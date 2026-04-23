function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.innerText = message;

  // reset clases
  toast.className = "toast";

  // aplicar tipo
  toast.classList.add("show", type);

  // limpiar anterior timeout
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }

  // ocultar después
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// ================= FUNCION GLOBAL PARA FORMATEAR FECHA
function formatearFecha(fecha) {
  if (!fecha) return "-";

  const [year, month, day] = fecha.split("-");

  return `${day}/${month}/${year}`;
}

function formatearFechaInput(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ================= FUNCION GLOBAL PARA render estado activo o inactivo
function renderEstadoBadge(estado) {
  if (!estado) return "-";

  const clase = estado === "activo" 
    ? "status-activo" 
    : "status-inactivo";

  return `<span class="status-badge ${clase}">${estado}</span>`;
}

// =========================
// FORMAT MONEY
// =========================
function format(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-CO");
}

// =========================
// CLOSE MODAL ON OUTSIDE CLICK
// =========================
document.addEventListener("click", (e) => {

  // Buscar si el click fue dentro del contenido del modal
  const isInsideContent = e.target.closest(".modal-content");

  // Buscar si el click fue dentro de un modal
  const modal = e.target.closest(".modal");

  // Si el click fue en el overlay (modal pero no en el contenido)
  if (modal && !isInsideContent) {
    modal.classList.add("hidden");
  }

});

function formatearFechaDesdeUTC(fechaISO) {
  if (!fechaISO) return "-";

  const fecha = new Date(fechaISO);

  const year = fecha.getUTCFullYear();
  const month = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const day = String(fecha.getUTCDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
}

function formatearFechaSafe(fechaStr) {
  if (!fechaStr) return "-";

  // ?? Forzar que SIEMPRE sea string YYYY-MM-DD
  if (fechaStr.includes("T")) {
    fechaStr = fechaStr.split("T")[0];
  }

  const [year, month, day] = fechaStr.split("-");

  return `${day}/${month}/${year}`;
}

function formatearFechaInputToDisplay(fechaStr) {
  if (!fechaStr) return "-";

  // ?? trabajar SOLO con string (evita timezone)
  const [year, month, day] = fechaStr.split("-");

  return `${day}/${month}/${year}`;
}

document.addEventListener("click", function (e) {

  const modal = e.target;

  if ([...modal.classList].some(c => c.endsWith("-modal"))) {
    modal.classList.add("hidden");
  }

});