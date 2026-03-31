const pool = require("../config/db");

// =========================================
// GET DEPARTAMENTOS
// =========================================
const getDepartamentos = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        codigo_departamento,
        nombre_departamento
      FROM ubicacion_colombia
      ORDER BY nombre_departamento ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo departamentos:", error);
    res.status(500).json({ error: "Error obteniendo departamentos" });
  }
};

// =========================================
// GET MUNICIPIOS POR DEPARTAMENTO
// =========================================
const getMunicipios = async (req, res) => {
  try {
    const {
      codigo_departamento,
      nombre_departamento
    } = req.query;

    let query = `
      SELECT
        codigo_municipio,
        nombre_municipio,
        tipo,
        codigo_departamento,
        nombre_departamento
      FROM ubicacion_colombia
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (codigo_departamento) {
      query += ` AND codigo_departamento = $${index}`;
      values.push(codigo_departamento);
      index++;
    }

    if (nombre_departamento) {
      query += ` AND nombre_departamento = $${index}`;
      values.push(nombre_departamento);
      index++;
    }

    query += ` ORDER BY nombre_municipio ASC`;

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (error) {
    console.error("Error obteniendo municipios:", error);
    res.status(500).json({ error: "Error obteniendo municipios" });
  }
};

// =========================================
// BUSQUEDA SIMPLE
// =========================================
const buscarUbicaciones = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json([]);
    }

    const result = await pool.query(`
      SELECT
        codigo_departamento,
        nombre_departamento,
        codigo_municipio,
        nombre_municipio,
        tipo
      FROM ubicacion_colombia
      WHERE nombre_departamento ILIKE $1
         OR nombre_municipio ILIKE $1
      ORDER BY nombre_departamento ASC, nombre_municipio ASC
      LIMIT 50
    `, [`%${q.trim()}%`]);

    res.json(result.rows);

  } catch (error) {
    console.error("Error buscando ubicaciones:", error);
    res.status(500).json({ error: "Error buscando ubicaciones" });
  }
};

module.exports = {
  getDepartamentos,
  getMunicipios,
  buscarUbicaciones
};