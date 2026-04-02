const pool = require("../config/db");

// =========================
// CONSTANTES
// =========================
const TIPOS = [
  "INGRESO MANIFIESTO",
  "EGRESO MANIFIESTO",
  "EGRESO OPERACIONAL"
];

const ESTADOS = ["activo", "inactivo"];

// =========================
// HELPERS
// =========================
function validarTipo(tipo) {
  return TIPOS.includes(tipo);
}

function validarEstado(estado) {
  return ESTADOS.includes(estado);
}

// =========================
// GET TODOS
// =========================
const getTiposTransaccion = async (req, res) => {
  try {
    const { estado, tipo } = req.query;

    let query = `
      SELECT *
      FROM tipo_transaccion
      WHERE 1=1
    `;

    const values = [];
    let i = 1;

    if (estado) {
      query += ` AND estado = $${i}`;
      values.push(estado);
      i++;
    }

    if (tipo) {
      query += ` AND tipo = $${i}`;
      values.push(tipo);
      i++;
    }

    query += ` ORDER BY categoria ASC`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("Error obteniendo tipos:", error);
    res.status(500).json({ error: "Error obteniendo tipos de transaccion" });
  }
};

// =========================
// GET BY ID
// =========================
const getTipoTransaccionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM tipo_transaccion WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tipo de transaccion no encontrado" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: "Error obteniendo tipo de transaccion" });
  }
};

// =========================
// CREATE
// =========================
const createTipoTransaccion = async (req, res) => {
  try {
    const {
      id,
      categoria,
      descripcion,
      tipo,
      estado
    } = req.body;

    // VALIDACIONES
    if (!id || !categoria || !tipo || !estado) {
      return res.status(400).json({ error: "Campos obligatorios faltantes" });
    }

    if (!validarTipo(tipo)) {
      return res.status(400).json({ error: "Tipo invalido" });
    }

    if (!validarEstado(estado)) {
      return res.status(400).json({ error: "Estado invalido" });
    }

    // VALIDAR DUPLICADO
    const existe = await pool.query(
      `SELECT id FROM tipo_transaccion WHERE id = $1`,
      [id]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "El ID ya existe" });
    }

    const result = await pool.query(`
      INSERT INTO tipo_transaccion (
        id,
        categoria,
        descripcion,
        tipo,
        estado,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,NOW())
      RETURNING *
    `, [
      id,
      categoria,
      descripcion || null,
      tipo,
      estado
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creando tipo:", error);
    res.status(500).json({ error: "Error creando tipo de transaccion" });
  }
};

// =========================
// UPDATE
// =========================
const updateTipoTransaccion = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      categoria,
      descripcion,
      tipo,
      estado
    } = req.body;

    // VALIDAR EXISTE
    const existe = await pool.query(
      `SELECT id FROM tipo_transaccion WHERE id = $1`,
      [id]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({ error: "Tipo no encontrado" });
    }

    // VALIDACIONES
    if (!validarTipo(tipo)) {
      return res.status(400).json({ error: "Tipo invalido" });
    }

    if (!validarEstado(estado)) {
      return res.status(400).json({ error: "Estado invalido" });
    }

    const result = await pool.query(`
      UPDATE tipo_transaccion
      SET
        categoria = $1,
        descripcion = $2,
        tipo = $3,
        estado = $4
      WHERE id = $5
      RETURNING *
    `, [
      categoria,
      descripcion || null,
      tipo,
      estado,
      id
    ]);

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error actualizando tipo:", error);
    res.status(500).json({ error: "Error actualizando tipo de transaccion" });
  }
};

// =========================
// EXPORT
// =========================
module.exports = {
  getTiposTransaccion,
  getTipoTransaccionById,
  createTipoTransaccion,
  updateTipoTransaccion
};