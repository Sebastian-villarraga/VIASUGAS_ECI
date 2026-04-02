const express = require("express");
const router = express.Router();

const {
  getFacturas,
  createFactura
} = require("../controllers/factura.controller");

// =========================
// GET
// =========================
router.get("/", getFacturas);

// =========================
// POST
// =========================
router.post("/", createFactura);

module.exports = router;