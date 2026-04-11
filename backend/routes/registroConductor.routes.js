const express = require("express");
const router = express.Router();

const {
  getManifiestosByConductor,
  getGastosByManifiesto
} = require("../controllers/registroConductor.controller");

// ? RUTAS
router.get("/manifiestos/:cedula", getManifiestosByConductor);
router.get("/gastos", getGastosByManifiesto);

module.exports = router;