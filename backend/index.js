require("dotenv").config();


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
// RUTAS API (PRIMERO)
// =====================
const manifiestoRoutes = require("./routes/manifiesto.routes");

app.use("/api/manifiestos", manifiestoRoutes);

app.get("/api", (req, res) => {
    res.json({ message: "API funcionando?" });
});

// =====================
// STATIC (DESPUÉS)
// =====================
app.use(express.static(path.join(__dirname, "../frontend")));

// =====================
// SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async () => {
    console.log("Servidor corriendo en puerto " + PORT);

    try {
        const result = await pool.query("SELECT NOW()");
        console.log("DB conectada:", result.rows[0]);
    } catch (error) {
        console.error("Error DB:", error.message);
    }
});
