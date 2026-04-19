const pool = require("../config/db");

// =========================
// KPI GERENCIAL
// =========================
// =========================
// KPI GERENCIAL CORREGIDO
// SOLO EGRESO MANIFIESTO
// =========================
const getDashboardKPI = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    // ======================
    // INGRESOS REALES
    // ======================
    const ingresosQ = await pool.query(`
      SELECT COALESCE(SUM(t.valor),0) AS total
      FROM transaccion t
      JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion
      WHERE tt.tipo = 'INGRESO MANIFIESTO'
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)
    `,[desde || null, hasta || null]);

    // ======================
    // FACTURADO
    // ======================
    const facturadoQ = await pool.query(`
      SELECT COALESCE(SUM(valor),0) AS total
      FROM factura
      WHERE ($1::date IS NULL OR fecha_emision >= $1)
        AND ($2::date IS NULL OR fecha_emision <= $2)
    `,[desde || null, hasta || null]);

    // ======================
    // EGRESOS (SOLO MANIFIESTO)
    // ======================
    const egresosQ = await pool.query(`
      SELECT
        COALESCE(SUM(t.valor),0) AS total
      FROM transaccion t
      JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion
      WHERE tt.tipo = 'EGRESO MANIFIESTO'
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)
    `,[desde || null, hasta || null]);

    // ======================
    // GASTOS OPERACIONALES
    // (SE MANTIENE CARD APARTE)
    // ======================
    const operacionalesQ = await pool.query(`
      SELECT
        COALESCE(SUM(t.valor),0) AS total
      FROM transaccion t
      JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion
      WHERE tt.tipo = 'EGRESO OPERACIONAL'
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)
    `,[desde || null, hasta || null]);

    // ======================
    // VIAJES
    // ======================
    const viajesQ = await pool.query(`
      SELECT COUNT(*) total
      FROM manifiesto
      WHERE ($1::date IS NULL OR fecha >= $1)
        AND ($2::date IS NULL OR fecha <= $2)
    `,[desde || null, hasta || null]);

    // ======================
    // ESTADO FACTURACION
    // ======================
    const estadoQ = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE f.codigo_factura IS NOT NULL
        ) facturados,

        COUNT(*) FILTER (
          WHERE f.codigo_factura IS NULL
        ) pendientes

      FROM manifiesto m
      LEFT JOIN factura f
        ON f.id_manifiesto = m.id_manifiesto

      WHERE ($1::date IS NULL OR m.fecha >= $1)
        AND ($2::date IS NULL OR m.fecha <= $2)
    `,[desde || null, hasta || null]);

    const ingresos = Number(ingresosQ.rows[0].total || 0);
    const facturado = Number(facturadoQ.rows[0].total || 0);
    const egresos = Number(egresosQ.rows[0].total || 0);

    const gastosOperacionales =
      Number(operacionalesQ.rows[0].total || 0);

    const viajes = Number(viajesQ.rows[0].total || 0);

    const utilidad = ingresos - egresos;

    const margen =
      ingresos > 0
      ? ((utilidad / ingresos) * 100)
      : 0;

    return res.json({
      ingresos,
      egresos,
      utilidad,
      margen,
      viajes,
      gastosOperacionales,

      periodo:{
        desde,
        hasta
      },

      facturas:{
        totalFacturado: facturado,
        facturados: Number(estadoQ.rows[0].facturados || 0),
        pendientes: Number(estadoQ.rows[0].pendientes || 0)
      }
    });

  } catch(error){
    console.error(error);

    res.status(500).json({
      error:"Error KPI"
    });
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

        COALESCE(c.nombre,'Sin cliente') AS cliente,

        COALESCE(eac.nombre,'Sin empresa') AS empresa_a_cargo,

        COALESCE(f.valor,0) AS valor_facturado,

        (
          COALESCE(f.retencion_fuente,0)
          + COALESCE(f.retencion_ica,0)
        ) AS retenciones,

        COALESCE(SUM(
          CASE
            WHEN tt.tipo='INGRESO MANIFIESTO'
            THEN t.valor ELSE 0
          END
        ),0) AS ingreso,

        COALESCE(SUM(
          CASE
            WHEN tt.tipo='EGRESO MANIFIESTO'
            THEN t.valor ELSE 0
          END
        ),0) AS egreso,

        COALESCE(SUM(
          CASE
            WHEN tt.tipo='GASTO CONDUCTOR'
            THEN t.valor ELSE 0
          END
        ),0) AS gasto_conductor,

        COALESCE(SUM(
          CASE
            WHEN tt.tipo='INGRESO MANIFIESTO'
            THEN t.valor ELSE 0
          END
        ),0)

        -

        COALESCE(SUM(
          CASE
            WHEN tt.tipo='EGRESO MANIFIESTO'
            THEN t.valor ELSE 0
          END
        ),0)

        AS utilidad

      FROM manifiesto m

      LEFT JOIN factura f
        ON f.id_manifiesto = m.id_manifiesto

      LEFT JOIN cliente c
        ON c.nit = m.id_cliente

      LEFT JOIN empresa_a_cargo eac
        ON eac.nit = m.id_empresa_a_cargo

      LEFT JOIN transaccion t
        ON t.id_manifiesto = m.id_manifiesto

      LEFT JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion

      WHERE
        ($1::date IS NULL OR m.fecha >= $1)
        AND ($2::date IS NULL OR m.fecha <= $2)

      GROUP BY
        m.id_manifiesto,
        c.nombre,
        eac.nombre,
        f.valor,
        f.retencion_fuente,
        f.retencion_ica

      ORDER BY utilidad DESC
    `,[desde || null, hasta || null]);

    res.json(result.rows);

  } catch(error){
    console.error(error);
    res.status(500).json({ error:"Error rentabilidad" });
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
      WHERE tt.tipo = 'EGRESO MANIFIESTO'
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
        base.cliente,
        base.empresa_a_cargo,
        base.total_facturado,
        base.retenciones,

        COALESCE(pagos.pagado,0) AS pagado,

        (
          base.total_facturado
          - base.retenciones
          - COALESCE(pagos.pagado,0)
        ) AS pendiente

      FROM (

        SELECT
          COALESCE(c.nombre,'Sin cliente') AS cliente,

          COALESCE(eac.nombre,'Sin empresa') AS empresa_a_cargo,

          SUM(COALESCE(f.valor,0)) AS total_facturado,

          SUM(
            COALESCE(f.retencion_fuente,0)
            + COALESCE(f.retencion_ica,0)
          ) AS retenciones

        FROM factura f

        JOIN manifiesto m
          ON f.id_manifiesto = m.id_manifiesto

        LEFT JOIN cliente c
          ON m.id_cliente = c.nit

        LEFT JOIN empresa_a_cargo eac
          ON m.id_empresa_a_cargo = eac.nit

        WHERE
          ($1::date IS NULL OR f.fecha_emision >= $1)
          AND ($2::date IS NULL OR f.fecha_emision <= $2)

        GROUP BY
          c.nombre,
          eac.nombre

      ) base

      LEFT JOIN (

        SELECT
          COALESCE(c.nombre,'Sin cliente') AS cliente,

          COALESCE(eac.nombre,'Sin empresa') AS empresa_a_cargo,

          SUM(COALESCE(t.valor,0)) AS pagado

        FROM transaccion t

        JOIN tipo_transaccion tt
          ON tt.id = t.id_tipo_transaccion

        JOIN manifiesto m
          ON t.id_manifiesto = m.id_manifiesto

        LEFT JOIN cliente c
          ON m.id_cliente = c.nit

        LEFT JOIN empresa_a_cargo eac
          ON m.id_empresa_a_cargo = eac.nit

        WHERE
          tt.tipo = 'INGRESO MANIFIESTO'
          AND ($1::date IS NULL OR t.fecha_pago >= $1)
          AND ($2::date IS NULL OR t.fecha_pago <= $2)

        GROUP BY
          c.nombre,
          eac.nombre

      ) pagos

      ON pagos.cliente = base.cliente
      AND pagos.empresa_a_cargo = base.empresa_a_cargo

      ORDER BY base.total_facturado DESC
    `,[desde || null, hasta || null]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:"Error estado facturación"
    });
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
// GASTOS OPERACIONALES
// =========================
const getGastosOperacionales = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const result = await pool.query(`
      SELECT
        t.fecha_pago AS fecha,
        tt.categoria AS categoria,
        COALESCE(b.nombre_banco,'Sin banco') AS banco,
        t.valor,
        COALESCE(t.descripcion,'-') AS descripcion

      FROM transaccion t

      INNER JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion

      LEFT JOIN banco b
        ON b.id = t.id_banco

      WHERE tt.tipo = 'EGRESO OPERACIONAL'
        AND ($1::date IS NULL OR t.fecha_pago >= $1)
        AND ($2::date IS NULL OR t.fecha_pago <= $2)

      ORDER BY t.fecha_pago DESC
    `,[desde || null, hasta || null]);

    res.json(result.rows);

  } catch(error){
    console.error(error);
    res.status(500).json({
      error: "Error gastos operacionales"
    });
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
  getTopClientes,
  getGastosOperacionales
};