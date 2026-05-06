const pool = require("../config/db");

// =============================
// BASE QUERY (CORREGIDA REAL)
// =============================
function getBaseQuery() {
  return `
    WITH base AS (

      SELECT
        m.id_manifiesto,
        m.fecha,
        c.nombre AS conductor,
        COALESCE(m.valor_flete, 0) AS valor_total

      FROM manifiesto m

      LEFT JOIN conductor c
        ON c.cedula = m.id_conductor

      WHERE
        ($1::date IS NULL OR m.fecha >= $1)
        AND ($2::date IS NULL OR m.fecha <= $2)
        AND (
              $3::text IS NULL
              OR $3::text = ''
              OR c.nombre ILIKE '%' || $3::text || '%'
            )
    ),

    comisiones AS (
      SELECT
        t.id_manifiesto,
        SUM(t.valor) AS comisiones
      FROM transaccion t
      JOIN tipo_transaccion tt ON tt.id = t.id_tipo_transaccion
      WHERE tt.categoria = 'COMISIONES'
      GROUP BY t.id_manifiesto
    ),

    anticipos AS (
      SELECT
        t.id_manifiesto,
        SUM(t.valor) AS anticipos
      FROM transaccion t
      JOIN tipo_transaccion tt ON tt.id = t.id_tipo_transaccion
      WHERE tt.categoria = 'ANTICIPO CONDUCTOR'
      GROUP BY t.id_manifiesto
    ),

    -- ?? FIX REAL
    gastos AS (
      SELECT
        gc.id_manifiesto,
        SUM(t.valor) AS gastos
      FROM gastos_conductor gc
      JOIN transaccion t 
        ON t.id = gc.id_transaccion
      GROUP BY gc.id_manifiesto
    )

    SELECT
      b.id_manifiesto,
      b.fecha,
      b.conductor,
      b.valor_total,

      COALESCE(c.comisiones, 0) AS comisiones,

      (b.valor_total - COALESCE(c.comisiones, 0)) AS base,

      ((b.valor_total - COALESCE(c.comisiones, 0)) * 0.08) AS porcentaje_conductor,

      COALESCE(a.anticipos, 0) AS anticipo,

      COALESCE(g.gastos, 0) AS gastos,

      (COALESCE(a.anticipos, 0) - COALESCE(g.gastos, 0)) AS saldo,

      (
        ((b.valor_total - COALESCE(c.comisiones, 0)) * 0.08)
        -
        (COALESCE(a.anticipos, 0) - COALESCE(g.gastos, 0))
      ) AS total_pago

    FROM base b

    LEFT JOIN comisiones c ON c.id_manifiesto = b.id_manifiesto
    LEFT JOIN anticipos a ON a.id_manifiesto = b.id_manifiesto
    LEFT JOIN gastos g ON g.id_manifiesto = b.id_manifiesto

    ORDER BY b.fecha DESC
  `;
}

// =============================
// GET TABLA
// =============================
const getDashboardConductores = async (req, res) => {
  try {
    let { desde, hasta, conductor } = req.query;

    desde = desde || null;
    hasta = hasta || null;
    if (!conductor || conductor === "") {
      conductor = null;
    }

    const result = await pool.query(
      getBaseQuery(),
      [desde, hasta, conductor]
    );

    return res.json(
      result.rows.map(r => ({
        id_manifiesto: r.id_manifiesto,
        fecha: r.fecha,
        conductor: r.conductor,
        valor_total: Number(r.valor_total || 0),
        comisiones: Number(r.comisiones || 0),
        base: Number(r.base || 0),
        porcentaje_conductor: Number(r.porcentaje_conductor || 0),
        anticipo: Number(r.anticipo || 0),
        gastos: Number(r.gastos || 0),
        saldo: Number(r.saldo || 0),
        total_pago: Number(r.total_pago || 0)
      }))
    );

  } catch (error) {
    console.error("?? ERROR SQL REAL:", error);
    return res.status(500).json({ error: error.message }); // ?? CLAVE
  }
};

// =============================
// GET CONDUCTORES
// =============================
const getConductores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nombre
      FROM conductor
      ORDER BY nombre
    `);

    return res.json(result.rows);

  } catch (error) {
    console.error("Error conductores:", error.message);
    return res.status(500).json({ error: "Error conductores" });
  }
};

module.exports = {
  getDashboardConductores,
  getConductores
};