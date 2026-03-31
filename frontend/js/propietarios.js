let editandoPropietario = false;

// =========================
// INIT
// =========================
function initPropietarios() {
  
  cargarPropietarios();
  initFormPropietario();

  // ?? listeners dinámicos
  document.getElementById("filtroNombre")
    .addEventListener("input", aplicarFiltrosPropietarios);

  document.getElementById("filtroIdentificacion")
    .addEventListener("input", aplicarFiltrosPropietarios);
}

// =========================
// CARGAR
// =========================
async function cargarPropietarios() {
  const tabla = document.getElementById("propietariosTable");

  const data = await apiFetch("/api/propietarios");

  renderTablaPropietarios(data);
}

// =========================
// RENDER
// =========================
function renderTablaPropietarios(data) {
  const tabla = document.getElementById("propietariosTable");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5">Sin resultados</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(p => `
    <tr 
      data-id="${p.identificacion}"
      data-nombre="${p.nombre}"
      data-correo="${p.correo || ""}"
      data-telefono="${p.telefono || ""}"
    >
      <td>${p.identificacion}</td>
      <td>${p.nombre}</td>
      <td>${p.correo || "-"}</td>
      <td>${p.telefono || "-"}</td>
      <td>
        <button class="btn-icon" onclick="editarPropietario(this, '${p.identificacion}')">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// =========================
// FILTROS
// =========================
async function filtrarPropietarios() {
  const nombre = document.getElementById("filtroNombre").value.trim();
  const identificacion = document.getElementById("filtroIdentificacion").value.trim();

  let params = [];

  if (nombre) params.push(`nombre=${encodeURIComponent(nombre)}`);
  if (identificacion) params.push(`identificacion=${encodeURIComponent(identificacion)}`);

  const url = `/api/propietarios${params.length ? "?" + params.join("&") : ""}`;

  const data = await apiFetch(url);

  renderTablaPropietarios(data);
}

function limpiarFiltrosProp() {
  document.getElementById("filtroNombre").value = "";
  document.getElementById("filtroIdentificacion").value = "";

  // ?? recargar sin filtros
  cargarPropietarios();
}

let debounceTimerProp;

function aplicarFiltrosPropietarios() {
  clearTimeout(debounceTimerProp);

  debounceTimerProp = setTimeout(() => {
    filtrarPropietarios();
  }, 300);
}

// =========================
// FORM
// =========================
function initFormPropietario() {
  const form = document.getElementById("formPropietario");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      identificacion: document.getElementById("identificacion").value,
      nombre: document.getElementById("nombre").value,
      correo: document.getElementById("correo").value,
      telefono: document.getElementById("telefono").value
    };

    try {
      const res = await apiFetch("/api/propietarios", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res) {
        showToast("Error creando propietario", "error");
        return;
      }

      showToast("? Propietario creado correctamente", "success");

      cerrarModalPropietario();
      form.reset();
      cargarPropietarios();

    } catch (error) {
      console.error("Error creando propietario:", error);
      showToast("Error inesperado al crear propietario", "error");
    }
  });
}

// =========================
// MODAL
// =========================
function abrirModalPropietario() {
  document.getElementById("modalPropietario").classList.remove("hidden");
}

function cerrarModalPropietario() {
  document.getElementById("modalPropietario").classList.add("hidden");
}


// =========================
// EDITAR PROPIETARIO INLINE
// =========================
function editarPropietario(btn, id) {

  if (editandoPropietario) {
    alert("Termina de editar la fila actual primero");
    return;
  }

  editandoPropietario = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  // inputs
  celdas[1].innerHTML = `<input value="${data.nombre}">`;
  celdas[2].innerHTML = `<input value="${data.correo}">`;
  celdas[3].innerHTML = `<input value="${data.telefono}">`;

  // botón guardar
  celdas[4].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarPropietario(this, '${id}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  // bloquear otros botones
  const btnGuardar = celdas[4].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// =========================
// GUARDAR PROPIETARIO
// =========================
async function guardarPropietario(btn, id) {
  const fila = btn.closest("tr");
  const inputs = fila.querySelectorAll("input");

  const data = {
    nombre: inputs[0].value,
    correo: inputs[1].value,
    telefono: inputs[2].value
  };

  try {
    const res = await apiFetch(`/api/propietarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    if (!res) {
      showToast("Error actualizando propietario", "error");
      return;
    }

    showToast("?? Propietario actualizado correctamente", "success");

    editandoPropietario = false;

    document.querySelectorAll(".btn-icon").forEach(b => {
      b.disabled = false;
    });

    cargarPropietarios();

  } catch (error) {
    console.error("Error actualizando propietario:", error);
    showToast("Error inesperado al actualizar", "error");
  }
}