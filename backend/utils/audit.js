const pool = require("../config/db");

async function registrarAuditoria({
  tabla,
  operacion,
  registroId,
  usuarioId,
  viejo,
  nuevo,
  req
}) {

  await pool.query(
    `
    INSERT INTO audit_logs
    (
      nombre_tabla,
      operacion,
      id_registro,
      id_usuario,
      dato_antiguo,
      dato_nuevo,
      ip,
      user_agent
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      tabla,
      operacion,
      registroId,
      usuarioId,
      viejo || null,
      nuevo || null,
      req.ip,
      req.headers["user-agent"]
    ]
  );

  // =========================
  // SOCKET EVENT
  // =========================
  try {

    if (global.io) {

      global.io.emit(
        "audit:new-log",
        {
          tabla,
          operacion,
          registroId,
          usuarioId
        }
      );

    }

  } catch (e) {

    console.error(
      "SOCKET AUDIT:",
      e.message
    );

  }

}

module.exports = registrarAuditoria;