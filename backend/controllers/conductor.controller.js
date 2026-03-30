const pool = require("../config/db");

// =====================
// GET CONDUCTORES (con filtros)
// =====================
const getConductores = async (req, res) => {
  try {
    const { nombre, cedula, estado } = req.query;

    let query = `
      SELECT 
        cedula,
        nombre,
        correo,
        telefono,
        estado,
        TO_CHAR(vencimiento_licencia, 'YYYY-MM-DD') AS vencimiento_licencia,
        TO_CHAR(vencimiento_manip_alimentos, 'YYYY-MM-DD') AS vencimiento_manip_alimentos,
        TO_CHAR(vencimiento_sustancia_peligrosa, 'YYYY-MM-DD') AS vencimiento_sustancia_peligrosa,
        creado,
        actualizado
      FROM conductor
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (nombre) {
      query += ` AND nombre ILIKE $${index}`;
      values.push(`%${nombre}%`);
      index++;
    }

    if (cedula) {
      query += ` AND CAST(cedula AS TEXT) ILIKE $${index}`;
      values.push(`%${cedula}%`);
      index++;
    }

    if (estado) {
      query += ` AND estado = $${index}`;
      values.push(estado);
      index++;
    }

    query += ` ORDER BY nombre`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("Error conductores:", error);
    res.status(500).json({ error: "Error obteniendo conductores" });
  }
};

// =====================
// CREAR
// =====================
const crearConductor = async (req, res) => {
  try {
    const {
      cedula,
      nombre,
      correo,
      telefono,
      estado,
      vencimiento_licencia,
      vencimiento_manip_alimentos,
      vencimiento_sustancia_peligrosa
    } = req.body;

    if (
      !cedula ||
      !nombre ||
      !vencimiento_licencia ||
      !vencimiento_manip_alimentos ||
      !vencimiento_sustancia_peligrosa
    ) {
      return res.status(400).json({
        error: "Todos los campos obligatorios deben estar completos"
      });
    }

    // duplicado
    const existe = await pool.query(
      "SELECT cedula FROM conductor WHERE cedula = $1",
      [cedula]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "El conductor ya existe"
      });
    }

    const result = await pool.query(`
      INSERT INTO conductor (
        cedula, nombre, correo, telefono, estado,
        vencimiento_licencia,
        vencimiento_manip_alimentos,
        vencimiento_sustancia_peligrosa,
        creado, actualizado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING *
    `, [
      cedula,
      nombre,
      correo || null,
      telefono || null,
      estado || "activo",
      vencimiento_licencia,
      vencimiento_manip_alimentos,
      vencimiento_sustancia_peligrosa
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creando conductor:", error);
    res.status(500).json({ error: "Error creando conductor" });
  }
};

// =====================
// UPDATE
// =====================
const actualizarConductor = async (req, res) => {
  try {
    const { cedula } = req.params;

    const {
      nombre,
      correo,
      telefono,
      estado,
      vencimiento_licencia,
      vencimiento_manip_alimentos,
      vencimiento_sustancia_peligrosa
    } = req.body;

    await pool.query(`
      UPDATE conductor SET
        nombre = $1,
        correo = $2,
        telefono = $3,
        estado = $4,
        vencimiento_licencia = $5,
        vencimiento_manip_alimentos = $6,
        vencimiento_sustancia_peligrosa = $7,
        actualizado = NOW()
      WHERE cedula = $8
    `, [
      nombre,
      correo,
      telefono,
      estado,
      vencimiento_licencia,
      vencimiento_manip_alimentos,
      vencimiento_sustancia_peligrosa,
      cedula
    ]);

    res.json({ ok: true });

  } catch (error) {
    console.error("Error update conductor:", error);
    res.status(500).json({ error: "Error actualizando conductor" });
  }
};

// =====================
// ALERTAS
// =====================
const getAlertasConductores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cedula,
        nombre,
        TO_CHAR(vencimiento_licencia, 'YYYY-MM-DD') AS vencimiento_licencia,
        TO_CHAR(vencimiento_manip_alimentos, 'YYYY-MM-DD') AS vencimiento_manip_alimentos,
        TO_CHAR(vencimiento_sustancia_peligrosa, 'YYYY-MM-DD') AS vencimiento_sustancia_peligrosa
      FROM conductor
    `);

    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 30);

    let alertas = [];

    result.rows.forEach(c => {

      const revisar = (fecha, tipo) => {
        if (!fecha) return;

        const f = new Date(fecha);

        if (f < hoy) {
          alertas.push({
            cedula: c.cedula,
            nombre: c.nombre,
            tipo,
            estado: "vencido",
            fecha
          });
        } else if (f <= limite) {
          alertas.push({
            cedula: c.cedula,
            nombre: c.nombre,
            tipo,
            estado: "proximo",
            fecha
          });
        }
      };

      revisar(c.vencimiento_licencia, "Licencia");
      revisar(c.vencimiento_manip_alimentos, "Manipulación alimentos");
      revisar(c.vencimiento_sustancia_peligrosa, "Sustancias peligrosas");

    });

    res.json(alertas);

  } catch (error) {
    console.error("Error alertas:", error);
    res.status(500).json({ error: "Error alertas conductores" });
  }
};

// =====================
module.exports = {
  getConductores,
  crearConductor,
  actualizarConductor,
  getAlertasConductores
};