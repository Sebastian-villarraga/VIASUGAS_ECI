const express = require("express");
const router = express.Router();

// ?? middleware auth
const { verifyToken } = require("../middlewares/auth");

const {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleUsuario,
  cambiarPassword,
  resetPassword
} = require("../controllers/usuarios.controller");

// =========================
// RUTAS USUARIOS
// =========================

// Obtener todos
router.get("/", getUsuarios);

// Crear
router.post("/", createUsuario);

router.post("/:id/reset-password", verifyToken, resetPassword);

// ?? Cambiar contraseña (usuario logueado)
router.post("/cambiar-password", verifyToken, cambiarPassword);

// Actualizar
router.put("/:id", updateUsuario);

// Activar / desactivar
router.patch("/:id/toggle", toggleUsuario);

module.exports = router;