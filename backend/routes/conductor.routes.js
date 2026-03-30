const express = require("express");
const router = express.Router();

const {
  getConductores,
  crearConductor,
  actualizarConductor,
  getAlertasConductores
} = require("../controllers/conductor.controller");

router.get("/", getConductores);
router.get("/alertas", getAlertasConductores);

router.post("/", crearConductor);
router.put("/:cedula", actualizarConductor);

module.exports = router;