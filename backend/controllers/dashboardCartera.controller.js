const pool = require("../config/db");

// =========================
// HELPERS
// =========================
function getFiltros(req) {
  const { desde, hasta } = req.query;

  return {
    desde: desde || null,
    hasta: hasta || null
  };
}

// =========================
// QUERY BASE CARTERA
// =========================
function getBaseQuery() {
  return `
    WITH pagos_por_factura AS (

      SELECT
        COALESCE(
          t.id_factura,
          f.codigo_factura
        ) AS codigo_factura,

        COALESCE(SUM(t.valor),0) AS pagado,
        MAX(t.fecha_pago) AS ultimo_pago

      FROM transaccion t

      JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion

      LEFT JOIN factura f
        ON f.id_manifiesto = t.id_manifiesto

      WHERE
        UPPER(TRIM(tt.tipo::text)) = 'INGRESO MANIFIESTO'

      GROUP BY
        COALESCE(
          t.id_factura,
          f.codigo_factura
        )
    ),

    cartera AS (

      SELECT
        f.codigo_factura,
        f.id_manifiesto,
        f.fecha_emision,
        f.fecha_vencimiento,

        c.nombre AS cliente,
        eac.nombre AS empresa_a_cargo,

        COALESCE(
          c.nombre,
          eac.nombre,
          'Sin tercero'
        ) AS tercero_visual,

        COALESCE(f.valor,0) AS valor_bruto,
        COALESCE(f.retencion_fuente,0) AS retencion_fuente,
        COALESCE(f.retencion_ica,0) AS retencion_ica,
        COALESCE(f.fopat,0) AS fopat, -- ?? NUEVO

        (
          COALESCE(f.valor,0)
          - COALESCE(f.retencion_fuente,0)
          - COALESCE(f.retencion_ica,0)
          - COALESCE(f.fopat,0) -- ?? CLAVE
        ) AS valor_neto,

        COALESCE(p.pagado,0) AS pagado,

        GREATEST(
          COALESCE(f.valor,0)
          - COALESCE(f.retencion_fuente,0)
          - COALESCE(f.retencion_ica,0)
          - COALESCE(f.fopat,0) -- ?? CLAVE
          - COALESCE(p.pagado,0),
          0
        ) AS pendiente,

        p.ultimo_pago,

        CASE
          WHEN f.fecha_vencimiento < CURRENT_DATE
          THEN CURRENT_DATE - f.fecha_vencimiento
          ELSE 0
        END AS dias_vencido

      FROM factura f

      JOIN manifiesto m
        ON m.id_manifiesto = f.id_manifiesto

      LEFT JOIN cliente c
        ON c.nit = m.id_cliente

      LEFT JOIN empresa_a_cargo eac
        ON eac.nit = m.id_empresa_a_cargo

      LEFT JOIN pagos_por_factura p
        ON p.codigo_factura = f.codigo_factura

      WHERE
        ($1::date IS NULL OR f.fecha_emision >= $1)
        AND ($2::date IS NULL OR f.fecha_emision <= $2)
    )
  `;
}

// =========================
// KPI
// =========================
const getDashboardCarteraKPI = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseQuery()}

      SELECT
        COALESCE(SUM(pendiente), 0) AS cartera_total,

        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento < CURRENT_DATE
            THEN pendiente
            ELSE 0
          END
        ), 0) AS cartera_vencida,

        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento >= CURRENT_DATE
            THEN pendiente
            ELSE 0
          END
        ), 0) AS cartera_corriente,

        COUNT(*) FILTER (
          WHERE pendiente > 0
        ) AS facturas_pendientes,

        COUNT(DISTINCT COALESCE(cliente, empresa_a_cargo, tercero_visual)) FILTER (
          WHERE pendiente > 0
        ) AS clientes_con_deuda,

        ROUND(AVG(
          CASE
            WHEN dias_vencido > 0 THEN dias_vencido
          END
        ), 2) AS mora_promedio,

        COALESCE(SUM(
          retencion_fuente + retencion_ica + COALESCE(fopat,0)
        ) FILTER (
          WHERE pendiente > 0
        ), 0) AS retenciones_total

      FROM cartera
    `, [desde, hasta]);

    return res.json({
      cartera_total: Number(result.rows[0].cartera_total || 0),
      cartera_vencida: Number(result.rows[0].cartera_vencida || 0),
      cartera_corriente: Number(result.rows[0].cartera_corriente || 0),
      facturas_pendientes: Number(result.rows[0].facturas_pendientes || 0),
      clientes_con_deuda: Number(result.rows[0].clientes_con_deuda || 0),
      mora_promedio: Number(result.rows[0].mora_promedio || 0),
      retenciones_total: Number(result.rows[0].retenciones_total || 0)
    });

  } catch (error) {
    console.error("Error KPI cartera:", error);
    return res.status(500).json({ error: "Error KPI cartera" });
  }
};

// =========================
// AGING
// =========================
const getAging = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseQuery()}

      SELECT
        COALESCE(SUM(
          CASE
            WHEN pendiente > 0
             AND fecha_vencimiento >= CURRENT_DATE
            THEN pendiente
            ELSE 0
          END
        ), 0) AS corriente,

        COALESCE(SUM(
          CASE
            WHEN pendiente > 0
             AND dias_vencido BETWEEN 1 AND 30
            THEN pendiente
            ELSE 0
          END
        ), 0) AS a30,

        COALESCE(SUM(
          CASE
            WHEN pendiente > 0
             AND dias_vencido BETWEEN 31 AND 60
            THEN pendiente
            ELSE 0
          END
        ), 0) AS a60,

        COALESCE(SUM(
          CASE
            WHEN pendiente > 0
             AND dias_vencido BETWEEN 61 AND 90
            THEN pendiente
            ELSE 0
          END
        ), 0) AS a90,

        COALESCE(SUM(
          CASE
            WHEN pendiente > 0
             AND dias_vencido > 90
            THEN pendiente
            ELSE 0
          END
        ), 0) AS mas90

      FROM cartera
    `, [desde, hasta]);

    const r = result.rows[0];

    return res.json([
      { rango: "Corriente", total: Number(r.corriente || 0) },
      { rango: "1-30", total: Number(r.a30 || 0) },
      { rango: "31-60", total: Number(r.a60 || 0) },
      { rango: "61-90", total: Number(r.a90 || 0) },
      { rango: "+90", total: Number(r.mas90 || 0) }
    ]);

  } catch (error) {
    console.error("Error aging cartera:", error);
    return res.status(500).json({ error: "Error aging cartera" });
  }
};

// =========================
// TOP DEUDORES
// =========================
const getTopDeudores = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseQuery()}

      SELECT
        COALESCE(cliente, empresa_a_cargo, tercero_visual) AS cliente,
        SUM(pendiente) AS total
      FROM cartera
      WHERE pendiente > 0
      GROUP BY COALESCE(cliente, empresa_a_cargo, tercero_visual)
      ORDER BY SUM(pendiente) DESC, COALESCE(cliente, empresa_a_cargo, tercero_visual) ASC
      LIMIT 10
    `, [desde, hasta]);

    return res.json(
      result.rows.map(row => ({
        cliente: row.cliente,
        total: Number(row.total || 0)
      }))
    );

  } catch (error) {
    console.error("Error top deudores cartera:", error);
    return res.status(500).json({ error: "Error top deudores cartera" });
  }
};

// =========================
// FACTURAS VENCIDAS
// =========================
const getFacturasVencidas = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseQuery()}

      SELECT
        codigo_factura,
        id_manifiesto,
        cliente,
        empresa_a_cargo,
        tercero_visual,
        fecha_emision,
        fecha_vencimiento,
        valor_bruto,
        retencion_fuente,
        retencion_ica,
        fopat, -- ?? ?? TAMBIÉN AQUÍ
        valor_neto,
        pagado,
        pendiente,
        ultimo_pago,
        dias_vencido
      FROM cartera
      WHERE pendiente > 0
        AND fecha_vencimiento < CURRENT_DATE
      ORDER BY dias_vencido DESC, pendiente DESC, fecha_vencimiento ASC
    `, [desde, hasta]);

    return res.json(
      result.rows.map(row => ({
        codigo_factura: row.codigo_factura,
        id_manifiesto: row.id_manifiesto,
        cliente: row.cliente,
        empresa_a_cargo: row.empresa_a_cargo,
        tercero_visual: row.tercero_visual,
        fecha_emision: row.fecha_emision,
        fecha_vencimiento: row.fecha_vencimiento,
        valor_bruto: Number(row.valor_bruto || 0),
        retencion_fuente: Number(row.retencion_fuente || 0),
        retencion_ica: Number(row.retencion_ica || 0),
        fopat: Number(row.fopat || 0), // ?? ??
        valor_neto: Number(row.valor_neto || 0),
        pagado: Number(row.pagado || 0),
        pendiente: Number(row.pendiente || 0),
        ultimo_pago: row.ultimo_pago,
        dias_vencido: Number(row.dias_vencido || 0)
      }))
    );

  } catch (error) {
    console.error("Error facturas vencidas cartera:", error);
    return res.status(500).json({ error: "Error facturas vencidas cartera" });
  }
};

// =========================
// DETALLE GENERAL
// =========================
const getDetalle = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseQuery()}

      SELECT
        codigo_factura,
        id_manifiesto,
        cliente,
        empresa_a_cargo,
        tercero_visual,
        fecha_emision,
        fecha_vencimiento,
        valor_bruto,
        retencion_fuente,
        retencion_ica,
        fopat, -- ?? ?? ESTE ERA EL PROBLEMA
        valor_neto,
        pagado,
        pendiente,
        ultimo_pago,
        dias_vencido
      FROM cartera
      WHERE pendiente > 0
      ORDER BY pendiente DESC, fecha_vencimiento ASC, COALESCE(cliente, empresa_a_cargo, tercero_visual) ASC
    `, [desde, hasta]);

    return res.json(
      result.rows.map(row => ({
        codigo_factura: row.codigo_factura,
        id_manifiesto: row.id_manifiesto,
        cliente: row.cliente,
        empresa_a_cargo: row.empresa_a_cargo,
        tercero_visual: row.tercero_visual,
        fecha_emision: row.fecha_emision,
        fecha_vencimiento: row.fecha_vencimiento,
        valor_bruto: Number(row.valor_bruto || 0),
        retencion_fuente: Number(row.retencion_fuente || 0),
        retencion_ica: Number(row.retencion_ica || 0),
        fopat: Number(row.fopat || 0), // ?? ?? ESTE TAMBIÉN
        valor_neto: Number(row.valor_neto || 0),
        pagado: Number(row.pagado || 0),
        pendiente: Number(row.pendiente || 0),
        ultimo_pago: row.ultimo_pago,
        dias_vencido: Number(row.dias_vencido || 0)
      }))
    );

  } catch (error) {
    console.error("Error detalle cartera:", error);
    return res.status(500).json({ error: "Error detalle cartera" });
  }
};

module.exports = {
  getDashboardCarteraKPI,
  getAging,
  getTopDeudores,
  getFacturasVencidas,
  getDetalle
};