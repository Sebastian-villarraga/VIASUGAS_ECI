const express = require("express");
const router = express.Router();

const {
  getFacturas,
  createFactura,
  getManifiestos,
  pagarFactura 
} = require("../controllers/factura.controller");

// =========================
// GET
// =========================
router.get("/", getFacturas);
router.get("/manifiestos", getManifiestos);

// =========================
// POST
// =========================
router.post("/", createFactura);

// =========================
// ROUTE
// =========================
router.put("/:codigo/pagar", pagarFactura);

module.exports = router;