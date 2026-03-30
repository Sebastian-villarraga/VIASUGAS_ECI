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
function limpiarFiltros() {
  document.getElementById("filtroPlaca").value = "";
  document.getElementById("filtroPropietario").value = "";
  document.getElementById("filtroEstado").value = "";

  cargarVehiculos();
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

    // ?? NORMALIZAR FECHAS
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

function renderEstadoBadge(estado) {
  const clase = estado === "activo" ? "badge-activo" : "badge-inactivo";
  return `<span class="${clase}">${estado}</span>`;
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

  celdas[2].innerHTML = `<input type="date" value="${data.todo}">`;
  celdas[3].innerHTML = `<input type="date" value="${data.soat}">`;
  celdas[4].innerHTML = `<input type="date" value="${data.tecno}">`;

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
  return `<span class="${clase}">${estado}</span>`;
}

// =========================
// ALERTAS
// =========================
async function cargarAlertas() {
  const lista = document.getElementById("alertasList");

  const data = await apiFetch("/api/vehiculos/alertas");

  if (!data || data.length === 0) {
    lista.innerHTML = "<li>Sin alertas</li>";
    return;
  }

  lista.innerHTML = data.map(a => `
    <li>
      ${a.tipo} - ${a.placa} <br>
      ${formatearFecha(a.fecha)}
    </li>
  `).join("");
}

// =========================
// FILTROS RAPIDOS
// =========================
async function filtrarVencidos() {
  const data = await apiFetch("/api/vehiculos/filtro-alertas?tipo=vencido");
  renderTabla(data);
}

async function filtrarProximos() {
  const data = await apiFetch("/api/vehiculos/filtro-alertas?tipo=proximo");
  renderTabla(data);
}

// =========================
// FORM
// =========================
function initFormVehiculo() {
  const form = document.getElementById("formVehiculo");

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

    await apiFetch("/api/vehiculos", {
      method: "POST",
      body: JSON.stringify(data)
    });

    cerrarModalVehiculo();
    form.reset();
    cargarVehiculos();
  });
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