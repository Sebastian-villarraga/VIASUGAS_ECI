const pool = require("../config/db");
const bcrypt = require("bcrypt");

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
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await client.query("BEGIN");

    // ?? contraseña automática
    const passwordPlano = correo.split("@")[0];
    const hash = await bcrypt.hash(passwordPlano, 10);

    // ?? insertar usuario
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
      VALUES ($1, $2, $3, $4, TRUE, TRUE, NOW())
    `, [id, nombre, correo, hash]);

    // ?? permisos
    if (permisos && permisos.length > 0) {
      for (const codigo of permisos) {
        const perm = await client.query(
          `SELECT id FROM permiso WHERE codigo = $1`,
          [codigo]
        );

        if (perm.rows.length) {
          await client.query(`
            INSERT INTO usuario_permiso (id_usuario, id_permiso)
            VALUES ($1, $2)
          `, [id, perm.rows[0].id]);
        }
      }
    }

    await client.query("COMMIT");

    res.json({ message: "Usuario creado correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error createUsuario:", error);
    res.status(500).json({ error: error.message });
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
    const { nombre, correo, permisos } = req.body;

    await client.query("BEGIN");

    // actualizar datos básicos
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

    // insertar nuevos permisos
    if (permisos && permisos.length > 0) {
      for (const codigo of permisos) {
        const perm = await client.query(
          `SELECT id FROM permiso WHERE codigo = $1`,
          [codigo]
        );

        if (perm.rows.length) {
          await client.query(`
            INSERT INTO usuario_permiso (id_usuario, id_permiso)
            VALUES ($1, $2)
          `, [id, perm.rows[0].id]);
        }
      }
    }

    await client.query("COMMIT");

    res.json({ message: "Usuario actualizado" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updateUsuario:", error);
    res.status(500).json({ error: error.message });
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

    await pool.query(`
      UPDATE usuario
      SET activo = NOT activo,
          actualizado = NOW()
      WHERE id = $1
    `, [id]);

    res.json({ message: "Estado actualizado" });

  } catch (error) {
    console.error("Error toggleUsuario:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================
// CAMBIAR PASSWORD
// =========================
const cambiarPassword = async (req, res) => {
  try {
    const userId = req.user.id; // viene del token
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "La contraseña es requerida" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Mínimo 6 caracteres" });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(`
      UPDATE usuario
      SET contrasena_hash = $1,
          debe_cambiar_contrasena = FALSE,
          actualizado = NOW()
      WHERE id = $2
    `, [hash, userId]);

    res.json({ message: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("Error cambiarPassword:", error);
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // obtener correo
    const result = await pool.query(
      `SELECT correo FROM usuario WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const correo = result.rows[0].correo;

    // password = antes del @
    const passwordPlano = correo.split("@")[0];

    const hash = await bcrypt.hash(passwordPlano, 10);

    await pool.query(`
      UPDATE usuario
      SET contrasena_hash = $1,
          debe_cambiar_contrasena = TRUE,
          actualizado = NOW()
      WHERE id = $2
    `, [hash, id]);

    res.json({ message: "Contraseña restablecida" });

  } catch (error) {
    console.error("Error resetPassword:", error);
    res.status(500).json({ error: error.message });
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