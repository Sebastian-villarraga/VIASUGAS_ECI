const pool = require("../config/db");

// =====================
// GET VEHICULOS
// =====================
const getVehiculos = async (req, res) => {
  try {
    const { placa, propietario, estado } = req.query;

    let query = `
      SELECT 
        v.placa,
        COALESCE(p.nombre, '-') AS propietario,
        v.vencimiento_todo_riesgo,
        v.vencimiento_soat,
        v.vencimiento_tecno,
        v.estado
      FROM vehiculo v
      LEFT JOIN propietario p 
        ON v.id_propietario = p.identificacion
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (placa) {
      query += ` AND v.placa ILIKE $${index}`;
      values.push(`%${placa}%`);
      index++;
    }
    
    if (propietario) {
      query += ` AND COALESCE(p.nombre, '') ILIKE $${index}`;
      values.push(`%${propietario}%`);
      index++;
    }
    
    if (estado) {
      query += ` AND v.estado = $${index}`;
      values.push(estado);
      index++;
    }

    query += `
      ORDER BY 
        CASE 
          WHEN v.estado = 'activo' THEN 0
          ELSE 1
        END,
        v.placa ASC
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("ERROR VEHICULOS:", error);
    res.status(500).json({ 
      error: "Error obteniendo vehículos",
      detalle: error.message
    });
  }
};

// =====================
// CREAR VEHICULO
// =====================
const crearVehiculo = async (req, res) => {
  try {
    const {
      placa,
      propietario, // ?? ahora es IDENTIFICACION
      vencimiento_soat,
      vencimiento_tecno,
      vencimiento_todo_riesgo,
      estado
    } = req.body;

    if (!placa) {
      return res.status(400).json({
        error: "La placa es obligatoria"
      });
    }

    if (!propietario) {
      return res.status(400).json({
        error: "Debe seleccionar un propietario"
      });
    }

    // VALIDAR DUPLICADO
    const existe = await pool.query(
      "SELECT placa FROM vehiculo WHERE placa = $1",
      [placa]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        error: "El vehículo ya existe"
      });
    }

    // VALIDAR QUE EL PROPIETARIO EXISTA
    const propietarioExiste = await pool.query(
      "SELECT identificacion FROM propietario WHERE identificacion = $1",
      [propietario]
    );

    if (propietarioExiste.rows.length === 0) {
      return res.status(400).json({
        error: "El propietario seleccionado no existe"
      });
    }

    // INSERT DIRECTO CON FK REAL
    const insertQuery = `
      INSERT INTO vehiculo (
        placa,
        id_propietario,
        estado,
        vencimiento_soat,
        vencimiento_tecno,
        vencimiento_todo_riesgo
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      placa.toUpperCase(),
      propietario,
      estado || "activo",
      vencimiento_soat || null,
      vencimiento_tecno || null,
      vencimiento_todo_riesgo || null
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("ERROR CREANDO VEHICULO:", error);
    res.status(500).json({
      error: "Error creando vehículo",
      detalle: error.message
    });
  }
};


// =====================
// ALERTAS VEHICULOS (SOLO ACTIVOS)
// =====================
const getAlertasVehiculos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.placa,
        COALESCE(p.nombre, '-') AS propietario,
        v.vencimiento_soat,
        v.vencimiento_tecno,
        v.vencimiento_todo_riesgo
      FROM vehiculo v
      LEFT JOIN propietario p 
        ON v.id_propietario = p.identificacion
      WHERE v.estado = 'activo'
    `);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + 30);
    limite.setHours(23, 59, 59, 999);

    let alertas = [];

    result.rows.forEach(v => {

      const revisar = (fecha, tipo) => {
        if (!fecha) return;

        const f = new Date(fecha);
        f.setHours(0, 0, 0, 0);

        if (f < hoy) {
          alertas.push({
            placa: v.placa,
            propietario: v.propietario,
            tipo,
            estado: "vencido",
            fecha
          });
        } else if (f >= hoy && f <= limite) {
          alertas.push({
            placa: v.placa,
            propietario: v.propietario,
            tipo,
            estado: "proximo",
            fecha
          });
        }
      };

      revisar(v.vencimiento_soat, "SOAT");
      revisar(v.vencimiento_tecno, "Tecnomecánica");
      revisar(v.vencimiento_todo_riesgo, "Todo Riesgo");
    });

    res.json(alertas);

  } catch (error) {
    console.error("Error alertas:", error);
    res.status(500).json({ error: "Error obteniendo alertas" });
  }
};


// =====================
// FILTRO RAPIDO (SOLO ACTIVOS)
// =====================
const getVehiculosPorEstadoAlerta = async (req, res) => {
  try {
    const { tipo } = req.query;

    const result = await pool.query(`
      SELECT 
        v.placa,
        COALESCE(p.nombre, '-') AS propietario,
        v.vencimiento_todo_riesgo,
        v.vencimiento_soat,
        v.vencimiento_tecno,
        v.estado
      FROM vehiculo v
      LEFT JOIN propietario p 
        ON v.id_propietario = p.identificacion
      WHERE v.estado = 'activo'
    `);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + 30);
    limite.setHours(23, 59, 59, 999);

    const filtrados = result.rows.filter(v => {

      const fechas = [
        v.vencimiento_soat,
        v.vencimiento_tecno,
        v.vencimiento_todo_riesgo
      ].filter(f => f);

      return fechas.some(f => {
        const fecha = new Date(f);
        fecha.setHours(0, 0, 0, 0);

        if (tipo === "vencido") {
          return fecha < hoy;
        }

        if (tipo === "proximo") {
          return fecha >= hoy && fecha <= limite;
        }

        return false;
      });
    });

    res.json(filtrados);

  } catch (error) {
    console.error("Error filtro alerta:", error);
    res.status(500).json({ error: "Error filtrando vehículos" });
  }
};


// =====================
// ACTUALIZAR VEHICULO
// =====================
const actualizarVehiculo = async (req, res) => {
  try {
    const { placa } = req.params;
    const {
      propietario,
      vencimiento_soat,
      vencimiento_tecno,
      vencimiento_todo_riesgo,
      estado
    } = req.body;

    if (!propietario) {
      return res.status(400).json({
        error: "Debe seleccionar un propietario"
      });
    }

    // VALIDAR QUE EL PROPIETARIO EXISTA
    const propietarioExiste = await pool.query(
      "SELECT identificacion FROM propietario WHERE identificacion = $1",
      [propietario]
    );

    if (propietarioExiste.rows.length === 0) {
      return res.status(400).json({
        error: "El propietario seleccionado no existe"
      });
    }

    await pool.query(`
      UPDATE vehiculo SET
        id_propietario = $1,
        vencimiento_soat = $2,
        vencimiento_tecno = $3,
        vencimiento_todo_riesgo = $4,
        estado = $5
      WHERE placa = $6
    `, [
      propietario,
      vencimiento_soat || null,
      vencimiento_tecno || null,
      vencimiento_todo_riesgo || null,
      estado || "activo",
      placa
    ]);

    res.json({ ok: true });

  } catch (error) {
    console.error("Error update:", error);
    res.status(500).json({ error: "Error actualizando vehículo" });
  }
};

// =====================
module.exports = {
  getVehiculos,
  crearVehiculo,
  getAlertasVehiculos,
  getVehiculosPorEstadoAlerta,
  actualizarVehiculo
};