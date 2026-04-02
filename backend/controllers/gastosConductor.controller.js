const pool = require("../config/db");

const getGastosConductor = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT gc.*,
             c.nombre AS conductor_nombre
      FROM gastos_conductor gc
      INNER JOIN conductor c ON gc.id_conductor = c.cedula
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo gastos conductor" });
  }
};

const createGastoConductor = async (req, res) => {
  try {
    const {
      id,
      id_transaccion,
      id_conductor,
      id_manifiesto,
      descripcion
    } = req.body;

    const result = await pool.query(`
      INSERT INTO gastos_conductor (
        id,
        id_transaccion,
        id_conductor,
        id_manifiesto,
        descripcion,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,NOW())
      RETURNING *
    `, [
      id,
      id_transaccion,
      id_conductor,
      id_manifiesto,
      descripcion
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: "Error creando gasto conductor" });
  }
};

module.exports = { getGastosConductor, createGastoConductor };