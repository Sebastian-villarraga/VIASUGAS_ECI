const pool = require("../config/db");

// =========================
// GET CON FILTROS + FLAG CONDUCTOR
// =========================
const getTransacciones = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      tipo,
      id_banco,
      id_manifiesto
    } = req.query;

    let query = `
      SELECT 
        t.*,
        b.nombre_banco,
        tt.categoria,
        tt.tipo,
        CASE 
          WHEN gc.id IS NOT NULL THEN true
          ELSE false
        END AS es_gasto_conductor
      FROM transaccion t
      LEFT JOIN banco b ON t.id_banco = b.id
      LEFT JOIN tipo_transaccion tt ON t.id_tipo_transaccion = tt.id
      LEFT JOIN gastos_conductor gc ON gc.id_transaccion = t.id
      WHERE 1=1
    `;

    const values = [];
    let i = 1;

    if (fecha_desde) {
      query += ` AND t.fecha_pago >= $${i++}`;
      values.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += ` AND t.fecha_pago <= $${i++}`;
      values.push(fecha_hasta);
    }

    if (tipo) {
      query += ` AND tt.tipo = $${i++}`;
      values.push(tipo);
    }

    if (id_banco) {
      query += ` AND t.id_banco = $${i++}`;
      values.push(id_banco);
    }

    if (id_manifiesto) {
      query += ` AND t.id_manifiesto = $${i++}`;
      values.push(id_manifiesto);
    }

    query += ` ORDER BY t.fecha_pago DESC`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo transacciones" });
  }
};



// =========================
// CREATE (VALIDADO)
// =========================
const createTransaccion = async (req, res) => {
  try {
    const {
      id,
      id_banco,
      id_tipo_transaccion,
      id_manifiesto,
      id_factura,
      valor,
      fecha_pago,
      descripcion
    } = req.body;

    // =========================
    // VALIDACIONES BASICAS
    // =========================
    if (!id || !id_banco || !id_tipo_transaccion || !valor || !fecha_pago) {
      return res.status(400).json({ error: "Campos obligatorios faltantes" });
    }

    // =========================
    // VALIDAR DUPLICADO
    // =========================
    const existe = await pool.query(
      `SELECT id FROM transaccion WHERE id = $1`,
      [id]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "ID ya existe" });
    }

    // =========================
    // TRAER TIPO
    // =========================
    const tipoRes = await pool.query(
      `SELECT tipo FROM tipo_transaccion WHERE id = $1`,
      [id_tipo_transaccion]
    );

    if (tipoRes.rows.length === 0) {
      return res.status(400).json({ error: "Tipo de transaccion invalido" });
    }

    const tipo = tipoRes.rows[0].tipo;

    // =========================
    // REGLAS DE NEGOCIO
    // =========================


    // ?? INGRESO MANIFIESTO
    // SOLO exige manifiesto, NO factura
    if (tipo === "INGRESO MANIFIESTO" && !id_manifiesto) {
      return res.status(400).json({
        error: "Ingreso requiere manifiesto"
      });
    }

    // OPERACIONAL ? NO manifiesto
    if (tipo === "EGRESO OPERACIONAL" && id_manifiesto) {
      return res.status(400).json({
        error: "Egreso operacional no debe tener manifiesto"
      });
    }

    // MANIFIESTO ? requiere manifiesto
    if (
      (tipo === "INGRESO MANIFIESTO" || tipo === "EGRESO MANIFIESTO") &&
      !id_manifiesto
    ) {
      return res.status(400).json({
        error: "Debe seleccionar manifiesto"
      });
    }

    // =========================
    // INSERT
    // =========================
    const result = await pool.query(`
      INSERT INTO transaccion (
        id,
        id_banco,
        id_tipo_transaccion,
        id_manifiesto,
        id_factura,
        valor,
        fecha_pago,
        descripcion,
        creado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      RETURNING *
    `, [
      id,
      id_banco,
      id_tipo_transaccion,
      id_manifiesto || null,
      id_factura || null,
      valor,
      fecha_pago,
      descripcion || null
    ]);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando transaccion" });
  }
};

module.exports = {
  getTransacciones,
  createTransaccion
};