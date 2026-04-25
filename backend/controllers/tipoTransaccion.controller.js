const pool = require("../config/db");
const audit = require("../utils/audit");

// =========================
// CONSTANTES
// =========================
const TIPOS = [
  "INGRESO MANIFIESTO",
  "EGRESO MANIFIESTO",
  "EGRESO OPERACIONAL",
  "GASTO CONDUCTOR"
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
    const { estado, tipo, categoria } = req.query;

    let query = `
      SELECT *
      FROM tipo_transaccion
      WHERE 1=1
    `;

    const values = [];
    let i = 1;

    if (estado) {
      query += ` AND estado = $${i++}`;
      values.push(estado);
    }

    if (tipo) {
      query += ` AND tipo = $${i++}`;
      values.push(tipo);
    }

    if (categoria) {
      query += ` AND categoria ILIKE $${i++}`;
      values.push(`%${categoria}%`);
    }

    query += ` ORDER BY categoria ASC`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("Error obteniendo tipos:", error);
    res.status(500).json({
      error: "Error obteniendo tipos de transaccion"
    });
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
      return res.status(404).json({
        error: "Tipo de transaccion no encontrado"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error obteniendo tipo:", error);
    res.status(500).json({
      error: "Error obteniendo tipo de transaccion"
    });
  }
};

// =========================
// CREATE (AUTO ID)
// =========================
const createTipoTransaccion = async (req, res) => {
  try {
    let { categoria, descripcion, tipo, estado } = req.body;

    categoria = categoria?.trim();
    descripcion = descripcion?.trim() || null;
    tipo = tipo?.trim();
    estado = estado?.trim();

    if (!categoria || !tipo || !estado) {
      return res.status(400).json({
        error: "Campos obligatorios faltantes"
      });
    }

    if (!validarTipo(tipo)) {
      return res.status(400).json({
        error: "Tipo invalido"
      });
    }

    if (!validarEstado(estado)) {
      return res.status(400).json({
        error: "Estado invalido"
      });
    }

    // =========================
    // GENERAR ID TT1, TT2...
    // =========================
    const ultimo = await pool.query(`
      SELECT id
      FROM tipo_transaccion
      WHERE id LIKE 'TT%'
      ORDER BY CAST(SUBSTRING(id FROM 3) AS INT) DESC
      LIMIT 1
    `);

    let nuevoId = "TT1";

    if (ultimo.rows.length > 0) {
      const ultimoId = ultimo.rows[0].id;
      const numero = parseInt(
        ultimoId.replace("TT", ""),
        10
      );

      nuevoId = "TT" + (numero + 1);
    }

    // =========================
    // VALIDAR CATEGORIA DUPLICADA
    // =========================
    const existeCategoria = await pool.query(
      `SELECT id 
       FROM tipo_transaccion 
       WHERE LOWER(categoria) = LOWER($1)`,
      [categoria]
    );

    if (existeCategoria.rows.length > 0) {
      return res.status(400).json({
        error: "La categoría ya existe"
      });
    }

    // =========================
    // INSERT
    // =========================
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
      nuevoId,
      categoria,
      descripcion,
      tipo,
      estado
    ]);

    // =========================
    // AUDITORIA CREATE
    // =========================
    try {
      await audit({
        tabla: "tipo_transaccion",
        operacion: "CREATE",
        registroId: result.rows[0].id,
        usuarioId:
          req.headers["x-usuario-id"] || "US1",
        viejo: null,
        nuevo: result.rows[0],
        req
      });
    } catch (e) {
      console.error(
        "AUDIT CREATE TIPO TRANSACCION:",
        e.message
      );
    }

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creando tipo:", error);
    res.status(500).json({
      error: "Error creando tipo de transaccion"
    });
  }
};

// =========================
// UPDATE
// =========================
const updateTipoTransaccion = async (req, res) => {
  try {
    const { id } = req.params;

    let {
      categoria,
      descripcion,
      tipo,
      estado
    } = req.body;

    categoria = categoria?.trim();
    descripcion = descripcion?.trim() || null;
    tipo = tipo?.trim().toUpperCase();
    estado = estado?.trim();

    console.log("TIPO RECIBIDO:", tipo);

    const existe = await pool.query(
      `SELECT id 
       FROM tipo_transaccion 
       WHERE id = $1`,
      [id]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        error: "Tipo no encontrado"
      });
    }

    if (!categoria || !tipo || !estado) {
      return res.status(400).json({
        error: "Campos obligatorios faltantes"
      });
    }

    if (!validarTipo(tipo)) {
      console.log("TIPO INVALIDO:", tipo);

      return res.status(400).json({
        error: "Tipo invalido"
      });
    }

    if (!validarEstado(estado)) {
      return res.status(400).json({
        error: "Estado invalido"
      });
    }

    // =========================
    // TRAER ANTES
    // =========================
    const viejo = await pool.query(
      `SELECT * 
       FROM tipo_transaccion 
       WHERE id = $1`,
      [id]
    );

    // =========================
    // UPDATE
    // =========================
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
      descripcion,
      tipo,
      estado,
      id
    ]);

    // =========================
    // AUDITORIA UPDATE
    // =========================
    try {
      await audit({
        tabla: "tipo_transaccion",
        operacion: "UPDATE",
        registroId: id,
        usuarioId:
          req.headers["x-usuario-id"] || "US1",
        viejo: viejo.rows[0] || null,
        nuevo: result.rows[0] || null,
        req
      });
    } catch (e) {
      console.error(
        "AUDIT UPDATE TIPO TRANSACCION:",
        e.message
      );
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(
      "Error actualizando tipo:",
      error
    );

    res.status(500).json({
      error: "Error actualizando tipo de transaccion"
    });
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