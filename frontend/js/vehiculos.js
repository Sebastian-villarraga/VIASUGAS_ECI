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
// CONTROL EDICIÓN
// =========================
let editando = false;

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
    <tr 
      data-placa="${v.placa}"
      data-propietario="${v.propietario || ""}"
      data-todo="${v.vencimiento_todo_riesgo || ""}"
      data-soat="${v.vencimiento_soat || ""}"
      data-tecno="${v.vencimiento_tecno || ""}"
      data-estado="${v.estado}"
    >
      <td>${v.placa}</td>
      <td>${v.propietario || "-"}</td>
      <td>${v.vencimiento_todo_riesgo ? formatearFecha(v.vencimiento_todo_riesgo) : "-"}</td>
      <td>${v.vencimiento_soat ? formatearFecha(v.vencimiento_soat) : "-"}</td>
      <td>${v.vencimiento_tecno ? formatearFecha(v.vencimiento_tecno) : "-"}</td>
      <td>${v.estado}</td>

      <td>
        <button type="button" class="btn-icon" onclick="editarVehiculo(this, '${v.placa}')">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// =========================
// EDITAR TABLA VEHICULO
// =========================
function editarVehiculo(btn, placa) {

  if (editando) {
    alert("Termina de editar la fila actual primero");
    return;
  }

  editando = true;

  const fila = btn.closest("tr");
  const celdas = fila.querySelectorAll("td");

  // ?? obtener datos reales desde atributos
  const data = fila.dataset;

  celdas[0].innerHTML = `<input value="${data.placa}" disabled>`;
  celdas[1].innerHTML = `<input value="${data.propietario || ""}">`;

  celdas[2].innerHTML = `<input type="date" value="${data.todo || ""}">`;
  celdas[3].innerHTML = `<input type="date" value="${data.soat || ""}">`;
  celdas[4].innerHTML = `<input type="date" value="${data.tecno || ""}">`;

  celdas[5].innerHTML = `
    <select>
      <option value="activo" ${data.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${data.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  celdas[6].innerHTML = `
    <button type="button" class="btn-icon btn-save" onclick="guardarEdicion(this, '${placa}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[6].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// =========================
// EDITAR VEHICULO GUARDAR
// =========================
async function guardarEdicion(btn, placa) {
  const fila = btn.closest("tr");
  const inputs = fila.querySelectorAll("input, select");

  const data = {
    propietario: inputs[1].value,
    vencimiento_todo_riesgo: inputs[2].value,
    vencimiento_soat: inputs[3].value,
    vencimiento_tecno: inputs[4].value,
    estado: inputs[5].value
  };

  try {
    await apiFetch(`/api/vehiculos/${placa}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    editando = false;

    document.querySelectorAll(".btn-icon").forEach(b => {
      b.disabled = false;
    });

    cargarVehiculos();

  } catch (error) {
    console.error("Error actualizando:", error);
  }
}

function formatoInputSeguro(fecha) {
  if (!fecha || fecha === "-") return "";

  // convierte DD/MM/YYYY ? YYYY-MM-DD
  const partes = fecha.split("/");
  if (partes.length !== 3) return "";

  const [dia, mes, anio] = partes;

  return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
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
      const clase = a.estado === "vencido"
        ? "alerta-vencido"
        : "alerta-proximo";

      return `
        <li class="alerta-item ${clase}">
          <div class="alerta-titulo">
            <i class="fas fa-circle alerta-icono"></i>
            ${a.tipo} - ${a.placa}
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

// =========================
// FILTROS RAPIDOS
// =========================
async function filtrarVencidos() {
  try {
    const data = await apiFetch("/api/vehiculos/filtro-alertas?tipo=vencido");
    renderTabla(data);
  } catch (error) {
    console.error("Error filtro vencidos:", error);
  }
}

async function filtrarProximos() {
  try {
    const data = await apiFetch("/api/vehiculos/filtro-alertas?tipo=proximo");
    renderTabla(data);
  } catch (error) {
    console.error("Error filtro próximos:", error);
  }
}