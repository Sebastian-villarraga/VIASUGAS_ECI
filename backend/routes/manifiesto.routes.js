const express = require("express");
const router = express.Router();

const {
  getManifiestos,
  getManifiestoById,
  createManifiesto,
  updateManifiesto,
  getCatalogosManifiesto,
  obtenerDetalleManifiesto
} = require("../controllers/manifiesto.controller");

// =========================================
// GET
// =========================================
router.get("/", getManifiestos);
router.get("/catalogos", getCatalogosManifiesto);
router.get("/:id_manifiesto", getManifiestoById);
router.get("/:id/detalle", obtenerDetalleManifiesto);

// =========================================
// POST
// =========================================
router.post("/", createManifiesto);

// =========================================
// PUT
// =========================================
router.put("/:id_manifiesto", updateManifiesto);

module.exports = router;