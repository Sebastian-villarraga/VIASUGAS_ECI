// =========================
// INIT (SPA)
// =========================
function initVehiculos() {
  console.log("INIT VEHICULOS");

  cargarVehiculos();
  cargarAlertas();
  initFormVehiculo(); 
}

// =========================
// CARGAR VEHICULOS
// =========================
async function cargarVehiculos() {
  try {
    const tabla = document.getElementById("vehiculosTable");
    if (!tabla) {
      console.warn("No existe #vehiculosTable");
      return;
    }

    const data = await apiFetch("/api/vehiculos");

    console.log("DATA VEHICULOS:", data);

    renderTabla(data);

  } catch (error) {
    console.error("Error cargando vehículos:", error);

    const tabla = document.getElementById("vehiculosTable");
    if (tabla) {
      tabla.innerHTML = `
        <tr>
          <td colspan="7">Error cargando datos</td>
        </tr>
      `;
    }
  }
}

// =========================
// FILTRAR VEHICULOS
// =========================
async function filtrarVehiculos() {
  try {
    const placa = document.getElementById("filtroPlaca").value.trim();
    const propietario = document.getElementById("filtroPropietario").value.trim();
    const estado = document.getElementById("filtroEstado").value;

    let params = [];

    if (placa) params.push(`placa=${encodeURIComponent(placa)}`);
    if (propietario) params.push(`propietario=${encodeURIComponent(propietario)}`);
    if (estado) params.push(`estado=${encodeURIComponent(estado)}`);

    const url = `/api/vehiculos${params.length ? "?" + params.join("&") : ""}`;

    console.log("URL FILTRO:", url);

    const data = await apiFetch(url);

    renderTabla(data);

  } catch (error) {
    console.error("Error filtrando vehículos:", error);
  }
}

// =========================
// LIMPIAR FILTROS
// =========================
function limpiarFiltros() {
  document.getElementById("filtroPlaca").value = "";
  document.getElementById("filtroPropietario").value = "";
  document.getElementById("filtroEstado").value = "";

  cargarVehiculos();
}

// =========================
// RENDER TABLA
// =========================
function renderTabla(data) {
  const tabla = document.getElementById("vehiculosTable");

  if (!tabla) return;

  if (!data || data.length === 0) {
    tabla.innerHTML = `
      <tr>
        <td colspan="7">No hay resultados</td>
      </tr>
    `;
    return;
  }

  tabla.innerHTML = data.map(v => `
    <tr>
      <td>${v.placa}</td>
      <td>${v.propietario || "-"}</td>
      <td>${formatearFecha(v.vencimiento_todo_riesgo)}</td>
      <td>${formatearFecha(v.vencimiento_soat)}</td>
      <td>${formatearFecha(v.vencimiento_tecno)}</td>
      <td>${v.estado}</td>
      <td>
        <button class="btn-icon" onclick="editarVehiculo('${v.placa}')">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// =========================
// EDITAR VEHICULO
// =========================
function editarVehiculo(placa) {
  console.log("Editar vehículo:", placa);
}

// =========================
// FORM 
// =========================
function initFormVehiculo() {
  const form = document.getElementById("formVehiculo");

  if (!form) {
    console.warn("No existe formVehiculo");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      placa: document.getElementById("placa").value,
      propietario: document.getElementById("propietario").value,
      vencimiento_soat: document.getElementById("soat").value,
      vencimiento_tecno: document.getElementById("tecno").value,
      vencimiento_todo_riesgo: document.getElementById("todoRiesgo").value,
      estado: document.getElementById("estado").value
    };

    console.log("ENVIANDO:", data);

    try {
      await apiFetch("/api/vehiculos", {
        method: "POST",
        body: JSON.stringify(data)
      });

      console.log("Vehículo creado");

      cerrarModalVehiculo();
      form.reset();

      await cargarVehiculos(); // ?? refresca tabla

    } catch (error) {
      console.error("Error creando vehículo:", error);
      alert("Error al crear vehículo");
    }
  });
}

// =========================
// UTILIDADES
// =========================
function formatearFecha(fecha) {
  if (!fecha) return "-";

  try {
    return new Date(fecha).toLocaleDateString();
  } catch {
    return fecha;
  }
}

// =========================
// MODAL
// =========================
function abrirModalVehiculo() {
  document.getElementById("modalVehiculo").classList.remove("hidden");
}

function cerrarModalVehiculo() {
  document.getElementById("modalVehiculo").classList.add("hidden");
}

// =========================
// CARGAR ALERTAS
// =========================
async function cargarAlertas() {
  try {
    const lista = document.getElementById("alertasList");

    const data = await apiFetch("/api/vehiculos/alertas");

    if (!data || data.length === 0) {
      lista.innerHTML = "<li>Sin alertas</li>";
      return;
    }

    lista.innerHTML = data.map(a => {
      const clase = a.estado === "vencido" ? "alerta-vencido" : "alerta-proximo";
      const icono = a.estado === "vencido"
  ? '<i class="fas fa-circle" style="color:#e53935;"></i>'
  : '<i class="fas fa-circle" style="color:#fbc02d;"></i>';

      return `
        <li class="alerta-item ${clase}">
          <div class="alerta-titulo">
            ${icono} ${a.tipo} - ${a.placa}
          </div>
          <div class="alerta-fecha">
            ${formatearFecha(a.fecha)}
          </div>
        </li>
      `;
    }).join("");

  } catch (error) {
    console.error("Error alertas:", error);
  }
}