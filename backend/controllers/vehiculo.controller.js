const pool = require("../config/db");

// =====================
// GET VEHICULOS
// =====================
const getVehiculos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.placa,
        p.nombre AS id_propietario,
        v.todo_riesgo,
        v.soat AS vencimiento_soat,
        v.tecnomecanica AS vencimiento_tecno,
        v.estado
      FROM Vehiculo v
      LEFT JOIN Propietario p ON v.propietario = p.identificacion
      ORDER BY v.placa;
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error vehículos:", error);
    res.status(500).json({ error: "Error obteniendo vehículos" });
  }
};

module.exports = {
  getVehiculos
};