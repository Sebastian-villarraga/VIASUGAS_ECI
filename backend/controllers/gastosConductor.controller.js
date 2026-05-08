const pool = require("../config/db");
const { randomUUID } = require("crypto");
const audit = require("../utils/audit");

// =========================
// GET
// =========================
const getGastosConductor = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        gc.*,
        c.nombre AS conductor_nombre,
        t.valor,
        t.descripcion AS transaccion_descripcion,
        t.id_tipo_transaccion
      FROM gastos_conductor gc
      INNER JOIN conductor c 
        ON gc.id_conductor = c.cedula
      INNER JOIN transaccion t
        ON gc.id_transaccion = t.id
      ORDER BY gc.creado DESC
    `);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({
      error: "Error obteniendo gastos conductor"
    });
  }
};

// =========================
// CREATE
// =========================
const createGastoConductor = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      tipo_transaccion,
      valor,
      id_manifiesto,
      descripcion,
      fecha
    } = req.body;

    if (!tipo_transaccion || !valor || !id_manifiesto) {
      return res.status(400).json({
        error: "tipo_transaccion, valor e id_manifiesto son obligatorios"
      });
    }

    await client.query("BEGIN");

    const mani = await client.query(`
      SELECT id_conductor
      FROM manifiesto
      WHERE id_manifiesto = $1
    `,[id_manifiesto]);

    const id_conductor = mani.rows[0].id_conductor;

    const id_transaccion = randomUUID();
    const id_gasto = randomUUID();

    await client.query(`
      INSERT INTO transaccion(
        id,
        id_tipo_transaccion,
        id_manifiesto,
        valor,
        fecha_pago,
        descripcion,
        creado
      )
      VALUES($1,$2,$3,$4,$5,$6,NOW())
    `,[
      id_transaccion,
      tipo_transaccion,
      id_manifiesto,
      valor,
      fecha,
      descripcion
    ]);

    const gasto = await client.query(`
      INSERT INTO gastos_conductor(
        id,
        id_transaccion,
        id_conductor,
        id_manifiesto,
        descripcion,
        creado
      )
      VALUES($1,$2,$3,$4,$5,NOW())
      RETURNING *
    `,[
      id_gasto,
      id_transaccion,
      id_conductor,
      id_manifiesto,
      descripcion
    ]);

    await client.query("COMMIT");

    await audit({
      tabla:"gastos_conductor",
      operacion:"CREATE",
      registroId:id_gasto,
      usuarioId:req.headers["x-usuario-id"] || "US1",
      viejo:null,
      nuevo:gasto.rows[0],
      req
    });

    // =========================
    // SOCKET EVENT
    // =========================
    if (global.io) {
    
      global.io.emit(
        "gasto-conductor:created",
        {
          gasto: gasto.rows[0]
        }
      );
    
    }
    
    // =========================
    // RESPONSE
    // =========================
    res.status(201).json(gasto.rows[0]);

  } catch(error){

    await client.query("ROLLBACK");

    res.status(500).json({
      error:error.message
    });

  } finally{
    client.release();
  }
};

// =========================
// UPDATE
// =========================
const updateGastoConductor = async (req, res) => {

  const client = await pool.connect();

  try {

    const { id } = req.params;
    const {
      valor,
      descripcion
    } = req.body;

    await client.query("BEGIN");

    const oldData = await client.query(`
      SELECT 
        gc.*,
        t.valor,
        t.descripcion AS transaccion_descripcion
      FROM gastos_conductor gc
      INNER JOIN transaccion t
        ON gc.id_transaccion = t.id
      WHERE gc.id = $1
    `,[id]);

    if (!oldData.rows.length) {
      throw new Error("Gasto no encontrado");
    }

    const gasto = oldData.rows[0];

    await client.query(`
      UPDATE transaccion
      SET valor = $1,
          descripcion = $2
      WHERE id = $3
    `,[
      valor,
      descripcion,
      gasto.id_transaccion
    ]);

    await client.query(`
      UPDATE gastos_conductor
      SET descripcion = $1
      WHERE id = $2
    `,[
      descripcion,
      id
    ]);

    await client.query("COMMIT");

    await audit({
      tabla:"gastos_conductor",
      operacion:"UPDATE",
      registroId:id,
      usuarioId:req.headers["x-usuario-id"] || "US1",
      viejo:oldData.rows[0],
      nuevo:{
        valor,
        descripcion
      },
      req
    });

    // =========================
    // SOCKET EVENT
    // =========================
    if (global.io) {
    
      global.io.emit(
        "gasto-conductor:updated",
        {
          id,
          valor,
          descripcion
        }
      );
    
    }
    
    // =========================
    // RESPONSE
    // =========================
    res.json({
      ok:true
    });

  } catch(error){

    await client.query("ROLLBACK");

    res.status(500).json({
      error:error.message
    });

  } finally{
    client.release();
  }
};

module.exports = {
  getGastosConductor,
  createGastoConductor,
  updateGastoConductor
};