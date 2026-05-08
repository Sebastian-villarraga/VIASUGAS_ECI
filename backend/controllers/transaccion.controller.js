const pool = require("../config/db");
const audit = require("../utils/audit");

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

      id_manifiesto,

      id_cliente,

      id_empresa_a_cargo

    } = req.query;

    let query = `

      SELECT 

        t.*,

        /* =====================
           BANCO / TIPO
        ===================== */
        b.nombre_banco,

        tt.categoria,
        tt.tipo,

        /* =====================
           MANIFIESTO
        ===================== */
        m.id_manifiesto,
        m.radicado,

        m.fecha AS fecha_manifiesto,

        m.estado,

        m.origen_departamento,
        m.origen_ciudad,

        m.destino_departamento,
        m.destino_ciudad,

        m.valor_flete,
        m.valor_flete_porcentaje,

        m.anticipo_manifiesto,

        m.gastos,
        m.documentos,

        m.novedades,
        m.observaciones,

        m.id_cliente,
        m.id_empresa_a_cargo,

        m.id_conductor,
        m.id_vehiculo,
        m.id_trailer,

        /* =====================
           CLIENTE
        ===================== */
        c.nombre AS cliente_nombre,

        c.nit AS cliente_nit,

        c.correo AS cliente_correo,

        c.telefono AS cliente_telefono,

        c.direccion AS cliente_direccion,

        /* =====================
           EMPRESA A CARGO
        ===================== */
        eac.nombre AS empresa_a_cargo_nombre,

        eac.nit AS empresa_a_cargo_nit,

        eac.correo AS empresa_a_cargo_correo,

        eac.telefono AS empresa_a_cargo_telefono,

        eac.direccion AS empresa_a_cargo_direccion,

        /* =====================
           CONDUCTOR
        ===================== */
        cond.nombre AS conductor_nombre,

        cond.cedula AS conductor_cedula,

        cond.telefono AS conductor_telefono,

        /* =====================
           VEHICULO
        ===================== */
        vh.placa AS vehiculo_placa,

        /* =====================
           TRAILER
        ===================== */
        tr.placa AS trailer_placa,

        /* =====================
           FACTURA RELACIONADA
        ===================== */
        f.codigo_factura,

        f.fecha_emision,

        f.fecha_vencimiento,

        f.valor AS factura_valor,

        f.retencion_fuente,

        f.retencion_ica,

        /* =====================
           BANDERA GASTO CONDUCTOR
        ===================== */
        CASE 
          WHEN gc.id IS NOT NULL
          THEN true
          ELSE false
        END AS es_gasto_conductor

      FROM transaccion t

      LEFT JOIN banco b
        ON t.id_banco = b.id

      LEFT JOIN tipo_transaccion tt
        ON t.id_tipo_transaccion = tt.id

      LEFT JOIN gastos_conductor gc
        ON gc.id_transaccion = t.id

      LEFT JOIN manifiesto m
        ON t.id_manifiesto = m.id_manifiesto

      LEFT JOIN cliente c
        ON m.id_cliente = c.nit

      LEFT JOIN empresa_a_cargo eac
        ON m.id_empresa_a_cargo = eac.nit

      LEFT JOIN conductor cond
        ON m.id_conductor = cond.cedula

      LEFT JOIN vehiculo vh
        ON m.id_vehiculo = vh.placa

      LEFT JOIN trailer tr
        ON m.id_trailer = tr.placa

      LEFT JOIN factura f
        ON (
          CAST(f.codigo_factura AS TEXT)
          =
          CAST(t.id_factura AS TEXT)

          OR

          CAST(f.id_manifiesto AS TEXT)
          =
          CAST(t.id_manifiesto AS TEXT)
        )

      WHERE 1=1

    `;

    const values = [];

    let i = 1;

    // =====================
    // VALIDACION HELPERS
    // =====================
    function valido(valor) {

      return (
        valor !== undefined &&
        valor !== null &&
        valor !== "" &&
        valor !== "undefined" &&
        valor !== "null"
      );

    }

    // =====================
    // FILTROS
    // =====================

    if (valido(fecha_desde)) {

      query += `
        AND t.fecha_pago >= $${i++}
      `;

      values.push(fecha_desde);

    }

    if (valido(fecha_hasta)) {

      query += `
        AND t.fecha_pago <= $${i++}
      `;

      values.push(fecha_hasta);

    }

    if (valido(tipo)) {

      query += `
        AND tt.tipo = $${i++}
      `;

      values.push(tipo);

    }

    if (valido(id_banco)) {

      query += `
        AND CAST(t.id_banco AS TEXT)
        =
        CAST($${i++} AS TEXT)
      `;

      values.push(id_banco);

    }

    if (valido(id_manifiesto)) {

      query += `
        AND CAST(t.id_manifiesto AS TEXT)
        =
        CAST($${i++} AS TEXT)
      `;

      values.push(id_manifiesto);

    }

    if (valido(id_cliente)) {

      query += `
        AND CAST(m.id_cliente AS TEXT)
        =
        CAST($${i++} AS TEXT)
      `;

      values.push(id_cliente);

    }

    if (valido(id_empresa_a_cargo)) {

      query += `
        AND CAST(m.id_empresa_a_cargo AS TEXT)
        =
        CAST($${i++} AS TEXT)
      `;

      values.push(id_empresa_a_cargo);

    }

    // =====================
    // ORDER
    // =====================
    query += `

      ORDER BY 
        t.fecha_pago DESC,
        t.creado DESC

    `;

    // =====================
    // DEBUG
    // =====================
    console.log({
      values
    });

    const result =
      await pool.query(
        query,
        values
      );

    res.json(result.rows);

  } catch (error) {

    console.error(
      "Error getTransacciones:",
      error
    );

    res.status(500).json({
      error:
        "Error obteniendo transacciones"
    });

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
    if (
      !id ||
      !id_banco ||
      !id_tipo_transaccion ||
      !valor ||
      !fecha_pago
    ) {
      return res.status(400).json({
        error: "Campos obligatorios faltantes"
      });
    }

    // =========================
    // VALIDAR DUPLICADO
    // =========================
    const existe = await pool.query(
      `SELECT id FROM transaccion WHERE id = $1`,
      [id]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "ID ya existe"
      });
    }

    // =========================
    // TRAER TIPO
    // =========================
    const tipoRes = await pool.query(
      `SELECT tipo FROM tipo_transaccion WHERE id = $1`,
      [id_tipo_transaccion]
    );

    if (tipoRes.rows.length === 0) {
      return res.status(400).json({
        error: "Tipo de transaccion invalido"
      });
    }

    const tipo = tipoRes.rows[0].tipo;

    // =========================
    // REGLAS DE NEGOCIO
    // =========================

    // INGRESO MANIFIESTO
    if (
      tipo === "INGRESO MANIFIESTO" &&
      !id_manifiesto
    ) {
      return res.status(400).json({
        error: "Ingreso requiere manifiesto"
      });
    }

    // OPERACIONAL
    if (
      tipo === "EGRESO OPERACIONAL" &&
      id_manifiesto
    ) {
      return res.status(400).json({
        error:
          "Egreso operacional no debe tener manifiesto"
      });
    }

    // MANIFIESTO
    if (
      (
        tipo === "INGRESO MANIFIESTO" ||
        tipo === "EGRESO MANIFIESTO"
      ) &&
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

    // =========================
    // AUDITORIA CREATE
    // =========================
    try {
      await audit({
        tabla: "transaccion",
        operacion: "CREATE",
        registroId: result.rows[0].id,
        usuarioId:
          req.headers["x-usuario-id"] || "US1",
        viejo: null,
        nuevo: result.rows[0],
        req
      });
    } catch (e) {
      console.error(
        "AUDIT CREATE TRANSACCION:",
        e.message
      );
    }

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error creando transaccion"
    });
  }
};

module.exports = {
  getTransacciones,
  createTransaccion
};