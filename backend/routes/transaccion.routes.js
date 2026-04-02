const express = require("express");
const router = express.Router();

const {
  getTransacciones,
  createTransaccion
} = require("../controllers/transaccion.controller");

// =========================
// GET
// =========================
router.get("/", getTransacciones);

// =========================
// POST
// =========================
router.post("/", createTransaccion);

module.exports = router;