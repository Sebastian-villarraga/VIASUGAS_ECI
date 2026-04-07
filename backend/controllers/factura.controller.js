const pool = require("../config/db");

// =========================
// GET FACTURAS
// =========================
const getFacturas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.codigo_factura,
        f.id_manifiesto,
        f.fecha_emision,
        f.fecha_vencimiento,
        f.valor,
        f.retencion_fuente,
        f.retencion_ica,
        f.plazo_pago,
        f.creado,
        c.nombre AS cliente_nombre
      FROM factura f
      LEFT JOIN manifiesto m 
        ON f.id_manifiesto = m.id_manifiesto
      LEFT JOIN cliente c
        ON m.id_cliente = c.nit
      ORDER BY f.fecha_emision DESC
    `);

    const hoy = new Date().toISOString().split("T")[0];

    // ?? calculamos estado dinámicamente
    const data = result.rows.map(f => {
      let estado = "pendiente";

      if (f.fecha_vencimiento && f.fecha_vencimiento < hoy) {
        estado = "vencida";
      }

      // ? opcional: si quieres lógica futura de pago real, se agrega aquí

      return {
        ...f,
        estado
      };
    });

    return res.json(data);

  } catch (error) {
    console.error("? Error getFacturas:", error);
    return res.status(500).json({ error: "Error obteniendo facturas" });
  }
};

// =========================
// GET MANIFIESTOS
// =========================
const getManifiestos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id_manifiesto,
        c.nombre AS cliente_nombre
      FROM manifiesto m
      LEFT JOIN cliente c
        ON m.id_cliente = c.nit
      ORDER BY m.id_manifiesto DESC
    `);

    return res.json(result.rows);

  } catch (error) {
    console.error("? Error getManifiestos:", error);
    return res.status(500).json({ error: "Error obteniendo manifiestos" });
  }
};

// =========================
// CREATE FACTURA
// =========================
const createFactura = async (req, res) => {
  try {
    const {
      codigo_factura,
      id_manifiesto,
      fecha_emision,
      fecha_vencimiento,
      valor,
      retencion_fuente = 0,
      retencion_ica = 0,
      plazo_pago = 0
    } = req.body;

    if (!codigo_factura || !id_manifiesto || !fecha_emision || !valor) {
      return res.status(400).json({ error: "Campos obligatorios faltantes" });
    }

    const result = await pool.query(
      `
      INSERT INTO factura (
        codigo_factura,
        id_manifiesto,
        fecha_emision,
        fecha_vencimiento,
        valor,
        retencion_fuente,
        retencion_ica,
        plazo_pago,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      RETURNING *
      `,
      [
        codigo_factura,
        id_manifiesto,
        fecha_emision,
        fecha_vencimiento,
        valor,
        retencion_fuente,
        retencion_ica,
        plazo_pago
      ]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("? Error createFactura:", error);
    return res.status(500).json({ error: "Error creando factura" });
  }
};

// =========================
// PAGAR FACTURA (SIMULADO)
// =========================
const pagarFactura = async (req, res) => {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({ error: "Código de factura requerido" });
    }

    // ?? ya no se guarda en DB ? solo respuesta simulada
    return res.json({
      codigo_factura: codigo,
      estado: "pagada"
    });

  } catch (error) {
    console.error("? Error pagarFactura:", error);
    return res.status(500).json({ error: "Error procesando pago" });
  }
};

// =========================
// EXPORTS 
// =========================
module.exports = {
  getFacturas,
  createFactura,
  getManifiestos,
  pagarFactura
};