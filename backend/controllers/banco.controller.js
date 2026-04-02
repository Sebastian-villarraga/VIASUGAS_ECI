const pool = require("../config/db");

// =========================
// GET
// =========================
const getBancos = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM banco
      ORDER BY nombre_banco ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo bancos" });
  }
};

// =========================
// GET BY ID
// =========================
const getBancoById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM banco WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banco no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo banco" });
  }
};

// =========================
// CREATE
// =========================
const createBanco = async (req, res) => {
  try {
    const {
      id,
      nombre_banco,
      numero_cuenta,
      tipo_cuenta,
      nombre_titular,
      identificacion
    } = req.body;

    if (!id || !nombre_banco || !numero_cuenta || !tipo_cuenta) {
      return res.status(400).json({ error: "Campos obligatorios faltantes" });
    }

    const query = `
      INSERT INTO banco (
        id,
        nombre_banco,
        numero_cuenta,
        tipo_cuenta,
        nombre_titular,
        identificacion,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      nombre_banco,
      numero_cuenta,
      tipo_cuenta,
      nombre_titular,
      identificacion
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: "Error creando banco" });
  }
};

// =========================
// UPDATE
// =========================
const updateBanco = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre_banco,
      numero_cuenta,
      tipo_cuenta,
      nombre_titular,
      identificacion
    } = req.body;

    const result = await pool.query(`
      UPDATE banco
      SET
        nombre_banco = $1,
        numero_cuenta = $2,
        tipo_cuenta = $3,
        nombre_titular = $4,
        identificacion = $5
      WHERE id = $6
      RETURNING *
    `, [
      nombre_banco,
      numero_cuenta,
      tipo_cuenta,
      nombre_titular,
      identificacion,
      id
    ]);

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: "Error actualizando banco" });
  }
};

module.exports = {
  getBancos,
  getBancoById,
  createBanco,
  updateBanco
};