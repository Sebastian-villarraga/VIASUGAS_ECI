const pool = require("../config/db");
const audit = require("../utils/audit");

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
      return res.status(404).json({
        error: "Banco no encontrado"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: "Error obteniendo banco"
    });
  }
};

// =========================
// CREATE (ID AUTO BN#)
// =========================
const createBanco = async (req, res) => {
  try {
    let {
      nombre_banco,
      numero_cuenta,
      tipo_cuenta,
      nombre_titular,
      identificacion
    } = req.body;

    console.log("?? BODY ORIGINAL:", req.body);

    // =========================
    // NORMALIZAR DATOS
    // =========================
    nombre_banco = nombre_banco?.trim();
    numero_cuenta = numero_cuenta?.trim();
    tipo_cuenta = tipo_cuenta?.toLowerCase().trim();
    nombre_titular = nombre_titular?.trim() || null;
    identificacion = identificacion?.trim() || null;

    console.log("?? BODY LIMPIO:", {
      nombre_banco,
      numero_cuenta,
      tipo_cuenta
    });

    // =========================
    // VALIDACIONES
    // =========================
    if (!nombre_banco || !numero_cuenta || !tipo_cuenta) {
      return res.status(400).json({
        error: "Campos obligatorios faltantes"
      });
    }

    if (!["ahorros", "corriente"].includes(tipo_cuenta)) {
      return res.status(400).json({
        error: "Tipo de cuenta inválido"
      });
    }

    // =========================
    // GENERAR ID
    // =========================
    const newId = "BN" + Date.now();

    // =========================
    // INSERT
    // =========================
    const result = await pool.query(`
      INSERT INTO banco (
        id,
        nombre_titular,
        identificacion,
        nombre_banco,
        numero_cuenta,
        tipo_cuenta,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
    `, [
      newId,
      nombre_titular,
      identificacion,
      nombre_banco,
      numero_cuenta,
      tipo_cuenta
    ]);

    // =========================
    // AUDITORIA CREATE
    // =========================
    try {
      await audit({
        tabla: "banco",
        operacion: "CREATE",
        registroId: result.rows[0].id,
        usuarioId: req.headers["x-usuario-id"] || "US1",
        viejo: null,
        nuevo: result.rows[0],
        req
      });
    } catch (e) {
      console.error("AUDIT CREATE BANCO:", e.message);
    }

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("?? ERROR SQL REAL:", error);

    res.status(500).json({
      error: "Error creando banco",
      detalle: error.message
    });
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

    if (!nombre_banco || !numero_cuenta || !tipo_cuenta) {
      return res.status(400).json({
        error: "Campos obligatorios faltantes"
      });
    }

    // =========================
    // TRAER ANTES
    // =========================
    const viejo = await pool.query(
      `SELECT * FROM banco WHERE id = $1`,
      [id]
    );

    const result = await pool.query(`
      UPDATE banco
      SET
        nombre_titular = $1,
        identificacion = $2,
        nombre_banco = $3,
        numero_cuenta = $4,
        tipo_cuenta = $5::tcuentabanco
      WHERE id = $6
      RETURNING *
    `, [
      nombre_titular || null,
      identificacion || null,
      nombre_banco,
      numero_cuenta,
      tipo_cuenta,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Banco no encontrado"
      });
    }

    // =========================
    // AUDITORIA UPDATE
    // =========================
    try {
      await audit({
        tabla: "banco",
        operacion: "UPDATE",
        registroId: id,
        usuarioId: req.headers["x-usuario-id"] || "US1",
        viejo: viejo.rows[0] || null,
        nuevo: result.rows[0] || null,
        req
      });
    } catch (e) {
      console.error("AUDIT UPDATE BANCO:", e.message);
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("?? ERROR UPDATE:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getBancos,
  getBancoById,
  createBanco,
  updateBanco
};