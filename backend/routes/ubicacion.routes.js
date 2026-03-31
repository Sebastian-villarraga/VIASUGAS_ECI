const express = require("express");
const router = express.Router();

const {
  getDepartamentos,
  getMunicipios,
  buscarUbicaciones
} = require("../controllers/ubicacion.controller");

router.get("/departamentos", getDepartamentos);
router.get("/municipios", getMunicipios);
router.get("/buscar", buscarUbicaciones);

module.exports = router;