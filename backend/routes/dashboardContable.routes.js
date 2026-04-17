// routes/dashboardContable.routes.js

const express = require("express");
const router = express.Router();

const {
  getDashboardContableKPI,
  getEstadoResultadosMensual,
  getUtilidadMensual,
  getGastosCategoriaContable,
  getResumenMensualContable,
  getDetalleGastosContables,
  getFlujoBancosContable
} = require("../controllers/dashboardContable.controller");

// =========================
// DASHBOARD CONTABLE
// =========================

router.get("/kpi", getDashboardContableKPI);

router.get(
  "/estado-resultados-mensual",
  getEstadoResultadosMensual
);

router.get(
  "/utilidad-mensual",
  getUtilidadMensual
);

router.get(
  "/gastos-categoria",
  getGastosCategoriaContable
);

router.get(
  "/resumen-mensual",
  getResumenMensualContable
);

router.get(
  "/detalle-gastos",
  getDetalleGastosContables
);

// NUEVO MODULO BANCOS
router.get(
  "/flujo-bancos",
  getFlujoBancosContable
);

module.exports = router;