require("dotenv").config();

console.log("?? Iniciando servidor...");

const express = require("express");
const cors = require("cors");
const path = require("path");

const http = require("http");
const { Server } = require("socket.io");

const pool = require("./config/db");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// GLOBAL SOCKET INSTANCE
global.io = io;

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
// SOCKETS
// =====================
io.on("connection", (socket) => {

  console.log("?? Cliente conectado:", socket.id);

  socket.emit("test", {
    mensaje: "Socket funcionando correctamente"
  });
  
  // =========================
  // MANIFIESTO EDITING
  // =========================
  socket.on("manifiesto:editing", (data) => {

    io.emit(
      "manifiesto:editing",
      data
    );
  
  });
  
  // =========================
  // MANIFIESTO STOP EDITING
  // =========================
  socket.on("manifiesto:stop-editing", (data) => {
  
    socket.broadcast.emit(
      "manifiesto:stop-editing",
      data
    );
  
  });

  socket.on("disconnect", () => {
    console.log("? Cliente desconectado:", socket.id);
  });
  
  // =========================
  // GASTO CONDUCTOR EDITING
  // =========================
  socket.on(
    "gasto-conductor:editing",
    (data) => {
  
      socket.broadcast.emit(
        "gasto-conductor:editing",
        data
      );
  
    }
  );
  
  // =========================
  // GASTO CONDUCTOR STOP EDITING
  // =========================
  socket.on(
    "gasto-conductor:stop-editing",
    (data) => {
  
      socket.broadcast.emit(
        "gasto-conductor:stop-editing",
        data
      );
  
    }
  );

});

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
const ubicacionRoutes = require("./routes/ubicacion.routes");
const bancoRoutes = require("./routes/banco.routes");
const facturaRoutes = require("./routes/factura.routes");
const transaccionRoutes = require("./routes/transaccion.routes");
const gastosConductorRoutes = require("./routes/gastosConductor.routes");
const tipoTransaccionRoutes = require("./routes/tipoTransaccion.routes");
const registroConductorRoutes = require("./routes/registroConductor.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const dashboardContableRoutes = require("./routes/dashboardContable.routes");
const dashboardCarteraRoutes = require("./routes/dashboardCartera.routes");
const dashboardProyeccionesRoutes = require("./routes/dashboardProyecciones.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const permisosRoutes = require("./routes/permisos.routes");
const auditRoutes = require("./routes/audit.routes");
const dashboardConductoresRoutes = require("./routes/dashboardConductores.routes");

app.use("/api", authRoutes);
app.use("/api/manifiestos", manifiestoRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/trailers", trailerRoutes);
app.use("/api/propietarios", propietarioRoutes);
app.use("/api/conductores", conductorRoutes);
app.use("/api/empresas-a-cargo", empresaACargoRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/ubicaciones", ubicacionRoutes);
app.use("/api/bancos", bancoRoutes);
app.use("/api/facturas", facturaRoutes);
app.use("/api/transacciones", transaccionRoutes);
app.use("/api/gastos-conductor", gastosConductorRoutes);
app.use("/api/tipo-transaccion", tipoTransaccionRoutes);
app.use("/api/registro-conductor", registroConductorRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard-contable", dashboardContableRoutes);
app.use("/api/dashboard-cartera", dashboardCarteraRoutes);
app.use("/api/dashboard-proyecciones", dashboardProyeccionesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/permisos", permisosRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard-conductores", dashboardConductoresRoutes);

// =====================
// HEALTH CHECKS
// =====================
app.get("/api", (req, res) => {
  res.json({
    ok: true,
    message: "API funcionando correctamente"
  });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/server-id", (req, res) => {
  res.json({
    server: `Backend en puerto ${PORT}`,
    pid: process.pid
  });
});

// =====================
// STATIC FRONTEND
// =====================
app.use(express.static(frontendPath));

// =====================
// SPA FALLBACK
// =====================
app.use((req, res) => {

  // NO tocar API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      error: "API route not found"
    });
  }

  // SPA fallback
  res.sendFile(
    path.join(frontendPath, "pages/home.html")
  );

});

// =====================
// SERVER START
// =====================
server.listen(PORT, "0.0.0.0", async () => {

  console.log(`?? Servidor corriendo en puerto ${PORT}`);

  try {

    const result = await pool.query("SELECT NOW()");

    console.log("? DB conectada:", result.rows[0]);

  } catch (error) {

    console.error("? Error DB:", error.message);

  }

});

// =====================
// ERROR HANDLING GLOBAL
// =====================
process.on("uncaughtException", (err) => {
  console.error("? Error no controlado:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("? Promesa rechazada:", err);
});

