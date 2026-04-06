const pool = require("../config/db");

// =========================
// GET FACTURAS
// =========================
const getFacturas = async (_req, res) => {
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
        f.estado,
        c.nombre AS cliente_nombre
      FROM factura f
      LEFT JOIN manifiesto m 
        ON f.id_manifiesto = m.id_manifiesto
      LEFT JOIN cliente c
        ON m.id_cliente = c.nit
      ORDER BY f.fecha_emision DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error getFacturas:", error);
    res.status(500).json({ error: "Error obteniendo facturas" });
  }
};

// =========================
// GET MANIFIESTOS
// =========================
const getManifiestos = async (_req, res) => {
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

    res.json(result.rows);

  } catch (error) {
    console.error("Error getManifiestos:", error);
    res.status(500).json({ error: "Error obteniendo manifiestos" });
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
      retencion_fuente,
      retencion_ica,
      plazo_pago
    } = req.body;

    if (!codigo_factura || !id_manifiesto || !fecha_emision || !valor) {
      return res.status(400).json({ error: "Campos obligatorios faltantes" });
    }

    const query = `
      INSERT INTO factura (
        codigo_factura,
        id_manifiesto,
        fecha_emision,
        fecha_vencimiento,
        valor,
        retencion_fuente,
        retencion_ica,
        plazo_pago,
        estado,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pendiente',NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      codigo_factura,
      id_manifiesto,
      fecha_emision,
      fecha_vencimiento,
      valor,
      retencion_fuente,
      retencion_ica,
      plazo_pago
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error createFactura:", error);
    res.status(500).json({ error: "Error creando factura" });
  }
};

// =========================
// MARCAR COMO PAGADA ??
// =========================
const pagarFactura = async (req, res) => {
  try {
    const { codigo } = req.params;

    // ?? VALIDACIÓN (evita undefined)
    if (!codigo) {
      return res.status(400).json({ error: "Código de factura requerido" });
    }

    const result = await pool.query(
      `
      UPDATE factura
      SET estado = 'pagada'
      WHERE codigo_factura = $1
      RETURNING *
      `,
      [codigo]
    );

    if (!result || result.rows.length === 0) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error pagarFactura:", error);
    res.status(500).json({ error: "Error actualizando factura" });
  }
};

// =========================
// EXPORTS
// =========================
module.exports = { 
  getFacturas, 
  createFactura, 
  getManifiestos,
  pagarFactura   // ?? NUEVO
};