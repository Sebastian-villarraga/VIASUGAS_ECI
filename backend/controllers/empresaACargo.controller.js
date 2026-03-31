// =====================
const pool = require("../config/db");

// =====================
// GET EMPRESAS A CARGO (con filtros)
// =====================
const getEmpresasACargo = async (req, res) => {
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
      FROM empresa_a_cargo
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

    query += `
      ORDER BY 
        CASE 
          WHEN estado = 'activo' THEN 0
          ELSE 1
        END,
        nombre ASC
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("Error obteniendo empresas a cargo:", error);
    res.status(500).json({ error: "Error obteniendo empresas a cargo" });
  }
};

// =====================
// GET EMPRESA A CARGO POR NIT
// =====================
const getEmpresaACargoById = async (req, res) => {
  try {
    const { nit } = req.params;

    const result = await pool.query(
      `SELECT * FROM empresa_a_cargo WHERE nit = $1`,
      [nit]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empresa a cargo no encontrada" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error obteniendo empresa a cargo:", error);
    res.status(500).json({ error: "Error obteniendo empresa a cargo" });
  }
};

// =====================
// CREAR EMPRESA A CARGO
// =====================
const crearEmpresaACargo = async (req, res) => {
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
      `SELECT nit FROM empresa_a_cargo WHERE nit = $1`,
      [nit]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "La empresa a cargo ya existe"
      });
    }

    const query = `
      INSERT INTO empresa_a_cargo (
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
    console.error("Error creando empresa a cargo:", error);
    res.status(500).json({ error: "Error creando empresa a cargo" });
  }
};

// =====================
// ACTUALIZAR EMPRESA A CARGO
// =====================
const actualizarEmpresaACargo = async (req, res) => {
  try {
    const { nit } = req.params;
    const { nombre, correo, telefono, direccion, estado } = req.body;

    // VALIDAR EXISTENCIA
    const existe = await pool.query(
      `SELECT nit FROM empresa_a_cargo WHERE nit = $1`,
      [nit]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({
        error: "Empresa a cargo no encontrada"
      });
    }

    const query = `
      UPDATE empresa_a_cargo SET
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
    console.error("Error actualizando empresa a cargo:", error);
    res.status(500).json({ error: "Error actualizando empresa a cargo" });
  }
};

// =====================
module.exports = {
  getEmpresasACargo,
  getEmpresaACargoById,
  crearEmpresaACargo,
  actualizarEmpresaACargo
};