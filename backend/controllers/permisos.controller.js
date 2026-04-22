const pool = require("../config/db");

// =========================
// GET PERMISOS
// =========================
const getPermisos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT codigo, nombre
      FROM permiso
      ORDER BY nombre
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error getPermisos:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPermisos
};