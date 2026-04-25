const pool = require("../config/db");

const getLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.nombre_tabla,
        a.operacion,
        a.id_registro,
        a.id_usuario,
        COALESCE(u.nombre, a.id_usuario) AS usuario,
        a.dato_antiguo,
        a.dato_nuevo,
        a.ip,
        a.user_agent,
        a.creado
      FROM audit_logs a
      LEFT JOIN usuario u
        ON u.id = a.id_usuario
      ORDER BY a.creado DESC
      LIMIT 300
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("ERROR AUDITORIA:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getLogs
};