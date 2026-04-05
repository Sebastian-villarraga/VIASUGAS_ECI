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

const CONTEXTOS = ["manifiesto", "operacional"];

// =========================
// HELPERS
// =========================
function validarTipo(tipo) {
  return TIPOS.includes(tipo);
}

function validarEstado(estado) {
  return ESTADOS.includes(estado);
}

// ?? MAPEAR A BD (CLAVE DEL FIX)
function mapearTipoBD(tipo) {
  if (tipo.includes("INGRESO")) return "ingreso";
  return "egreso";
}

// ?? RELACIÓN AUTOMÁTICA
function obtenerContextoDesdeTipo(tipo) {
  if (tipo === "EGRESO OPERACIONAL") return "operacional";
  return "manifiesto";
}

// =========================
// GET TODOS
// =========================
const getTiposTransaccion = async (req, res) => {
  try {
    const { estado, tipo, categoria, contexto } = req.query;

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
      // ?? permitir buscar por ingreso/egreso o texto completo
      if (tipo.includes("INGRESO") || tipo.includes("EGRESO")) {
        query += ` AND tipo = $${i}`;
        values.push(mapearTipoBD(tipo));
      } else {
        query += ` AND tipo = $${i}`;
        values.push(tipo);
      }
      i++;
    }

    if (categoria) {
      query += ` AND categoria ILIKE $${i}`;
      values.push(`%${categoria}%`);
      i++;
    }

    if (contexto) {
      query += ` AND contexto = $${i}`;
      values.push(contexto);
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
    let { id, categoria, descripcion, tipo, estado } = req.body;

    // NORMALIZAR
    id = id?.trim();
    categoria = categoria?.trim();
    descripcion = descripcion?.trim();
    tipo = tipo?.trim();
    estado = estado?.trim();

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

    const tipoBD = mapearTipoBD(tipo); // ?? FIX
    const contexto = obtenerContextoDesdeTipo(tipo);

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
        contexto,
        estado,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
    `, [
      id,
      categoria,
      descripcion || null,
      tipoBD, // ?? FIX
      contexto,
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

    let { categoria, descripcion, tipo, estado } = req.body;

    categoria = categoria?.trim();
    descripcion = descripcion?.trim();
    tipo = tipo?.trim();
    estado = estado?.trim();

    const existe = await pool.query(
      `SELECT id FROM tipo_transaccion WHERE id = $1`,
      [id]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({ error: "Tipo no encontrado" });
    }

    if (!categoria || !tipo || !estado) {
      return res.status(400).json({ error: "Campos obligatorios faltantes" });
    }

    if (!validarTipo(tipo)) {
      return res.status(400).json({ error: "Tipo invalido" });
    }

    if (!validarEstado(estado)) {
      return res.status(400).json({ error: "Estado invalido" });
    }

    const tipoBD = mapearTipoBD(tipo); // ?? FIX
    const contexto = obtenerContextoDesdeTipo(tipo);

    const result = await pool.query(`
      UPDATE tipo_transaccion
      SET
        categoria = $1,
        descripcion = $2,
        tipo = $3,
        contexto = $4,
        estado = $5
      WHERE id = $6
      RETURNING *
    `, [
      categoria,
      descripcion || null,
      tipoBD, // ?? FIX
      contexto,
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