const pool = require("../config/db");

// =========================
// KPI GERENCIAL
// =========================
const getDashboardKPI = async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    // ?? FILTRO FACTURA
    const ingresosQ = await pool.query(`
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM factura
      WHERE ($1::date IS NULL OR fecha_emision >= $1)
        AND ($2::date IS NULL OR fecha_emision <= $2)
    `, [desde || null, hasta || null]);

    // ?? FILTRO TRANSACCION
    const egresosQ = await pool.query(`
      SELECT COALESCE(SUM(t.valor), 0) AS total
      FROM transaccion t
      JOIN tipo_transaccion tt 
        ON t.id_tipo_transaccion = tt.id
      WHERE tt.tipo = 'GASTO CONDUCTOR'
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)
    `, [desde || null, hasta || null]);

    // ?? FILTRO VIAJES
    const viajesQ = await pool.query(`
      SELECT COUNT(*) AS total
      FROM manifiesto
      WHERE ($1::date IS NULL OR fecha_creacion >= $1)
        AND ($2::date IS NULL OR fecha_creacion <= $2)
    `, [desde || null, hasta || null]);

    const ingresos = Number(ingresosQ.rows[0].total);
    const egresos = Number(egresosQ.rows[0].total);
    const viajes = Number(viajesQ.rows[0].total);

    return res.json({
      ingresos,
      egresos,
      utilidad: ingresos - egresos,
      viajes
    });

  } catch (error) {
    console.error("? Error getDashboardKPI:", error);
    return res.status(500).json({ error: "Error obteniendo KPI" });
  }
};

// =========================
// RENTABILIDAD POR MANIFIESTO
// =========================
const getRentabilidad = async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    const result = await pool.query(`
      SELECT 
        m.id_manifiesto,
        c.nombre AS cliente,

        COALESCE(f.valor, 0) AS ingreso,

        COALESCE(SUM(
          CASE 
            WHEN tt.tipo = 'GASTO CONDUCTOR' THEN t.valor
            ELSE 0
          END
        ), 0) AS egreso,

        COALESCE(f.valor, 0) - COALESCE(SUM(
          CASE 
            WHEN tt.tipo = 'GASTO CONDUCTOR' THEN t.valor
            ELSE 0
          END
        ), 0) AS utilidad

      FROM manifiesto m

      LEFT JOIN factura f 
        ON m.id_manifiesto = f.id_manifiesto

      LEFT JOIN cliente c
        ON m.id_cliente = c.nit

      LEFT JOIN transaccion t
        ON m.id_manifiesto = t.id_manifiesto

      LEFT JOIN tipo_transaccion tt
        ON t.id_tipo_transaccion = tt.id

      WHERE 
        ($1::date IS NULL OR f.fecha_emision >= $1)
        AND ($2::date IS NULL OR f.fecha_emision <= $2)

      GROUP BY 
        m.id_manifiesto,
        c.nombre,
        f.valor

      ORDER BY m.id_manifiesto DESC
    `, [desde || null, hasta || null]);

    return res.json(result.rows);

  } catch (error) {
    console.error("? Error getRentabilidad:", error);
    return res.status(500).json({ error: "Error obteniendo rentabilidad" });
  }
};

// =========================
// INGRESOS VS EGRESOS POR MES
// =========================
const getIngresosEgresos = async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    const ingresosQ = await pool.query(`
      SELECT 
        TO_CHAR(fecha_emision, 'YYYY-MM') AS mes,
        COALESCE(SUM(valor), 0) AS ingresos
      FROM factura
      WHERE ($1::date IS NULL OR fecha_emision >= $1)
        AND ($2::date IS NULL OR fecha_emision <= $2)
      GROUP BY mes
      ORDER BY mes
    `, [desde || null, hasta || null]);

    const egresosQ = await pool.query(`
      SELECT 
        TO_CHAR(t.fecha_pago, 'YYYY-MM') AS mes,
        COALESCE(SUM(t.valor), 0) AS egresos
      FROM transaccion t
      JOIN tipo_transaccion tt 
        ON t.id_tipo_transaccion = tt.id
      WHERE tt.tipo = 'GASTO CONDUCTOR'
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)
      GROUP BY mes
    `, [desde || null, hasta || null]);

    const mapEgresos = {};
    egresosQ.rows.forEach(e => {
      mapEgresos[e.mes] = Number(e.egresos);
    });

    const final = ingresosQ.rows.map(r => ({
      mes: r.mes,
      ingresos: Number(r.ingresos),
      egresos: mapEgresos[r.mes] || 0
    }));

    return res.json(final);

  } catch (error) {
    console.error("? Error getIngresosEgresos:", error);
    return res.status(500).json({ error: "Error obteniendo gráfica" });
  }
};
};

const getGastosPorCategoria = async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    const result = await pool.query(`
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
    `, [desde || null, hasta || null]);

    return res.json(result.rows);

  } catch (error) {
    console.error("? Error getGastosPorCategoria:", error);
    return res.status(500).json({ error: "Error obteniendo gastos por tipo" });
  }
};

// =========================
// EXPORTS
// =========================
module.exports = {
  getDashboardKPI,
  getRentabilidad,
  getIngresosEgresos,
  getGastosPorCategoria
};