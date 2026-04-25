const express = require("express");
const router = express.Router();

const {
  getGastosConductor,
  createGastoConductor,
  updateGastoConductor
} = require("../controllers/gastosConductor.controller");

router.get("/", getGastosConductor);

router.post("/", createGastoConductor);

router.put("/:id", updateGastoConductor);

module.exports = router;