const express = require("express");
const router = express.Router();

const {
  getPropietarios,
  getPropietarioById,
  crearPropietario,
  actualizarPropietario
} = require("../controllers/propietario.controller");

// =====================
// GET
// =====================
router.get("/", getPropietarios);
router.get("/:id", getPropietarioById);

// =====================
// POST
// =====================
router.post("/", crearPropietario);

// =====================
// PUT
// =====================
router.put("/:id", actualizarPropietario);

module.exports = router;