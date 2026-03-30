const express = require("express");
const router = express.Router();

const {
  getEmpresasACargo,
  getEmpresaACargoById,
  crearEmpresaACargo,
  actualizarEmpresaACargo
} = require("../controllers/empresaACargo.controller");

// =====================
// GET
// =====================
router.get("/", getEmpresasACargo);
router.get("/:nit", getEmpresaACargoById);

// =====================
// POST
// =====================
router.post("/", crearEmpresaACargo);

// =====================
// PUT
// =====================
router.put("/:nit", actualizarEmpresaACargo);

module.exports = router;