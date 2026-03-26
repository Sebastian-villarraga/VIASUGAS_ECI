// =========================
// INIT (SPA)
// =========================
function initVehiculos() {
  cargarVehiculos();
}

// =========================
// CARGAR VEHICULOS
// =========================
async function cargarVehiculos() {
  try {
    const tabla = document.getElementById("vehiculosTable");
    if (!tabla) return;

    const data = await apiFetch("/api/vehiculos");

    if (!data || data.length === 0) {
      tabla.innerHTML = `<tr><td colspan="7">No hay vehículos</td></tr>`;
      return;
    }

    tabla.innerHTML = data.map(v => `
      <tr>
        <td>${v.placa}</td>
        <td>${v.id_propietario}</td>
        <td>${formatearFecha(v.todo_riesgo)}</td>
        <td>${formatearFecha(v.vencimiento_soat)}</td>
        <td>${formatearFecha(v.vencimiento_tecno)}</td>
        <td>${v.estado}</td>
        <td>
          <button onclick="editarVehiculo('${v.placa}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Error cargando vehículos:", error);

    const tabla = document.getElementById("vehiculosTable");
    if (tabla) {
      tabla.innerHTML = `<tr><td colspan="7">Error cargando datos</td></tr>`;
    }
  }
}

// =========================
// UTILIDADES
// =========================
function formatearFecha(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString();
}