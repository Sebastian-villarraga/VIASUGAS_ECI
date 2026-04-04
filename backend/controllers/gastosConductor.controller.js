const pool = require("../config/db");

// =========================
// GET
// =========================
const getGastosConductor = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        gc.*,
        c.nombre AS conductor_nombre,
        t.valor,
        t.descripcion AS transaccion_descripcion
      FROM gastos_conductor gc
      INNER JOIN conductor c 
        ON gc.id_conductor = c.cedula
      INNER JOIN transaccion t
        ON gc.id_transaccion = t.id
      ORDER BY gc.creado DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("? Error obteniendo gastos:", error);
    res.status(500).json({ error: "Error obteniendo gastos conductor" });
  }
};

// =========================
// POST
// =========================
const createGastoConductor = async (req, res) => {
  try {
    const {
      id_transaccion,
      id_conductor,
      id_manifiesto,
      descripcion,
      fecha
    } = req.body;

    // ?? VALIDACIÓN
    if (!id_transaccion || !id_conductor) {
      return res.status(400).json({
        error: "id_transaccion y id_conductor son obligatorios"
      });
    }

    const result = await pool.query(`
      INSERT INTO gastos_conductor (
        id_transaccion,
        id_conductor,
        id_manifiesto,
        descripcion,
        creado
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      id_transaccion,
      id_conductor,
      id_manifiesto || null,
      descripcion || "",
      fecha || new Date()
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("? Error creando gasto:", error);
    res.status(500).json({ error: "Error creando gasto conductor" });
  }
};

module.exports = {
  getGastosConductor,
  createGastoConductor
};