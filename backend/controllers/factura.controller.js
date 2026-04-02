const pool = require("../config/db");

const getFacturas = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*,
             m.id_manifiesto
      FROM factura f
      LEFT JOIN manifiesto m ON f.id_manifiesto = m.id_manifiesto
      ORDER BY f.fecha_emision DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo facturas" });
  }
};

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
        creado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
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
    res.status(500).json({ error: "Error creando factura" });
  }
};

module.exports = { getFacturas, createFactura };