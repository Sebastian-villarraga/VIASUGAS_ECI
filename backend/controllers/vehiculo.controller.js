const pool = require("../config/db");

// =====================
// GET VEHICULOS (CON FILTROS)
// =====================
const getVehiculos = async (req, res) => {
  try {
    const { placa, propietario, estado } = req.query;

    let query = `
      SELECT 
        v.placa,
        p.nombre AS propietario,
        v.vencimiento_todo_riesgo,
        v.vencimiento_soat,
        v.vencimiento_tecno,
        v.estado
      FROM vehiculo v
      LEFT JOIN propietario p 
        ON v.id_propietario = p.identificacion
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    // ?? FILTRO POR PLACA
    if (placa) {
      query += ` AND v.placa ILIKE $${index}`;
      values.push(`%${placa}%`);
      index++;
    }

    // ?? FILTRO POR PROPIETARIO
    if (propietario) {
      query += ` AND p.nombre ILIKE $${index}`;
      values.push(`%${propietario}%`);
      index++;
    }

    // ?? FILTRO POR ESTADO
    if (estado) {
      query += ` AND v.estado = $${index}`;
      values.push(estado);
      index++;
    }

    query += ` ORDER BY v.placa`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("? ERROR VEHICULOS:", error);
    res.status(500).json({ 
      error: "Error obteniendo vehículos", 
      detalle: error.message 
    });
  }
};

module.exports = {
  getVehiculos
};