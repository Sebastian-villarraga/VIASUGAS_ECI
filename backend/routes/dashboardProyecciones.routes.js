// routes/dashboardProyecciones.routes.js
const express = require("express");
const router = express.Router();

const {
  getDashboardProyeccionesKPI,
  getProyeccionMensual,
  getProyeccionSemanal,
  getTopClientesProyectados,
  getFacturasProximasVencer,
  getDetalleProyeccion
} = require("../controllers/dashboardProyecciones.controller");

router.get("/kpi", getDashboardProyeccionesKPI);
router.get("/proyeccion-mensual", getProyeccionMensual);
router.get("/proyeccion-semanal", getProyeccionSemanal);
router.get("/top-clientes", getTopClientesProyectados);
router.get("/facturas-proximas", getFacturasProximasVencer);
router.get("/detalle", getDetalleProyeccion);

module.exports = router;