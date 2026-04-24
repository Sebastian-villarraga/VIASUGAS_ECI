let usuarios = [];
let permisosDisponibles = [];
let usuarioEditando = null;
let usuarioResetId = null;

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
  const inputCedula = document.getElementById("us-id");
  const inputNombre = document.getElementById("us-nombre");

  if (!btnGuardar) return;

  // ? SOLO NUMEROS (CEDULA)
  if (inputCedula) {
    inputCedula.addEventListener("input", () => {
      inputCedula.value = inputCedula.value.replace(/\D/g, "");
    });
  }

  // ? SOLO LETRAS (NOMBRE)
  if (inputNombre) {
    inputNombre.addEventListener("input", () => {
      inputNombre.value = inputNombre.value.replace(/[^a-zA-Z·ÈÌÛ˙¡…Õ”⁄Ò—\s]/g, "");
    });
  }

  btnGuardar.addEventListener("click", async () => {

    const id = document.getElementById("us-id")?.value.trim();
    const nombre = document.getElementById("us-nombre")?.value.trim();
    const correo = document.getElementById("us-correo")?.value.trim();

    // =========================
    // VALIDACIONES
    // =========================
    if (!id || !nombre || !correo) {
      showToast("Todos los campos son obligatorios", "error");
      return;
    }

    if (!/^\d+$/.test(id)) {
      showToast("La c√©dula debe contener solo n√∫meros", "error");
      return;
    }

    if (!/^[a-zA-Z·ÈÌÛ˙¡…Õ”⁄Ò—\s]+$/.test(nombre)) {
      showToast("El nombre solo puede contener letras", "error");
      return;
    }

    if (!esCorreoValido(correo)) {
      showToast("Correo inv√°lido", "error");
      return;
    }

    const permisos = obtenerPermisosSeleccionados();

    try {
      await apiFetch("/api/usuarios", {
        method: "POST",
        body: JSON.stringify({ id, nombre, correo, permisos })
      });

      showToast("Usuario creado correctamente", "success");

      limpiarForm();
      await cargarUsuarios();

    } catch (err) {
      console.error("Error creando usuario:", err);
      showToast("Error creando usuario", "error");
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

  // =========================
  // ? FILTRAR
  // =========================
  const permisosFiltrados = permisosDisponibles.filter(p =>
    p.codigo !== "admin" &&
    p.codigo !== "usuarios"
  );

  // =========================
  // ?? AGRUPAR
  // =========================
  const grupos = {
    "Flota": [
      "vehiculos",
      "trailer",
      "propietarios",
      "conductores",
      "clientes",
      "empresas-a-cargo"
    ],
    "Finanzas": [
      "bancos",
      "tipo-transaccion",
      "transacciones",
      "gastos-conductor",
      "registro-conductor",
      "facturas"
    ],
    "Reportes": [
      "dashboard",
      "dashboard-contable",
      "dashboard-cartera",
      "dashboard-proyecciones"
    ],
    "Otros": [
      "manifiestos",
      "auditoria"
    ]
  };

  // =========================
  // ?? RENDER
  // =========================
  let html = "";

  Object.entries(grupos).forEach(([titulo, codigos]) => {

    // filtrar permisos que existan
    const items = permisosFiltrados.filter(p =>
      codigos.includes(p.codigo)
    );

    if (!items.length) return;

    // t√∫tulo
    html += `<div class="us-perm-section">${titulo}</div>`;

    // items
    items.forEach(p => {
      const checked = permisosSeleccionados.includes(p.codigo) ? "checked" : "";

      html += `
        <label class="us-check">
          <input type="checkbox" value="${p.codigo}" ${checked}>
          <span>${p.nombre}</span>
        </label>
      `;
    });

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
          <div class="us-actions">

            <button 
              class="us-btn-action us-btn-secondary"
              onclick="abrirPermisos('${u.id}')"
            >
              Permisos
            </button>
          
            <button 
              class="us-btn-action us-btn-primary"
              onclick="resetPassword('${u.id}')"
            >
              Restablecer
            </button>
          
            <button 
              class="us-btn-action ${u.activo ? 'us-btn-danger' : 'us-btn-success'}"
              onclick="toggleUsuario('${u.id}')"
            >
              ${u.activo ? "Desactivar" : "Activar"}
            </button>
          
          </div>
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

// =========================
// RESTABLECER CONTRASE√ëA
// =========================
async function confirmarResetPassword() {
  if (!usuarioResetId) return;

  const modal = document.getElementById("modal-reset");
  const botones = modal.querySelectorAll("button");

  // solo evitar doble click (sin da√±ar estilos)
  botones.forEach(b => b.style.pointerEvents = "none");

  try {
    await apiFetch(`/api/usuarios/${usuarioResetId}/reset-password`, {
      method: "POST"
    });

    showToast("Contrase√±a restablecida correctamente", "success");

    cerrarModalReset();

  } catch (err) {
    console.error("Error reset password:", err);
    showToast("Error al restablecer contrase√±a", "error");

    // reactivar interacci√≥n
    botones.forEach(b => b.style.pointerEvents = "auto");
  }
}



function resetPassword(id) {
  usuarioResetId = id;

  const usuario = usuarios.find(u => u.id === id);

  const modal = document.getElementById("modal-reset");
  const text = document.getElementById("reset-text");

  if (!modal || !text) return;

  text.textContent = `¬øRestablecer contrase√±a de ${usuario?.nombre || "este usuario"}?`;

  const botones = modal.querySelectorAll("button");

  botones.forEach(btn => {
    btn.disabled = false;              // ? quitar disabled
    btn.style.pointerEvents = "auto";  // ? reactivar clicks
    btn.style.opacity = "1";           // ? forzar visual normal
  });

  modal.classList.remove("hidden");
}
// =========================
// ABRIR PERMISOS
// =========================
function abrirPermisos(id) {

  const usuario = usuarios.find(u => u.id === id);
  if (!usuario) return;

  usuarioEditando = usuario;

  const modal = document.getElementById("modal-permisos");
  const container = document.getElementById("perm-container");

  if (!modal || !container) return;

  modal.classList.remove("hidden");

  // render permisos con selecci√≥n actual
  renderPermisosUsuario(usuario.permisos || []);
}

// =========================
// RENDER PERMISOS
// =========================
function renderPermisosUsuario(permisosSeleccionados = []) {

  const container = document.getElementById("perm-container");
  if (!container) return;

  container.innerHTML = "";

  // quitar admin y usuarios
  const permisosFiltrados = permisosDisponibles.filter(p =>
    p.codigo !== "admin" &&
    p.codigo !== "usuarios"
  );

  let html = "";

  permisosFiltrados.forEach(p => {

    const checked = permisosSeleccionados.includes(p.codigo)
      ? "checked"
      : "";

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
// GUARDAR PERMISOS
// =========================
async function guardarPermisos() {

  if (!usuarioEditando) return;

  const container = document.getElementById("perm-container");
  if (!container) return;

  const checks = container.querySelectorAll("input:checked");
  const permisos = Array.from(checks).map(c => c.value);

  try {

    await apiFetch(`/api/usuarios/${usuarioEditando.id}`, {
      method: "PUT",
      body: JSON.stringify({
        nombre: usuarioEditando.nombre,
        correo: usuarioEditando.correo,
        permisos
      })
    });

    // ? TOAST VERDE
    if (typeof showToast === "function") {
      showToast("Permisos actualizados correctamente", "success");
    }

    cerrarModalPermisos();
    await cargarUsuarios();

  } catch (err) {
    console.error(err);

    // ? TOAST ROJO
    if (typeof showToast === "function") {
      showToast("Error actualizando permisos", "error");
    }
  }
}


// =========================
// CERRAR MODAL PERMISOS
// =========================
window.cerrarModalPermisos = function () {
  const modal = document.getElementById("modal-permisos");
  if (modal) modal.classList.add("hidden");

  usuarioEditando = null;
};

function cerrarModalReset() {
  const modal = document.getElementById("modal-reset");
  if (modal) modal.classList.add("hidden");

  const botones = modal?.querySelectorAll("button");

  botones?.forEach(btn => {
    btn.disabled = false;
    btn.style.pointerEvents = "auto";
  });

  usuarioResetId = null;
}


function esCorreoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}
