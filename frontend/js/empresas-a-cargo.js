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
  try {
    const data = await apiFetch("/api/empresas-a-cargo");

    if (!data) {
      renderTablaEmpresas([]);
      return;
    }

    // ?? GUARDAR DATA GLOBAL (para validar duplicados)
    window.empresasData = data;

    renderTablaEmpresas(data);

  } catch (error) {
    console.error("Error cargando empresas:", error);
    renderTablaEmpresas([]);
  }
}

// ================= RENDER
function renderTablaEmpresas(data) {
  const tabla = document.getElementById("empresasTable");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">Sin datos</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(e => {

    const estado = (e.estado || "").toLowerCase().trim();

    return `
      <tr 
        data-nit="${e.nit}"
        data-nombre="${e.nombre}"
        data-correo="${e.correo || ""}"
        data-telefono="${e.telefono || ""}"
        data-direccion="${e.direccion || ""}"
        data-estado="${estado}"
      >
        <td>${e.nit}</td>
        <td>${e.nombre}</td>
        <td>${e.correo || "-"}</td>
        <td>${e.telefono || "-"}</td>
        <td>${e.direccion || "-"}</td>
        <td>
          <span class="estado-badge ${estado}">
            ${estado === "activo" ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td>
          <button class="btn-icon" onclick="editarEmpresa(this, '${e.nit}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
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
  if (!form) return;

  const inputNit = document.getElementById("nit");
  const inputNombre = document.getElementById("nombre");
  const inputCorreo = document.getElementById("correo");
  const inputTelefono = document.getElementById("telefono");
  const selectDireccion = document.getElementById("direccion");

  // =========================
  // ?? CARGAR DIRECCIONES (ARREGLO)
  // =========================
  const ubicaciones = [
    { dep: "Antioquia", ciudad: "Medellín" },
    { dep: "Antioquia", ciudad: "Bello" },
    { dep: "Cundinamarca", ciudad: "Bogotá" },
    { dep: "Cundinamarca", ciudad: "Soacha" },
    { dep: "Valle del Cauca", ciudad: "Cali" },
    { dep: "Valle del Cauca", ciudad: "Palmira" },
    { dep: "Atlántico", ciudad: "Barranquilla" },
    { dep: "Santander", ciudad: "Bucaramanga" }
  ];

  function cargarDirecciones() {
    if (!selectDireccion) return;

    selectDireccion.innerHTML = `<option value="">Seleccione</option>`;

    ubicaciones.forEach(u => {
      const option = document.createElement("option");
      option.value = u.ciudad;
      option.textContent = `${u.ciudad} (${u.dep})`;
      selectDireccion.appendChild(option);
    });
  }

  cargarDirecciones();

  // =========================
  // HELPERS
  // =========================
  const marcarError = (el) => el.classList.add("error");
  const limpiarError = (el) => el.classList.remove("error");

  // =========================
  // VALIDACIONES
  // =========================

  inputNit.addEventListener("input", () => {
    inputNit.value = inputNit.value.replace(/\D/g, "");
    inputNit.value ? limpiarError(inputNit) : marcarError(inputNit);
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

  selectDireccion.addEventListener("change", () => {
    selectDireccion.value ? limpiarError(selectDireccion) : marcarError(selectDireccion);
  });

  // =========================
  // VALIDAR DUPLICADOS
  // =========================

  function existeEmpresa(nit, nombre) {
    if (!window.empresasData) return false;

    return window.empresasData.some(e =>
      e.nit === nit ||
      e.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    );
  }

  // =========================
  // SUBMIT
  // =========================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nit = inputNit.value.trim();
    const nombre = inputNombre.value.trim();
    const correo = inputCorreo.value.trim();
    const telefono = inputTelefono.value.trim();
    const direccion = selectDireccion.value;
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
      marcarError(selectDireccion);
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

    // ?? DUPLICADOS
    if (existeEmpresa(nit, nombre)) {
      marcarError(inputNit);
      marcarError(inputNombre);
      showToast("La empresa ya existe (NIT o Nombre)", "error");
      return;
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
      const res = await apiFetch("/api/empresas-a-cargo", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res) {
        showToast("Error creando empresa", "error");
        return;
      }

      showToast("Empresa creada correctamente", "success");

      cerrarModalEmpresa();
      form.reset();
      cargarEmpresas();

    } catch (error) {
      console.error(error);
      showToast("Error inesperado", "error");
    }
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