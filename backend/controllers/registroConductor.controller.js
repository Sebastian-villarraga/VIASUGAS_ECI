const pool = require("../config/db");
const audit = require("../utils/audit");

// =========================
// MANIFIESTOS POR CONDUCTOR
// =========================
const getManifiestosByConductor = async (req, res) => {
  try {
    const { cedula } = req.params;

    const result = await pool.query(`
      SELECT 
        id_manifiesto, 
        fecha, 
        estado
      FROM manifiesto
      WHERE id_conductor = $1
      ORDER BY fecha DESC
    `, [cedula]);

    // =========================
    // AUDITORIA CONSULTA
    // =========================
    try {
      await audit({
        tabla: "manifiesto",
        operacion: "READ",
        registroId: cedula,
        usuarioId:
          req.headers["x-usuario-id"] || "US1",
        viejo: null,
        nuevo: {
          consulta:
            "getManifiestosByConductor",
          cedula,
          total:
            result.rows.length
        },
        req
      });
    } catch (e) {
      console.error(
        "AUDIT READ REGISTRO CONDUCTOR:",
        e.message
      );
    }

    res.json(result.rows);

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

// =========================
// GASTOS POR MANIFIESTO
// =========================
const getGastosByManifiesto = async (req, res) => {
  try {
    const { manifiesto } = req.query;

    const result = await pool.query(`
      SELECT 
        gc.id,
        gc.descripcion,
        gc.creado,
        t.valor
      FROM gastos_conductor gc
      INNER JOIN transaccion t 
        ON gc.id_transaccion = t.id
      WHERE gc.id_manifiesto = $1
      ORDER BY gc.creado DESC
    `, [manifiesto]);

    // =========================
    // AUDITORIA CONSULTA
    // =========================
    try {
      await audit({
        tabla: "gastos_conductor",
        operacion: "READ",
        registroId: manifiesto,
        usuarioId:
          req.headers["x-usuario-id"] || "US1",
        viejo: null,
        nuevo: {
          consulta:
            "getGastosByManifiesto",
          manifiesto,
          total:
            result.rows.length
        },
        req
      });
    } catch (e) {
      console.error(
        "AUDIT READ GASTOS CONDUCTOR:",
        e.message
      );
    }

    res.json(result.rows);

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getManifiestosByConductor,
  getGastosByManifiesto
};