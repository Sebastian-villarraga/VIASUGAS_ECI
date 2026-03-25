// =========================
// COMPONENTES (SIDEBAR / TOPBAR)
// =========================
async function loadComponent(id, file) {
  try {
    const res = await fetch(file);
    const html = await res.text();
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  } catch (error) {
    console.error(`Error cargando ${file}:`, error);
  }
}

// =========================
// NAVEGACIÓN GLOBAL
// =========================
function go(page) {
  window.location.href = page;
}

function logout() {
  window.location.href = "/index.html";
}

// =========================
// DASHBOARD DATA
// =========================
async function loadDashboard() {
  try {
    const response = await fetch("http://TU_IP:PUERTO/dashboard");

    if (!response.ok) throw new Error("Error servidor");

    const data = await response.json();

    const activos = document.getElementById("viajesActivos");
    const finalizados = document.getElementById("viajesFinalizados");
    const pendientes = document.getElementById("facturasPendientes");
    const total = document.getElementById("totalPendiente");

    if (activos) activos.textContent = data.viajesActivos ?? 0;
    if (finalizados) finalizados.textContent = data.viajesFinalizados ?? 0;
    if (pendientes) pendientes.textContent = data.facturasPendientes ?? 0;
    if (total) total.textContent = "$" + (data.totalPendiente ?? 0).toLocaleString();

  } catch (error) {
    console.error("Dashboard error:", error);

    ["viajesActivos", "viajesFinalizados", "facturasPendientes"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "0";
    });

    const total = document.getElementById("totalPendiente");
    if (total) total.textContent = "$0";
  }
}

// =========================
// VIAJES
// =========================
async function loadViajes() {
  try {
    const response = await fetch("http://TU_IP:PUERTO/viajes");
    const viajes = await response.json();

    const tabla = document.getElementById("tablaViajes");
    if (!tabla) return;

    tabla.innerHTML = "";

    viajes.forEach(viaje => {
      tabla.innerHTML += `
        <tr>
          <td>${viaje.id}</td>
          <td>${viaje.origen}</td>
          <td>${viaje.destino}</td>
          <td>
            <span class="status ${viaje.estado}">
              ${viaje.estado}
            </span>
          </td>
          <td>${viaje.fecha}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("Error viajes:", error);
  }
}

// =========================
// VENCIMIENTOS
// =========================
async function loadVencimientos() {
  try {
    const res = await fetch("http://TU_IP:PUERTO/dashboard/vencimientos");
    const data = await res.json();

    const list = document.getElementById("vencimientosList");
    if (!list) return;

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
    const res = await fetch("http://TU_IP:PUERTO/dashboard/facturacion");
    const data = await res.json();

    const texto = document.getElementById("facturacionTexto");
    const valor = document.getElementById("facturacionValor");

    if (texto) texto.textContent = data.mensaje;
    if (valor) valor.textContent = "$" + (data.total ?? 0).toLocaleString();

  } catch (error) {
    console.error("Error facturación:", error);
  }
}

// =========================
// LOGIN
// =========================
function initLogin() {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopPropagation(); // ?? CLAVE

    const email = document.getElementById("email").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!email || !passwordInput) {
      alert("Completa todos los campos");
      return;
    }

    console.log("Login:", email);

    // ?? REDIRECCIÓN FORZADA
    setTimeout(() => {
      window.location.href = "/pages/home.html";
    }, 100);
  });

  // ?? toggle password
  const toggle = document.getElementById("togglePassword");
  const passwordField = document.getElementById("password");

  if (toggle && passwordField) {
    toggle.addEventListener("click", () => {
      passwordField.type =
        passwordField.type === "password" ? "text" : "password";
    });
  }
}

// =========================
// INIT GLOBAL
// =========================
document.addEventListener("DOMContentLoaded", async () => {

  // ?? CARGAR COMPONENTES
  await loadComponent("sidebar", "/pages/components/sidebar.html");
  await loadComponent("topbar", "/pages/components/topbar.html");

  // ?? LOGIN
  initLogin();

  // ?? SOLO HOME
  if (window.location.pathname.includes("home.html")) {
    loadDashboard();
    loadViajes();
    loadVencimientos();
    loadFacturacion();
  }


// =========================
// VEHICULOS
// =========================
async function cargarVehiculos() {
  try {
    const res = await fetch("http://localhost:3000/api/vehiculos");
    const data = await res.json();

    const tabla = document.getElementById("vehiculosTable");

    if (!data || data.length === 0) {
      tabla.innerHTML = `<tr><td colspan="7">No hay vehículos</td></tr>`;
      return;
    }

    tabla.innerHTML = data.map(v => `
      <tr>
        <td>${v.placa}</td>
        <td>${v.id_propietario}</td>
        <td>${formatearFecha(v.todo_riesgo)}</td>
        <td>${formatearFecha(v.vencimiento_soat)}</td>
        <td>${formatearFecha(v.vencimiento_tecno)}</td>
        <td>${v.estado}</td>
        <td>
          <button onclick="editarVehiculo('${v.placa}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Error cargando vehiculos:", error);
  }
}

function formatearFecha(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString();
}


});