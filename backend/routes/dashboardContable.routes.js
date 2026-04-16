// routes/dashboardContable.routes.js
const express = require("express");
const router = express.Router();

const {
  getDashboardContableKPI,
  getEstadoResultadosMensual,
  getUtilidadMensual,
  getGastosCategoriaContable,
  getResumenMensualContable,
  getDetalleGastosContables
} = require("../controllers/dashboardContable.controller");

router.get("/kpi", getDashboardContableKPI);
router.get("/estado-resultados-mensual", getEstadoResultadosMensual);
router.get("/utilidad-mensual", getUtilidadMensual);
router.get("/gastos-categoria", getGastosCategoriaContable);
router.get("/resumen-mensual", getResumenMensualContable);
router.get("/detalle-gastos", getDetalleGastosContables);

module.exports = router;