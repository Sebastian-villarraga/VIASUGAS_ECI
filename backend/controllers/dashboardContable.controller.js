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
// KPI CONTABLE (VERSION FULL)
// controllers/dashboardContable.controller.js
// =========================
const getDashboardContableKPI = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      WITH ingresos AS (
        SELECT COALESCE(SUM(t.valor),0) total_ingresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON tt.id = t.id_tipo_transaccion
        WHERE tt.tipo = 'INGRESO MANIFIESTO'
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
      ),

      egresos AS (
        SELECT COALESCE(SUM(t.valor),0) total_egresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON tt.id = t.id_tipo_transaccion
        WHERE tt.tipo = 'EGRESO MANIFIESTO'
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
      ),

      operativos AS (
        SELECT COALESCE(SUM(t.valor),0) total_operativos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON tt.id = t.id_tipo_transaccion
        WHERE tt.tipo = 'EGRESO OPERACIONAL'
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
      ),

      facturas AS (
        SELECT
          COUNT(*) total_facturas,
          COALESCE(SUM(valor),0) total_facturado
        FROM factura
        WHERE ($1::date IS NULL OR fecha_emision >= $1)
          AND ($2::date IS NULL OR fecha_emision <= $2)
      )

      SELECT
        i.total_ingresos,
        e.total_egresos,
        o.total_operativos,
        f.total_facturas,
        f.total_facturado
      FROM ingresos i
      CROSS JOIN egresos e
      CROSS JOIN operativos o
      CROSS JOIN facturas f
    `,[desde || null, hasta || null]);

    const row = result.rows[0];

    const ingresos = Number(row.total_ingresos || 0);
    const egresos = Number(row.total_egresos || 0);
    const operativos = Number(row.total_operativos || 0);

    const utilidad = ingresos - egresos;

    const margen =
      ingresos > 0
      ? (utilidad / ingresos) * 100
      : 0;

    res.json({
      ingresos,
      egresos,
      utilidad,
      margen,

      facturas_emitidas:
        Number(row.total_facturas || 0),

      egresos_operativos:
        operativos,

      facturacion_total:
        Number(row.total_facturado || 0),

      periodo:{
        desde,
        hasta
      }
    });

  } catch(error){
    console.error(error);

    res.status(500).json({
      error:"Error KPI contable"
    });
  }
};

// =========================
// ESTADO DE RESULTADOS MENSUAL
// CORREGIDO
// - Ingresos = INGRESO MANIFIESTO
// - Egresos = EGRESO MANIFIESTO
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
          TO_CHAR(t.fecha_pago, 'YYYY-MM') AS mes,
          COALESCE(SUM(t.valor), 0) AS ingresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON t.id_tipo_transaccion = tt.id
        WHERE tt.tipo = 'INGRESO MANIFIESTO'
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
        GROUP BY TO_CHAR(t.fecha_pago, 'YYYY-MM')
      ),

      egresos AS (
        SELECT
          TO_CHAR(t.fecha_pago, 'YYYY-MM') AS mes,
          COALESCE(SUM(t.valor), 0) AS egresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON t.id_tipo_transaccion = tt.id
        WHERE tt.tipo = 'EGRESO MANIFIESTO'
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
      LEFT JOIN ingresos i
        ON i.mes = m.mes
      LEFT JOIN egresos e
        ON e.mes = m.mes
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
    return res.status(500).json({
      error: "Error obteniendo estado de resultados mensual"
    });
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

    const result = await pool.query(`
      WITH facturas AS (
        SELECT
          TO_CHAR(fecha_emision,'YYYY-MM') AS mes,
          COUNT(*) AS facturas_emitidas,
          COALESCE(SUM(valor),0) AS total_facturado
        FROM factura
        WHERE ($1::date IS NULL OR fecha_emision >= $1)
          AND ($2::date IS NULL OR fecha_emision <= $2)
        GROUP BY mes
      ),

      ingresos AS (
        SELECT
          TO_CHAR(t.fecha_pago,'YYYY-MM') AS mes,
          COALESCE(SUM(t.valor),0) AS ingresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON tt.id = t.id_tipo_transaccion
        WHERE tt.tipo = 'INGRESO MANIFIESTO'
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
        GROUP BY mes
      ),

      egresos AS (
        SELECT
          TO_CHAR(t.fecha_pago,'YYYY-MM') AS mes,
          COALESCE(SUM(t.valor),0) AS egresos
        FROM transaccion t
        JOIN tipo_transaccion tt
          ON tt.id = t.id_tipo_transaccion
        WHERE tt.tipo IN (
          'GASTO CONDUCTOR',
          'EGRESO OPERACIONAL',
          'EGRESO MANIFIESTO'
        )
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)
        GROUP BY mes
      ),

      meses AS (
        SELECT mes FROM facturas
        UNION
        SELECT mes FROM ingresos
        UNION
        SELECT mes FROM egresos
      )

      SELECT
        m.mes,
        COALESCE(f.facturas_emitidas,0) AS facturas_emitidas,
        COALESCE(f.total_facturado,0) AS total_facturado,
        COALESCE(i.ingresos,0) AS ingresos,
        COALESCE(e.egresos,0) AS egresos,

        (
          COALESCE(i.ingresos,0)
          -
          COALESCE(e.egresos,0)
        ) utilidad,

        CASE
          WHEN COALESCE(i.ingresos,0) > 0 THEN
            ROUND(
              (
                (
                  COALESCE(i.ingresos,0)
                  -
                  COALESCE(e.egresos,0)
                )
                /
                COALESCE(i.ingresos,0)
              ) * 100,2
            )
          ELSE 0
        END margen

      FROM meses m
      LEFT JOIN facturas f ON f.mes = m.mes
      LEFT JOIN ingresos i ON i.mes = m.mes
      LEFT JOIN egresos e ON e.mes = m.mes

      ORDER BY m.mes DESC
    `,[desde || null, hasta || null]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:"Error resumen mensual"
    });
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

// =====================================
// BACKEND NUEVO
// dashboardContable.controller.js
// FLUJO POR BANCO
// =====================================

const getFlujoBancosContable = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.nombre_banco,

        COALESCE(SUM(
          CASE
            WHEN tt.tipo = 'INGRESO MANIFIESTO'
            THEN t.valor
            ELSE 0
          END
        ),0) AS ingresos,

        COALESCE(SUM(
          CASE
            WHEN tt.tipo IN (
              'EGRESO MANIFIESTO',
              'EGRESO OPERACIONAL',
              'GASTO CONDUCTOR'
            )
            THEN t.valor
            ELSE 0
          END
        ),0) AS egresos,

        COALESCE(COUNT(t.id),0) AS movimientos

      FROM banco b

      LEFT JOIN transaccion t
        ON t.id_banco = b.id
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)

      LEFT JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion

      GROUP BY
        b.id,
        b.nombre_banco

      ORDER BY
        b.nombre_banco ASC
      `,
      [desde || null, hasta || null]
    );

    const data = result.rows.map(row => {

      const ingresos = Number(row.ingresos || 0);
      const egresos = Number(row.egresos || 0);

      return {
        id: row.id,
        banco: row.nombre_banco,
        ingresos,
        egresos,
        neto: ingresos - egresos,
        movimientos: Number(row.movimientos || 0)
      };
    });

    return res.json(data);

  } catch (error) {
    console.error("Error getFlujoBancosContable:", error);

    return res.status(500).json({
      error: "Error obteniendo flujo bancario"
    });
  }
};



module.exports = {
  getDashboardContableKPI,
  getEstadoResultadosMensual,
  getUtilidadMensual,
  getGastosCategoriaContable,
  getResumenMensualContable,
  getDetalleGastosContables,
  getFlujoBancosContable
};