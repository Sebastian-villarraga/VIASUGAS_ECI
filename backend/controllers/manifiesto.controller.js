const pool = require("../config/db");
const audit = require("../utils/audit");
const ExcelJS = require("exceljs");

// =========================================
// HELPERS
// =========================================
const ESTADOS = [
  "CREADO-EN TRANSITO",
  "ENTREGADO POR COBRAR",
  "MANIFIESTO PAGO"
];

const ENTREGAS = ["PENDIENTES", "ENTREGADOS"];

function normalizarNumero(valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  return Number(valor);
}

function validarEstado(valor) {
  return ESTADOS.includes(valor);
}

function validarEntrega(valor) {
  return ENTREGAS.includes(valor);
}

async function validarRelaciones({
  id_cliente,
  id_conductor,
  id_vehiculo,
  id_trailer,
  id_empresa_a_cargo
}) {
  const queries = [
    id_cliente
      ? pool.query(`SELECT nit FROM cliente WHERE nit = $1`, [id_cliente])
      : Promise.resolve({ rows: [{ nit: null }] }),

    id_conductor
      ? pool.query(`SELECT cedula FROM conductor WHERE cedula = $1`, [id_conductor])
      : Promise.resolve({ rows: [] }),

    id_vehiculo
      ? pool.query(`SELECT placa FROM vehiculo WHERE placa = $1`, [id_vehiculo])
      : Promise.resolve({ rows: [] }),

    id_trailer
      ? pool.query(`SELECT placa FROM trailer WHERE placa = $1`, [id_trailer])
      : Promise.resolve({ rows: [] }),

    id_empresa_a_cargo
      ? pool.query(`SELECT nit FROM empresa_a_cargo WHERE nit = $1`, [id_empresa_a_cargo])
      : Promise.resolve({ rows: [] }),
  ];

  const [cliente, conductor, vehiculo, trailer, empresa] = await Promise.all(queries);

  if (id_cliente && cliente.rows.length === 0) throw new Error("Cliente no encontrado");
  if (conductor.rows.length === 0) throw new Error("Conductor no encontrado");
  if (vehiculo.rows.length === 0) throw new Error("Vehículo no encontrado");
  if (trailer.rows.length === 0) throw new Error("Trailer no encontrado");
  if (empresa.rows.length === 0) throw new Error("Empresa a cargo no encontrada");
}

// =========================================
// GET MANIFIESTOS CON FILTROS
// =========================================
const getManifiestos = async (req, res) => {
  try {
    const {
      anio,
      mes,
      id_manifiesto,
      fecha_desde,
      fecha_hasta,
      estado,
      id_cliente
    } = req.query;

    let query = `
      SELECT
        m.id_manifiesto,
        f.codigo_factura AS id_factura,
        m.radicado,
        TO_CHAR(m.fecha, 'YYYY-MM-DD') AS fecha,
        m.origen_departamento,
        m.origen_ciudad,
        m.destino_departamento,
        m.destino_ciudad,
        m.estado,
        m.valor_flete,
        m.valor_flete_porcentaje,
        m.anticipo_manifiesto,
        m.gastos,
        m.documentos,
        m.novedades,
        m.observaciones,
        m.id_cliente,
        c.nombre AS cliente_nombre,
        m.id_conductor,
        co.nombre AS conductor_nombre,
        m.id_vehiculo,
        m.id_trailer,
        m.id_empresa_a_cargo,
        e.nombre AS empresa_a_cargo_nombre
      FROM manifiesto m
      LEFT JOIN factura f ON f.id_manifiesto = m.id_manifiesto
      LEFT JOIN cliente c ON m.id_cliente = c.nit
      INNER JOIN conductor co ON m.id_conductor = co.cedula
      INNER JOIN vehiculo v ON m.id_vehiculo = v.placa
      INNER JOIN trailer t ON m.id_trailer = t.placa
      INNER JOIN empresa_a_cargo e ON m.id_empresa_a_cargo = e.nit
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (anio) {
      query += ` AND EXTRACT(YEAR FROM m.fecha) = $${index}`;
      values.push(Number(anio));
      index++;
    }

    if (mes) {
      query += ` AND EXTRACT(MONTH FROM m.fecha) = $${index}`;
      values.push(Number(mes));
      index++;
    }

    if (id_manifiesto) {
      query += ` AND m.id_manifiesto ILIKE $${index}`;
      values.push(`%${id_manifiesto}%`);
      index++;
    }

    if (fecha_desde) {
      query += ` AND m.fecha >= $${index}`;
      values.push(fecha_desde);
      index++;
    }

    if (fecha_hasta) {
      query += ` AND m.fecha <= $${index}`;
      values.push(fecha_hasta);
      index++;
    }

    if (estado && estado !== "Todos") {
      query += ` AND m.estado = $${index}`;
      values.push(estado);
      index++;
    }

    if (id_cliente && id_cliente !== "Todos") {
      query += ` AND m.id_cliente = $${index}`;
      values.push(id_cliente);
      index++;
    }

    query += `
      ORDER BY m.fecha DESC, m.radicado DESC
      LIMIT 200
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("Error obteniendo manifiestos:", error);
    res.status(500).json({ error: "Error obteniendo manifiestos" });
  }
};

// =========================================
// GET MANIFIESTO POR ID
// =========================================
const getManifiestoById = async (req, res) => {
  try {
    const { id_manifiesto } = req.params;

    const result = await pool.query(
      `
      SELECT
        m.*,
        f.codigo_factura AS id_factura,
        c.nombre AS cliente_nombre,
        co.nombre AS conductor_nombre,
        e.nombre AS empresa_a_cargo_nombre
      FROM manifiesto m
      LEFT JOIN factura f ON f.id_manifiesto = m.id_manifiesto
      LEFT JOIN cliente c ON m.id_cliente = c.nit
      INNER JOIN conductor co ON m.id_conductor = co.cedula
      INNER JOIN empresa_a_cargo e ON m.id_empresa_a_cargo = e.nit
      WHERE m.id_manifiesto = $1
      `,
      [id_manifiesto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Manifiesto no encontrado" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error obteniendo manifiesto:", error);
    res.status(500).json({ error: "Error obteniendo manifiesto" });
  }
};

// =========================================
// CREAR MANIFIESTO
// =========================================
const createManifiesto = async (req, res) => {
  try {
    const {
      id_manifiesto,
      radicado,
      fecha,
      origen_departamento,
      origen_ciudad,
      destino_departamento,
      destino_ciudad,
      valor_flete,
      valor_flete_porcentaje,
      anticipo_manifiesto,
      id_cliente,
      id_conductor,
      id_vehiculo,
      id_trailer,
      id_empresa_a_cargo,
      observaciones
    } = req.body;

    const estado = "CREADO-EN TRANSITO";
    const gastos = "PENDIENTES";
    const documentos = "PENDIENTES";
    const novedades = false;

    if (
      !id_manifiesto ||
      !fecha ||
      !origen_departamento ||
      !origen_ciudad ||
      !destino_departamento ||
      !destino_ciudad ||
      valor_flete === undefined || valor_flete === null || valor_flete === "" ||
      anticipo_manifiesto === undefined || anticipo_manifiesto === null || anticipo_manifiesto === "" ||
      !id_conductor ||
      !id_vehiculo ||
      !id_trailer ||
      !id_empresa_a_cargo
    ) {
      return res.status(400).json({
        error: "Campos obligatorios incompletos"
      });
    }

    if (!validarEstado(estado)) {
      return res.status(400).json({ error: "Estado de manifiesto inválido" });
    }

    if (!validarEntrega(gastos) || !validarEntrega(documentos)) {
      return res.status(400).json({ error: "Gastos o documentos inválidos" });
    }

    const existe = await pool.query(
      `SELECT id_manifiesto FROM manifiesto WHERE id_manifiesto = $1`,
      [id_manifiesto]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "El ID de manifiesto ya existe" });
    }

    if (radicado) {
      const existeRadicado = await pool.query(
        `SELECT radicado FROM manifiesto WHERE radicado = $1`,
        [Number(radicado)]
      );

      if (existeRadicado.rows.length > 0) {
        return res.status(400).json({ error: "El radicado ya existe" });
      }
    }

    await validarRelaciones({
      id_cliente: id_cliente || null,
      id_conductor,
      id_vehiculo,
      id_trailer,
      id_empresa_a_cargo
    });

    const query = `
      INSERT INTO manifiesto (
        id_manifiesto,
        radicado,
        id_cliente,
        id_conductor,
        id_vehiculo,
        id_trailer,
        id_empresa_a_cargo,
        fecha,
        origen_departamento,
        origen_ciudad,
        destino_departamento,
        destino_ciudad,
        estado,
        valor_flete,
        valor_flete_porcentaje,
        anticipo_manifiesto,
        gastos,
        documentos,
        novedades,
        observaciones,
        creado
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW()
      )
      RETURNING *
    `;

    const values = [
      id_manifiesto,
      radicado && radicado !== "" ? Number(radicado) : null,
      id_cliente || null,
      Number(id_conductor),
      id_vehiculo,
      id_trailer,
      id_empresa_a_cargo,
      fecha,
      origen_departamento,
      origen_ciudad,
      destino_departamento,
      destino_ciudad,
      estado,
      normalizarNumero(valor_flete),
      normalizarNumero(valor_flete_porcentaje),
      normalizarNumero(anticipo_manifiesto),
      gastos,
      documentos,
      novedades,
      observaciones || null
    ];

    const result = await pool.query(query, values);

    try {
      await audit({
        tabla: "manifiesto",
        operacion: "CREATE",
        registroId: result.rows[0].id_manifiesto,
        usuarioId: req.headers["x-usuario-id"] || "US1",
        viejo: null,
        nuevo: result.rows[0],
        req
      });
    } catch (e) {
      console.error("AUDIT CREATE MANIFIESTO:", e.message);
    }

    // =========================
    // SOCKET EVENT
    // =========================
    global.io.emit("manifiesto:created", {
      manifiesto: result.rows[0]
    });
    
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creando manifiesto:", error);

    if (
      error.message === "Cliente no encontrado" ||
      error.message === "Conductor no encontrado" ||
      error.message === "Vehículo no encontrado" ||
      error.message === "Trailer no encontrado" ||
      error.message === "Empresa a cargo no encontrada"
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error creando manifiesto" });
  }
};

// =========================================
// ACTUALIZAR MANIFIESTO
// =========================================
const updateManifiesto = async (req, res) => {
  try {
    const { id_manifiesto } = req.params;

    const {
      radicado,
      fecha,
      origen_departamento,
      origen_ciudad,
      destino_departamento,
      destino_ciudad,
      estado,
      valor_flete,
      valor_flete_porcentaje,
      anticipo_manifiesto,
      gastos,
      documentos,
      id_cliente,
      id_conductor,
      id_vehiculo,
      id_trailer,
      id_empresa_a_cargo,
      novedades,
      observaciones,
      originalSnapshot
    } = req.body;

    const existe = await pool.query(
      `SELECT id_manifiesto FROM manifiesto WHERE id_manifiesto = $1`,
      [id_manifiesto]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({ error: "Manifiesto no encontrado" });
    }

    const viejo = await pool.query(
      `SELECT * FROM manifiesto WHERE id_manifiesto = $1`,
      [id_manifiesto]
    );
    
    // =========================
    // OPTIMISTIC LOCK
    // =========================
    if (originalSnapshot) {
    
      const actual = viejo.rows[0];
    
      const conflicto =
        String(actual.estado || "") !== String(originalSnapshot.estado || "") ||
    
        String(actual.gastos || "") !== String(originalSnapshot.gastos || "") ||
    
        String(actual.documentos || "") !== String(originalSnapshot.documentos || "") ||
    
        String(actual.observaciones || "") !== String(originalSnapshot.observaciones || "") ||
    
        String(actual.id_conductor || "") !== String(originalSnapshot.id_conductor || "") ||
    
        String(actual.id_vehiculo || "") !== String(originalSnapshot.id_vehiculo || "") ||
    
        String(actual.id_trailer || "") !== String(originalSnapshot.id_trailer || "");
    
      if (conflicto) {
    
        return res.status(409).json({
          error: "Este manifiesto fue modificado por otro usuario. Recarga antes de guardar."
        });
    
      }
    
    }

    // ? radicado y cliente NO obligatorios
    if (
      !fecha ||
      !origen_departamento ||
      !origen_ciudad ||
      !destino_departamento ||
      !destino_ciudad ||
      !estado ||
      valor_flete === undefined ||
      valor_flete_porcentaje === undefined ||
      anticipo_manifiesto === undefined ||
      !gastos ||
      !documentos ||
      !id_conductor ||
      !id_vehiculo ||
      !id_trailer ||
      !id_empresa_a_cargo ||
      novedades === undefined
    ) {
      return res.status(400).json({
        error: "Todos los campos obligatorios para actualizar deben estar completos"
      });
    }

    if (!validarEstado(estado)) {
      return res.status(400).json({ error: "Estado de manifiesto inválido" });
    }

    if (!validarEntrega(gastos) || !validarEntrega(documentos)) {
      return res.status(400).json({ error: "Gastos o documentos inválidos" });
    }

    await validarRelaciones({
      id_cliente: id_cliente || null,
      id_conductor,
      id_vehiculo,
      id_trailer,
      id_empresa_a_cargo
    });

    // ? Validar radicado duplicado solo si viene dato
    if (radicado !== null && radicado !== undefined && radicado !== "") {
      const radicadoDuplicado = await pool.query(
        `
        SELECT radicado
        FROM manifiesto
        WHERE radicado = $1
          AND id_manifiesto <> $2
        `,
        [Number(radicado), id_manifiesto]
      );

      if (radicadoDuplicado.rows.length > 0) {
        return res.status(400).json({
          error: "El radicado ya está en uso por otro manifiesto"
        });
      }
    }

    const query = `
      UPDATE manifiesto
      SET
        radicado = $1,
        id_cliente = $2,
        id_conductor = $3,
        id_vehiculo = $4,
        id_trailer = $5,
        id_empresa_a_cargo = $6,
        fecha = $7,
        origen_departamento = $8,
        origen_ciudad = $9,
        destino_departamento = $10,
        destino_ciudad = $11,
        estado = $12,
        valor_flete = $13,
        valor_flete_porcentaje = $14,
        anticipo_manifiesto = $15,
        gastos = $16,
        documentos = $17,
        novedades = $18,
        observaciones = $19
      WHERE id_manifiesto = $20
      RETURNING *
    `;

    const values = [
      radicado !== null && radicado !== undefined && radicado !== ""
        ? Number(radicado)
        : null,

      id_cliente && id_cliente !== ""
        ? id_cliente
        : null,

      Number(id_conductor),
      id_vehiculo,
      id_trailer,
      id_empresa_a_cargo,
      fecha,
      origen_departamento,
      origen_ciudad,
      destino_departamento,
      destino_ciudad,
      estado,
      normalizarNumero(valor_flete),
      normalizarNumero(valor_flete_porcentaje),
      normalizarNumero(anticipo_manifiesto),
      gastos,
      documentos,
      Boolean(novedades),
      observaciones || null,
      id_manifiesto
    ];

    const result = await pool.query(query, values);

    try {
      await audit({
        tabla: "manifiesto",
        operacion: "UPDATE",
        registroId: id_manifiesto,
        usuarioId: req.headers["x-usuario-id"] || "US1",
        viejo: viejo.rows[0],
        nuevo: result.rows[0],
        req
      });
    } catch (e) {
      console.error("AUDIT UPDATE MANIFIESTO:", e.message);
    }

    // =========================
    // SOCKET EVENT
    // =========================
    global.io.emit("manifiesto:updated", {
      manifiesto: result.rows[0]
    });
    
    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error actualizando manifiesto:", error);

    if (
      error.message === "Cliente no encontrado" ||
      error.message === "Conductor no encontrado" ||
      error.message === "Vehículo no encontrado" ||
      error.message === "Trailer no encontrado" ||
      error.message === "Empresa a cargo no encontrada"
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error actualizando manifiesto" });
  }
};



// =========================================
// CATÁLOGOS PARA SELECTS
// =========================================
const getCatalogosManifiesto = async (_req, res) => {
  try {
    const [
      clientes,
      conductores,
      vehiculos,
      trailers,
      empresas
    ] = await Promise.all([
      pool.query(`SELECT nit, nombre FROM cliente WHERE estado = 'activo' ORDER BY nombre ASC`),
      pool.query(`SELECT cedula, nombre FROM conductor WHERE estado = 'activo' ORDER BY nombre ASC`),
      pool.query(`SELECT placa FROM vehiculo WHERE estado = 'activo' ORDER BY placa ASC`),
      pool.query(`SELECT placa FROM trailer WHERE estado = 'activo' ORDER BY placa ASC`),
      pool.query(`SELECT nit, nombre FROM empresa_a_cargo WHERE estado = 'activo' ORDER BY nombre ASC`)
    ]);

    res.json({
      estados: ESTADOS,
      entregas: ENTREGAS,
      clientes: clientes.rows,
      conductores: conductores.rows,
      vehiculos: vehiculos.rows,
      trailers: trailers.rows,
      empresas: empresas.rows
    });

  } catch (error) {
    console.error("Error obteniendo catálogos:", error);
    res.status(500).json({ error: "Error obteniendo catálogos de manifiesto" });
  }
};

// =========================================
// DETALLE COMPLETO MANIFIESTO
// =========================================
async function obtenerDetalleManifiesto(req, res) {
  try {
    const { id } = req.params;

    const resultManifiesto = await pool.query(`
      SELECT
        m.*,

        c.nombre AS cliente_nombre,

        co.cedula AS conductor_cedula,
        co.nombre AS conductor_nombre,
        co.correo AS conductor_correo,
        co.telefono AS conductor_telefono,
        co.estado AS conductor_estado,
        co.vencimiento_licencia AS conductor_vencimiento_licencia,
        co.vencimiento_manip_alimentos AS conductor_vencimiento_manip_alimentos,
        co.vencimiento_sustancia_peligrosa AS conductor_vencimiento_sustancia_peligrosa,

        e.nit AS empresa_nit,
        e.nombre AS empresa_nombre,
        e.correo AS empresa_correo,
        e.telefono AS empresa_telefono,
        e.direccion AS empresa_direccion,
        e.estado AS empresa_estado

      FROM manifiesto m
      LEFT JOIN cliente c
        ON m.id_cliente = c.nit
      LEFT JOIN conductor co
        ON m.id_conductor = co.cedula
      LEFT JOIN empresa_a_cargo e
        ON m.id_empresa_a_cargo = e.nit
      WHERE m.id_manifiesto = $1
    `, [id]);

    if (resultManifiesto.rows.length === 0) {
      return res.status(404).json({ error: "Manifiesto no encontrado" });
    }

    const manifiesto = resultManifiesto.rows[0];

    const resultGastos = await pool.query(`
      SELECT
        g.*,

        t.id AS transaccion_id,
        t.id_banco AS transaccion_id_banco,
        t.id_tipo_transaccion AS transaccion_id_tipo_transaccion,
        t.id_vehiculo AS transaccion_id_vehiculo,
        t.id_trailer AS transaccion_id_trailer,
        t.id_manifiesto AS transaccion_id_manifiesto,
        t.id_factura AS transaccion_id_factura,
        t.valor AS transaccion_valor,
        t.fecha_pago AS transaccion_fecha_pago,
        t.descripcion AS transaccion_descripcion,
        t.creado AS transaccion_creado,

        tt.id AS tipo_transaccion_id,
        tt.categoria AS tipo_transaccion_categoria,
        tt.descripcion AS tipo_transaccion_descripcion,
        tt.tipo AS tipo_transaccion_tipo,
        tt.estado AS tipo_transaccion_estado,
        tt.creado AS tipo_transaccion_creado

      FROM gastos_conductor g
      LEFT JOIN transaccion t
        ON g.id_transaccion = t.id
      LEFT JOIN tipo_transaccion tt
        ON t.id_tipo_transaccion = tt.id
      WHERE g.id_manifiesto = $1
    `, [id]);

    const resultTransacciones = await pool.query(`
      SELECT
        t.*,

        tt.id AS tipo_transaccion_id,
        tt.categoria AS tipo_transaccion_categoria,
        tt.descripcion AS tipo_transaccion_descripcion,
        tt.tipo AS tipo_transaccion_tipo,
        tt.estado AS tipo_transaccion_estado,
        tt.creado AS tipo_transaccion_creado

      FROM transaccion t
      LEFT JOIN tipo_transaccion tt
        ON t.id_tipo_transaccion = tt.id
      WHERE t.id_manifiesto = $1
        AND (tt.tipo IS NULL OR tt.tipo <> 'GASTO CONDUCTOR')
    `, [id]);

    const resultFactura = await pool.query(`
      SELECT *
      FROM factura
      WHERE id_manifiesto = $1
    `, [id]);

    return res.json({
      manifiesto,
      gastos: resultGastos.rows,
      transacciones: resultTransacciones.rows,
      factura: resultFactura.rows[0] || null
    });

  } catch (error) {
    console.error("Error detalle manifiesto:", error);
    return res.status(500).json({ error: error.message });
  }
}


const exportarManifiestosExcel = async (req, res) => {
  try {
    const {
      id_manifiesto,
      fecha_desde,
      fecha_hasta,
      estado,
      id_cliente
    } = req.query;

    const values = [];
    let index = 1;
    let where = `WHERE 1=1`;

    if (id_manifiesto) {
      where += ` AND m.id_manifiesto ILIKE $${index}`;
      values.push(`%${id_manifiesto}%`);
      index++;
    }

    if (fecha_desde) {
      where += ` AND m.fecha >= $${index}`;
      values.push(fecha_desde);
      index++;
    }

    if (fecha_hasta) {
      where += ` AND m.fecha <= $${index}`;
      values.push(fecha_hasta);
      index++;
    }

    if (estado && estado !== "Todos") {
      where += ` AND m.estado = $${index}`;
      values.push(estado);
      index++;
    }

    if (id_cliente && id_cliente !== "Todos") {
      where += ` AND m.id_cliente = $${index}`;
      values.push(id_cliente);
      index++;
    }

    const resumenQuery = `
      WITH totales_transacciones AS (
        SELECT
          t.id_manifiesto,
          SUM(CASE WHEN tt.tipo = 'INGRESO MANIFIESTO' THEN t.valor ELSE 0 END) AS ingresos_manifiesto,
          SUM(CASE WHEN tt.tipo = 'EGRESO MANIFIESTO' THEN t.valor ELSE 0 END) AS egresos_manifiesto
        FROM transaccion t
        LEFT JOIN tipo_transaccion tt ON tt.id = t.id_tipo_transaccion
        GROUP BY t.id_manifiesto
      ),
      totales_gastos AS (
        SELECT
          gc.id_manifiesto,
          SUM(t.valor) AS gastos_conductor
        FROM gastos_conductor gc
        LEFT JOIN transaccion t ON t.id = gc.id_transaccion
        GROUP BY gc.id_manifiesto
      )
      SELECT
        m.id_manifiesto,
        m.radicado,
        TO_CHAR(m.fecha, 'YYYY-MM-DD') AS fecha,
        m.origen_departamento,
        m.origen_ciudad,
        m.destino_departamento,
        m.destino_ciudad,
        m.estado,
        m.valor_flete,
        m.valor_flete_porcentaje,
        m.anticipo_manifiesto,
        m.gastos,
        m.documentos,
        m.novedades,
        m.observaciones,
        TO_CHAR(m.creado, 'YYYY-MM-DD HH24:MI:SS') AS creado,

        c.nit AS cliente_nit,
        c.nombre AS cliente_nombre,
        c.correo AS cliente_correo,
        c.telefono AS cliente_telefono,
        c.direccion AS cliente_direccion,
        c.estado AS cliente_estado,

        co.cedula AS conductor_cedula,
        co.nombre AS conductor_nombre,
        co.correo AS conductor_correo,
        co.telefono AS conductor_telefono,
        co.estado AS conductor_estado,
        TO_CHAR(co.vencimiento_licencia, 'YYYY-MM-DD') AS conductor_vencimiento_licencia,
        TO_CHAR(co.vencimiento_manip_alimentos, 'YYYY-MM-DD') AS conductor_vencimiento_manip_alimentos,
        TO_CHAR(co.vencimiento_sustancia_peligrosa, 'YYYY-MM-DD') AS conductor_vencimiento_sustancia_peligrosa,

        v.placa AS vehiculo_placa,
        v.estado AS vehiculo_estado,
        v.id_propietario AS vehiculo_propietario_id,
        pv.nombre AS vehiculo_propietario_nombre,
        TO_CHAR(v.vencimiento_soat, 'YYYY-MM-DD') AS vehiculo_vencimiento_soat,
        TO_CHAR(v.vencimiento_tecno, 'YYYY-MM-DD') AS vehiculo_vencimiento_tecno,
        TO_CHAR(v.vencimiento_todo_riesgo, 'YYYY-MM-DD') AS vehiculo_vencimiento_todo_riesgo,

        tr.placa AS trailer_placa,
        tr.estado AS trailer_estado,
        tr.id_propietario AS trailer_propietario_id,
        pt.nombre AS trailer_propietario_nombre,
        TO_CHAR(tr.vencimiento_cert_fumigacion, 'YYYY-MM-DD') AS trailer_vencimiento_cert_fumigacion,
        TO_CHAR(tr.vencimiento_cert_sanidad, 'YYYY-MM-DD') AS trailer_vencimiento_cert_sanidad,

        e.nit AS empresa_nit,
        e.nombre AS empresa_nombre,
        e.correo AS empresa_correo,
        e.telefono AS empresa_telefono,
        e.direccion AS empresa_direccion,
        e.estado AS empresa_estado,

        f.codigo_factura,
        TO_CHAR(f.fecha_emision, 'YYYY-MM-DD') AS factura_fecha_emision,
        TO_CHAR(f.fecha_vencimiento, 'YYYY-MM-DD') AS factura_fecha_vencimiento,
        f.valor AS factura_valor,
        f.retencion_fuente,
        f.retencion_ica,
        f.plazo_pago,

        COALESCE(tt.ingresos_manifiesto, 0) AS ingresos_manifiesto,
        COALESCE(tt.egresos_manifiesto, 0) AS egresos_manifiesto,
        COALESCE(tg.gastos_conductor, 0) AS gastos_conductor

      FROM manifiesto m
      LEFT JOIN cliente c ON c.nit = m.id_cliente
      LEFT JOIN conductor co ON co.cedula = m.id_conductor
      LEFT JOIN vehiculo v ON v.placa = m.id_vehiculo
      LEFT JOIN propietario pv ON pv.identificacion = v.id_propietario
      LEFT JOIN trailer tr ON tr.placa = m.id_trailer
      LEFT JOIN propietario pt ON pt.identificacion = tr.id_propietario
      LEFT JOIN empresa_a_cargo e ON e.nit = m.id_empresa_a_cargo
      LEFT JOIN factura f ON f.id_manifiesto = m.id_manifiesto
      LEFT JOIN totales_transacciones tt ON tt.id_manifiesto = m.id_manifiesto
      LEFT JOIN totales_gastos tg ON tg.id_manifiesto = m.id_manifiesto
      ${where}
      ORDER BY m.fecha DESC, m.radicado DESC
    `;

    const detalleQuery = `
      SELECT
        m.id_manifiesto,
        m.radicado,
        TO_CHAR(m.fecha, 'YYYY-MM-DD') AS fecha_manifiesto,

        t.id AS transaccion_id,
        TO_CHAR(t.fecha_pago, 'YYYY-MM-DD') AS fecha_pago,
        t.valor,
        t.descripcion AS transaccion_descripcion,
        TO_CHAR(t.creado, 'YYYY-MM-DD HH24:MI:SS') AS transaccion_creado,

        tt.id AS tipo_transaccion_id,
        tt.categoria AS tipo_transaccion_categoria,
        tt.descripcion AS tipo_transaccion_descripcion,
        tt.tipo AS tipo_transaccion_tipo,
        tt.estado AS tipo_transaccion_estado,

        b.id AS banco_id,
        b.nombre_banco,
        b.nombre_titular,
        b.identificacion AS banco_identificacion,
        b.numero_cuenta,
        b.tipo_cuenta,

        t.id_vehiculo,
        t.id_trailer,
        t.id_factura,

        gc.id AS gasto_conductor_id,
        gc.descripcion AS gasto_conductor_descripcion,
        gc.id_conductor AS gasto_conductor_id_conductor,
        cnd.nombre AS gasto_conductor_nombre_conductor

      FROM manifiesto m
      LEFT JOIN transaccion t ON t.id_manifiesto = m.id_manifiesto
      LEFT JOIN tipo_transaccion tt ON tt.id = t.id_tipo_transaccion
      LEFT JOIN banco b ON b.id = t.id_banco
      LEFT JOIN gastos_conductor gc ON gc.id_transaccion = t.id
      LEFT JOIN conductor cnd ON cnd.cedula = gc.id_conductor
      ${where}
      ORDER BY m.fecha DESC, m.id_manifiesto, t.fecha_pago DESC
    `;

    const [resumenResult, detalleResult] = await Promise.all([
      pool.query(resumenQuery, values),
      pool.query(detalleQuery, values)
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "VIASUGAS";
    workbook.created = new Date();

    const sheetResumen = workbook.addWorksheet("Resumen Manifiestos");
    const sheetDetalle = workbook.addWorksheet("Detalle Transacciones");

    sheetResumen.columns = [
      { header: "ID Manifiesto", key: "id_manifiesto", width: 18 },
      { header: "Radicado", key: "radicado", width: 15 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Estado", key: "estado", width: 24 },
      { header: "Origen Departamento", key: "origen_departamento", width: 22 },
      { header: "Origen Ciudad", key: "origen_ciudad", width: 20 },
      { header: "Destino Departamento", key: "destino_departamento", width: 22 },
      { header: "Destino Ciudad", key: "destino_ciudad", width: 20 },
      { header: "Valor Flete", key: "valor_flete", width: 18 },
      { header: "Flete Porcentaje", key: "valor_flete_porcentaje", width: 18 },
      { header: "Anticipo", key: "anticipo_manifiesto", width: 18 },
      { header: "Gastos Docs", key: "gastos", width: 16 },
      { header: "Documentos", key: "documentos", width: 16 },
      { header: "Novedades", key: "novedades", width: 12 },
      { header: "Observaciones", key: "observaciones", width: 35 },

      { header: "Cliente NIT", key: "cliente_nit", width: 18 },
      { header: "Cliente Nombre", key: "cliente_nombre", width: 28 },
      { header: "Cliente Correo", key: "cliente_correo", width: 28 },
      { header: "Cliente Teléfono", key: "cliente_telefono", width: 18 },
      { header: "Cliente Dirección", key: "cliente_direccion", width: 30 },
      { header: "Cliente Estado", key: "cliente_estado", width: 16 },

      { header: "Conductor Cédula", key: "conductor_cedula", width: 18 },
      { header: "Conductor Nombre", key: "conductor_nombre", width: 28 },
      { header: "Conductor Correo", key: "conductor_correo", width: 28 },
      { header: "Conductor Teléfono", key: "conductor_telefono", width: 18 },
      { header: "Conductor Estado", key: "conductor_estado", width: 16 },
      { header: "Venc. Licencia", key: "conductor_vencimiento_licencia", width: 18 },
      { header: "Venc. Manip. Alimentos", key: "conductor_vencimiento_manip_alimentos", width: 22 },
      { header: "Venc. Sust. Peligrosa", key: "conductor_vencimiento_sustancia_peligrosa", width: 22 },

      { header: "Vehículo Placa", key: "vehiculo_placa", width: 16 },
      { header: "Vehículo Estado", key: "vehiculo_estado", width: 16 },
      { header: "Vehículo Propietario ID", key: "vehiculo_propietario_id", width: 22 },
      { header: "Vehículo Propietario", key: "vehiculo_propietario_nombre", width: 28 },
      { header: "Venc. SOAT", key: "vehiculo_vencimiento_soat", width: 16 },
      { header: "Venc. Tecno", key: "vehiculo_vencimiento_tecno", width: 16 },
      { header: "Venc. Todo Riesgo", key: "vehiculo_vencimiento_todo_riesgo", width: 20 },

      { header: "Trailer Placa", key: "trailer_placa", width: 16 },
      { header: "Trailer Estado", key: "trailer_estado", width: 16 },
      { header: "Trailer Propietario ID", key: "trailer_propietario_id", width: 22 },
      { header: "Trailer Propietario", key: "trailer_propietario_nombre", width: 28 },
      { header: "Venc. Cert. Fumigación", key: "trailer_vencimiento_cert_fumigacion", width: 22 },
      { header: "Venc. Cert. Sanidad", key: "trailer_vencimiento_cert_sanidad", width: 22 },

      { header: "Empresa NIT", key: "empresa_nit", width: 18 },
      { header: "Empresa Nombre", key: "empresa_nombre", width: 28 },
      { header: "Empresa Correo", key: "empresa_correo", width: 28 },
      { header: "Empresa Teléfono", key: "empresa_telefono", width: 18 },
      { header: "Empresa Dirección", key: "empresa_direccion", width: 30 },
      { header: "Empresa Estado", key: "empresa_estado", width: 16 },

      { header: "Factura Código", key: "codigo_factura", width: 18 },
      { header: "Factura Emisión", key: "factura_fecha_emision", width: 18 },
      { header: "Factura Vencimiento", key: "factura_fecha_vencimiento", width: 20 },
      { header: "Factura Valor", key: "factura_valor", width: 18 },
      { header: "Retención Fuente", key: "retencion_fuente", width: 18 },
      { header: "Retención ICA", key: "retencion_ica", width: 18 },
      { header: "Plazo Pago", key: "plazo_pago", width: 14 },

      { header: "Ingresos Manifiesto", key: "ingresos_manifiesto", width: 20 },
      { header: "Egresos Manifiesto", key: "egresos_manifiesto", width: 20 },
      { header: "Gastos Conductor", key: "gastos_conductor", width: 20 },

      { header: "Creado", key: "creado", width: 22 }
    ];

    const filasResumen = resumenResult.rows.map((row) => ({
      ...row,
      valor_flete: Number(row.valor_flete || 0),
      valor_flete_porcentaje: Number(row.valor_flete_porcentaje || 0),
      anticipo_manifiesto: Number(row.anticipo_manifiesto || 0),
      factura_valor: Number(row.factura_valor || 0),
      retencion_fuente: Number(row.retencion_fuente || 0),
      retencion_ica: Number(row.retencion_ica || 0),
      ingresos_manifiesto: Number(row.ingresos_manifiesto || 0),
      egresos_manifiesto: Number(row.egresos_manifiesto || 0),
      gastos_conductor: Number(row.gastos_conductor || 0)
    }));

    sheetResumen.addRows(filasResumen);

    sheetDetalle.columns = [
      { header: "ID Manifiesto", key: "id_manifiesto", width: 18 },
      { header: "Radicado", key: "radicado", width: 15 },
      { header: "Fecha Manifiesto", key: "fecha_manifiesto", width: 18 },
      { header: "ID Transacción", key: "transaccion_id", width: 18 },
      { header: "Fecha Pago", key: "fecha_pago", width: 15 },
      { header: "Valor", key: "valor", width: 18 },
      { header: "Tipo", key: "tipo_transaccion_tipo", width: 24 },
      { header: "Categoría", key: "tipo_transaccion_categoria", width: 26 },
      { header: "Descripción Tipo", key: "tipo_transaccion_descripcion", width: 35 },
      { header: "Descripción Transacción", key: "transaccion_descripcion", width: 35 },
      { header: "Banco", key: "nombre_banco", width: 22 },
      { header: "Titular Banco", key: "nombre_titular", width: 26 },
      { header: "Identificación Banco", key: "banco_identificacion", width: 22 },
      { header: "Número Cuenta", key: "numero_cuenta", width: 24 },
      { header: "Tipo Cuenta", key: "tipo_cuenta", width: 16 },
      { header: "Vehículo", key: "id_vehiculo", width: 15 },
      { header: "Trailer", key: "id_trailer", width: 15 },
      { header: "Factura", key: "id_factura", width: 18 },
      { header: "ID Gasto Conductor", key: "gasto_conductor_id", width: 22 },
      { header: "Conductor Gasto ID", key: "gasto_conductor_id_conductor", width: 22 },
      { header: "Conductor Gasto Nombre", key: "gasto_conductor_nombre_conductor", width: 28 },
      { header: "Descripción Gasto", key: "gasto_conductor_descripcion", width: 35 },
      { header: "Creado Transacción", key: "transaccion_creado", width: 22 }
    ];

    const filasDetalle = detalleResult.rows.map((row) => ({
      ...row,
      valor: Number(row.valor || 0)
    }));

    sheetDetalle.addRows(filasDetalle);

    [sheetResumen, sheetDetalle].forEach((sheet) => {
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.autoFilter = {
        from: "A1",
        to: sheet.getRow(1).getCell(sheet.columnCount).address
      };

      const header = sheet.getRow(1);
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3C72" }
      };
      header.alignment = {
        vertical: "middle",
        horizontal: "center"
      };
    });

    const formatoMoneda = '"$"#,##0;[Red]-"$"#,##0';

    [
      "valor_flete",
      "valor_flete_porcentaje",
      "anticipo_manifiesto",
      "factura_valor",
      "retencion_fuente",
      "retencion_ica",
      "ingresos_manifiesto",
      "egresos_manifiesto",
      "gastos_conductor"
    ].forEach((key) => {
      sheetResumen.getColumn(key).numFmt = formatoMoneda;
    });

    sheetDetalle.getColumn("valor").numFmt = formatoMoneda;

    const nombreArchivo =
      `Manifiestos_${fecha_desde || "inicio"}_a_${fecha_hasta || "hoy"}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error exportando manifiestos Excel:", error);
    res.status(500).json({
      error: "Error exportando manifiestos a Excel"
    });
  }
};



module.exports = {
  getManifiestos,
  getManifiestoById,
  createManifiesto,
  updateManifiesto,
  getCatalogosManifiesto,
  obtenerDetalleManifiesto,
  exportarManifiestosExcel
};