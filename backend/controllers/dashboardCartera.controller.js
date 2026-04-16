// controllers/dashboardCartera.controller.js
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
        t.id_factura,
        COALESCE(SUM(t.valor),0) AS pagado,
        MAX(t.fecha_pago) AS ultimo_pago
      FROM transaccion t
      WHERE t.id_factura IS NOT NULL
      GROUP BY t.id_factura
    ),

    cartera AS (
      SELECT
        f.codigo_factura,
        f.fecha_emision,
        f.fecha_vencimiento,
        c.nombre AS cliente,

        f.valor AS valor_bruto,
        COALESCE(f.retencion_fuente,0) AS retencion_fuente,
        COALESCE(f.retencion_ica,0) AS retencion_ica,

        (
          f.valor
          - COALESCE(f.retencion_fuente,0)
          - COALESCE(f.retencion_ica,0)
        ) AS valor_neto,

        COALESCE(p.pagado,0) AS pagado,

        GREATEST(
          (
            f.valor
            - COALESCE(f.retencion_fuente,0)
            - COALESCE(f.retencion_ica,0)
          )
          - COALESCE(p.pagado,0)
        ,0) AS pendiente,

        p.ultimo_pago,

        CASE
          WHEN f.fecha_vencimiento < CURRENT_DATE
            THEN (CURRENT_DATE - f.fecha_vencimiento)
          ELSE 0
        END AS dias_vencido

      FROM factura f

      JOIN manifiesto m
        ON f.id_manifiesto = m.id_manifiesto

      JOIN cliente c
        ON m.id_cliente = c.nit

      LEFT JOIN pagos_por_factura p
        ON p.id_factura = f.codigo_factura

      WHERE ($1::date IS NULL OR f.fecha_emision >= $1)
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
        COALESCE(SUM(pendiente),0) AS cartera_total,

        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento < CURRENT_DATE
            THEN pendiente
            ELSE 0
          END
        ),0) AS cartera_vencida,

        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento >= CURRENT_DATE
            THEN pendiente
            ELSE 0
          END
        ),0) AS cartera_corriente,

        COUNT(*) FILTER (WHERE pendiente > 0) AS facturas_pendientes,

        COUNT(DISTINCT cliente)
        FILTER (WHERE pendiente > 0) AS clientes_con_deuda,

        ROUND(AVG(
          CASE
            WHEN dias_vencido > 0 THEN dias_vencido
          END
        ),2) AS mora_promedio,

        COALESCE(SUM(
          retencion_fuente + retencion_ica
        ),0) AS retenciones_total

      FROM cartera
      WHERE pendiente > 0
    `, [desde, hasta]);

    return res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error KPI cartera" });
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
          CASE WHEN pendiente > 0 AND fecha_vencimiento >= CURRENT_DATE
          THEN pendiente ELSE 0 END
        ),0) AS corriente,

        COALESCE(SUM(
          CASE WHEN pendiente > 0 AND dias_vencido BETWEEN 1 AND 30
          THEN pendiente ELSE 0 END
        ),0) AS a30,

        COALESCE(SUM(
          CASE WHEN pendiente > 0 AND dias_vencido BETWEEN 31 AND 60
          THEN pendiente ELSE 0 END
        ),0) AS a60,

        COALESCE(SUM(
          CASE WHEN pendiente > 0 AND dias_vencido BETWEEN 61 AND 90
          THEN pendiente ELSE 0 END
        ),0) AS a90,

        COALESCE(SUM(
          CASE WHEN pendiente > 0 AND dias_vencido > 90
          THEN pendiente ELSE 0 END
        ),0) AS mas90

      FROM cartera
    `, [desde, hasta]);

    const r = result.rows[0];

    res.json([
      { rango:"Corriente", total:Number(r.corriente) },
      { rango:"1-30", total:Number(r.a30) },
      { rango:"31-60", total:Number(r.a60) },
      { rango:"61-90", total:Number(r.a90) },
      { rango:"+90", total:Number(r.mas90) }
    ]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error:"Error aging" });
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
        cliente,
        SUM(pendiente) AS total
      FROM cartera
      WHERE pendiente > 0
      GROUP BY cliente
      ORDER BY total DESC
      LIMIT 10
    `,[desde,hasta]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error:"Error top deudores" });
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

      SELECT *
      FROM cartera
      WHERE pendiente > 0
        AND fecha_vencimiento < CURRENT_DATE
      ORDER BY dias_vencido DESC, pendiente DESC
    `,[desde,hasta]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error:"Error vencidas" });
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

      SELECT *
      FROM cartera
      WHERE pendiente > 0
      ORDER BY pendiente DESC
    `,[desde,hasta]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error:"Error detalle cartera" });
  }
};

// =========================
// EXPORTS
// =========================
module.exports = {
  getDashboardCarteraKPI,
  getAging,
  getTopDeudores,
  getFacturasVencidas,
  getDetalle
};