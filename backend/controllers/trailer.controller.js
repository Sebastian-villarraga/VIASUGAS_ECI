const pool = require("../config/db");
const audit = require("../utils/audit");

// =====================
// GET TRAILERS
// =====================
const getTrailers = async (req, res) => {
  try {
    const { placa, propietario, estado } = req.query;

    let query = `
      SELECT 
        t.placa,
        COALESCE(p.nombre, '-') AS propietario,
        t.vencimiento_cert_fumigacion,
        t.vencimiento_cert_sanidad,
        t.estado::text AS estado
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
      query += ` AND t.estado::text = $${index}`;
      values.push(estado.trim().toLowerCase());
      index++;
    }

    query += `
      ORDER BY 
        CASE 
          WHEN t.estado::text = 'activo' THEN 0
          ELSE 1
        END,
        t.placa ASC
    `;

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
      propietario,
      vencimiento_cert_fumigacion,
      vencimiento_cert_sanidad,
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

    const existe = await pool.query(
      "SELECT placa FROM trailer WHERE placa = $1",
      [placa]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "El trailer ya existe"
      });
    }

    const propietarioExiste = await pool.query(
      "SELECT identificacion FROM propietario WHERE identificacion = $1",
      [propietario]
    );

    if (propietarioExiste.rows.length === 0) {
      return res.status(400).json({
        error: "El propietario seleccionado no existe"
      });
    }

    const insertQuery = `
      INSERT INTO trailer (
        placa,
        id_propietario,
        vencimiento_cert_fumigacion,
        vencimiento_cert_sanidad,
        estado
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const estadoNormalizado = (estado || "activo")
      .toString()
      .toLowerCase()
      .trim();

    const values = [
      placa.toUpperCase(),
      propietario,
      vencimiento_cert_fumigacion || null,
      vencimiento_cert_sanidad || null,
      estadoNormalizado
    ];

    const result = await pool.query(insertQuery, values);

    // =====================
    // AUDITORIA CREATE
    // =====================
    try {
      await audit({
        tabla: "trailer",
        operacion: "CREATE",
        registroId: result.rows[0].placa,
        usuarioId: req.headers["x-usuario-id"] || "US1",
        viejo: null,
        nuevo: result.rows[0],
        req
      });
    } catch (e) {
      console.error("AUDIT CREATE TRAILER:", e.message);
    }

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
// ALERTAS TRAILERS
// =====================
const getAlertasTrailers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.placa,
        COALESCE(p.nombre, '-') AS propietario,
        t.vencimiento_cert_fumigacion,
        t.vencimiento_cert_sanidad
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

      if (t.vencimiento_cert_fumigacion) {
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
        } else if (f >= hoy && f <= limite) {
          alertas.push({
            placa: t.placa,
            propietario: t.propietario,
            tipo: "Fumigación",
            estado: "proximo",
            fecha: t.vencimiento_cert_fumigacion
          });
        }
      }

      if (t.vencimiento_cert_sanidad) {
        const f = new Date(t.vencimiento_cert_sanidad);
        f.setHours(0, 0, 0, 0);

        if (f < hoy) {
          alertas.push({
            placa: t.placa,
            propietario: t.propietario,
            tipo: "Sanidad",
            estado: "vencido",
            fecha: t.vencimiento_cert_sanidad
          });
        } else if (f <= limite) {
          alertas.push({
            placa: t.placa,
            propietario: t.propietario,
            tipo: "Sanidad",
            estado: "proximo",
            fecha: t.vencimiento_cert_sanidad
          });
        }
      }

    });

    res.json(alertas);

  } catch (error) {
    console.error("Error alertas trailer:", error);
    res.status(500).json({ error: "Error obteniendo alertas" });
  }
};

// =====================
// FILTRO RAPIDO
// =====================
const getTrailersPorEstadoAlerta = async (req, res) => {
  try {
    const { tipo } = req.query;

    const result = await pool.query(`
      SELECT 
        t.placa,
        COALESCE(p.nombre, '-') AS propietario,
        t.vencimiento_cert_fumigacion,
        t.vencimiento_cert_sanidad,
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

      const fechas = [
        t.vencimiento_cert_fumigacion,
        t.vencimiento_cert_sanidad
      ].filter(Boolean);

      if (fechas.length === 0) return false;

      return fechas.some(f => {
        const fecha = new Date(f);
        fecha.setHours(0, 0, 0, 0);

        if (tipo === "vencido") {
          return fecha < hoy;
        }

        if (tipo === "proximo") {
          return fecha >= hoy && fecha <= limite;
        }

        return false;
      });
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
      vencimiento_cert_sanidad,
      estado
    } = req.body;

    if (!propietario) {
      return res.status(400).json({
        error: "Debe seleccionar un propietario"
      });
    }

    const propietarioExiste = await pool.query(
      "SELECT identificacion FROM propietario WHERE identificacion = $1",
      [propietario]
    );

    if (propietarioExiste.rows.length === 0) {
      return res.status(400).json({
        error: "El propietario seleccionado no existe"
      });
    }

    // =====================
    // TRAER ANTES
    // =====================
    const viejo = await pool.query(
      `SELECT * FROM trailer WHERE placa = $1`,
      [placa]
    );

    const estadoNormalizado = (estado || "activo")
      .toString()
      .toLowerCase()
      .trim();

    const result = await pool.query(`
      UPDATE trailer SET
        id_propietario = $1,
        vencimiento_cert_fumigacion = $2,
        vencimiento_cert_sanidad = $3,
        estado = $4
      WHERE placa = $5
      RETURNING *
    `, [
      propietario,
      vencimiento_cert_fumigacion || null,
      vencimiento_cert_sanidad || null,
      estadoNormalizado,
      placa
    ]);

    // =====================
    // AUDITORIA UPDATE
    // =====================
    try {
      await audit({
        tabla: "trailer",
        operacion: "UPDATE",
        registroId: placa,
        usuarioId: req.headers["x-usuario-id"] || "US1",
        viejo: viejo.rows[0] || null,
        nuevo: result.rows[0] || null,
        req
      });
    } catch (e) {
      console.error("AUDIT UPDATE TRAILER:", e.message);
    }

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