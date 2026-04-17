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

  tabla.innerHTML = data.map(c => {

    const estado = (c.estado || "").toLowerCase().trim();

    return `
      <tr 
        data-nit="${c.nit}"
        data-nombre="${c.nombre}"
        data-correo="${c.correo || ""}"
        data-telefono="${c.telefono || ""}"
        data-direccion="${c.direccion || ""}"
        data-estado="${estado}"
      >
        <td>${c.nit}</td>
        <td>${c.nombre}</td>
        <td>${c.correo || "-"}</td>
        <td>${c.telefono || "-"}</td>
        <td>${c.direccion || "-"}</td>
        <td>
          <span class="estado-badge ${estado}">
            ${estado === "activo" ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td>
          <button class="btn-icon" onclick="editarCliente(this, '${c.nit}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
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
  if (!form) return;

  const inputNit = document.getElementById("nit");
  const inputNombre = document.getElementById("nombre");
  const inputCorreo = document.getElementById("correo");
  const inputTelefono = document.getElementById("telefono");
  const inputDireccion = document.getElementById("direccion");

  const marcarError = (el) => el.classList.add("error");
  const limpiarError = (el) => el.classList.remove("error");

  // =========================
  // VALIDACIONES
  // =========================

  // NIT: permitir números, letras, guion, punto y espacios
  inputNit.addEventListener("input", () => {
    inputNit.value = inputNit.value.replace(/[^0-9a-zA-Z\-. ]/g, "");
    inputNit.value.trim() ? limpiarError(inputNit) : marcarError(inputNit);
  });

  inputNombre.addEventListener("input", () => {
    inputNombre.value = inputNombre.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    inputNombre.value.trim() ? limpiarError(inputNombre) : marcarError(inputNombre);
  });

  inputTelefono.addEventListener("input", () => {
    inputTelefono.value = inputTelefono.value.replace(/\D/g, "").slice(0, 10);

    if (!inputTelefono.value || inputTelefono.value.length === 10) {
      limpiarError(inputTelefono);
    } else {
      marcarError(inputTelefono);
    }
  });

  inputCorreo.addEventListener("input", () => {
    const val = inputCorreo.value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!val || regex.test(val)) {
      limpiarError(inputCorreo);
    } else {
      marcarError(inputCorreo);
    }
  });

  inputDireccion.addEventListener("input", () => {
    inputDireccion.value.trim() ? limpiarError(inputDireccion) : marcarError(inputDireccion);
  });

  // =========================
  // SUBMIT
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nit = inputNit.value.trim();
    const nombre = inputNombre.value.trim();
    const correo = inputCorreo.value.trim();
    const telefono = inputTelefono.value.trim();
    const direccion = inputDireccion.value.trim();
    const estado = document.getElementById("estado").value;

    let hayError = false;

    if (!nit) {
      marcarError(inputNit);
      hayError = true;
    }

    if (!nombre) {
      marcarError(inputNombre);
      hayError = true;
    }

    if (!direccion) {
      marcarError(inputDireccion);
      hayError = true;
    }

    if (telefono && telefono.length !== 10) {
      marcarError(inputTelefono);
      hayError = true;
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !regexCorreo.test(correo)) {
      marcarError(inputCorreo);
      hayError = true;
    }

    if (hayError) {
      showToast("Corrige los campos marcados", "warning");
      return;
    }

    const data = {
      nit,
      nombre,
      correo,
      telefono,
      direccion,
      estado
    };

    try {
      const res = await apiFetch("/api/clientes", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res) {
        showToast("Error creando cliente", "error");
        return;
      }

      showToast("Cliente creado correctamente", "success");

      cerrarModalCliente();
      form.reset();
      cargarClientes();

    } catch (error) {
      console.error(error);
      showToast("Error inesperado", "error");
    }
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
