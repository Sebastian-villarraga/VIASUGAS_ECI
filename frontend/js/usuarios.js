let usuarios = [];
let permisosDisponibles = [];

// =========================
// INIT
// =========================
async function initUsuarios() {

  if (!document.querySelector("#us-container")) return;

  await cargarPermisos();
  await cargarUsuarios();
  eventosUsuarios();
}

// =========================
// EVENTOS
// =========================
function eventosUsuarios() {

  const btnGuardar = document.getElementById("us-guardar");

  if (!btnGuardar) return;

  btnGuardar.addEventListener("click", async () => {

    const id = document.getElementById("us-id")?.value.trim();
    const nombre = document.getElementById("us-nombre")?.value.trim();
    const correo = document.getElementById("us-correo")?.value.trim();

    if (!id || !nombre || !correo) {
      alert("Completa todos los campos");
      return;
    }

    const permisos = obtenerPermisosSeleccionados();

    try {
      await apiFetch("/api/usuarios", {
        method: "POST",
        body: JSON.stringify({ id, nombre, correo, permisos })
      });

      limpiarForm();
      await cargarUsuarios();

    } catch (err) {
      console.error("Error creando usuario:", err);
    }
  });
}

// =========================
// CARGAR USUARIOS
// =========================
async function cargarUsuarios() {
  try {
    usuarios = await apiFetch("/api/usuarios");
    renderTabla();
  } catch (err) {
    console.error("Error cargando usuarios:", err);
  }
}

// =========================
// CARGAR PERMISOS
// =========================
async function cargarPermisos() {
  try {
    permisosDisponibles = await apiFetch("/api/permisos");
    renderPermisos();
  } catch (err) {
    console.error("Error cargando permisos:", err);
  }
}

// =========================
// RENDER PERMISOS (checkbox)
// =========================
function renderPermisos(permisosSeleccionados = []) {

  const container = document.getElementById("us-permisos");
  if (!container) return;

  container.innerHTML = "";

  if (!permisosDisponibles.length) {
    container.innerHTML = `<span style="color:#999;">Sin permisos</span>`;
    return;
  }

  let html = "";

  permisosDisponibles.forEach(p => {
    const checked = permisosSeleccionados.includes(p.codigo) ? "checked" : "";

    html += `
      <label class="us-check">
        <input type="checkbox" value="${p.codigo}" ${checked}>
        <span>${p.nombre}</span>
      </label>
    `;
  });

  container.innerHTML = html;
}

// =========================
// OBTENER PERMISOS CHECKED
// =========================
function obtenerPermisosSeleccionados() {
  const container = document.getElementById("us-permisos");
  if (!container) return [];

  const checks = container.querySelectorAll("input[type='checkbox']:checked");

  return Array.from(checks).map(c => c.value);
}

// =========================
// RENDER TABLA
// =========================
function renderTabla() {

  const tbody = document.getElementById("us-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!usuarios.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color:#9ca3af;">
          Sin usuarios
        </td>
      </tr>
    `;
    return;
  }

  let html = "";

  usuarios.forEach(u => {

    const estadoBadge = u.activo
      ? `<span class="us-badge-activo">Activo</span>`
      : `<span class="us-badge-inactivo">Inactivo</span>`;

    html += `
      <tr>
        <td>${u.nombre}</td>
        <td>${u.correo}</td>
        <td>${estadoBadge}</td>
        <td>
          <button 
            class="us-btn-action ${u.activo ? 'us-btn-danger' : 'us-btn-success'}"
            onclick="toggleUsuario('${u.id}')"
          >
            ${u.activo ? "Desactivar" : "Activar"}
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// =========================
// TOGGLE USUARIO
// =========================
async function toggleUsuario(id) {
  try {
    await apiFetch(`/api/usuarios/${id}/toggle`, {
      method: "PATCH"
    });

    await cargarUsuarios();

  } catch (err) {
    console.error("Error toggle:", err);
  }
}

// =========================
// LIMPIAR FORM
// =========================
function limpiarForm() {
  document.getElementById("us-id").value = "";
  document.getElementById("us-nombre").value = "";
  document.getElementById("us-correo").value = "";

  document
    .querySelectorAll("#us-permisos input")
    .forEach(c => c.checked = false);
}