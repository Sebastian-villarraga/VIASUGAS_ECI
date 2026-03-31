// =========================
// INIT (SPA)
// =========================
function initVehiculos() {
  console.log("INIT VEHICULOS");

  const intentarInit = () => {
    const tabla = document.getElementById("vehiculosTable");

    // ?? si aún no existe el DOM, reintenta
    if (!tabla) {
      console.warn("? Esperando render de vista vehiculos...");
      setTimeout(intentarInit, 50);
      return;
    }

    console.log("? Vista vehiculos renderizada");

    cargarVehiculos();
    cargarAlertasVehiculos();
    initFormVehiculo();
  };

  intentarInit();
}
// =========================
// CONTROL EDICIÓN
// =========================
let editando = false;

// =========================
// CARGAR VEHICULOS
// =========================
async function cargarVehiculos() {
  const data = await apiFetch("/api/vehiculos");
  renderTabla(data);
}

// =========================
// FILTRAR
// =========================
async function filtrarVehiculos() {
  const placa = document.getElementById("filtroPlaca").value.trim();
  const propietario = document.getElementById("filtroPropietario").value.trim();
  const estado = document.getElementById("filtroEstado").value;

  let params = [];

  if (placa) params.push(`placa=${encodeURIComponent(placa)}`);
  if (propietario) params.push(`propietario=${encodeURIComponent(propietario)}`);
  if (estado) params.push(`estado=${estado}`);

  const url = `/api/vehiculos${params.length ? "?" + params.join("&") : ""}`;

  const data = await apiFetch(url);

  renderTabla(data);
}

// =========================
// LIMPIAR
// =========================
function limpiarFiltrosVehiculos() {
  document.getElementById("filtroPlaca").value = "";
  document.getElementById("filtroPropietario").value = "";
  document.getElementById("filtroEstado").value = "";

  // ?? recargar sin filtros (igual que propietarios)
  cargarVehiculos();
}

let debounceTimerVehiculos;

function aplicarFiltrosVehiculos() {
  clearTimeout(debounceTimerVehiculos);

  debounceTimerVehiculos = setTimeout(() => {
    filtrarVehiculos();
  }, 300);
}
// =========================
// RENDER TABLA (FIX CLAVE)
// =========================
function renderTabla(data) {
  const tabla = document.getElementById("vehiculosTable");

  console.log("VERSION NUEVA VEHICULOS");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">No hay resultados</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(v => {

    const todo = v.vencimiento_todo_riesgo || "";
    const soat = v.vencimiento_soat || "";
    const tecno = v.vencimiento_tecno || "";

    return `
      <tr 
        data-placa="${v.placa}"
        data-propietario="${v.propietario || ""}"
        data-todo="${todo}"
        data-soat="${soat}"
        data-tecno="${tecno}"
        data-estado="${v.estado}"
      >
        <td>${v.placa}</td>
        <td>${v.propietario || "-"}</td>

        <td>${todo ? formatearFecha(todo) : "-"}</td>
        <td>${soat ? formatearFecha(soat) : "-"}</td>
        <td>${tecno ? formatearFecha(tecno) : "-"}</td>

        <td>${renderEstadoBadge(v.estado)}</td>

        <td class="acciones">
          <button class="btn-icon editar" onclick="editarVehiculo(this, '${v.placa}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// =========================
// EDITAR
// =========================
function editarVehiculo(btn, placa) {

  if (editando) {
    alert("Termina de editar primero");
    return;
  }

  editando = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  celdas[1].innerHTML = `<input value="${data.propietario}">`;

  celdas[2].innerHTML = `<input type="date" value="${formatFechaInput(data.todo)}">`;
  celdas[3].innerHTML = `<input type="date" value="${formatFechaInput(data.soat)}">`;
  celdas[4].innerHTML = `<input type="date" value="${formatFechaInput(data.tecno)}">`;

  celdas[5].innerHTML = `
    <select>
      <option value="activo" ${data.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${data.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  celdas[6].innerHTML = `
    <button class="btn-icon guardar" onclick="guardarEdicion(this, '${placa}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[6].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// =========================
// GUARDAR
// =========================
async function guardarEdicion(btn, placa) {
  const fila = btn.closest("tr");
  const inputs = fila.querySelectorAll("input, select");

  const data = {
    propietario: inputs[0].value,
    vencimiento_todo_riesgo: inputs[1].value,
    vencimiento_soat: inputs[2].value,
    vencimiento_tecno: inputs[3].value,
    estado: inputs[4].value
  };

  await apiFetch(`/api/vehiculos/${placa}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  editando = false;

  document.querySelectorAll(".btn-icon").forEach(b => {
    b.disabled = false;
  });

  cargarVehiculos();
}

// =========================
// FORMATO FECHA (DISPLAY)
// =========================
function formatearFecha(fecha) {
  if (!fecha) return "-";

  const clean = fecha.split("T")[0];
  const [year, month, day] = clean.split("-");

  return `${day}/${month}/${year}`;
}

// =========================
// FORMATO INPUT (CLAVE)
// =========================
function formatFechaInput(fecha) {
  if (!fecha) return "";

  return fecha.split("T")[0];
}

// =========================
// BADGE ESTADO (IGUAL CONDUCTORES)
// =========================
function renderEstadoBadge(estado) {
  const clase = estado === "activo" ? "badge-activo" : "badge-inactivo";
  const texto = estado === "activo" ? "Activo" : "Inactivo";
  return `<span class="${clase}">${texto}</span>`;
}

// =========================
// ALERTAS
// =========================
async function cargarAlertasVehiculos() {
  try {
    const data = await apiFetch("/api/vehiculos/alertas");

    window._alertasVehiculos = data || [];

    renderAlertas(window._alertasVehiculos);

  } catch (error) {
    console.error("ERROR ALERTAS VEHICULOS:", error);
  }
}

// =========================
// FILTROS RAPIDOS
// =========================
function filtrarVehiculosVencidos() {
  activarBoton("vencido");

  const data = window._alertasVehiculos || [];

  const filtrados = data.filter(a => a.estado === "vencido");

  renderAlertas(filtrados);

  const placas = [...new Set(filtrados.map(a => a.placa))];

  filtrarTablaPorPlacas(placas);
}

function filtrarVehiculosProximos() {
  activarBoton("proximo");

  const data = window._alertasVehiculos || [];

  const filtrados = data.filter(a => a.estado === "proximo");

  renderAlertas(filtrados);

  const placas = [...new Set(filtrados.map(a => a.placa))];

  filtrarTablaPorPlacas(placas);
}

function activarBoton(tipo) {
  const btnV = document.getElementById("btnVencidos");
  const btnP = document.getElementById("btnProximos");

  if (!btnV || !btnP) return;

  btnV.classList.remove("activo");
  btnP.classList.remove("activo");

  if (tipo === "vencido") {
    btnV.classList.add("activo");
  } else if (tipo === "proximo") {
    btnP.classList.add("activo");
  }
}





function filtrarTablaPorPlacas(placas) {
  const filas = document.querySelectorAll("#vehiculosTable tr");

  filas.forEach(fila => {
    const placa = fila.dataset?.placa;

    if (!placa) return;

    if (placas.includes(placa)) {
      fila.style.display = "";
    } else {
      fila.style.display = "none";
    }
  });
}


// =========================
// RENDER ALERTAS
// =========================
function renderAlertas(data) {
  const lista = document.getElementById("alertasList");
  const btnV = document.getElementById("btnVencidos");
  const btnP = document.getElementById("btnProximos");

  if (!lista) return;

  if (!data || data.length === 0) {
    lista.innerHTML = `<li class="sin-alertas">Sin alertas</li>`;

    if (btnV) btnV.textContent = "0 vencidos";
    if (btnP) btnP.textContent = "0 por vencer";

    return;
  }

  const all = window._alertasVehiculos || [];

  const vencidos = all.filter(a => a.estado === "vencido").length;
  const proximos = all.filter(a => a.estado === "proximo").length;

  if (btnV) btnV.textContent = `${vencidos} vencidos`;
  if (btnP) btnP.textContent = `${proximos} por vencer`;

  lista.innerHTML = data.map(a => {

    const clase = a.estado === "vencido"
      ? "alerta-item alerta-vencido"
      : "alerta-item alerta-proximo";

    return `
      <li class="${clase}">
        <div class="alerta-titulo">
          <strong>${a.propietario || "Sin nombre"} - ${a.placa}</strong>
        </div>
        <div>${a.tipo || "-"}</div>
        <div class="alerta-fecha">${a.fecha ? formatearFecha(a.fecha) : "-"}</div>
      </li>
    `;
  }).join("");
}
// =========================
// FORM
// =========================
function initFormVehiculo() {
  const form = document.getElementById("formVehiculo");

  if (!form) {
    console.warn("formVehiculo no existe aún (SPA timing)");
    return;
  }

  form.removeEventListener("submit", form._handlerVehiculo);

  const handler = async (e) => {
    e.preventDefault();

    const placa = document.getElementById("placa")?.value.trim();
    const propietario = document.getElementById("propietario")?.value.trim();
    const soat = document.getElementById("soat")?.value;
    const tecno = document.getElementById("tecno")?.value;
    const todoRiesgo = document.getElementById("todoRiesgo")?.value;
    const estado = document.getElementById("estado")?.value;

    if (!placa) {
      alert("La placa es obligatoria");
      return;
    }

    const data = {
      placa,
      propietario,
      vencimiento_soat: soat || null,
      vencimiento_tecno: tecno || null,
      vencimiento_todo_riesgo: todoRiesgo || null,
      estado
    };

    const res = await apiFetch("/api/vehiculos", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res) return;

    cerrarModalVehiculo();
    form.reset();
    cargarVehiculos();
  };

  form._handlerVehiculo = handler;
  form.addEventListener("submit", handler);
}

// =========================
// MODAL
// =========================
function abrirModalVehiculo() {
  const modal = document.getElementById("modalVehiculo");

  if (!modal) {
    console.error("Modal no encontrado");
    return;
  }

  modal.classList.remove("hidden");
}

function cerrarModalVehiculo() {
  const modal = document.getElementById("modalVehiculo");
  if (modal) modal.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  initVehiculos();
});

window.abrirModalVehiculo = abrirModalVehiculo;
window.cerrarModalVehiculo = cerrarModalVehiculo;