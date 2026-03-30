const pool = require("../config/db");

// =====================
// GET PROPIETARIOS
// =====================
const getPropietarios = async (req, res) => {
  try {
    const { nombre, identificacion } = req.query;

    let query = `
      SELECT 
        identificacion,
        nombre,
        correo,
        telefono,
        creado,
        actualizado
      FROM propietario
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (nombre) {
      query += ` AND nombre ILIKE $${index}`;
      values.push(`%${nombre}%`);
      index++;
    }

    if (identificacion) {
      query += ` AND identificacion ILIKE $${index}`;
      values.push(`%${identificacion}%`);
      index++;
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("Error obteniendo propietarios:", error);
    res.status(500).json({ error: "Error obteniendo propietarios" });
  }
};

// =====================
// GET PROPIETARIO POR ID
// =====================
const getPropietarioById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM propietario WHERE identificacion = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Propietario no encontrado" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error obteniendo propietario:", error);
    res.status(500).json({ error: "Error obteniendo propietario" });
  }
};

// =====================
// CREAR PROPIETARIO
// =====================
const crearPropietario = async (req, res) => {
  try {
    const {
      identificacion,
      nombre,
      correo,
      telefono
    } = req.body;

    // ?? VALIDACIÓN
    if (!identificacion || !nombre) {
      return res.status(400).json({
        error: "Identificación y nombre son obligatorios"
      });
    }

    // ?? VALIDAR DUPLICADO
    const existe = await pool.query(
      `SELECT identificacion FROM propietario WHERE identificacion = $1`,
      [identificacion]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "El propietario ya existe"
      });
    }

    const query = `
      INSERT INTO propietario (
        identificacion,
        nombre,
        correo,
        telefono,
        creado,
        actualizado
      )
      VALUES ($1,$2,$3,$4,NOW(),NOW())
      RETURNING *
    `;

    const values = [
      identificacion,
      nombre,
      correo || null,
      telefono || null
    ];

    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creando propietario:", error);
    res.status(500).json({ error: "Error creando propietario" });
  }
};

// =====================
// ACTUALIZAR PROPIETARIO
// =====================
const actualizarPropietario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, telefono } = req.body;

    // validar existencia
    const existe = await pool.query(
      `SELECT identificacion FROM propietario WHERE identificacion = $1`,
      [id]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        error: "Propietario no encontrado"
      });
    }

    const query = `
      UPDATE propietario SET
        nombre = $1,
        correo = $2,
        telefono = $3,
        actualizado = NOW()
      WHERE identificacion = $4
      RETURNING *
    `;

    const values = [
      nombre || null,
      correo || null,
      telefono || null,
      id
    ];

    const result = await pool.query(query, values);

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error actualizando propietario:", error);
    res.status(500).json({ error: "Error actualizando propietario" });
  }
};

module.exports = {
  getPropietarios,
  getPropietarioById,
  crearPropietario,
  actualizarPropietario
};