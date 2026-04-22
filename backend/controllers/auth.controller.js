const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // =========================
    // 1. VALIDAR INPUT
    // =========================
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" });
    }

    // =========================
    // 2. BUSCAR USUARIO (CON ALIAS)
    // =========================
    const userResult = await pool.query(
      `
      SELECT 
        id,
        nombre,
        correo,
        contrasena_hash,
        activo,
        debe_cambiar_contrasena AS debe_cambiar_password
      FROM usuario
      WHERE correo = $1
      `,
      [email]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // =========================
    // 3. VALIDAR ACTIVO
    // =========================
    if (!user.activo) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    // =========================
    // 4. VALIDAR PASSWORD
    // =========================
    const match = await bcrypt.compare(password, user.contrasena_hash);

    if (!match) {
      return res.status(401).json({ error: "Contrasena incorrecta" });
    }

    // =========================
    // 5. TRAER PERMISOS
    // =========================
    const permisosResult = await pool.query(
      `
      SELECT p.codigo
      FROM usuario_permiso up
      JOIN permiso p ON p.id = up.id_permiso
      WHERE up.id_usuario = $1
      `,
      [user.id]
    );

    const permisos = permisosResult.rows.map(p => p.codigo);

    // =========================
    // 6. GENERAR TOKEN
    // =========================
    const token = jwt.sign(
      { id: user.id, correo: user.correo },
      process.env.JWT_SECRET || "super-secret-key",
      { expiresIn: "8h" }
    );

    // =========================
    // 7. RESPUESTA
    // =========================
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        debe_cambiar_password: user.debe_cambiar_password
      },
      permisos
    });

  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({ error: "Error en login" });
  }
};

module.exports = {
  login
};
