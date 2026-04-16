// controllers/dashboardProyecciones.controller.js
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

function getBaseProjectionQuery() {
  return `
    WITH pagos_por_factura AS (
      SELECT
        t.id_factura,
        COALESCE(SUM(t.valor), 0) AS pagado
      FROM transaccion t
      WHERE t.id_factura IS NOT NULL
      GROUP BY t.id_factura
    ),

    proyeccion AS (
      SELECT
        f.codigo_factura,
        f.fecha_emision,
        f.fecha_vencimiento,
        f.plazo_pago,
        c.nombre AS cliente,

        f.valor AS valor_bruto,
        COALESCE(f.retencion_fuente, 0) AS retencion_fuente,
        COALESCE(f.retencion_ica, 0) AS retencion_ica,

        (
          f.valor
          - COALESCE(f.retencion_fuente, 0)
          - COALESCE(f.retencion_ica, 0)
        ) AS valor_neto,

        COALESCE(p.pagado, 0) AS pagado,

        GREATEST(
          (
            f.valor
            - COALESCE(f.retencion_fuente, 0)
            - COALESCE(f.retencion_ica, 0)
          ) - COALESCE(p.pagado, 0),
          0
        ) AS pendiente_proyectado

      FROM factura f
      JOIN manifiesto m
        ON f.id_manifiesto = m.id_manifiesto
      JOIN cliente c
        ON m.id_cliente = c.nit
      LEFT JOIN pagos_por_factura p
        ON p.id_factura = f.codigo_factura

      WHERE f.fecha_vencimiento IS NOT NULL
        AND ($1::date IS NULL OR f.fecha_vencimiento >= $1)
        AND ($2::date IS NULL OR f.fecha_vencimiento <= $2)
    )
  `;
}

// =========================
// KPI
// =========================
const getDashboardProyeccionesKPI = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      ${getBaseProjectionQuery()}

      SELECT
        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento >= CURRENT_DATE
             AND fecha_vencimiento < (CURRENT_DATE + INTERVAL '1 month')
            THEN pendiente_proyectado
            ELSE 0
          END
        ), 0) AS proximo_mes,

        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento >= CURRENT_DATE
             AND fecha_vencimiento < (CURRENT_DATE + INTERVAL '3 month')
            THEN pendiente_proyectado
            ELSE 0
          END
        ), 0) AS proximos_3_meses,

        COALESCE(SUM(
          CASE
            WHEN fecha_vencimiento >= CURRENT_DATE
             AND fecha_vencimiento < (CURRENT_DATE + INTERVAL '6 month')
            THEN pendiente_proyectado
            ELSE 0
          END
        ), 0) AS proximos_6_meses,

        COUNT(*) FILTER (WHERE pendiente_proyectado > 0) AS facturas_proyectadas,

        COUNT(DISTINCT cliente) FILTER (WHERE pendiente_proyectado > 0) AS clientes_proyectados,

        ROUND(
          COALESCE(AVG(
            CASE
              WHEN pendiente_proyectado > 0 THEN pendiente_proyectado
            END
          ), 0),
          2
        ) AS ticket_promedio_proyectado

      FROM proyeccion
      WHERE pendiente_proyectado > 0
      `,
      [desde, hasta]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getDashboardProyeccionesKPI:", error);
    return res.status(500).json({ error: "Error obteniendo KPI de proyecciones" });
  }
};

// =========================
// PROYECCION MENSUAL
// =========================
const getProyeccionMensual = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      ${getBaseProjectionQuery()}

      SELECT
        TO_CHAR(DATE_TRUNC('month', fecha_vencimiento), 'YYYY-MM') AS mes,
        COUNT(*) FILTER (WHERE pendiente_proyectado > 0) AS facturas,
        COALESCE(SUM(pendiente_proyectado), 0) AS total
      FROM proyeccion
      WHERE pendiente_proyectado > 0
      GROUP BY DATE_TRUNC('month', fecha_vencimiento)
      ORDER BY DATE_TRUNC('month', fecha_vencimiento)
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        mes: row.mes,
        facturas: Number(row.facturas || 0),
        total: Number(row.total || 0)
      }))
    );
  } catch (error) {
    console.error("Error getProyeccionMensual:", error);
    return res.status(500).json({ error: "Error obteniendo proyección mensual" });
  }
};

// =========================
// PROYECCION SEMANAL PROXIMAS 8 SEMANAS
// =========================
const getProyeccionSemanal = async (req, res) => {
  try {
    const result = await pool.query(
      `
      WITH pagos_por_factura AS (
        SELECT
          t.id_factura,
          COALESCE(SUM(t.valor), 0) AS pagado
        FROM transaccion t
        WHERE t.id_factura IS NOT NULL
        GROUP BY t.id_factura
      ),
      proyeccion AS (
        SELECT
          f.fecha_vencimiento,
          GREATEST(
            (
              f.valor
              - COALESCE(f.retencion_fuente, 0)
              - COALESCE(f.retencion_ica, 0)
            ) - COALESCE(p.pagado, 0),
            0
          ) AS pendiente_proyectado
        FROM factura f
        LEFT JOIN pagos_por_factura p
          ON p.id_factura = f.codigo_factura
        WHERE f.fecha_vencimiento IS NOT NULL
          AND f.fecha_vencimiento >= CURRENT_DATE
          AND f.fecha_vencimiento < (CURRENT_DATE + INTERVAL '8 week')
      )
      SELECT
        TO_CHAR(DATE_TRUNC('week', fecha_vencimiento), 'YYYY-MM-DD') AS semana_inicio,
        COALESCE(SUM(pendiente_proyectado), 0) AS total
      FROM proyeccion
      WHERE pendiente_proyectado > 0
      GROUP BY DATE_TRUNC('week', fecha_vencimiento)
      ORDER BY DATE_TRUNC('week', fecha_vencimiento)
      `
    );

    return res.json(
      result.rows.map(row => ({
        semana_inicio: row.semana_inicio,
        total: Number(row.total || 0)
      }))
    );
  } catch (error) {
    console.error("Error getProyeccionSemanal:", error);
    return res.status(500).json({ error: "Error obteniendo proyección semanal" });
  }
};

// =========================
// TOP CLIENTES PROYECTADOS
// =========================
const getTopClientesProyectados = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      ${getBaseProjectionQuery()}

      SELECT
        cliente,
        COALESCE(SUM(pendiente_proyectado), 0) AS total
      FROM proyeccion
      WHERE pendiente_proyectado > 0
      GROUP BY cliente
      ORDER BY total DESC
      LIMIT 8
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        cliente: row.cliente,
        total: Number(row.total || 0)
      }))
    );
  } catch (error) {
    console.error("Error getTopClientesProyectados:", error);
    return res.status(500).json({ error: "Error obteniendo top clientes proyectados" });
  }
};

// =========================
// FACTURAS PROXIMAS A VENCER
// =========================
const getFacturasProximasVencer = async (req, res) => {
  try {
    const result = await pool.query(
      `
      WITH pagos_por_factura AS (
        SELECT
          t.id_factura,
          COALESCE(SUM(t.valor), 0) AS pagado
        FROM transaccion t
        WHERE t.id_factura IS NOT NULL
        GROUP BY t.id_factura
      )
      SELECT
        f.codigo_factura,
        c.nombre AS cliente,
        f.fecha_vencimiento,
        f.valor AS valor_bruto,
        COALESCE(f.retencion_fuente, 0) AS retencion_fuente,
        COALESCE(f.retencion_ica, 0) AS retencion_ica,
        (
          f.valor
          - COALESCE(f.retencion_fuente, 0)
          - COALESCE(f.retencion_ica, 0)
        ) AS valor_neto,
        COALESCE(p.pagado, 0) AS pagado,
        GREATEST(
          (
            f.valor
            - COALESCE(f.retencion_fuente, 0)
            - COALESCE(f.retencion_ica, 0)
          ) - COALESCE(p.pagado, 0),
          0
        ) AS pendiente_proyectado
      FROM factura f
      JOIN manifiesto m
        ON f.id_manifiesto = m.id_manifiesto
      JOIN cliente c
        ON m.id_cliente = c.nit
      LEFT JOIN pagos_por_factura p
        ON p.id_factura = f.codigo_factura
      WHERE f.fecha_vencimiento IS NOT NULL
        AND f.fecha_vencimiento >= CURRENT_DATE
        AND f.fecha_vencimiento < (CURRENT_DATE + INTERVAL '45 day')
        AND GREATEST(
          (
            f.valor
            - COALESCE(f.retencion_fuente, 0)
            - COALESCE(f.retencion_ica, 0)
          ) - COALESCE(p.pagado, 0),
          0
        ) > 0
      ORDER BY f.fecha_vencimiento ASC, pendiente_proyectado DESC
      `
    );

    return res.json(
      result.rows.map(row => ({
        codigo_factura: row.codigo_factura,
        cliente: row.cliente,
        fecha_vencimiento: row.fecha_vencimiento,
        valor_bruto: Number(row.valor_bruto || 0),
        retencion_fuente: Number(row.retencion_fuente || 0),
        retencion_ica: Number(row.retencion_ica || 0),
        valor_neto: Number(row.valor_neto || 0),
        pagado: Number(row.pagado || 0),
        pendiente_proyectado: Number(row.pendiente_proyectado || 0)
      }))
    );
  } catch (error) {
    console.error("Error getFacturasProximasVencer:", error);
    return res.status(500).json({ error: "Error obteniendo facturas próximas a vencer" });
  }
};

// =========================
// DETALLE PROYECCION
// =========================
const getDetalleProyeccion = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      ${getBaseProjectionQuery()}

      SELECT
        codigo_factura,
        cliente,
        fecha_emision,
        fecha_vencimiento,
        plazo_pago,
        valor_bruto,
        retencion_fuente,
        retencion_ica,
        valor_neto,
        pagado,
        pendiente_proyectado
      FROM proyeccion
      WHERE pendiente_proyectado > 0
      ORDER BY fecha_vencimiento ASC, pendiente_proyectado DESC
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        codigo_factura: row.codigo_factura,
        cliente: row.cliente,
        fecha_emision: row.fecha_emision,
        fecha_vencimiento: row.fecha_vencimiento,
        plazo_pago: row.plazo_pago,
        valor_bruto: Number(row.valor_bruto || 0),
        retencion_fuente: Number(row.retencion_fuente || 0),
        retencion_ica: Number(row.retencion_ica || 0),
        valor_neto: Number(row.valor_neto || 0),
        pagado: Number(row.pagado || 0),
        pendiente_proyectado: Number(row.pendiente_proyectado || 0)
      }))
    );
  } catch (error) {
    console.error("Error getDetalleProyeccion:", error);
    return res.status(500).json({ error: "Error obteniendo detalle de proyección" });
  }
};

module.exports = {
  getDashboardProyeccionesKPI,
  getProyeccionMensual,
  getProyeccionSemanal,
  getTopClientesProyectados,
  getFacturasProximasVencer,
  getDetalleProyeccion
};