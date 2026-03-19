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
// DASHBOARD DATA (BACKEND)
// =========================
async function loadDashboard() {
  try {
    const response = await fetch("http://TU_IP:PUERTO/dashboard"); // ?? cambia esto luego

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor");
    }

    const data = await response.json();

    // Asignar datos dinámicamente
    const activos = document.getElementById("viajesActivos");
    const finalizados = document.getElementById("viajesFinalizados");
    const pendientes = document.getElementById("facturasPendientes");
    const total = document.getElementById("totalPendiente");

    if (activos) activos.textContent = data.viajesActivos ?? 0;
    if (finalizados) finalizados.textContent = data.viajesFinalizados ?? 0;
    if (pendientes) pendientes.textContent = data.facturasPendientes ?? 0;
    if (total) total.textContent = "$" + (data.totalPendiente ?? 0).toLocaleString();

  } catch (error) {
    console.error("Error cargando dashboard:", error);

    // Fallback visual (por si falla backend)
    const activos = document.getElementById("viajesActivos");
    const finalizados = document.getElementById("viajesFinalizados");
    const pendientes = document.getElementById("facturasPendientes");
    const total = document.getElementById("totalPendiente");

    if (activos) activos.textContent = "0";
    if (finalizados) finalizados.textContent = "0";
    if (pendientes) pendientes.textContent = "0";
    if (total) total.textContent = "$0";
  }
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // LOGIN
  // =========================
  const form = document.getElementById("loginForm");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const passwordInput = document.getElementById("password").value.trim();

      if (!email || !passwordInput) {
        alert("Por favor completa todos los campos");
        return;
      }

      console.log("Login:", email, passwordInput);

      // ?? Redirección al home (temporal)
      window.location.href = "./pages/home.html";

      // ?? FUTURO REAL:
      /*
      fetch("http://TU_IP:PUERTO/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password: passwordInput })
      })
      */
    });
  }

  // =========================
  // VER / OCULTAR CONTRASEÑA
  // =========================
  const toggle = document.getElementById("togglePassword");
  const passwordField = document.getElementById("password");

  if (toggle && passwordField) {
    toggle.addEventListener("click", () => {
      passwordField.type =
        passwordField.type === "password" ? "text" : "password";
    });
  }

  // =========================
  // CARGAR DASHBOARD (SOLO HOME)
  // =========================
  if (window.location.pathname.includes("home.html")) {
    loadDashboard();
  }
  
  // =========================
  // CARGAR TABLA DE VIAJES
  // =========================
  async function loadViajes() {
    try {
      const response = await fetch("http://TU_IP:PUERTO/viajes");
  
      const viajes = await response.json();
  
      const tabla = document.getElementById("tablaViajes");
  
      if (!tabla) return;
  
      tabla.innerHTML = "";
  
      viajes.forEach(viaje => {
        const row = `
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
  
        tabla.innerHTML += row;
      });
  
    } catch (error) {
      console.error("Error cargando viajes:", error);
    }
  }
  
  async function loadVencimientos() {
    try {
      const res = await fetch("http://TU_IP:PUERTO/vencimientos");
      const data = await res.json();
  
      const list = document.getElementById("vencimientosList");
  
      list.innerHTML = `
        <li>Licencias <span class="badge">${data.licencias}</span></li>
        <li>SOAT <span class="badge">${data.soat}</span></li>
        <li>Tecnomecánica <span class="badge">${data.tecno}</span></li>
      `;
  
    } catch (e) {
      console.error(e);
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
        <li>Licencias <span class="badge">${data.licencias}</span></li>
        <li>SOAT <span class="badge">${data.soat}</span></li>
        <li>Tecnomecánica <span class="badge">${data.tecno}</span></li>
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
  
      const el = document.getElementById("facturacionTexto");
  
      if (el) {
        el.textContent = data.mensaje;
      }
  
    } catch (error) {
      console.error("Error facturación:", error);
    }
  }

});