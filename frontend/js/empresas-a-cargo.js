let editandoEmpresa = false;

// ================= INIT
function initEmpresas() {
  cargarEmpresas();
  initFormEmpresa();

  document.getElementById("filtroNit")
    .addEventListener("input", aplicarFiltrosEmpresas);

  document.getElementById("filtroNombre")
    .addEventListener("input", aplicarFiltrosEmpresas);

  document.getElementById("filtroEstado")
    .addEventListener("change", aplicarFiltrosEmpresas);
}

// ================= CARGAR
async function cargarEmpresas() {
  const data = await apiFetch("/api/empresas-a-cargo");
  renderTablaEmpresas(data);
}

// ================= RENDER
function renderTablaEmpresas(data) {
  const tabla = document.getElementById("empresasTable");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">Sin datos</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(e => `
    <tr 
      data-nit="${e.nit}"
      data-nombre="${e.nombre}"
      data-correo="${e.correo || ""}"
      data-telefono="${e.telefono || ""}"
      data-direccion="${e.direccion || ""}"
      data-estado="${e.estado}"
    >
      <td>${e.nit}</td>
      <td>${e.nombre}</td>
      <td>${e.correo || "-"}</td>
      <td>${e.telefono || "-"}</td>
      <td>${e.direccion || "-"}</td>
      <td>${renderEstadoBadge(e.estado)}</td>
      <td>
        <button class="btn-icon" onclick="editarEmpresa(this, '${e.nit}')">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// ================= FILTROS
async function filtrarEmpresas() {
  const nit = document.getElementById("filtroNit").value.trim();
  const nombre = document.getElementById("filtroNombre").value.trim();
  const estado = document.getElementById("filtroEstado").value;

  let params = [];

  if (nit) params.push(`nit=${encodeURIComponent(nit)}`);
  if (nombre) params.push(`nombre=${encodeURIComponent(nombre)}`);
  if (estado) params.push(`estado=${estado}`);

  const url = `/api/empresas-a-cargo${params.length ? "?" + params.join("&") : ""}`;

  const data = await apiFetch(url);
  renderTablaEmpresas(data);
}

function limpiarFiltrosEmpresas() {
  document.getElementById("filtroNit").value = "";
  document.getElementById("filtroNombre").value = "";
  document.getElementById("filtroEstado").value = "";

  cargarEmpresas();
}

// ================= FORM
function initFormEmpresa() {
  const form = document.getElementById("formEmpresa");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nit: document.getElementById("nit").value,
      nombre: document.getElementById("nombre").value,
      correo: document.getElementById("correo").value,
      telefono: document.getElementById("telefono").value,
      direccion: document.getElementById("direccion").value,
      estado: document.getElementById("estado").value
    };

    const res = await apiFetch("/api/empresas-a-cargo", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res) return;

    showToast("Empresa creada correctamente", "success");

    cerrarModalEmpresa();
    form.reset();
    cargarEmpresas();
  });
}

// ================= EDITAR
function editarEmpresa(btn, nit) {

  if (editandoEmpresa) {
    showToast("Termina de editar primero", "info");
    return;
  }

  editandoEmpresa = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  celdas[1].innerHTML = `<input value="${data.nombre}">`;
  celdas[2].innerHTML = `<input value="${data.correo}">`;
  celdas[3].innerHTML = `<input value="${data.telefono}">`;
  celdas[4].innerHTML = `<input value="${data.direccion}">`;

  celdas[5].innerHTML = `
    <select>
      <option value="activo" ${data.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${data.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  celdas[6].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarEmpresa(this, '${nit}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[6].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// ================= GUARDAR
async function guardarEmpresa(btn, nit) {
  const fila = btn.closest("tr");
  const inputs = fila.querySelectorAll("input, select");

  const data = {
    nombre: inputs[0].value,
    correo: inputs[1].value,
    telefono: inputs[2].value,
    direccion: inputs[3].value,
    estado: inputs[4].value
  };

  const res = await apiFetch(`/api/empresas-a-cargo/${nit}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  if (!res) return;

  showToast("Empresa actualizada", "success");

  editandoEmpresa = false;

  document.querySelectorAll(".btn-icon").forEach(b => b.disabled = false);

  cargarEmpresas();
}

// ================= MODAL
function abrirModalEmpresa() {
  document.getElementById("modalEmpresa").classList.remove("hidden");
}

function cerrarModalEmpresa() {
  document.getElementById("modalEmpresa").classList.add("hidden");
}

// ================= DEBOUNCE
let debounceTimerEmpresas;

function aplicarFiltrosEmpresas() {
  clearTimeout(debounceTimerEmpresas);

  debounceTimerEmpresas = setTimeout(() => {
    filtrarEmpresas();
  }, 300);
}