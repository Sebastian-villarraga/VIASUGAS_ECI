const pool = require("../config/db");
const { randomUUID } = require("crypto");

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
  const client = await pool.connect();

  try {
    const {
      tipo_transaccion,
      valor,
      id_manifiesto,
      descripcion,
      fecha
    } = req.body;

    if (!tipo_transaccion || !id_manifiesto || !valor) {
      return res.status(400).json({
        error: "tipo_transaccion, valor e id_manifiesto son obligatorios"
      });
    }

    await client.query("BEGIN");

    // =========================
    // 1. OBTENER CONDUCTOR
    // =========================
    const resultManifiesto = await client.query(`
      SELECT id_conductor
      FROM manifiesto
      WHERE id_manifiesto = $1
    `, [id_manifiesto]);

    if (resultManifiesto.rows.length === 0) {
      throw new Error("Manifiesto no encontrado");
    }

    const id_conductor = resultManifiesto.rows[0].id_conductor;

    // =========================
    // 2. CREAR TRANSACCION
    // =========================
    const id_transaccion = randomUUID();

    const id_banco_default = null; // ?? ajusta si quieres

    await client.query(`
      INSERT INTO transaccion (
        id,
        id_banco,
        id_tipo_transaccion,
        id_manifiesto,
        valor,
        fecha_pago,
        descripcion,
        creado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      id_transaccion,
      id_banco_default,
      tipo_transaccion,
      id_manifiesto,
      valor,
      fecha || new Date(),
      descripcion || "Gasto conductor"
    ]);

    // =========================
    // 3. CREAR GASTO
    // =========================
    const id_gasto = randomUUID();

    const gastoResult = await client.query(`
      INSERT INTO gastos_conductor (
        id,
        id_transaccion,
        id_conductor,
        id_manifiesto,
        descripcion,
        creado
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      id_gasto,
      id_transaccion,
      id_conductor,
      id_manifiesto,
      descripcion || "",
      fecha || new Date()
    ]);

    await client.query("COMMIT");

    res.status(201).json(gastoResult.rows[0]);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creando gasto:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getGastosConductor,
  createGastoConductor
};