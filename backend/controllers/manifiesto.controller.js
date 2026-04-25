const pool = require("../config/db");
const audit = require("../utils/audit");

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
      observaciones
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

    if (
      !radicado ||
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
      !id_cliente ||
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
      id_cliente,
      id_conductor,
      id_vehiculo,
      id_trailer,
      id_empresa_a_cargo
    });

    const radicadoDuplicado = await pool.query(
      `
      SELECT radicado
      FROM manifiesto
      WHERE radicado = $1 AND id_manifiesto <> $2
      `,
      [radicado, id_manifiesto]
    );

    if (radicadoDuplicado.rows.length > 0) {
      return res.status(400).json({ error: "El radicado ya está en uso por otro manifiesto" });
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
      Number(radicado),
      id_cliente,
      id_conductor ? Number(id_conductor) : null,
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

module.exports = {
  getManifiestos,
  getManifiestoById,
  createManifiesto,
  updateManifiesto,
  getCatalogosManifiesto,
  obtenerDetalleManifiesto
};