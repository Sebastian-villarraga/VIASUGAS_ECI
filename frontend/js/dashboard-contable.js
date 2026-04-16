// dashboard-contable.js

let dbcFiltro = {
  desde: null,
  hasta: null
};

let dbcChartEstadoResultados = null;
let dbcChartUtilidadMensual = null;
let dbcChartGastosCategoria = null;

// =========================
// INIT
// =========================
function initDashboardContable() {
  dbcEventosDashboard();
  dbcCargarDashboard();
}

// =========================
// LOAD ALL
// =========================
async function dbcCargarDashboard() {
  await Promise.all([
    dbcCargarKPI(),
    dbcCargarEstadoResultadosMensual(),
    dbcCargarUtilidadMensual(),
    dbcCargarGastosCategoria(),
    dbcCargarResumenMensual(),
    dbcCargarDetalleGastos()
  ]);
}

// =========================
// API
// =========================
function dbcGetQueryFiltro() {
  const params = new URLSearchParams();

  if (dbcFiltro.desde) params.append("desde", dbcFiltro.desde);
  if (dbcFiltro.hasta) params.append("hasta", dbcFiltro.hasta);

  return params.toString() ? `?${params.toString()}` : "";
}

function dbcFormatearMoneda(valor) {
  return "$ " + Number(valor || 0).toLocaleString("es-CO");
}

function dbcFormatearPorcentaje(valor) {
  return `${Number(valor || 0).toFixed(1)}%`;
}

function dbcFormatearMes(mes) {
  if (!mes) return "-";
  const [anio, month] = mes.split("-");
  const fecha = new Date(Number(anio), Number(month) - 1, 1);
  return fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short"
  });
}

// =========================
// KPI
// =========================
async function dbcCargarKPI() {
  try {
    const query = dbcGetQueryFiltro();
    const data = await apiFetch(`/api/dashboard-contable/kpi${query}`);
    dbcRenderKPIs(data);
  } catch (error) {
    console.error("Error KPI contable:", error);
  }
}

function dbcRenderKPIs(data) {
  const container = document.getElementById("dbcCardsDashboard");
  if (!container) return;

  container.innerHTML = `
    <div class="dbc-card dbc-kpi-ingresos">
      <h3>Ingresos del período</h3>
      <p>${dbcFormatearMoneda(data.ingresos)}</p>
    </div>

    <div class="dbc-card dbc-kpi-egresos">
      <h3>Egresos del período</h3>
      <p>${dbcFormatearMoneda(data.egresos)}</p>
    </div>

    <div class="dbc-card dbc-kpi-utilidad">
      <h3>Utilidad contable</h3>
      <p>${dbcFormatearMoneda(data.utilidad)}</p>
    </div>

    <div class="dbc-card dbc-kpi-margen">
      <h3>Margen contable</h3>
      <p>${dbcFormatearPorcentaje(data.margen)}</p>
    </div>

    <div class="dbc-card dbc-kpi-facturas">
      <h3>Facturas emitidas</h3>
      <p>${Number(data.facturas_emitidas || 0)}</p>
    </div>

    <div class="dbc-card dbc-kpi-viaje">
      <h3>Costo promedio por viaje</h3>
      <p>${dbcFormatearMoneda(data.costo_promedio_viaje)}</p>
    </div>
  `;
}

// =========================
// ESTADO DE RESULTADOS
// =========================
async function dbcCargarEstadoResultadosMensual() {
  try {
    const query = dbcGetQueryFiltro();
    const data = await apiFetch(`/api/dashboard-contable/estado-resultados-mensual${query}`);
    dbcRenderGraficaEstadoResultados(data);
  } catch (error) {
    console.error("Error estado resultados mensual:", error);
  }
}

function dbcRenderGraficaEstadoResultados(data) {
  const canvas = document.getElementById("dbcGraficaEstadoResultados");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dbcChartEstadoResultados) {
    dbcChartEstadoResultados.destroy();
  }

  const labels = data.map(item => dbcFormatearMes(item.mes));
  const ingresos = data.map(item => Number(item.ingresos));
  const egresos = data.map(item => Number(item.egresos));
  const utilidad = data.map(item => Number(item.utilidad));

  dbcChartEstadoResultados = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Ingresos",
          data: ingresos
        },
        {
          label: "Egresos",
          data: egresos
        },
        {
          label: "Utilidad",
          data: utilidad,
          type: "line",
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${dbcFormatearMoneda(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return dbcFormatearMoneda(value);
            }
          }
        }
      }
    }
  });
}

// =========================
// UTILIDAD MENSUAL
// =========================
async function dbcCargarUtilidadMensual() {
  try {
    const query = dbcGetQueryFiltro();
    const data = await apiFetch(`/api/dashboard-contable/utilidad-mensual${query}`);
    dbcRenderGraficaUtilidadMensual(data);
  } catch (error) {
    console.error("Error utilidad mensual:", error);
  }
}

function dbcRenderGraficaUtilidadMensual(data) {
  const canvas = document.getElementById("dbcGraficaUtilidadMensual");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dbcChartUtilidadMensual) {
    dbcChartUtilidadMensual.destroy();
  }

  const labels = data.map(item => dbcFormatearMes(item.mes));
  const utilidad = data.map(item => Number(item.utilidad));

  dbcChartUtilidadMensual = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Utilidad",
          data: utilidad,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return dbcFormatearMoneda(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return dbcFormatearMoneda(value);
            }
          }
        }
      }
    }
  });
}

// =========================
// GASTOS POR CATEGORIA
// =========================
async function dbcCargarGastosCategoria() {
  try {
    const query = dbcGetQueryFiltro();
    const data = await apiFetch(`/api/dashboard-contable/gastos-categoria${query}`);
    dbcRenderGraficaGastosCategoria(data);
  } catch (error) {
    console.error("Error gastos categoría:", error);
  }
}

function dbcRenderGraficaGastosCategoria(data) {
  const canvas = document.getElementById("dbcGraficaGastosCategoria");
  if (!canvas) return;

  if (dbcChartGastosCategoria) {
    dbcChartGastosCategoria.destroy();
  }

  const labels = data.map(item => item.tipo);
  const valores = data.map(item => Number(item.total));
  const total = valores.reduce((acc, val) => acc + val, 0);

  const centerTextPlugin = {
    id: "dbcCenterText",
    beforeDraw(chart) {
      const { width, height, ctx } = chart;
      ctx.save();
      ctx.font = "600 16px sans-serif";
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dbcFormatearMoneda(total), width / 2, height / 2);
      ctx.restore();
    }
  };

  dbcChartGastosCategoria = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: valores,
          backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"],
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
              const value = Number(context.raw || 0);
              const porcentaje = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${dbcFormatearMoneda(value)} (${porcentaje}%)`;
            }
          }
        }
      }
    },
    plugins: [centerTextPlugin]
  });
}

// =========================
// RESUMEN MENSUAL
// =========================
async function dbcCargarResumenMensual() {
  try {
    const query = dbcGetQueryFiltro();
    const data = await apiFetch(`/api/dashboard-contable/resumen-mensual${query}`);
    dbcRenderTablaResumenMensual(data);
  } catch (error) {
    console.error("Error resumen mensual:", error);
  }
}

function dbcRenderTablaResumenMensual(data) {
  const tbody = document.getElementById("dbcTablaResumenMensual");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="dbc-empty-row">No hay información para el período seleccionado.</td>
      </tr>
    `;
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${dbcFormatearMes(row.mes)}</td>
      <td class="dbc-text-center">${row.facturas_emitidas}</td>
      <td class="dbc-text-green dbc-text-center">${dbcFormatearMoneda(row.ingresos)}</td>
      <td class="dbc-text-red dbc-text-center">${dbcFormatearMoneda(row.egresos)}</td>
      <td class="dbc-text-center">${dbcFormatearMoneda(row.utilidad)}</td>
      <td class="dbc-text-center">${dbcFormatearPorcentaje(row.margen)}</td>
    `;

    tbody.appendChild(tr);
  });
}

// =========================
// DETALLE GASTOS
// =========================
async function dbcCargarDetalleGastos() {
  try {
    const query = dbcGetQueryFiltro();
    const data = await apiFetch(`/api/dashboard-contable/detalle-gastos${query}`);
    dbcRenderTablaDetalleGastos(data);
  } catch (error) {
    console.error("Error detalle gastos:", error);
  }
}

function dbcRenderTablaDetalleGastos(data) {
  const tbody = document.getElementById("dbcTablaDetalleGastos");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="dbc-empty-row">No hay egresos contables para el período seleccionado.</td>
      </tr>
    `;
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.fecha_pago || "-"}</td>
      <td>${row.tipo || "-"}</td>
      <td>${row.categoria || "-"}</td>
      <td>${row.descripcion || "-"}</td>
      <td>${row.id_manifiesto || "-"}</td>
      <td>${row.id_factura || "-"}</td>
      <td class="dbc-text-red dbc-text-center">${dbcFormatearMoneda(row.valor)}</td>
    `;

    tbody.appendChild(tr);
  });
}

// =========================
// FILTROS
// =========================
function dbcEventosDashboard() {
  document.getElementById("dbcBtnMesActual")?.addEventListener("click", () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    dbcSetFiltroFechas(inicio, fin);
  });

  document.getElementById("dbcBtnMesAnterior")?.addEventListener("click", () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    dbcSetFiltroFechas(inicio, fin);
  });

  document.getElementById("dbcBtnAnioActual")?.addEventListener("click", () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), 0, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    dbcSetFiltroFechas(inicio, fin);
  });

  document.getElementById("dbcBtnLimpiar")?.addEventListener("click", () => {
    dbcFiltro = { desde: null, hasta: null };

    const desdeEl = document.getElementById("dbcFechaDesde");
    const hastaEl = document.getElementById("dbcFechaHasta");

    if (desdeEl) desdeEl.value = "";
    if (hastaEl) hastaEl.value = "";

    dbcCargarDashboard();
  });

  ["dbcFechaDesde", "dbcFechaHasta"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => {
      dbcFiltro.desde = document.getElementById("dbcFechaDesde")?.value || null;
      dbcFiltro.hasta = document.getElementById("dbcFechaHasta")?.value || null;
      dbcCargarDashboard();
    });
  });
}

function dbcSetFiltroFechas(inicio, fin) {
  const desde = inicio.toISOString().split("T")[0];
  const hasta = fin.toISOString().split("T")[0];

  dbcFiltro.desde = desde;
  dbcFiltro.hasta = hasta;

  const desdeEl = document.getElementById("dbcFechaDesde");
  const hastaEl = document.getElementById("dbcFechaHasta");

  if (desdeEl) desdeEl.value = desde;
  if (hastaEl) hastaEl.value = hasta;

  dbcCargarDashboard();
}