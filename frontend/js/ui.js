function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.innerText = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 5000);
}

// ================= FUNCION GLOBAL PARA FORMATEAR FECHA
function formatearFecha(fecha) {
  if (!fecha) return "-";

  const [year, month, day] = fecha.split("-");

  return `${day}/${month}/${year}`;
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