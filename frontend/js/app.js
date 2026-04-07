// =========================
// ROUTER SPA
// =========================
async function loadView(view) {
  const container = document.getElementById("app-content");

  if (!container) {
    console.error("#app-content no existe en el DOM");
    return;
  }

  try {
    const res = await fetch(`/pages/views/${view}.html`);

    if (!res.ok) {
      throw new Error(`Vista no encontrada: ${view}`);
    }

    const html = await res.text();

    container.innerHTML = html;

    // =========================
    // INIT POR VISTA
    // =========================
    switch (view) {
      case "dashboard":
      case "home":
        if (typeof initDashboard === "function") initDashboard();
        break;

      case "vehiculos":
        if (typeof initVehiculos === "function") initVehiculos();
        break;

      case "trailer":
        if (typeof initTrailers === "function") initTrailers();
        break;

      case "propietarios":
        if (typeof initPropietarios === "function") initPropietarios();
        break;

      case "conductores":
        if (typeof initConductores === "function") initConductores();
        break;

      case "empresas-a-cargo":
        if (typeof initEmpresas === "function") initEmpresas();
        break;

      // ?? NUEVO
      case "clientes":
        if (typeof initClientes === "function") initClientes();
        break;
      case "manifiestos":
        if (typeof initManifiestos === "function") initManifiestos();
        break;
      case "transacciones":
        if (typeof initTransacciones === "function") initTransacciones();
        break;
      case "gastos-conductor":
        if (typeof initGastosConductor === "function") initGastosConductor();
        break;
      case "tipo-transaccion":
        if (typeof initTiposTransaccion === "function") initTiposTransaccion();
        break;
      case "facturas":
        if (typeof initFacturas === "function") initFacturas();
        break;
      case "bancos":
        if (typeof initBancos === "function") initBancos();
        break;
    }

    setActiveMenu(view);

  } catch (error) {
    console.error("Error cargando vista:", error);

    container.innerHTML = `
      <div style="padding:20px;">
        <h3>Error cargando la vista</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// =========================
// NAV
// =========================
function navigate(view) {
  history.pushState({}, "", `#${view}`);
  loadView(view);
}

// =========================
// BACK / FORWARD
// =========================
window.addEventListener("popstate", () => {
  const view = window.location.hash.replace("#", "") || "home";
  loadView(view);
});

// =========================
// MENU ACTIVO
// =========================
function setActiveMenu(view) {
  const items = document.querySelectorAll(".menu-item");

  items.forEach(i => i.classList.remove("active"));

  const activeItem = document.querySelector(`.menu-item[data-view="${view}"]`);

  if (activeItem) {
    activeItem.classList.add("active");
  }
}

// =========================
// INIT APP
// =========================
function initApp() {
  console.log("App iniciando...");

  // AUTH
  if (typeof checkAuth === "function") {
    checkAuth();
  }

  let view = window.location.hash.replace("#", "");

  if (!view) {
    view = "home";
    history.replaceState({}, "", "#home");
  }

  loadView(view);
}

// =========================
// DOM READY
// =========================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}


