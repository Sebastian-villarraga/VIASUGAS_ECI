const pool = require("../config/db");
const bcrypt = require("bcrypt");
const audit = require("../utils/audit");

// =========================
// GET USUARIOS
// =========================
const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.correo,
        u.activo,
        COALESCE(
          json_agg(p.codigo) FILTER (WHERE p.codigo IS NOT NULL),
          '[]'
        ) AS permisos
      FROM usuario u
      LEFT JOIN usuario_permiso up ON u.id = up.id_usuario
      LEFT JOIN permiso p ON p.id = up.id_permiso
      GROUP BY u.id
      ORDER BY u.id;
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error getUsuarios:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================
// CREATE USUARIO
// =========================
const createUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id, nombre, correo, permisos } = req.body;

    if (!id || !nombre || !correo) {
      return res.status(400).json({
        error: "Datos incompletos"
      });
    }

    await client.query("BEGIN");

    // ============================
    // PASSWORD TEMPORAL ALEATORIA
    // ============================
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    let passwordPlano = "";

    for (let i = 0; i < 10; i++) {
      passwordPlano += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    const hash = await bcrypt.hash(passwordPlano, 10);

    // crear usuario
    await client.query(`
      INSERT INTO usuario (
        id,
        nombre,
        correo,
        contrasena_hash,
        activo,
        debe_cambiar_contrasena,
        creado
      )
      VALUES ($1,$2,$3,$4,TRUE,TRUE,NOW())
    `, [id, nombre, correo, hash]);

    // permisos
    let permisosFinal = Array.isArray(permisos)
      ? [...permisos]
      : [];

    if (!permisosFinal.includes("inicio")) {
      permisosFinal.push("inicio");
    }

    permisosFinal = [...new Set(permisosFinal)];

    for (const codigo of permisosFinal) {
      const perm = await client.query(`
        SELECT id
        FROM permiso
        WHERE codigo = $1
      `, [codigo]);

      if (perm.rows.length) {
        await client.query(`
          INSERT INTO usuario_permiso (
            id_usuario,
            id_permiso
          )
          VALUES ($1,$2)
        `, [id, perm.rows[0].id]);
      }
    }

    await client.query("COMMIT");

    res.json({
      message: "Usuario creado",
      correo,
      temporalPassword: passwordPlano
    });

  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      error: error.message
    });

  } finally {
    client.release();
  }
};

// =========================
// UPDATE USUARIO
// =========================
const updateUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      nombre,
      correo,
      permisos
    } = req.body;

    await client.query("BEGIN");

    // datos anteriores
    const oldUser =
      await client.query(`
      SELECT id, nombre, correo
      FROM usuario
      WHERE id = $1
    `, [id]);

    const oldPerms =
      await client.query(`
      SELECT p.codigo
      FROM usuario_permiso up
      INNER JOIN permiso p
        ON p.id = up.id_permiso
      WHERE up.id_usuario = $1
    `, [id]);

    const viejo = {
      ...(oldUser.rows[0] || {}),
      permisos:
        oldPerms.rows.map(
          x => x.codigo
        )
    };

    // actualizar básicos
    await client.query(`
      UPDATE usuario
      SET nombre = $1,
          correo = $2,
          actualizado = NOW()
      WHERE id = $3
    `, [nombre, correo, id]);

    // borrar permisos actuales
    await client.query(`
      DELETE FROM usuario_permiso
      WHERE id_usuario = $1
    `, [id]);

    // ==========================================
    // SIEMPRE AGREGAR PERMISO INICIO
    // ==========================================
    let permisosFinal = Array.isArray(permisos)
      ? [...permisos]
      : [];

    if (!permisosFinal.includes("inicio")) {
      permisosFinal.push("inicio");
    }

    // quitar duplicados
    permisosFinal = [...new Set(permisosFinal)];

    // insertar permisos nuevos
    for (const codigo of permisosFinal) {
      const perm = await client.query(
        `SELECT id FROM permiso WHERE codigo = $1`,
        [codigo]
      );

      if (perm.rows.length) {
        await client.query(`
          INSERT INTO usuario_permiso (
            id_usuario,
            id_permiso
          )
          VALUES ($1, $2)
        `, [id, perm.rows[0].id]);
      }
    }

    await client.query("COMMIT");

    // auditoría
    try {
      await audit({
        tabla: "usuario",
        operacion: "UPDATE",
        registroId: id,
        usuarioId:
          req.headers["x-usuario-id"] || "US1",
        viejo,
        nuevo: {
          id,
          nombre,
          correo,
          permisos: permisosFinal
        },
        req
      });
    } catch (e) {
      console.error(
        "AUDIT UPDATE USUARIO:",
        e.message
      );
    }

    res.json({
      message:
        "Usuario actualizado"
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Error updateUsuario:",
      error
    );

    res.status(500).json({
      error: error.message
    });

  } finally {
    client.release();
  }
};


// =========================
// TOGGLE ACTIVO
// =========================
const toggleUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const before =
      await pool.query(`
      SELECT *
      FROM usuario
      WHERE id = $1
    `, [id]);

    await pool.query(`
      UPDATE usuario
      SET activo = NOT activo,
          actualizado = NOW()
      WHERE id = $1
    `, [id]);

    const after =
      await pool.query(`
      SELECT *
      FROM usuario
      WHERE id = $1
    `, [id]);

    // AUDITORIA UPDATE
    try {
      await audit({
        tabla: "usuario",
        operacion: "UPDATE",
        registroId: id,
        usuarioId:
          req.headers["x-usuario-id"] || "US1",
        viejo:
          before.rows[0],
        nuevo:
          after.rows[0],
        req
      });
    } catch (e) {
      console.error(
        "AUDIT TOGGLE USUARIO:",
        e.message
      );
    }

    res.json({
      message:
        "Estado actualizado"
    });

  } catch (error) {
    console.error(
      "Error toggleUsuario:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};

// =========================
// CAMBIAR PASSWORD
// =========================
const cambiarPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error:
          "La contraseña es requerida"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error:
          "Mínimo 6 caracteres"
      });
    }

    const before =
      await pool.query(`
      SELECT id, nombre, correo
      FROM usuario
      WHERE id = $1
    `, [userId]);

    const hash =
      await bcrypt.hash(
        password,
        10
      );

    await pool.query(`
      UPDATE usuario
      SET contrasena_hash = $1,
          debe_cambiar_contrasena = FALSE,
          actualizado = NOW()
      WHERE id = $2
    `, [hash, userId]);

    const after =
      await pool.query(`
      SELECT id, nombre, correo
      FROM usuario
      WHERE id = $1
    `, [userId]);

    // AUDITORIA
    try {
      await audit({
        tabla: "usuario",
        operacion: "UPDATE",
        registroId: userId,
        usuarioId: userId,
        viejo:
          before.rows[0],
        nuevo:
          after.rows[0],
        req
      });
    } catch (e) {
      console.error(
        "AUDIT PASSWORD:",
        e.message
      );
    }

    res.json({
      message:
        "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error(
      "Error cambiarPassword:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};

// =========================
// RESET PASSWORD
// =========================
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const before = await pool.query(`
      SELECT * FROM usuario
      WHERE id = $1
    `, [id]);

    if (!before.rows.length) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      });
    }

    // ====================================
    // GENERAR PASSWORD TEMPORAL
    // ====================================
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    let passwordPlano = "";

    for (let i = 0; i < 10; i++) {
      passwordPlano += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    const hash = await bcrypt.hash(passwordPlano, 10);

    await pool.query(`
      UPDATE usuario
      SET contrasena_hash = $1,
          debe_cambiar_contrasena = TRUE,
          actualizado = NOW()
      WHERE id = $2
    `, [hash, id]);

    res.json({
      message: "Contraseña restablecida",
      temporalPassword: passwordPlano
    });

  } catch (error) {
    console.error("Error resetPassword:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleUsuario,
  cambiarPassword,
  resetPassword
};