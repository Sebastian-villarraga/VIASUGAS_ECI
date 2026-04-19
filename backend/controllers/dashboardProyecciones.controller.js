// ======================================================
// controllers/dashboardProyecciones.controller.js
// CORREGIDO COMPLETO / FILTROS REALES / PROFESIONAL
// ======================================================

const pool = require("../config/db");

// ======================================================
// HELPERS
// ======================================================
function getFiltros(req) {
  const { desde, hasta } = req.query;

  return {
    desde: desde || null,
    hasta: hasta || null
  };
}

// ======================================================
// QUERY BASE PROYECCIÓN
// ======================================================
function getBaseProjectionQuery() {
  return `
    WITH pagos_por_manifiesto AS (

      SELECT
        t.id_manifiesto,
        COALESCE(SUM(t.valor),0) AS pagado

      FROM transaccion t

      JOIN tipo_transaccion tt
        ON tt.id = t.id_tipo_transaccion

      WHERE t.id_manifiesto IS NOT NULL
        AND tt.tipo = 'INGRESO MANIFIESTO'

      GROUP BY t.id_manifiesto
    ),

    proyeccion AS (

      SELECT
        f.codigo_factura,
        f.fecha_emision,
        f.fecha_vencimiento,

        COALESCE(c.nombre,'Sin cliente') AS cliente,
        COALESCE(eac.nombre,'Sin empresa') AS empresa_a_cargo,

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
          ) - COALESCE(p.pagado,0),
          0
        ) AS pendiente_proyectado

      FROM factura f

      JOIN manifiesto m
        ON f.id_manifiesto = m.id_manifiesto

      LEFT JOIN cliente c
        ON c.nit = m.id_cliente

      LEFT JOIN empresa_a_cargo eac
        ON eac.nit = m.id_empresa_a_cargo

      LEFT JOIN pagos_por_manifiesto p
        ON p.id_manifiesto = m.id_manifiesto

      WHERE f.fecha_vencimiento IS NOT NULL
        AND ($1::date IS NULL OR f.fecha_vencimiento >= $1)
        AND ($2::date IS NULL OR f.fecha_vencimiento <= $2)
    )
  `;
}

// ======================================================
// KPI
// ======================================================
const getDashboardProyeccionesKPI = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseProjectionQuery()}

      SELECT
        COALESCE(SUM(valor_neto),0) AS total_periodo,

        COALESCE(SUM(pagado),0) AS pagado_total,

        COUNT(*) FILTER (
          WHERE pendiente_proyectado > 0
        ) AS facturas_proyectadas,

        COUNT(DISTINCT cliente) FILTER (
          WHERE pendiente_proyectado > 0
        ) AS clientes_proyectados,

        ROUND(
          AVG(
            CASE
              WHEN pendiente_proyectado > 0
              THEN pendiente_proyectado
            END
          ),2
        ) AS ticket_promedio_proyectado

      FROM proyeccion
    `, [desde, hasta]);

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error KPI proyecciones"
    });
  }
};

// ======================================================
// PROYECCIÓN MENSUAL
// ======================================================
const getProyeccionMensual = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const result = await pool.query(`
      ${getBaseProjectionQuery()}

      SELECT
        TO_CHAR(
          DATE_TRUNC('month', fecha_vencimiento),
          'YYYY-MM'
        ) AS mes,

        COUNT(*) AS facturas,

        COALESCE(
          SUM(valor_neto),0
        ) AS total

      FROM proyeccion

      GROUP BY DATE_TRUNC('month', fecha_vencimiento)

      ORDER BY DATE_TRUNC('month', fecha_vencimiento)
    `, [desde || null, hasta || null]);

    res.json(result.rows);

  } catch (error) {
    console.error("Error proyección mensual:", error);

    res.status(500).json({
      error: "Error proyección mensual"
    });
  }
};

// ======================================================
// PROYECCIÓN SEMANAL
// ======================================================
const getProyeccionSemanal = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const result = await pool.query(`
      ${getBaseProjectionQuery()}

      SELECT
        TO_CHAR(
          DATE_TRUNC('week', fecha_vencimiento),
          'YYYY-MM-DD'
        ) AS semana_inicio,

        COUNT(*) AS facturas,

        COALESCE(
          SUM(valor_neto),0
        ) AS total

      FROM proyeccion

      GROUP BY DATE_TRUNC('week', fecha_vencimiento)

      ORDER BY DATE_TRUNC('week', fecha_vencimiento)
    `, [desde || null, hasta || null]);

    res.json(result.rows);

  } catch (error) {
    console.error("Error proyección semanal:", error);

    res.status(500).json({
      error: "Error proyección semanal"
    });
  }
};

// ======================================================
// TOP CLIENTES
// ======================================================
const getTopClientesProyectados = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseProjectionQuery()}

      SELECT
        cliente,
        COALESCE(
          SUM(pendiente_proyectado),0
        ) AS total

      FROM proyeccion
      WHERE pendiente_proyectado > 0

      GROUP BY cliente
      ORDER BY total DESC
      LIMIT 10
    `, [desde, hasta]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error top clientes"
    });
  }
};

// ======================================================
// FACTURAS PRÓXIMAS
// ======================================================
const getFacturasProximasVencer = async (req, res) => {
  try {
    const { desde, hasta } = getFiltros(req);

    const result = await pool.query(`
      ${getBaseProjectionQuery()}

      SELECT
        codigo_factura,
        cliente,
        fecha_vencimiento,
        valor_bruto,
        retencion_fuente,
        retencion_ica,
        valor_neto,
        pagado,
        pendiente_proyectado

      FROM proyeccion
      WHERE pendiente_proyectado > 0

      ORDER BY fecha_vencimiento ASC
      LIMIT 50
    `, [desde, hasta]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error facturas próximas"
    });
  }
};

// ======================================================
// DETALLE
// ======================================================
const getDetalleProyeccion = async (req,res) => {
  try {

    const { desde, hasta } = req.query;

    const result = await pool.query(`
      ${getBaseProjectionQuery()}

      SELECT
        cliente,
        empresa_a_cargo,
        codigo_factura,
        fecha_emision,
        fecha_vencimiento,
        valor_bruto,
        retencion_fuente,
        retencion_ica,
        valor_neto,
        pagado,
        pendiente_proyectado
      FROM proyeccion
      ORDER BY fecha_vencimiento ASC

    `,[desde || null, hasta || null]);

    res.json(result.rows);

  } catch(error){
    console.error(error);
    res.status(500).json({error:"Error detalle"});
  }
};

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  getDashboardProyeccionesKPI,
  getProyeccionMensual,
  getProyeccionSemanal,
  getTopClientesProyectados,
  getFacturasProximasVencer,
  getDetalleProyeccion
};