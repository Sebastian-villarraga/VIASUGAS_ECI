const pool = require("../config/db");

// =========================
// MANIFIESTOS POR CONDUCTOR
// =========================
const getManifiestosByConductor = async (req, res) => {
  try {
    const { cedula } = req.params;

    const result = await pool.query(`
      SELECT id_manifiesto, fecha, estado
      FROM manifiesto
      WHERE id_conductor = $1
      ORDER BY fecha DESC
    `, [cedula]);

    res.json(result.rows);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================
// GASTOS POR MANIFIESTO
// =========================
const getGastosByManifiesto = async (req, res) => {
  try {
    const { manifiesto } = req.query;

    const result = await pool.query(`
      SELECT 
        gc.id,
        gc.descripcion,
        gc.creado,
        t.valor
      FROM gastos_conductor gc
      INNER JOIN transaccion t 
        ON gc.id_transaccion = t.id
      WHERE gc.id_manifiesto = $1
      ORDER BY gc.creado DESC
    `, [manifiesto]);

    res.json(result.rows);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getManifiestosByConductor,
  getGastosByManifiesto
};