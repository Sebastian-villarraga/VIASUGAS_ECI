const express = require("express");
const router = express.Router();

const {
  getVehiculos,
  crearVehiculo,
  getAlertasVehiculos
} = require("../controllers/vehiculo.controller");

// =========================
// GET
// =========================
router.get("/", getVehiculos);
router.get("/alertas", getAlertasVehiculos);

// =========================
// POST 
// =========================
router.post("/", crearVehiculo);

module.exports = router;




