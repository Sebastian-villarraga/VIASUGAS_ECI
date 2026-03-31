const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { Pool } = require("pg");

// =========================================
// CONFIG
// =========================================
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "viasugas",
  password: "1003526827",
  port: 5432,
});

const CSV_PATH = path.join(__dirname, "../database/divipola_municipios.csv");
const LIMPIAR_TABLA_ANTES = true;

// =========================================
// HELPERS
// =========================================
function limpiarValor(valor) {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
}

function tituloLegible(texto) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .split(" ")
    .map(p => p ? p.charAt(0).toUpperCase() + p.slice(1) : p)
    .join(" ")
    .replace(/\bD\.c\.\b/g, "D.C.")
    .replace(/\bY\b/g, "y");
}

// =========================================
// MAIN
// =========================================
async function main() {
  const client = await pool.connect();

  try {
    console.log("Leyendo CSV:", CSV_PATH);

    const csvContent = fs.readFileSync(CSV_PATH, "utf8");

    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: true,
      delimiter: ";",
      trim: true
    });

    console.log(`Filas leídas: ${rows.length}`);

    await client.query("BEGIN");

    if (LIMPIAR_TABLA_ANTES) {
      console.log("Limpiando tabla ubicacion_colombia...");
      await client.query("TRUNCATE TABLE ubicacion_colombia RESTART IDENTITY");
    }

    const insertQuery = `
      INSERT INTO ubicacion_colombia (
        codigo_departamento,
        nombre_departamento,
        codigo_municipio,
        nombre_municipio,
        tipo
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (codigo_municipio) DO UPDATE SET
        codigo_departamento = EXCLUDED.codigo_departamento,
        nombre_departamento = EXCLUDED.nombre_departamento,
        nombre_municipio = EXCLUDED.nombre_municipio,
        tipo = EXCLUDED.tipo
    `;

    let insertados = 0;
    let omitidos = 0;

    for (const row of rows) {
      const codigoDepartamento = limpiarValor(row.CodigoDepartamento).padStart(2, "0");
      const nombreDepartamento = tituloLegible(limpiarValor(row.NombreDepartamento));
      const codigoMunicipio = limpiarValor(row.CodigoMunicipio).padStart(5, "0");
      const nombreMunicipio = tituloLegible(limpiarValor(row.NombreMunicipio));

      if (!codigoDepartamento || !nombreDepartamento || !codigoMunicipio || !nombreMunicipio) {
        omitidos++;
        continue;
      }

      await client.query(insertQuery, [
        codigoDepartamento,
        nombreDepartamento,
        codigoMunicipio,
        nombreMunicipio,
        "Municipio"
      ]);

      insertados++;
    }

    await client.query("COMMIT");

    console.log("Carga completada");
    console.log("Insertados/actualizados:", insertados);
    console.log("Omitidos:", omitidos);

    const total = await client.query("SELECT COUNT(*) FROM ubicacion_colombia");
    console.log("Total final en tabla:", total.rows[0].count);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cargando ubicaciones:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();