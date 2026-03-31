const pool = require("../config/db");

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
    pool.query(`SELECT nit FROM cliente WHERE nit = $1`, [id_cliente]),
    pool.query(`SELECT cedula FROM conductor WHERE cedula = $1`, [id_conductor]),
    pool.query(`SELECT placa FROM vehiculo WHERE placa = $1`, [id_vehiculo]),
    pool.query(`SELECT placa FROM trailer WHERE placa = $1`, [id_trailer]),
    pool.query(`SELECT nit FROM empresa_a_cargo WHERE nit = $1`, [id_empresa_a_cargo]),
  ];

  const [cliente, conductor, vehiculo, trailer, empresa] = await Promise.all(queries);

  if (cliente.rows.length === 0) throw new Error("Cliente no encontrado");
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
      INNER JOIN cliente c ON m.id_cliente = c.nit
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

    if (estado) {
      query += ` AND m.estado = $${index}`;
      values.push(estado);
      index++;
    }

    if (id_cliente) {
      query += ` AND m.id_cliente = $${index}`;
      values.push(id_cliente);
      index++;
    }

    query += ` ORDER BY m.fecha DESC, m.radicado DESC`;

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
        c.nombre AS cliente_nombre,
        co.nombre AS conductor_nombre,
        e.nombre AS empresa_a_cargo_nombre
      FROM manifiesto m
      INNER JOIN cliente c ON m.id_cliente = c.nit
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

    // Valores por defecto al crear
    const estado = "CREADO-EN TRANSITO";
    const gastos = "PENDIENTES";
    const documentos = "PENDIENTES";
    const novedades = false;

    if (
      !id_manifiesto ||
      !radicado ||
      !fecha ||
      !origen_departamento ||
      !origen_ciudad ||
      !destino_departamento ||
      !destino_ciudad ||
      valor_flete === undefined ||
      valor_flete_porcentaje === undefined ||
      anticipo_manifiesto === undefined ||
      !id_cliente ||
      !id_conductor ||
      !id_vehiculo ||
      !id_trailer ||
      !id_empresa_a_cargo
    ) {
      return res.status(400).json({
        error: "Todos los campos obligatorios del manifiesto deben estar completos"
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

    const existeRadicado = await pool.query(
      `SELECT radicado FROM manifiesto WHERE radicado = $1`,
      [radicado]
    );

    if (existeRadicado.rows.length > 0) {
      return res.status(400).json({ error: "El radicado ya existe" });
    }

    await validarRelaciones({
      id_cliente,
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
      Number(radicado),
      id_cliente,
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

module.exports = {
  getManifiestos,
  getManifiestoById,
  createManifiesto,
  updateManifiesto,
  getCatalogosManifiesto
};