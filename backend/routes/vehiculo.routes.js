const express = require("express");
const router = express.Router();

const {
  getVehiculos,
  crearVehiculo,
  getAlertasVehiculos,
  getVehiculosPorEstadoAlerta,
  actualizarVehiculo
} = require("../controllers/vehiculo.controller");

// =========================
// GET
// =========================
router.get("/", getVehiculos);
router.get("/alertas", getAlertasVehiculos);
router.get("/filtro-alertas", getVehiculosPorEstadoAlerta);

// =========================
// POST 
// =========================
router.post("/", crearVehiculo);

// =========================
// PUT
// =========================
router.put("/:placa", actualizarVehiculo);

module.exports = router;




