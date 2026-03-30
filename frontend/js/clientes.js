let editandoCliente = false;

// ================= INIT
function initClientes() {
  cargarClientes();
  initFormCliente();

  document.getElementById("filtroNit")
    .addEventListener("input", aplicarFiltrosClientes);

  document.getElementById("filtroNombre")
    .addEventListener("input", aplicarFiltrosClientes);

  document.getElementById("filtroEstado")
    .addEventListener("change", aplicarFiltrosClientes);
}

// ================= CARGAR
async function cargarClientes() {
  const data = await apiFetch("/api/clientes");
  renderTablaClientes(data);
}

// ================= RENDER
function renderTablaClientes(data) {
  const tabla = document.getElementById("clientesTable");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">Sin datos</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(c => `
    <tr 
      data-nit="${c.nit}"
      data-nombre="${c.nombre}"
      data-correo="${c.correo || ""}"
      data-telefono="${c.telefono || ""}"
      data-direccion="${c.direccion || ""}"
      data-estado="${c.estado}"
    >
      <td>${c.nit}</td>
      <td>${c.nombre}</td>
      <td>${c.correo || "-"}</td>
      <td>${c.telefono || "-"}</td>
      <td>${c.direccion || "-"}</td>
      <td>${renderEstadoBadge(c.estado)}</td>
      <td>
        <button class="btn-icon" onclick="editarCliente(this, '${c.nit}')">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// ================= FILTROS
async function filtrarClientes() {
  const nit = document.getElementById("filtroNit").value.trim();
  const nombre = document.getElementById("filtroNombre").value.trim();
  const estado = document.getElementById("filtroEstado").value;

  let params = [];

  if (nit) params.push(`nit=${encodeURIComponent(nit)}`);
  if (nombre) params.push(`nombre=${encodeURIComponent(nombre)}`);
  if (estado) params.push(`estado=${estado}`);

  const url = `/api/clientes${params.length ? "?" + params.join("&") : ""}`;

  const data = await apiFetch(url);
  renderTablaClientes(data);
}

function limpiarFiltrosClientes() {
  document.getElementById("filtroNit").value = "";
  document.getElementById("filtroNombre").value = "";
  document.getElementById("filtroEstado").value = "";

  cargarClientes();
}

// ================= FORM
function initFormCliente() {
  const form = document.getElementById("formCliente");

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

    const res = await apiFetch("/api/clientes", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res) return;

    showToast("Cliente creado correctamente", "success");

    cerrarModalCliente();
    form.reset();
    cargarClientes();
  });
}

// ================= EDITAR
function editarCliente(btn, nit) {

  if (editandoCliente) {
    showToast("Termina de editar primero", "info");
    return;
  }

  editandoCliente = true;

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
    <button class="btn-icon btn-save" onclick="guardarCliente(this, '${nit}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[6].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// ================= GUARDAR
async function guardarCliente(btn, nit) {
  const fila = btn.closest("tr");
  const inputs = fila.querySelectorAll("input, select");

  const data = {
    nombre: inputs[0].value,
    correo: inputs[1].value,
    telefono: inputs[2].value,
    direccion: inputs[3].value,
    estado: inputs[4].value
  };

  const res = await apiFetch(`/api/clientes/${nit}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  if (!res) return;

  showToast("Cliente actualizado", "success");

  editandoCliente = false;

  document.querySelectorAll(".btn-icon").forEach(b => b.disabled = false);

  cargarClientes();
}

// ================= MODAL
function abrirModalCliente() {
  document.getElementById("modalCliente").classList.remove("hidden");
}

function cerrarModalCliente() {
  document.getElementById("modalCliente").classList.add("hidden");
}

// ================= DEBOUNCE
let debounceTimerClientes;

function aplicarFiltrosClientes() {
  clearTimeout(debounceTimerClientes);

  debounceTimerClientes = setTimeout(() => {
    filtrarClientes();
  }, 300);
}