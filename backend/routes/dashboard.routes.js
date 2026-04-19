const express = require("express");
const router = express.Router();

const {
  getDashboardKPI,
  getRentabilidad,
  getIngresosEgresos,
  getGastosPorCategoria,
  getEstadoFacturacion,
  getTopClientes,
  getGastosOperacionales
} = require("../controllers/dashboard.controller");

// =========================
// DASHBOARD
// =========================
router.get("/kpi", getDashboardKPI);
router.get("/rentabilidad", getRentabilidad);
router.get("/grafica-ingresos-egresos", getIngresosEgresos);
router.get("/gastos-categoria", getGastosPorCategoria);
router.get("/estado-facturacion", getEstadoFacturacion);
router.get("/top-clientes", getTopClientes);
router.get("/gastos-operacionales", getGastosOperacionales);

module.exports = router;