const express = require("express");
const router = express.Router();

const {
  getDashboardKPI,
  getRentabilidad,
  getIngresosEgresos,
  getGastosPorCategoria
} = require("../controllers/dashboard.controller");

// =========================
// DASHBOARD
// =========================

router.get("/kpi", getDashboardKPI);
router.get("/rentabilidad", getRentabilidad);
router.get("/grafica-ingresos-egresos", getIngresosEgresos);
router.get("/gastos-categoria", getGastosPorCategoria);

module.exports = router;