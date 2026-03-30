require("dotenv").config();

console.log("?? Iniciando servidor...");

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");

const app = express();

// =====================
// CONFIG
// =====================
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "../frontend");

// =====================
// MIDDLEWARES
// =====================
app.use(cors());
app.use(express.json());

// =====================
// LOG REQUESTS (PRO)
// =====================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// =====================
// RUTAS API
// =====================
const manifiestoRoutes = require("./routes/manifiesto.routes");
const vehiculoRoutes = require("./routes/vehiculo.routes");
const authRoutes = require("./routes/auth.routes");
const trailerRoutes = require("./routes/trailer.routes");
const propietarioRoutes = require("./routes/propietario.routes");
const conductorRoutes = require("./routes/conductor.routes");
const empresaACargoRoutes = require("./routes/empresaACargo.routes");
const clienteRoutes = require("./routes/cliente.routes");

app.use("/api", authRoutes);
app.use("/api/manifiestos", manifiestoRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/trailers", trailerRoutes);
app.use("/api/propietarios", propietarioRoutes);
app.use("/api/conductores", conductorRoutes);
app.use("/api/empresas-a-cargo", empresaACargoRoutes);
app.use("/api/clientes", clienteRoutes);

// =====================
// HEALTH CHECKS
// =====================
app.get("/api", (req, res) => {
  res.json({ ok: true, message: "API funcionando correctamente" });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

// =====================
// STATIC FRONTEND
// =====================
app.use(express.static(frontendPath));

// =====================
// SPA FALLBACK (?? FIX REAL)
// =====================
app.use((req, res, next) => {
  // ?? NO tocar API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }

  // ? SPA fallback
  res.sendFile(path.join(frontendPath, "pages/home.html"));
});
// =====================
// SERVER START
// =====================
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`? Servidor corriendo en puerto ${PORT}`);

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("?? DB conectada:", result.rows[0]);
  } catch (error) {
    console.error("?? Error DB:", error.message);
  }
});

// =====================
// ERROR HANDLING GLOBAL
// =====================
process.on("uncaughtException", (err) => {
  console.error("?? Error no controlado:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("?? Promesa rechazada:", err);
});