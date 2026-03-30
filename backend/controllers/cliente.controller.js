// =====================
const pool = require("../config/db");

// =====================
// GET CLIENTES (con filtros)
// =====================
const getClientes = async (req, res) => {
  try {
    const { nombre, nit, estado } = req.query;

    let query = `
      SELECT 
        nit,
        nombre,
        correo,
        telefono,
        direccion,
        estado,
        creado,
        actualizado
      FROM cliente
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (nombre) {
      query += ` AND nombre ILIKE $${index}`;
      values.push(`%${nombre}%`);
      index++;
    }

    if (nit) {
      query += ` AND nit ILIKE $${index}`;
      values.push(`%${nit}%`);
      index++;
    }

    if (estado) {
      query += ` AND estado = $${index}`;
      values.push(estado);
      index++;
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({ error: "Error obteniendo clientes" });
  }
};

// =====================
// GET CLIENTE POR NIT
// =====================
const getClienteById = async (req, res) => {
  try {
    const { nit } = req.params;

    const result = await pool.query(
      `SELECT * FROM cliente WHERE nit = $1`,
      [nit]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    res.status(500).json({ error: "Error obteniendo cliente" });
  }
};

// =====================
// CREAR CLIENTE
// =====================
const crearCliente = async (req, res) => {
  try {
    const {
      nit,
      nombre,
      correo,
      telefono,
      direccion,
      estado
    } = req.body;

    // VALIDACIÓN
    if (!nit || !nombre) {
      return res.status(400).json({
        error: "NIT y nombre son obligatorios"
      });
    }

    // VALIDAR DUPLICADO
    const existe = await pool.query(
      `SELECT nit FROM cliente WHERE nit = $1`,
      [nit]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "El cliente ya existe"
      });
    }

    const query = `
      INSERT INTO cliente (
        nit,
        nombre,
        correo,
        telefono,
        direccion,
        estado,
        creado,
        actualizado
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      RETURNING *
    `;

    const values = [
      nit,
      nombre,
      correo || null,
      telefono || null,
      direccion || null,
      estado || "activo"
    ];

    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creando cliente:", error);
    res.status(500).json({ error: "Error creando cliente" });
  }
};

// =====================
// ACTUALIZAR CLIENTE
// =====================
const actualizarCliente = async (req, res) => {
  try {
    const { nit } = req.params;
    const { nombre, correo, telefono, direccion, estado } = req.body;

    // VALIDAR EXISTENCIA
    const existe = await pool.query(
      `SELECT nit FROM cliente WHERE nit = $1`,
      [nit]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        error: "Cliente no encontrado"
      });
    }

    const query = `
      UPDATE cliente SET
        nombre = $1,
        correo = $2,
        telefono = $3,
        direccion = $4,
        estado = $5,
        actualizado = NOW()
      WHERE nit = $6
      RETURNING *
    `;

    const values = [
      nombre || null,
      correo || null,
      telefono || null,
      direccion || null,
      estado,
      nit
    ];

    const result = await pool.query(query, values);

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({ error: "Error actualizando cliente" });
  }
};

// =====================
module.exports = {
  getClientes,
  getClienteById,
  crearCliente,
  actualizarCliente
};