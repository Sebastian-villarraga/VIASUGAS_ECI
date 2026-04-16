// routes/dashboardCartera.routes.js

const express = require("express");
const router = express.Router();

const {
  getDashboardCarteraKPI,
  getAging,
  getTopDeudores,
  getFacturasVencidas,
  getDetalle
} = require("../controllers/dashboardCartera.controller");

// =============================
// DASHBOARD CARTERA
// =============================

// KPI principales
router.get("/kpi", getDashboardCarteraKPI);

// Antigüedad / Aging de cartera
router.get("/aging", getAging);

// Top clientes con mayor deuda
router.get("/top-deudores", getTopDeudores);

// Facturas vencidas
router.get("/facturas-vencidas", getFacturasVencidas);

// Detalle completo cartera pendiente
router.get("/detalle", getDetalle);

module.exports = router;