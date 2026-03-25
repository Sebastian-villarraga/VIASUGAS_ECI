require("dotenv").config();

console.log("INICIANDO SERVER...");

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");

const app = express();

// =====================
// MIDDLEWARES
// =====================
app.use(cors());
app.use(express.json());

// =====================
// RUTAS API
// =====================
const manifiestoRoutes = require("./routes/manifiesto.routes");
const vehiculoRoutes = require("./routes/vehiculo.routes");

app.use("/api/manifiestos", manifiestoRoutes);
app.use("/api/vehiculos", vehiculoRoutes);

// =====================
// TESTS
// =====================
app.get("/api", (req, res) => {
    res.json({ message: "API funcionando correctamente" });
});

app.get("/test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en base de datos" });
    }
});

// DEBUG RÁPIDO
app.get("/ping", (req, res) => {
    res.send("pong");
});

// =====================
// STATIC FRONTEND
// =====================
app.use(express.static(path.join(__dirname, "../frontend")));

// =====================
// RUTAS DINÁMICAS FRONTEND (SOLUCIÓN PRO)
// =====================
app.get("/:page", (req, res, next) => {
    const page = req.params.page;

    // Evitar interferir con API
    if (page.startsWith("api")) {
        return next();
    }

    const filePath = path.join(__dirname, `../frontend/pages/${page}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send("Página no encontrada");
        }
    });
});

// =====================
// SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("Servidor corriendo en puerto " + PORT);
});

// =====================
// TEST DB AL INICIAR
// =====================
(async () => {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("DB conectada:", result.rows[0]);
    } catch (error) {
        console.error("Error DB:", error.message);
    }
})();

// =====================
// DEBUG PROCESO
// =====================
process.on("exit", (code) => {
    console.log("El proceso se cerró con código:", code);
});

process.on("uncaughtException", (err) => {
    console.error("Error no controlado:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("Promesa rechazada:", err);
});

setInterval(() => {
    console.log("backend vivo");
}, 5000);