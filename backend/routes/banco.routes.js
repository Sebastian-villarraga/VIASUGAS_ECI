const express = require("express");
const router = express.Router();

const {
  getBancos,
  getBancoById,
  createBanco,
  updateBanco
} = require("../controllers/banco.controller");

// =========================
// GET
// =========================
router.get("/", getBancos);
router.get("/:id", getBancoById);

// =========================
// POST
// =========================
router.post("/", createBanco);

// =========================
// PUT
// =========================
router.put("/:id", updateBanco);

module.exports = router;