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

    const data = result.rows.map(f => {

      let estado = "pendiente";

      if (f.fecha_vencimiento && f.fecha_vencimiento < hoy) {
        estado = "vencida";
      }

      return {
        ...f,
        estado
      };
    });

    return res.json(data);

  } catch (error) {
    console.error("?? Error getFacturas:", error);
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
    console.error("?? Error getManifiestos:", error);
    return res.status(500).json({ error: "Error obteniendo manifiestos" });
  }
};

// =========================
// CREATE FACTURA
// =========================
const createFactura = async (req, res) => {
  try {
    let {
      codigo_factura,
      id_manifiesto,
      fecha_emision,
      fecha_vencimiento,
      valor,
      retencion_fuente = 0,
      retencion_ica = 0,
      plazo_pago = 0
    } = req.body;

    // =========================
    // VALIDACIONES
    // =========================
    if (!codigo_factura) {
      return res.status(400).json({
        error: "El código de factura es obligatorio"
      });
    }

    if (!id_manifiesto || !fecha_emision || !valor) {
      return res.status(400).json({
        error: "Campos obligatorios faltantes"
      });
    }

    valor = Number(valor) || 0;
    retencion_fuente = Number(retencion_fuente) || 0;
    retencion_ica = Number(retencion_ica) || 0;
    plazo_pago = Number(plazo_pago) || 0;

    if (valor <= 0) {
      return res.status(400).json({
        error: "El valor debe ser mayor a 0"
      });
    }

    // =========================
    // VALIDAR MANIFIESTO UNICO
    // =========================
    const existe = await pool.query(
      `SELECT 1 FROM factura WHERE id_manifiesto = $1`,
      [id_manifiesto]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "Ya existe una factura para este manifiesto"
      });
    }

    // =========================
    // INSERT REAL (SIN AUTOGENERAR)
    // =========================
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

    // UNIQUE codigo_factura
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Ya existe una factura con ese código"
      });
    }

    console.error("?? Error createFactura:", error);

    return res.status(500).json({
      error: "Error creando factura"
    });
  }
};

// =========================
// PAGAR FACTURA (REAL)
// =========================
const pagarFactura = async (req, res) => {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({ error: "Código requerido" });
    }

    // ?? SOLO VALIDAR QUE EXISTA
    const result = await pool.query(`
      SELECT codigo_factura
      FROM factura
      WHERE codigo_factura = $1
    `, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    // ? NO TOCA DB
    return res.json({ ok: true });

  } catch (error) {
    console.error("?? Error pagarFactura:", error);
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