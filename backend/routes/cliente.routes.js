const express = require("express");
const router = express.Router();

const {
  getClientes,
  getClienteById,
  crearCliente,
  actualizarCliente
} = require("../controllers/cliente.controller");

// =====================
// GET
// =====================
router.get("/", getClientes);
router.get("/:nit", getClienteById);

// =====================
// POST
// =====================
router.post("/", crearCliente);

// =====================
// PUT
// =====================
router.put("/:nit", actualizarCliente);

module.exports = router;