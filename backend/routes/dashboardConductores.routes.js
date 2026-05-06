const express = require("express");
const router = express.Router();

const {
  getDashboardConductores,
  getConductores
} = require("../controllers/dashboardConductores.controller");

// =============================
// DASHBOARD
// =============================
router.get("/", getDashboardConductores);

// =============================
// FILTRO CONDUCTORES
// =============================
router.get("/conductores", getConductores);

module.exports = router;