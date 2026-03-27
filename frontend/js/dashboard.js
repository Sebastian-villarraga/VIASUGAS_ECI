// =========================
// INIT (SPA)
// =========================
function initDashboard() {
  loadDashboard();
  loadViajes();
  loadVencimientos();
  loadFacturacion();
}

// =========================
// DASHBOARD
// =========================
async function loadDashboard() {
  try {
    const data = await apiFetch("/dashboard");
    if (!data) return;

    const activos = document.getElementById("viajesActivos");
    const finalizados = document.getElementById("viajesFinalizados");
    const pendientes = document.getElementById("facturasPendientes");
    const total = document.getElementById("totalPendiente");

    if (activos) activos.textContent = data.viajesActivos ?? 0;
    if (finalizados) finalizados.textContent = data.viajesFinalizados ?? 0;
    if (pendientes) pendientes.textContent = data.facturasPendientes ?? 0;
    if (total) total.textContent = "$" + (data.totalPendiente ?? 0).toLocaleString();

  } catch (error) {
    console.error("Error dashboard:", error);
  }
}

// =========================
// VIAJES
// =========================
async function loadViajes() {
  try {
    const tabla = document.getElementById("tablaViajes");
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

    const viajes = await apiFetch("/viajes");

    if (!viajes || viajes.length === 0) {
      tabla.innerHTML = `<tr><td colspan="5">No hay viajes</td></tr>`;
      return;
    }

    tabla.innerHTML = viajes.map(v => `
      <tr>
        <td>${v.id}</td>
        <td>${v.origen}</td>
        <td>${v.destino}</td>
        <td><span class="status ${v.estado}">${v.estado}</span></td>
        <td>${v.fecha}</td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Error viajes:", error);
  }
}

// =========================
// VENCIMIENTOS
// =========================
async function loadVencimientos() {
  try {
    const list = document.getElementById("vencimientosList");
    if (!list) return;

    const data = await apiFetch("/dashboard/vencimientos");
    if (!data) return;

    list.innerHTML = `
      <li>Licencias <span class="badge warning">${data.licencias}</span></li>
      <li>SOAT <span class="badge ok">${data.soat}</span></li>
      <li>Tecnomecánica <span class="badge danger">${data.tecno}</span></li>
    `;

  } catch (error) {
    console.error("Error vencimientos:", error);
  }
}

// =========================
// FACTURACIÓN
// =========================
async function loadFacturacion() {
  try {
    const texto = document.getElementById("facturacionTexto");
    const valor = document.getElementById("facturacionValor");

    if (!texto || !valor) return;

    const data = await apiFetch("/dashboard/facturacion");
    if (!data) return;

    texto.textContent = data.mensaje || "Sin información";
    valor.textContent = "$" + (data.total ?? 0).toLocaleString();

  } catch (error) {
    console.error("Error facturación:", error);
  }
}