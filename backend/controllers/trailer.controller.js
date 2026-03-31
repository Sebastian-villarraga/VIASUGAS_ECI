const pool = require("../config/db");

// =====================
// GET TRAILERS
// =====================
const getTrailers = async (req, res) => {
  try {
    const { placa, propietario, estado } = req.query;

    console.log("QUERY PARAMS:", req.query);

    let query = `
      SELECT 
        t.placa,
        COALESCE(p.nombre, '-') AS propietario,
        t.vencimiento_cert_fumigacion,
        t.estado
      FROM trailer t
      LEFT JOIN propietario p 
        ON t.id_propietario = p.identificacion
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (placa && placa.trim() !== "") {
      query += ` AND t.placa ILIKE $${index}`;
      values.push(`%${placa.trim()}%`);
      index++;
    }

    if (propietario && propietario.trim() !== "") {
      query += ` AND p.nombre ILIKE $${index}`;
      values.push(`%${propietario.trim()}%`);
      index++;
    }

    if (estado && estado.trim() !== "") {
      query += ` AND LOWER(t.estado::text) = $${index}`;
      values.push(estado.trim().toLowerCase());
      index++;
    }

    query += `
        ORDER BY 
          CASE 
            WHEN t.estado = 'activo' THEN 0
            ELSE 1
          END,
          t.placa ASC
      `;

    console.log("QUERY FINAL:", query);
    console.log("VALUES:", values);

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("ERROR TRAILERS:", error);
    res.status(500).json({ 
      error: "Error obteniendo trailers",
      detalle: error.message
    });
  }
};

// =====================
// CREAR TRAILER
// =====================
const crearTrailer = async (req, res) => {
  try {
    const {
      placa,
      propietario, // ?? ahora es IDENTIFICACION real
      vencimiento_cert_fumigacion,
      estado
    } = req.body;

    if (!placa) {
      return res.status(400).json({
        error: "La placa es obligatoria"
      });
    }

    if (!propietario) {
      return res.status(400).json({
        error: "Debe seleccionar un propietario"
      });
    }

    // VALIDAR DUPLICADO
    const existe = await pool.query(
      "SELECT placa FROM trailer WHERE placa = $1",
      [placa]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "El trailer ya existe"
      });
    }

    // VALIDAR QUE EL PROPIETARIO EXISTA
    const propietarioExiste = await pool.query(
      "SELECT identificacion FROM propietario WHERE identificacion = $1",
      [propietario]
    );

    if (propietarioExiste.rows.length === 0) {
      return res.status(400).json({
        error: "El propietario seleccionado no existe"
      });
    }

    // INSERT DIRECTO CON FK REAL
    const insertQuery = `
      INSERT INTO trailer (
        placa,
        id_propietario,
        vencimiento_cert_fumigacion,
        estado
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      placa.toUpperCase(),
      propietario,
      vencimiento_cert_fumigacion || null,
      estado || "activo"
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("ERROR CREANDO TRAILER:", error);
    res.status(500).json({
      error: "Error creando trailer",
      detalle: error.message
    });
  }
};

// =====================
// ALERTAS TRAILERS (SOLO ACTIVOS)
// =====================
const getAlertasTrailers = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT 
        t.placa,
        COALESCE(p.nombre, '-') AS propietario,
        t.vencimiento_cert_fumigacion
      FROM trailer t
      LEFT JOIN propietario p 
        ON t.id_propietario = p.identificacion
      WHERE t.estado = 'activo'
    `);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + 30);
    limite.setHours(23, 59, 59, 999);

    let alertas = [];

    result.rows.forEach(t => {

      if (!t.vencimiento_cert_fumigacion) return;

      const f = new Date(t.vencimiento_cert_fumigacion);
      f.setHours(0, 0, 0, 0);

      if (f < hoy) {
        alertas.push({
          placa: t.placa,
          propietario: t.propietario,
          tipo: "Fumigación",
          estado: "vencido",
          fecha: t.vencimiento_cert_fumigacion
        });
      } 
      else if (f >= hoy && f <= limite) {
        alertas.push({
          placa: t.placa,
          propietario: t.propietario,
          tipo: "Fumigación",
          estado: "proximo",
          fecha: t.vencimiento_cert_fumigacion
        });
      }

    });

    res.json(alertas);

  } catch (error) {
    console.error("Error alertas trailer:", error);
    res.status(500).json({ error: "Error obteniendo alertas" });
  }
};

// =====================
// FILTRO RAPIDO (SOLO ACTIVOS)
// =====================
const getTrailersPorEstadoAlerta = async (req, res) => {
  try {
    const { tipo } = req.query;

    const result = await pool.query(`
      SELECT 
        t.placa,
        COALESCE(p.nombre, '-') AS propietario,
        t.vencimiento_cert_fumigacion,
        t.estado
      FROM trailer t
      LEFT JOIN propietario p 
        ON t.id_propietario = p.identificacion
      WHERE t.estado = 'activo'
    `);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + 30);
    limite.setHours(23, 59, 59, 999);

    const filtrados = result.rows.filter(t => {

      if (!t.vencimiento_cert_fumigacion) return false;

      const fecha = new Date(t.vencimiento_cert_fumigacion);
      fecha.setHours(0, 0, 0, 0);

      if (tipo === "vencido") {
        return fecha < hoy;
      }

      if (tipo === "proximo") {
        return fecha >= hoy && fecha <= limite;
      }

      return false;
    });

    res.json(filtrados);

  } catch (error) {
    console.error("Error filtro trailer:", error);
    res.status(500).json({ error: "Error filtrando trailers" });
  }
};


// =====================
// ACTUALIZAR TRAILER
// =====================
const actualizarTrailer = async (req, res) => {
  try {
    const { placa } = req.params;
    const {
      propietario,
      vencimiento_cert_fumigacion,
      estado
    } = req.body;

    if (!propietario) {
      return res.status(400).json({
        error: "Debe seleccionar un propietario"
      });
    }

    // VALIDAR QUE EL PROPIETARIO EXISTA
    const propietarioExiste = await pool.query(
      "SELECT identificacion FROM propietario WHERE identificacion = $1",
      [propietario]
    );

    if (propietarioExiste.rows.length === 0) {
      return res.status(400).json({
        error: "El propietario seleccionado no existe"
      });
    }

    await pool.query(`
      UPDATE trailer SET
        id_propietario = $1,
        vencimiento_cert_fumigacion = $2,
        estado = $3
      WHERE placa = $4
    `, [
      propietario,
      vencimiento_cert_fumigacion || null,
      estado || "activo",
      placa
    ]);

    res.json({ ok: true });

  } catch (error) {
    console.error("Error update trailer:", error);
    res.status(500).json({ error: "Error actualizando trailer" });
  }
};

// =====================
module.exports = {
  getTrailers,
  crearTrailer,
  getAlertasTrailers,
  getTrailersPorEstadoAlerta,
  actualizarTrailer
};