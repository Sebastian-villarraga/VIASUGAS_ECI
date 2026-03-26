const express = require("express");
const router = express.Router();

const {
  getVehiculos
} = require("../controllers/vehiculo.controller");

// =====================
// ROUTES
// =====================
router.get("/", getVehiculos);

module.exports = router;