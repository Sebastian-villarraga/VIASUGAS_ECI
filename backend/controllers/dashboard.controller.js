const pool = require("../config/db");

// =========================
// KPI GERENCIAL
// =========================
const getDashboardKPI = async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    // =========================
    // INGRESOS
    // =========================
    const ingresosQ = await pool.query(`
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM factura
      WHERE ($1::date IS NULL OR fecha_emision >= $1)
        AND ($2::date IS NULL OR fecha_emision <= $2)
    `, [desde || null, hasta || null]);

    // =========================
    // EGRESOS
    // =========================
    const egresosQ = await pool.query(`
      SELECT COALESCE(SUM(t.valor), 0) AS total
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
    `, [desde || null, hasta || null]);

    // =========================
    // VIAJES
    // =========================
    const viajesQ = await pool.query(`
      SELECT COUNT(*) AS total
      FROM manifiesto
      WHERE ($1::date IS NULL OR fecha >= $1)
        AND ($2::date IS NULL OR fecha <= $2)
    `, [desde || null, hasta || null]);

    // =========================
    // FACTURAS PAGADAS / PENDIENTES
    // =========================
    const facturasQ = await pool.query(`
      SELECT 
        COALESCE(COUNT(*) FILTER (WHERE COALESCE(t.pagado,0) >= f.valor), 0) AS pagadas,
        COALESCE(COUNT(*) FILTER (WHERE COALESCE(t.pagado,0) < f.valor), 0) AS pendientes
      FROM factura f
      LEFT JOIN (
        SELECT 
          id_factura,
          COALESCE(SUM(valor),0) AS pagado
        FROM transaccion
        WHERE id_factura IS NOT NULL
        GROUP BY id_factura
      ) t ON t.id_factura = f.codigo_factura
      WHERE ($1::date IS NULL OR f.fecha_emision >= $1)
        AND ($2::date IS NULL OR f.fecha_emision <= $2)
    `, [desde || null, hasta || null]);

    const ingresos = Number(ingresosQ.rows[0].total);
    const egresos = Number(egresosQ.rows[0].total);
    const viajes = Number(viajesQ.rows[0].total);

    const utilidad = ingresos - egresos;
    const margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;

    const pagadas = Number(facturasQ.rows[0].pagadas || 0);
    const pendientes = Number(facturasQ.rows[0].pendientes || 0);

    return res.json({
      ingresos,
      egresos,
      utilidad,
      margen,
      viajes,
      facturas: {
        pagadas,
        pendientes
      }
    });

  } catch (error) {
    console.error("?? Error KPI:", error);
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
    console.error("Error getIngresosEgresos:", error);
    return res.status(500).json({ error: "Error obteniendo gráfica" });
  }
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

const getEstadoFacturacion = async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    const result = await pool.query(`
      SELECT 
        c.nombre AS cliente,

        -- TOTAL FACTURADO
        COALESCE(SUM(f.valor), 0) AS total_facturado,

        -- PAGADO (transacciones asociadas a factura)
        COALESCE(SUM(
          CASE 
            WHEN t.id IS NOT NULL THEN t.valor
            ELSE 0
          END
        ), 0) AS pagado,

        -- PENDIENTE
        COALESCE(SUM(f.valor), 0) - COALESCE(SUM(
          CASE 
            WHEN t.id IS NOT NULL THEN t.valor
            ELSE 0
          END
        ), 0) AS pendiente

      FROM factura f

      JOIN manifiesto m 
        ON f.id_manifiesto = m.id_manifiesto

      JOIN cliente c 
        ON m.id_cliente = c.nit

      LEFT JOIN transaccion t 
        ON t.id_factura = f.codigo_factura

      WHERE 
        ($1::date IS NULL OR f.fecha_emision >= $1)
        AND ($2::date IS NULL OR f.fecha_emision <= $2)

      GROUP BY c.nombre
      ORDER BY total_facturado DESC
    `, [desde || null, hasta || null]);

    return res.json(result.rows);

  } catch (error) {
    console.error("Error estado facturación:", error);
    return res.status(500).json({ error: "Error estado facturación" });
  }
};



const getTopClientes = async (req, res) => {
  try {

    const { desde, hasta } = req.query;

    const result = await pool.query(`
      SELECT 
        c.nombre AS cliente,
        COALESCE(SUM(f.valor), 0) AS total

      FROM factura f

      JOIN manifiesto m 
        ON f.id_manifiesto = m.id_manifiesto

      JOIN cliente c 
        ON m.id_cliente = c.nit

      WHERE 
        ($1::date IS NULL OR f.fecha_emision >= $1)
        AND ($2::date IS NULL OR f.fecha_emision <= $2)

      GROUP BY c.nombre
      ORDER BY total DESC
      LIMIT 5
    `, [desde || null, hasta || null]);

    return res.json(result.rows);

  } catch (error) {
    console.error("Error top clientes:", error);
    return res.status(500).json({ error: "Error top clientes" });
  }
};

// =========================
// EXPORTS
// =========================
module.exports = {
  getDashboardKPI,
  getRentabilidad,
  getIngresosEgresos,
  getGastosPorCategoria,
  getEstadoFacturacion,
  getTopClientes
};