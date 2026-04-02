const express = require("express");
const router = express.Router();

const {
  getGastosConductor,
  createGastoConductor
} = require("../controllers/gastosConductor.controller");

// =========================
// GET
// =========================
router.get("/", getGastosConductor);

// =========================
// POST
// =========================
router.post("/", createGastoConductor);

module.exports = router;