const express = require("express");
const router = express.Router();

const {
  getTiposTransaccion,
  getTipoTransaccionById,
  createTipoTransaccion,
  updateTipoTransaccion
} = require("../controllers/tipoTransaccion.controller");

// =========================
// GET
// =========================
router.get("/", getTiposTransaccion);
router.get("/:id", getTipoTransaccionById);

// =========================
// POST
// =========================
router.post("/", createTipoTransaccion);

// =========================
// PUT
// =========================
router.put("/:id", updateTipoTransaccion);

module.exports = router;