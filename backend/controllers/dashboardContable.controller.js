// controllers/dashboardContable.controller.js
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
// KPI CONTABLE
// =========================
const getDashboardContableKPI = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      WITH ingresos AS (
        SELECT COALESCE(SUM(f.valor), 0) AS total_ingresos,
               COUNT(*) AS total_facturas
        FROM factura f
        WHERE ($1::date IS NULL OR f.fecha_emision >= $1)
          AND ($2::date IS NULL OR f.fecha_emision <= $2)
      ),
      egresos AS (
        SELECT COALESCE(SUM(t.valor), 0) AS total_egresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON t.id_tipo_transaccion = tt.id
        WHERE tt.tipo IN (
          'GASTO CONDUCTOR',
          'EGRESO OPERACIONAL',
          'EGRESO MANIFIESTO'
        )
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
      ),
      viajes AS (
        SELECT COUNT(*) AS total_viajes
        FROM manifiesto m
        WHERE ($1::date IS NULL OR m.fecha >= $1)
          AND ($2::date IS NULL OR m.fecha <= $2)
      )
      SELECT
        i.total_ingresos,
        e.total_egresos,
        (i.total_ingresos - e.total_egresos) AS utilidad,
        CASE
          WHEN i.total_ingresos > 0
            THEN ROUND(((i.total_ingresos - e.total_egresos) / i.total_ingresos) * 100, 2)
          ELSE 0
        END AS margen,
        i.total_facturas,
        v.total_viajes,
        CASE
          WHEN v.total_viajes > 0
            THEN ROUND(e.total_egresos / v.total_viajes, 2)
          ELSE 0
        END AS costo_promedio_viaje
      FROM ingresos i
      CROSS JOIN egresos e
      CROSS JOIN viajes v
      `,
      [desde, hasta]
    );

    const row = result.rows[0];

    return res.json({
      ingresos: Number(row.total_ingresos || 0),
      egresos: Number(row.total_egresos || 0),
      utilidad: Number(row.utilidad || 0),
      margen: Number(row.margen || 0),
      facturas_emitidas: Number(row.total_facturas || 0),
      viajes: Number(row.total_viajes || 0),
      costo_promedio_viaje: Number(row.costo_promedio_viaje || 0)
    });
  } catch (error) {
    console.error("Error getDashboardContableKPI:", error);
    return res.status(500).json({ error: "Error obteniendo KPI contable" });
  }
};

// =========================
// ESTADO DE RESULTADOS MENSUAL
// =========================
const getEstadoResultadosMensual = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      WITH limites AS (
        SELECT
          COALESCE($1::date, date_trunc('year', CURRENT_DATE)::date) AS fecha_desde,
          COALESCE($2::date, CURRENT_DATE) AS fecha_hasta
      ),
      meses AS (
        SELECT TO_CHAR(gs.mes, 'YYYY-MM') AS mes
        FROM limites l,
        LATERAL generate_series(
          date_trunc('month', l.fecha_desde)::date,
          date_trunc('month', l.fecha_hasta)::date,
          interval '1 month'
        ) AS gs(mes)
      ),
      ingresos AS (
        SELECT
          TO_CHAR(f.fecha_emision, 'YYYY-MM') AS mes,
          COALESCE(SUM(f.valor), 0) AS ingresos
        FROM factura f
        WHERE ($1::date IS NULL OR f.fecha_emision >= $1)
          AND ($2::date IS NULL OR f.fecha_emision <= $2)
        GROUP BY TO_CHAR(f.fecha_emision, 'YYYY-MM')
      ),
      egresos AS (
        SELECT
          TO_CHAR(t.fecha_pago, 'YYYY-MM') AS mes,
          COALESCE(SUM(t.valor), 0) AS egresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON t.id_tipo_transaccion = tt.id
        WHERE tt.tipo IN (
          'GASTO CONDUCTOR',
          'EGRESO OPERACIONAL',
          'EGRESO MANIFIESTO'
        )
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
        GROUP BY TO_CHAR(t.fecha_pago, 'YYYY-MM')
      )
      SELECT
        m.mes,
        COALESCE(i.ingresos, 0) AS ingresos,
        COALESCE(e.egresos, 0) AS egresos,
        COALESCE(i.ingresos, 0) - COALESCE(e.egresos, 0) AS utilidad
      FROM meses m
      LEFT JOIN ingresos i ON i.mes = m.mes
      LEFT JOIN egresos e ON e.mes = m.mes
      ORDER BY m.mes
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        mes: row.mes,
        ingresos: Number(row.ingresos || 0),
        egresos: Number(row.egresos || 0),
        utilidad: Number(row.utilidad || 0)
      }))
    );
  } catch (error) {
    console.error("Error getEstadoResultadosMensual:", error);
    return res.status(500).json({ error: "Error obteniendo estado de resultados mensual" });
  }
};

// =========================
// UTILIDAD MENSUAL
// =========================
const getUtilidadMensual = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      WITH limites AS (
        SELECT
          COALESCE($1::date, date_trunc('year', CURRENT_DATE)::date) AS fecha_desde,
          COALESCE($2::date, CURRENT_DATE) AS fecha_hasta
      ),
      meses AS (
        SELECT TO_CHAR(gs.mes, 'YYYY-MM') AS mes
        FROM limites l,
        LATERAL generate_series(
          date_trunc('month', l.fecha_desde)::date,
          date_trunc('month', l.fecha_hasta)::date,
          interval '1 month'
        ) AS gs(mes)
      ),
      ingresos AS (
        SELECT
          TO_CHAR(f.fecha_emision, 'YYYY-MM') AS mes,
          COALESCE(SUM(f.valor), 0) AS ingresos
        FROM factura f
        WHERE ($1::date IS NULL OR f.fecha_emision >= $1)
          AND ($2::date IS NULL OR f.fecha_emision <= $2)
        GROUP BY TO_CHAR(f.fecha_emision, 'YYYY-MM')
      ),
      egresos AS (
        SELECT
          TO_CHAR(t.fecha_pago, 'YYYY-MM') AS mes,
          COALESCE(SUM(t.valor), 0) AS egresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON t.id_tipo_transaccion = tt.id
        WHERE tt.tipo IN (
          'GASTO CONDUCTOR',
          'EGRESO OPERACIONAL',
          'EGRESO MANIFIESTO'
        )
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
        GROUP BY TO_CHAR(t.fecha_pago, 'YYYY-MM')
      )
      SELECT
        m.mes,
        (COALESCE(i.ingresos, 0) - COALESCE(e.egresos, 0)) AS utilidad
      FROM meses m
      LEFT JOIN ingresos i ON i.mes = m.mes
      LEFT JOIN egresos e ON e.mes = m.mes
      ORDER BY m.mes
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        mes: row.mes,
        utilidad: Number(row.utilidad || 0)
      }))
    );
  } catch (error) {
    console.error("Error getUtilidadMensual:", error);
    return res.status(500).json({ error: "Error obteniendo utilidad mensual" });
  }
};

// =========================
// GASTOS POR CATEGORIA CONTABLE
// =========================
const getGastosCategoriaContable = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      SELECT
        tt.tipo,
        COALESCE(SUM(t.valor), 0) AS total
      FROM transaccion t
      JOIN tipo_transaccion tt
        ON t.id_tipo_transaccion = tt.id
      WHERE tt.tipo IN (
        'GASTO CONDUCTOR',
        'EGRESO OPERACIONAL',
        'EGRESO MANIFIESTO'
      )
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)
      GROUP BY tt.tipo
      ORDER BY total DESC
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        tipo: row.tipo,
        total: Number(row.total || 0)
      }))
    );
  } catch (error) {
    console.error("Error getGastosCategoriaContable:", error);
    return res.status(500).json({ error: "Error obteniendo gastos por categoría" });
  }
};

// =========================
// RESUMEN CONTABLE MENSUAL
// =========================
const getResumenMensualContable = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      WITH limites AS (
        SELECT
          COALESCE($1::date, date_trunc('year', CURRENT_DATE)::date) AS fecha_desde,
          COALESCE($2::date, CURRENT_DATE) AS fecha_hasta
      ),
      meses AS (
        SELECT TO_CHAR(gs.mes, 'YYYY-MM') AS mes
        FROM limites l,
        LATERAL generate_series(
          date_trunc('month', l.fecha_desde)::date,
          date_trunc('month', l.fecha_hasta)::date,
          interval '1 month'
        ) AS gs(mes)
      ),
      ingresos AS (
        SELECT
          TO_CHAR(f.fecha_emision, 'YYYY-MM') AS mes,
          COUNT(*) AS facturas_emitidas,
          COALESCE(SUM(f.valor), 0) AS ingresos
        FROM factura f
        WHERE ($1::date IS NULL OR f.fecha_emision >= $1)
          AND ($2::date IS NULL OR f.fecha_emision <= $2)
        GROUP BY TO_CHAR(f.fecha_emision, 'YYYY-MM')
      ),
      egresos AS (
        SELECT
          TO_CHAR(t.fecha_pago, 'YYYY-MM') AS mes,
          COALESCE(SUM(t.valor), 0) AS egresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON t.id_tipo_transaccion = tt.id
        WHERE tt.tipo IN (
          'GASTO CONDUCTOR',
          'EGRESO OPERACIONAL',
          'EGRESO MANIFIESTO'
        )
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
        GROUP BY TO_CHAR(t.fecha_pago, 'YYYY-MM')
      )
      SELECT
        m.mes,
        COALESCE(i.facturas_emitidas, 0) AS facturas_emitidas,
        COALESCE(i.ingresos, 0) AS ingresos,
        COALESCE(e.egresos, 0) AS egresos,
        COALESCE(i.ingresos, 0) - COALESCE(e.egresos, 0) AS utilidad,
        CASE
          WHEN COALESCE(i.ingresos, 0) > 0
            THEN ROUND(((COALESCE(i.ingresos, 0) - COALESCE(e.egresos, 0)) / COALESCE(i.ingresos, 0)) * 100, 2)
          ELSE 0
        END AS margen
      FROM meses m
      LEFT JOIN ingresos i ON i.mes = m.mes
      LEFT JOIN egresos e ON e.mes = m.mes
      ORDER BY m.mes DESC
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        mes: row.mes,
        facturas_emitidas: Number(row.facturas_emitidas || 0),
        ingresos: Number(row.ingresos || 0),
        egresos: Number(row.egresos || 0),
        utilidad: Number(row.utilidad || 0),
        margen: Number(row.margen || 0)
      }))
    );
  } catch (error) {
    console.error("Error getResumenMensualContable:", error);
    return res.status(500).json({ error: "Error obteniendo resumen mensual contable" });
  }
};

// =========================
// DETALLE DE EGRESOS CONTABLES
// =========================
const getDetalleGastosContables = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.fecha_pago,
        tt.tipo,
        tt.categoria,
        COALESCE(t.descripcion, tt.descripcion, '-') AS descripcion,
        t.id_manifiesto,
        t.id_factura,
        t.valor
      FROM transaccion t
      JOIN tipo_transaccion tt
        ON t.id_tipo_transaccion = tt.id
      WHERE tt.tipo IN (
        'GASTO CONDUCTOR',
        'EGRESO OPERACIONAL',
        'EGRESO MANIFIESTO'
      )
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)
      ORDER BY t.fecha_pago DESC, t.creado DESC NULLS LAST
      `,
      [desde, hasta]
    );

    return res.json(
      result.rows.map(row => ({
        id: row.id,
        fecha_pago: row.fecha_pago,
        tipo: row.tipo,
        categoria: row.categoria || "-",
        descripcion: row.descripcion || "-",
        id_manifiesto: row.id_manifiesto || "-",
        id_factura: row.id_factura || "-",
        valor: Number(row.valor || 0)
      }))
    );
  } catch (error) {
    console.error("Error getDetalleGastosContables:", error);
    return res.status(500).json({ error: "Error obteniendo detalle de gastos contables" });
  }
};

module.exports = {
  getDashboardContableKPI,
  getEstadoResultadosMensual,
  getUtilidadMensual,
  getGastosCategoriaContable,
  getResumenMensualContable,
  getDetalleGastosContables
};