// ======================================================
// DASHBOARD PROYECCIONES FINAL
// Compatible con ui.js global
// Usa:
// - formatearFechaSafe()
// - formatearFechaInput()
// - format()
// - showToast()
// ======================================================

let dprFiltro = {
  desde: null,
  hasta: null
};

let dprChartMensual = null;
let dprChartSemanal = null;
let dprChartTopClientes = null;

// ======================================================
// INIT
// ======================================================
function initDashboardProyecciones() {
  dprReset();
  dprCargarAnios();
  dprEventos();
  dprAplicarEsteMes();
}

// ======================================================
// RESET
// ======================================================
function dprReset() {
  dprFiltro = {
    desde: null,
    hasta: null
  };

  dprDestroyCharts();
}

function dprDestroyCharts() {
  if (dprChartMensual) {
    dprChartMensual.destroy();
    dprChartMensual = null;
  }

  if (dprChartSemanal) {
    dprChartSemanal.destroy();
    dprChartSemanal = null;
  }

  if (dprChartTopClientes) {
    dprChartTopClientes.destroy();
    dprChartTopClientes = null;
  }
}

// ======================================================
// HELPERS
// ======================================================
function dprEl(id) {
  return document.getElementById(id);
}

function dprMoney(valor) {
  return format(valor || 0);
}

function dprFecha(valor) {
  return formatearFechaSafe(valor);
}

function dprMes(valor) {
  if (!valor) return "-";

  const [year, month] = valor.split("-");

  const fecha = new Date(Number(year), Number(month) - 1, 1);

  return fecha.toLocaleDateString("es-CO", {
    month: "short",
    year: "numeric"
  });
}

function dprSafe(data) {
  return Array.isArray(data) ? data : [];
}

function dprGetQuery() {
  const params = new URLSearchParams();

  if (dprFiltro.desde) params.append("desde", dprFiltro.desde);
  if (dprFiltro.hasta) params.append("hasta", dprFiltro.hasta);

  const query = params.toString();

  return query ? `?${query}` : "";
}

async function dprApi(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

// ======================================================
// AÑOS
// ======================================================
function dprCargarAnios() {
  const select = dprEl("dprFiltroAnio");
  if (!select) return;

  const actual = new Date().getFullYear();

  select.innerHTML = "";

  for (let i = actual - 3; i <= actual + 3; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;

    if (i === actual) option.selected = true;

    select.appendChild(option);
  }
}

// ======================================================
// EVENTOS
// ======================================================
function dprEventos() {
  dprEl("dprBtnMesActual")?.addEventListener("click", dprAplicarEsteMes);
  dprEl("dprBtnMesAnterior")?.addEventListener("click", dprAplicarMesAnterior);
  dprEl("dprBtnMesSiguiente")?.addEventListener("click", dprAplicarMesSiguiente);

  dprEl("dprBtnQ1")?.addEventListener("click", () => dprQuarter(1));
  dprEl("dprBtnQ2")?.addEventListener("click", () => dprQuarter(2));
  dprEl("dprBtnQ3")?.addEventListener("click", () => dprQuarter(3));
  dprEl("dprBtnQ4")?.addEventListener("click", () => dprQuarter(4));

  dprEl("dprBtnS1")?.addEventListener("click", () => dprSemestre(1));
  dprEl("dprBtnS2")?.addEventListener("click", () => dprSemestre(2));

  dprEl("dprBtnAnio")?.addEventListener("click", dprAnio);

  dprEl("dprBtnLimpiar")?.addEventListener("click", dprLimpiar);

  dprEl("dprFechaDesde")?.addEventListener("change", dprManual);
  dprEl("dprFechaHasta")?.addEventListener("change", dprManual);

  dprEl("dprFiltroAnio")?.addEventListener("change", dprAnio);
}

// ======================================================
// FILTROS
// ======================================================
function dprSetRango(inicio, fin) {
  const desde = formatearFechaInput(inicio);
  const hasta = formatearFechaInput(fin);

  dprFiltro.desde = desde;
  dprFiltro.hasta = hasta;

  dprEl("dprFechaDesde").value = desde;
  dprEl("dprFechaHasta").value = hasta;

  dprCargarDashboard();
}

function dprAplicarEsteMes() {
  const hoy = new Date();

  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  dprSetRango(inicio, fin);
}

function dprAplicarMesAnterior() {
  const hoy = new Date();

  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

  dprSetRango(inicio, fin);
}

function dprQuarter(num) {
  const anio = Number(dprEl("dprFiltroAnio").value);

  const inicioMes = (num - 1) * 3;
  const finMes = inicioMes + 2;

  const inicio = new Date(anio, inicioMes, 1);
  const fin = new Date(anio, finMes + 1, 0);

  dprSetRango(inicio, fin);
}

function dprSemestre(num) {
  const anio = Number(dprEl("dprFiltroAnio").value);

  const inicioMes = num === 1 ? 0 : 6;
  const finMes = num === 1 ? 5 : 11;

  const inicio = new Date(anio, inicioMes, 1);
  const fin = new Date(anio, finMes + 1, 0);

  dprSetRango(inicio, fin);
}

function dprAnio() {
  const anio = Number(dprEl("dprFiltroAnio").value);

  const inicio = new Date(anio, 0, 1);
  const fin = new Date(anio, 11, 31);

  dprSetRango(inicio, fin);
}

function dprLimpiar() {
  dprFiltro = {
    desde: null,
    hasta: null
  };

  dprEl("dprFechaDesde").value = "";
  dprEl("dprFechaHasta").value = "";

  dprCargarDashboard();
}

function dprManual() {
  dprFiltro.desde = dprEl("dprFechaDesde").value || null;
  dprFiltro.hasta = dprEl("dprFechaHasta").value || null;

  dprCargarDashboard();
}

// ======================================================
// LOAD ALL
// ======================================================
async function dprCargarDashboard() {
  try {
    await Promise.all([
      dprCargarKPI(),
      dprCargarMensual(),
      dprCargarDetalle()
    ]);
  } catch (error) {
    console.error(error);
    showToast("Error cargando dashboard", "error");
  }
}

// ======================================================
// KPI
// ======================================================
async function dprCargarKPI() {
  const data = await dprApi(`/api/dashboard-proyecciones/kpi${dprGetQuery()}`);

  const box = dprEl("dprCardsDashboard");
  if (!box) return;

  const desde = dprFiltro.desde
    ? dprFecha(dprFiltro.desde)
    : "-";

  const hasta = dprFiltro.hasta
    ? dprFecha(dprFiltro.hasta)
    : "-";

  box.innerHTML = `
    <div class="dpr-card dpr-kpi-mes">
      <h3>Periodo Consultado</h3>
      <p>${desde}</p>
      <p>${hasta}</p>
    </div>
  
    <div class="dpr-card dpr-kpi-3m">
      <h3>Ingreso Esperado en el Periodo</h3>
      <p>${dprMoney(data.total_periodo || 0)}</p>
    </div>
  
    <div class="dpr-card dpr-kpi-recibido">
      <h3>Ingreso Recibido</h3>
      <p>${dprMoney(data.pagado_total || 0)}</p>
    </div>
  
    <div class="dpr-card dpr-kpi-facturas">
      <h3>Facturas Pendientes</h3>
      <p>${Number(data.facturas_proyectadas || 0)}</p>
    </div>
  `;
}

// ======================================================
// MENSUAL
// ======================================================
async function dprCargarMensual() {
  const data = await dprApi(`/api/dashboard-proyecciones/proyeccion-mensual${dprGetQuery()}`);

  const ctx = dprEl("dprGraficaMensual").getContext("2d");

  if (dprChartMensual) dprChartMensual.destroy();

  dprChartMensual = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dprSafe(data).map(x => dprMes(x.mes)),
      datasets: [{
        label: "Ingreso proyectado",
        data: dprSafe(data).map(x => Number(x.total || 0)),
        backgroundColor: "#2f56a6",
        borderRadius: 8,
        maxBarThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => dprMoney(value)
          }
        }
      }
    }
  });
}





// ======================================================
// FUNCIÓN CORREGIDA:
// DETALLE PROYECCIÓN CON EMPRESA A CARGO
// ======================================================
async function dprCargarDetalle() {
  const data = await dprApi(
    `/api/dashboard-proyecciones/detalle${dprGetQuery()}`
  );

  const tbody = dprEl("dprTablaDetalle");

  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="dpr-empty-row">
          No hay registros
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.cliente || "-"}</td>
      <td>${row.empresa_a_cargo || "-"}</td>
      <td>${row.codigo_factura || "-"}</td>
      <td>${dprFecha(row.fecha_emision)}</td>
      <td>${dprFecha(row.fecha_vencimiento)}</td>
      <td>${dprMoney(row.valor_bruto)}</td>
      <td>${dprMoney(row.retencion_fuente)}</td>
      <td>${dprMoney(row.retencion_ica)}</td>
      <td>${dprMoney(row.valor_neto)}</td>
      <td>${dprMoney(row.pagado)}</td>
      <td>${dprMoney(row.pendiente_proyectado)}</td>
    </tr>
  `).join("");
}

function dprAplicarMesSiguiente() {
  const hoy = new Date();

  const inicio = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + 1,
    1
  );

  const fin = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + 2,
    0
  );

  dprSetRango(inicio, fin);
}