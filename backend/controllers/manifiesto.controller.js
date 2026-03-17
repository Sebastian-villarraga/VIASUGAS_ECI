const pool = require("../config/db");

// ?? Obtener todos los manifiestos
const getManifiestos = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM manifiesto ORDER BY fecha DESC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo manifiestos" });
    }
};

// ?? Crear manifiesto
const createManifiesto = async (req, res) => {
    try {
        const {
            id_manifiesto,
            fecha,
            origen_ciudad,
            destino_ciudad,
            origen_departamento,
            destino_departamento,
            estado,
            valor_flete,
            id_cliente,
            id_conductor,
            id_vehiculo,
            id_trailer
        } = req.body;

        const query = `
            INSERT INTO manifiesto (
                id_manifiesto, fecha, origen_ciudad, destino_ciudad,
                origen_departamento, destino_departamento, estado,
                valor_flete, id_cliente, id_conductor, id_vehiculo, id_trailer
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *
        `;

        const values = [
            id_manifiesto,
            fecha,
            origen_ciudad,
            destino_ciudad,
            origen_departamento,
            destino_departamento,
            estado,
            valor_flete,
            id_cliente,
            id_conductor,
            id_vehiculo,
            id_trailer
        ];

        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creando manifiesto" });
    }
};

module.exports = {
    getManifiestos,
    createManifiesto
};
