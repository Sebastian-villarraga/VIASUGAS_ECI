const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET ALL VEHICULOS
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                v.placa,
                p.nombre AS propietario,
                v.todo_riesgo,
                v.soat,
                v.tecnomecanica,
                v.estado
            FROM Vehiculo v
            LEFT JOIN Propietario p ON v.propietario = p.identificacion
            ORDER BY v.placa;
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo vehículos" });
    }
});

module.exports = router;