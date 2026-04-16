// public/js/dashboard-proyecciones.js

let dprFiltro = {
  desde: null,
  hasta: null
};

let dprChartMensual = null;
let dprChartSemanal = null;
let dprChartTopClientes = null;

// =========================
// INIT
// =========================
function initDashboardProyecciones() {
  dprConfigurarEventos();
  dprCargarDashboard();
}

// =========================
// LOAD ALL
// =========================
async function dprCargarDashboard() {
  try {
    await Promise.all([
      dprCargarKPI(),
      dprCargarProyeccionMensual(),
      dprCargarProyeccionSemanal(),
      dprCargarTopClientes(),
      dprCargarFacturasProximas(),
      dprCargarDetalle()
    ]);
  } catch (error) {
    console.error("Error cargando dashboard proyecciones:", error);
  }
}

// =========================
// HELPERS
// =========================
function dprGetQuery() {
  const params = new URLSearchParams();

  if (dprFiltro.desde) params.append("desde", dprFiltro.desde);
  if (dprFiltro.hasta) params.append("hasta", dprFiltro.hasta);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function dprMoney(valor) {
  return "$ " + Number(valor || 0).toLocaleString("es-CO");
}

function dprFecha(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-CO");
}

function dprMes(valor) {
  if (!valor) return "-";
  const [year, month] = valor.split("-");
  const fecha = new Date(Number(year), Number(month) - 1, 1);
  return fecha.toLocaleDateString("es-CO", { month: "short", year: "numeric" });
}

// =========================
// KPI
// =========================
async function dprCargarKPI() {
  try {
    const data = await apiFetch(`/api/dashboard-proyecciones/kpi${dprGetQuery()}`);
    dprRenderKPI(data);
  } catch (error) {
    console.error("Error KPI proyecciones:", error);
  }
}

function dprRenderKPI(data) {
  const box = document.getElementById("dprCardsDashboard");
  if (!box) return;

  box.innerHTML = `
    <div class="dpr-card dpr-kpi-mes">
      <h3>Próximo Mes</h3>
      <p>${dprMoney(data.proximo_mes)}</p>
    </div>

    <div class="dpr-card dpr-kpi-3m">
      <h3>Próximos 3 Meses</h3>
      <p>${dprMoney(data.proximos_3_meses)}</p>
    </div>

    <div class="dpr-card dpr-kpi-6m">
      <h3>Próximos 6 Meses</h3>
      <p>${dprMoney(data.proximos_6_meses)}</p>
    </div>

    <div class="dpr-card dpr-kpi-facturas">
      <h3>Facturas Proyectadas</h3>
      <p>${Number(data.facturas_proyectadas || 0)}</p>
    </div>

    <div class="dpr-card dpr-kpi-clientes">
      <h3>Clientes Proyectados</h3>
      <p>${Number(data.clientes_proyectados || 0)}</p>
    </div>

    <div class="dpr-card dpr-kpi-ticket">
      <h3>Ticket Promedio</h3>
      <p>${dprMoney(data.ticket_promedio_proyectado)}</p>
    </div>
  `;
}

// =========================
// PROYECCION MENSUAL
// =========================
async function dprCargarProyeccionMensual() {
  try {
    const data = await apiFetch(`/api/dashboard-proyecciones/proyeccion-mensual${dprGetQuery()}`);
    dprRenderProyeccionMensual(data);
  } catch (error) {
    console.error("Error proyección mensual:", error);
  }
}

function dprRenderProyeccionMensual(data) {
  const canvas = document.getElementById("dprGraficaMensual");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dprChartMensual) dprChartMensual.destroy();

  dprChartMensual = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(x => dprMes(x.mes)),
      datasets: [{
        label: "Ingreso proyectado",
        data: data.map(x => Number(x.total || 0)),
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return dprMoney(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return dprMoney(value);
            }
          }
        }
      }
    }
  });
}

// =========================
// PROYECCION SEMANAL
// =========================
async function dprCargarProyeccionSemanal() {
  try {
    const data = await apiFetch(`/api/dashboard-proyecciones/proyeccion-semanal`);
    dprRenderProyeccionSemanal(data);
  } catch (error) {
    console.error("Error proyección semanal:", error);
  }
}

function dprRenderProyeccionSemanal(data) {
  const canvas = document.getElementById("dprGraficaSemanal");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dprChartSemanal) dprChartSemanal.destroy();

  dprChartSemanal = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(x => dprFecha(x.semana_inicio)),
      datasets: [{
        label: "Ingreso semanal",
        data: data.map(x => Number(x.total || 0)),
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return dprMoney(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return dprMoney(value);
            }
          }
        }
      }
    }
  });
}

// =========================
// TOP CLIENTES
// =========================
async function dprCargarTopClientes() {
  try {
    const data = await apiFetch(`/api/dashboard-proyecciones/top-clientes${dprGetQuery()}`);
    dprRenderTopClientes(data);
  } catch (error) {
    console.error("Error top clientes proyectados:", error);
  }
}

function dprRenderTopClientes(data) {
  const canvas = document.getElementById("dprGraficaTopClientes");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dprChartTopClientes) dprChartTopClientes.destroy();

  dprChartTopClientes = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(x => x.cliente),
      datasets: [{
        label: "Total proyectado",
        data: data.map(x => Number(x.total || 0)),
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return dprMoney(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback(value) {
              return dprMoney(value);
            }
          }
        }
      }
    }
  });
}

// =========================
// FACTURAS PROXIMAS
// =========================
async function dprCargarFacturasProximas() {
  try {
    const data = await apiFetch(`/api/dashboard-proyecciones/facturas-proximas`);
    dprRenderFacturasProximas(data);
  } catch (error) {
    console.error("Error facturas próximas:", error);
  }
}

function dprRenderFacturasProximas(data) {
  const tbody = document.getElementById("dprTablaFacturasProximas");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="dpr-empty-row">No hay facturas próximas a vencer.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.codigo_factura}</td>
      <td>${row.cliente}</td>
      <td>${dprFecha(row.fecha_vencimiento)}</td>
      <td class="dpr-text-center">${dprMoney(row.valor_neto)}</td>
      <td class="dpr-text-center dpr-text-green">${dprMoney(row.pagado)}</td>
      <td class="dpr-text-center dpr-text-blue">${dprMoney(row.pendiente_proyectado)}</td>
    </tr>
  `).join("");
}

// =========================
// DETALLE
// =========================
async function dprCargarDetalle() {
  try {
    const data = await apiFetch(`/api/dashboard-proyecciones/detalle${dprGetQuery()}`);
    dprRenderDetalle(data);
  } catch (error) {
    console.error("Error detalle proyección:", error);
  }
}

function dprRenderDetalle(data) {
  const tbody = document.getElementById("dprTablaDetalle");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="dpr-empty-row">No hay proyección disponible.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.cliente}</td>
      <td>${row.codigo_factura}</td>
      <td>${dprFecha(row.fecha_emision)}</td>
      <td>${dprFecha(row.fecha_vencimiento)}</td>
      <td class="dpr-text-center">${dprMoney(row.valor_bruto)}</td>
      <td class="dpr-text-center">${dprMoney(row.retencion_fuente)}</td>
      <td class="dpr-text-center">${dprMoney(row.retencion_ica)}</td>
      <td class="dpr-text-center">${dprMoney(row.valor_neto)}</td>
      <td class="dpr-text-center dpr-text-green">${dprMoney(row.pagado)}</td>
      <td class="dpr-text-center dpr-text-blue">${dprMoney(row.pendiente_proyectado)}</td>
    </tr>
  `).join("");
}

// =========================
// FILTROS
// =========================
function dprConfigurarEventos() {
  const btnMesActual = document.getElementById("dprBtnMesActual");
  const btnMesAnterior = document.getElementById("dprBtnMesAnterior");
  const btnProx3Meses = document.getElementById("dprBtnProx3Meses");
  const btnLimpiar = document.getElementById("dprBtnLimpiar");

  const fechaDesde = document.getElementById("dprFechaDesde");
  const fechaHasta = document.getElementById("dprFechaHasta");

  btnMesActual?.addEventListener("click", () => {
    const hoy = new Date();
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    dprAplicarFechas(desde, hasta);
  });

  btnMesAnterior?.addEventListener("click", () => {
    const hoy = new Date();
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    dprAplicarFechas(desde, hasta);
  });

  btnProx3Meses?.addEventListener("click", () => {
    const hoy = new Date();
    const desde = hoy;
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 3, hoy.getDate());
    dprAplicarFechas(desde, hasta);
  });

  btnLimpiar?.addEventListener("click", () => {
    dprFiltro = { desde: null, hasta: null };

    if (fechaDesde) fechaDesde.value = "";
    if (fechaHasta) fechaHasta.value = "";

    dprCargarDashboard();
  });

  fechaDesde?.addEventListener("change", () => {
    dprFiltro.desde = fechaDesde.value || null;
    dprCargarDashboard();
  });

  fechaHasta?.addEventListener("change", () => {
    dprFiltro.hasta = fechaHasta.value || null;
    dprCargarDashboard();
  });
}

function dprAplicarFechas(desdeDate, hastaDate) {
  const desde = desdeDate.toISOString().split("T")[0];
  const hasta = hastaDate.toISOString().split("T")[0];

  dprFiltro.desde = desde;
  dprFiltro.hasta = hasta;

  const fechaDesde = document.getElementById("dprFechaDesde");
  const fechaHasta = document.getElementById("dprFechaHasta");

  if (fechaDesde) fechaDesde.value = desde;
  if (fechaHasta) fechaHasta.value = hasta;

  dprCargarDashboard();
}