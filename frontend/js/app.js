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
    // =========================
    // VALIDAR PERMISOS
    // =========================
    const permisos = JSON.parse(localStorage.getItem("permisos") || "[]");
    const esGerente = permisos.includes("admin");
    
    // ?? GERENTE entra a todo
    if (!esGerente) {
    
      // ?? todos pueden ver home
      if (view === "home") {
        // ok
      }
    
      // ? usuarios solo admin
      else if (view === "usuarios") {
        container.innerHTML = `
          <div style="padding:20px;">
            <h3>Acceso denegado</h3>
            <p>Solo el administrador puede acceder a esta vista</p>
          </div>
        `;
        return;
      }
    
      // ?? resto según permisos
      else if (permisos.length && !permisos.includes(view)) {
        container.innerHTML = `
          <div style="padding:20px;">
            <h3>Acceso denegado</h3>
            <p>No tienes permisos para esta vista</p>
          </div>
        `;
        return;
      }
    }

    // =========================
    // CARGAR VISTA
    // =========================
    const res = await fetch(`/pages/views/${view}.html`);

    if (!res.ok) {
      throw new Error(`Vista no encontrada: ${view}`);
    }

    const html = await res.text();
    container.innerHTML = html;

    // =========================
    // FORZAR RENDER
    // =========================
    await new Promise(r => requestAnimationFrame(r));

    // =========================
    // INIT POR VISTA
    // =========================
    switch (view) {

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

      case "registro-conductor":
        if (typeof initRegistroConductor === "function") initRegistroConductor();
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

      case "dashboard":
        if (typeof initDashboard === "function") initDashboard();
        break;

      case "dashboard-contable":
        if (typeof initDashboardContable === "function") initDashboardContable();
        break;

      case "dashboard-cartera":
        if (typeof initDashboardCartera === "function") initDashboardCartera();
        break;

      case "dashboard-proyecciones":
        if (typeof initDashboardProyecciones === "function") initDashboardProyecciones();
        break;

      case "usuarios":
        if (typeof initUsuarios === "function") initUsuarios();
        break;
    }

    // =========================
    // UI FINAL
    // =========================
    setActiveMenu(view);
    aplicarPermisosMenu();

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
  const permisos = JSON.parse(localStorage.getItem("permisos") || "[]");
  const esGerente = permisos.includes("admin");

  if (!esGerente) {

    if (view === "usuarios") {
      alert("Solo el administrador puede acceder");
      return;
    }

    if (view !== "home" && permisos.length && !permisos.includes(view)) {
      alert("No tienes acceso a esta vista");
      return;
    }
  }

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


// =========================
// FILTRAR VISTAS POR PERMISOS
// =========================
function aplicarPermisosMenu() {
  const permisos = JSON.parse(localStorage.getItem("permisos") || "[]");
  const esGerente = permisos.includes("admin");

  const items = document.querySelectorAll(".menu-item[data-view]");

  // =========================
  // 1. OCULTAR ITEMS
  // =========================
  items.forEach(item => {
    const view = item.getAttribute("data-view");

    if (esGerente) {
      item.style.display = "";
      return;
    }

    // HOME siempre visible
    if (view === "home") {
      item.style.display = "";
      return;
    }

    // usuarios solo admin
    if (view === "usuarios") {
      item.style.display = "none";
      return;
    }

    // resto según permisos
    if (!permisos.includes(view)) {
      item.style.display = "none";
    } else {
      item.style.display = "";
    }
  });

  // =========================
  // 2. OCULTAR MODULOS VACÍOS
  // =========================
  const sections = document.querySelectorAll(".menu-section");

  sections.forEach(section => {
    const nextItems = [];
    let sibling = section.nextElementSibling;

    // recolecta items hasta el siguiente título
    while (sibling && !sibling.classList.contains("menu-section")) {
      if (sibling.classList.contains("menu-item")) {
        nextItems.push(sibling);
      }
      sibling = sibling.nextElementSibling;
    }

    // verifica si alguno es visible
    const algunoVisible = nextItems.some(item => item.style.display !== "none");

    // ocultar sección si no hay visibles
    section.style.display = algunoVisible ? "" : "none";
  });
}