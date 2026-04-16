// public/js/dashboard-cartera.js

let dcrFiltro = {
  desde: null,
  hasta: null
};

let dcrChartAging = null;
let dcrChartTopDeudores = null;

// =====================================
// INIT
// =====================================
function initDashboardCartera() {
  dcrConfigurarEventos();
  dcrCargarDashboard();
}

// =====================================
// LOAD ALL
// =====================================
async function dcrCargarDashboard() {
  try {
    await Promise.all([
      dcrCargarKPI(),
      dcrCargarAging(),
      dcrCargarTopDeudores(),
      dcrCargarFacturasVencidas(),
      dcrCargarDetalle()
    ]);
  } catch (error) {
    console.error("Error cargando dashboard cartera:", error);
  }
}

// =====================================
// HELPERS
// =====================================
function dcrGetQuery() {
  const params = new URLSearchParams();

  if (dcrFiltro.desde) params.append("desde", dcrFiltro.desde);
  if (dcrFiltro.hasta) params.append("hasta", dcrFiltro.hasta);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function dcrMoney(valor) {
  return "$ " + Number(valor || 0).toLocaleString("es-CO");
}

function dcrFecha(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);
  return d.toLocaleDateString("es-CO");
}

function dcrNum(valor) {
  return Number(valor || 0);
}

// =====================================
// KPI
// =====================================
async function dcrCargarKPI() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/kpi${dcrGetQuery()}`);
    dcrRenderKPIs(data);
  } catch (error) {
    console.error("Error KPI:", error);
  }
}

function dcrRenderKPIs(data) {
  const box = document.getElementById("dcrCardsDashboard");
  if (!box) return;

  box.innerHTML = `
    <div class="dcr-card dcr-kpi-total">
      <h3>Cartera Total</h3>
      <p>${dcrMoney(data.cartera_total)}</p>
    </div>

    <div class="dcr-card dcr-kpi-vencida">
      <h3>Cartera Vencida</h3>
      <p>${dcrMoney(data.cartera_vencida)}</p>
    </div>

    <div class="dcr-card dcr-kpi-corriente">
      <h3>Cartera Corriente</h3>
      <p>${dcrMoney(data.cartera_corriente)}</p>
    </div>

    <div class="dcr-card dcr-kpi-clientes">
      <h3>Clientes con Deuda</h3>
      <p>${dcrNum(data.clientes_con_deuda)}</p>
    </div>

    <div class="dcr-card dcr-kpi-facturas">
      <h3>Facturas Pendientes</h3>
      <p>${dcrNum(data.facturas_pendientes)}</p>
    </div>

    <div class="dcr-card dcr-kpi-recaudo">
      <h3>Retenciones Totales</h3>
      <p>${dcrMoney(data.retenciones_total)}</p>
    </div>
  `;
}

// =====================================
// AGING
// =====================================
async function dcrCargarAging() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/aging${dcrGetQuery()}`);
    dcrRenderAging(data);
  } catch (error) {
    console.error("Error aging:", error);
  }
}

function dcrRenderAging(data) {
  const canvas = document.getElementById("dcrGraficaAging");
  if (!canvas) return;

  if (dcrChartAging) dcrChartAging.destroy();

  const labels = data.map(x => x.rango);
  const valores = data.map(x => dcrNum(x.total));

  dcrChartAging = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: valores,
          backgroundColor: [
            "#16a34a",
            "#f59e0b",
            "#fb923c",
            "#ef4444",
            "#991b1b"
          ],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${dcrMoney(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

// =====================================
// TOP DEUDORES
// =====================================
async function dcrCargarTopDeudores() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/top-deudores${dcrGetQuery()}`);
    dcrRenderTopDeudores(data);
  } catch (error) {
    console.error("Error top deudores:", error);
  }
}

function dcrRenderTopDeudores(data) {
  const canvas = document.getElementById("dcrGraficaTopDeudores");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dcrChartTopDeudores) dcrChartTopDeudores.destroy();

  const labels = data.map(x => x.cliente);
  const valores = data.map(x => dcrNum(x.total));

  dcrChartTopDeudores = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Pendiente",
          data: valores,
          borderRadius: 8
        }
      ]
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
              return dcrMoney(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback(value) {
              return dcrMoney(value);
            }
          }
        }
      }
    }
  });
}

// =====================================
// FACTURAS VENCIDAS
// =====================================
async function dcrCargarFacturasVencidas() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/facturas-vencidas${dcrGetQuery()}`);
    dcrRenderFacturasVencidas(data);
  } catch (error) {
    console.error("Error facturas vencidas:", error);
  }
}

function dcrRenderFacturasVencidas(data) {
  const tbody = document.getElementById("dcrTablaFacturasVencidas");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="dcr-empty-row">
          No hay facturas vencidas.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.codigo_factura}</td>
      <td>${row.cliente}</td>
      <td>${dcrFecha(row.fecha_emision)}</td>
      <td>${dcrFecha(row.fecha_vencimiento)}</td>
      <td class="dcr-text-center dcr-text-red">${row.dias_vencido}</td>
      <td class="dcr-text-center dcr-text-red">${dcrMoney(row.pendiente)}</td>
    </tr>
  `).join("");
}

// =====================================
// DETALLE
// =====================================
async function dcrCargarDetalle() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/detalle${dcrGetQuery()}`);
    dcrRenderDetalle(data);
  } catch (error) {
    console.error("Error detalle:", error);
  }
}

function dcrRenderDetalle(data) {
  const tbody = document.getElementById("dcrTablaDetalle");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="dcr-empty-row">
          No hay cartera pendiente.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(row => {
    const bucket = dcrGetBucket(row.dias_vencido);

    return `
      <tr>
        <td>${row.cliente}</td>
        <td>${row.codigo_factura}</td>
        <td>${dcrMoney(row.valor_bruto)}</td>
        <td>${dcrMoney(row.retencion_fuente)}</td>
        <td>${dcrMoney(row.retencion_ica)}</td>
        <td>${dcrMoney(row.valor_neto)}</td>
        <td class="dcr-text-green">${dcrMoney(row.pagado)}</td>
        <td class="dcr-text-red">${dcrMoney(row.pendiente)}</td>
        <td>${dcrFecha(row.fecha_vencimiento)}</td>
        <td>${bucket}</td>
      </tr>
    `;
  }).join("");
}

// =====================================
// BUCKET
// =====================================
function dcrGetBucket(dias) {
  dias = Number(dias || 0);

  if (dias <= 0) return "Corriente";
  if (dias <= 30) return "1-30";
  if (dias <= 60) return "31-60";
  if (dias <= 90) return "61-90";
  return "+90";
}

// =====================================
// FILTROS
// =====================================
function dcrConfigurarEventos() {
  const btnMesActual = document.getElementById("dcrBtnMesActual");
  const btnMesAnterior = document.getElementById("dcrBtnMesAnterior");
  const btnAnioActual = document.getElementById("dcrBtnAnioActual");
  const btnLimpiar = document.getElementById("dcrBtnLimpiar");

  const fechaDesde = document.getElementById("dcrFechaDesde");
  const fechaHasta = document.getElementById("dcrFechaHasta");

  btnMesActual?.addEventListener("click", () => {
    const hoy = new Date();

    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    dcrAplicarFechas(desde, hasta);
  });

  btnMesAnterior?.addEventListener("click", () => {
    const hoy = new Date();

    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    dcrAplicarFechas(desde, hasta);
  });

  btnAnioActual?.addEventListener("click", () => {
    const hoy = new Date();

    const desde = new Date(hoy.getFullYear(), 0, 1);
    const hasta = hoy;

    dcrAplicarFechas(desde, hasta);
  });

  btnLimpiar?.addEventListener("click", () => {
    dcrFiltro = { desde: null, hasta: null };

    if (fechaDesde) fechaDesde.value = "";
    if (fechaHasta) fechaHasta.value = "";

    dcrCargarDashboard();
  });

  fechaDesde?.addEventListener("change", () => {
    dcrFiltro.desde = fechaDesde.value || null;
    dcrCargarDashboard();
  });

  fechaHasta?.addEventListener("change", () => {
    dcrFiltro.hasta = fechaHasta.value || null;
    dcrCargarDashboard();
  });
}

function dcrAplicarFechas(desdeDate, hastaDate) {
  const desde = desdeDate.toISOString().split("T")[0];
  const hasta = hastaDate.toISOString().split("T")[0];

  dcrFiltro.desde = desde;
  dcrFiltro.hasta = hasta;

  const fechaDesde = document.getElementById("dcrFechaDesde");
  const fechaHasta = document.getElementById("dcrFechaHasta");

  if (fechaDesde) fechaDesde.value = desde;
  if (fechaHasta) fechaHasta.value = hasta;

  dcrCargarDashboard();
}