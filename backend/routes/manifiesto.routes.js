const express = require("express");
const router = express.Router();

const {
  getManifiestos,
  getManifiestoById,
  createManifiesto,
  updateManifiesto,
  getCatalogosManifiesto
} = require("../controllers/manifiesto.controller");

// =========================================
// GET
// =========================================
router.get("/", getManifiestos);
router.get("/catalogos", getCatalogosManifiesto);
router.get("/:id_manifiesto", getManifiestoById);

// =========================================
// POST
// =========================================
router.post("/", createManifiesto);

// =========================================
// PUT
// =========================================
router.put("/:id_manifiesto", updateManifiesto);

module.exports = router;