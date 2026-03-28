const express = require("express");
const router = express.Router();

const {
  getTrailers,
  crearTrailer,
  getAlertasTrailers,
  getTrailersPorEstadoAlerta,
  actualizarTrailer
} = require("../controllers/trailer.controller");

// =========================
// GET
// =========================
router.get("/", getTrailers);
router.get("/alertas", getAlertasTrailers);
router.get("/filtro-alertas", getTrailersPorEstadoAlerta);

// =========================
// POST 
// =========================
router.post("/", crearTrailer);

// =========================
// PUT
// =========================
router.put("/:placa", actualizarTrailer);

module.exports = router;