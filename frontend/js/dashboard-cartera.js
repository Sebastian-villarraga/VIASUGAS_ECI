// =====================================================
// DASHBOARD CARTERA PREMIUM JS
// CSS/HTML nuevos con prefijo dcrt-
// Lógica original de cartera preservada
// =====================================================

let dcrtFiltro = {
  desde: null,
  hasta: null
};

let dcrtChartAging = null;
let dcrtChartTopDeudores = null;

// =====================================================
// INIT
// =====================================================
function initDashboardCartera() {
  dcrtConfigurarEventos();
  dcrtCargarSelectAnio();
  dcrtAplicarEsteMesPorDefecto();
}

// =====================================================
// LOAD ALL
// =====================================================
async function dcrtCargarDashboard() {
  try {
    await Promise.all([
      dcrtCargarKPI(),
      dcrtCargarAging(),
      dcrtCargarTopDeudores(),
      dcrtCargarFacturasVencidas(),
      dcrtCargarDetalle()
    ]);
  } catch (error) {
    console.error("Error cargando dashboard cartera:", error);
  }
}

// =====================================================
// HELPERS
// =====================================================
function dcrtGetQuery() {
  const params = new URLSearchParams();

  if (dcrtFiltro.desde) params.append("desde", dcrtFiltro.desde);
  if (dcrtFiltro.hasta) params.append("hasta", dcrtFiltro.hasta);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function dcrtMoney(valor) {
  return "$ " + Number(valor || 0).toLocaleString("es-CO");
}

function dcrtNum(valor) {
  return Number(valor || 0);
}

function dcrtFecha(fecha) {
  if (!fecha) return "-";

  // evita desfases por timezone
  const fechaStr = String(fecha).includes("T")
    ? String(fecha).split("T")[0]
    : String(fecha);

  const [year, month, day] = fechaStr.split("-");
  if (!year || !month || !day) return "-";

  return `${day}/${month}/${year}`;
}

function dcrtFechaInput(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function dcrtGetBucket(dias) {
  dias = Number(dias || 0);

  if (dias <= 0) return "Corriente";
  if (dias <= 30) return "1-30";
  if (dias <= 60) return "31-60";
  if (dias <= 90) return "61-90";
  return "+90";
}

// =====================================================
// KPI
// =====================================================
async function dcrtCargarKPI() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/kpi${dcrtGetQuery()}`);
    dcrtRenderKPIs(data);
  } catch (error) {
    console.error("Error KPI:", error);
  }
}

function dcrtRenderKPIs(data) {
  const box = document.getElementById("dcrtCardsDashboard");
  if (!box) return;

  const desde = dcrtFiltro.desde ? dcrtFecha(dcrtFiltro.desde) : "--";
  const hasta = dcrtFiltro.hasta ? dcrtFecha(dcrtFiltro.hasta) : "--";

  box.innerHTML = `
    <div class="dcrt-card dcrt-periodo">
      <h3>Periodo Consultado</h3>
      <p class="dcrt-small">${desde}<br>${hasta}</p>
    </div>

    <div class="dcrt-card dcrt-total">
      <h3>Cartera Total</h3>
      <p>${dcrtMoney(data.cartera_total)}</p>
    </div>

    <div class="dcrt-card dcrt-vencida">
      <h3>Cartera Vencida</h3>
      <p>${dcrtMoney(data.cartera_vencida)}</p>
    </div>

    <div class="dcrt-card dcrt-corriente">
      <h3>Cartera Corriente</h3>
      <p>${dcrtMoney(data.cartera_corriente)}</p>
    </div>

    <div class="dcrt-card dcrt-clientes">
      <h3>Clientes con Deuda</h3>
      <p>${dcrtNum(data.clientes_con_deuda)}</p>
    </div>

    <div class="dcrt-card dcrt-facturas">
      <h3>Facturas Pendientes</h3>
      <p>${dcrtNum(data.facturas_pendientes)}</p>
    </div>

    <div class="dcrt-card dcrt-mora">
      <h3>Mora Promedio</h3>
      <p>${dcrtNum(data.mora_promedio)} días</p>
    </div>

    <div class="dcrt-card dcrt-retenciones">
      <h3>Retenciones</h3>
      <p>${dcrtMoney(data.retenciones_total)}</p>
    </div>
  `;
}

// =====================================================
// AGING
// =====================================================
async function dcrtCargarAging() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/aging${dcrtGetQuery()}`);
    dcrtRenderAging(data);
  } catch (error) {
    console.error("Error aging:", error);
  }
}

function dcrtRenderAging(data) {
  const canvas = document.getElementById("dcrGraficaAging");
  if (!canvas) return;

  if (dcrtChartAging) dcrtChartAging.destroy();

  const labels = data.map(x => x.rango);
  const valores = data.map(x => dcrtNum(x.total));

  dcrtChartAging = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: valores,
          backgroundColor: [
            "#3498db",
            "#ef5b7a",
            "#f39c34",
            "#e9b949",
            "#56b8b8"
          ],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "52%",
      plugins: {
        legend: {
          position: "top"
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${dcrtMoney(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

// =====================================================
// TOP DEUDORES
// =====================================================
async function dcrtCargarTopDeudores() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/top-deudores${dcrtGetQuery()}`);
    dcrtRenderTopDeudores(data);
  } catch (error) {
    console.error("Error top deudores:", error);
  }
}

function dcrtRenderTopDeudores(data) {
  const canvas = document.getElementById("dcrGraficaTopDeudores");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dcrtChartTopDeudores) dcrtChartTopDeudores.destroy();

  const labels = data.map(x => x.cliente);
  const valores = data.map(x => dcrtNum(x.total));

  dcrtChartTopDeudores = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Pendiente",
          data: valores,
          borderRadius: 8,
          backgroundColor: "#2f56a6"
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
              return dcrtMoney(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback(value) {
              return dcrtMoney(value);
            }
          }
        }
      }
    }
  });
}

// =====================================================
// FACTURAS VENCIDAS
// =====================================================
async function dcrtCargarFacturasVencidas() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/facturas-vencidas${dcrtGetQuery()}`);
    dcrtRenderFacturasVencidas(data);
  } catch (error) {
    console.error("Error facturas vencidas:", error);
  }
}

function dcrtRenderFacturasVencidas(data) {
  const tbody = document.getElementById("dcrTablaFacturasVencidas");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="dcr-empty-row">
          No hay facturas vencidas.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(row => `
    <tr>
      <td>${row.codigo_factura}</td>
      <td>${row.cliente || "-"}</td>
      <td>${row.empresa_a_cargo || "-"}</td>
      <td>${dcrtFecha(row.fecha_emision)}</td>
      <td>${dcrtFecha(row.fecha_vencimiento)}</td>
      <td class="dcrt-center dcrt-red">${row.dias_vencido}</td>
      <td class="dcrt-center dcrt-red">${dcrtMoney(row.pendiente)}</td>
    </tr>
  `).join("");
}

// =====================================================
// DETALLE
// =====================================================
async function dcrtCargarDetalle() {
  try {
    const data = await apiFetch(`/api/dashboard-cartera/detalle${dcrtGetQuery()}`);
    dcrtRenderDetalle(data);
  } catch (error) {
    console.error("Error detalle:", error);
  }
}

function dcrtRenderDetalle(data) {
  const tbody = document.getElementById("dcrTablaDetalle");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="dcr-empty-row">
          No hay cartera pendiente.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(row => {
    const bucket = dcrtGetBucket(row.dias_vencido);

    return `
      <tr>
        <td>${row.cliente || "-"}</td>
        <td>${row.empresa_a_cargo || "-"}</td>
        <td>${row.codigo_factura}</td>
        <td>${dcrtMoney(row.valor_bruto)}</td>
        <td>${dcrtMoney(row.retencion_fuente)}</td>
        <td>${dcrtMoney(row.retencion_ica)}</td>
        <td>${dcrtMoney(row.valor_neto)}</td>
        <td>${dcrtMoney(row.pagado)}</td>
        <td>${dcrtMoney(row.pendiente)}</td>
        <td>${dcrtFecha(row.fecha_vencimiento)}</td>
        <td>${bucket}</td>
      </tr>
    `;
  }).join("");
}

// =====================================================
// FILTROS
// =====================================================
function dcrtConfigurarEventos() {
  document.getElementById("dcrtBtnMesActual")
    ?.addEventListener("click", () => {
      const hoy = new Date();

      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      dcrtAplicarFechas(desde, hasta);
    });

  document.getElementById("dcrtBtnMesAnterior")
    ?.addEventListener("click", () => {
      const hoy = new Date();

      const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

      dcrtAplicarFechas(desde, hasta);
    });

  document.getElementById("dcrtBtnLimpiar")
    ?.addEventListener("click", () => {
      dcrtFiltro = { desde: null, hasta: null };

      const fechaDesde = document.getElementById("dcrtFechaDesde");
      const fechaHasta = document.getElementById("dcrtFechaHasta");

      if (fechaDesde) fechaDesde.value = "";
      if (fechaHasta) fechaHasta.value = "";

      dcrtCargarDashboard();
    });

  document.getElementById("dcrtFechaDesde")
    ?.addEventListener("change", (e) => {
      dcrtFiltro.desde = e.target.value || null;
      dcrtCargarDashboard();
    });

  document.getElementById("dcrtFechaHasta")
    ?.addEventListener("change", (e) => {
      dcrtFiltro.hasta = e.target.value || null;
      dcrtCargarDashboard();
    });

  document.getElementById("dcrtBtnQ1")?.addEventListener("click", () => dcrtQuarter(1));
  document.getElementById("dcrtBtnQ2")?.addEventListener("click", () => dcrtQuarter(2));
  document.getElementById("dcrtBtnQ3")?.addEventListener("click", () => dcrtQuarter(3));
  document.getElementById("dcrtBtnQ4")?.addEventListener("click", () => dcrtQuarter(4));

  document.getElementById("dcrtBtnS1")?.addEventListener("click", () => dcrtSemestre(1));
  document.getElementById("dcrtBtnS2")?.addEventListener("click", () => dcrtSemestre(2));

  document.getElementById("dcrtBtnAnioCompleto")
    ?.addEventListener("click", dcrtAnioCompleto);

  document.getElementById("dcrtFiltroAnio")
    ?.addEventListener("change", () => {
      // no dispara nada solo al cambiar año;
      // queda listo para quarter/semestre/año completo
    });
}

function dcrtAplicarFechas(desdeDate, hastaDate) {
  const desde = dcrtFechaInput(desdeDate);
  const hasta = dcrtFechaInput(hastaDate);

  dcrtFiltro.desde = desde;
  dcrtFiltro.hasta = hasta;

  const fechaDesde = document.getElementById("dcrtFechaDesde");
  const fechaHasta = document.getElementById("dcrtFechaHasta");

  if (fechaDesde) fechaDesde.value = desde;
  if (fechaHasta) fechaHasta.value = hasta;

  dcrtCargarDashboard();
}

function dcrtAplicarEsteMesPorDefecto() {
  const hoy = new Date();

  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  dcrtAplicarFechas(desde, hasta);
}

function dcrtCargarSelectAnio() {
  const select = document.getElementById("dcrtFiltroAnio");
  if (!select) return;

  const actual = new Date().getFullYear();
  select.innerHTML = "";

  for (let y = actual + 1; y >= actual - 5; y--) {
    select.innerHTML += `<option value="${y}">${y}</option>`;
  }

  select.value = actual;
}

function dcrtQuarter(q) {
  const select = document.getElementById("dcrtFiltroAnio");
  const year = Number(select?.value || new Date().getFullYear());
  const startMonth = (q - 1) * 3;

  dcrtAplicarFechas(
    new Date(year, startMonth, 1),
    new Date(year, startMonth + 3, 0)
  );
}

function dcrtSemestre(s) {
  const select = document.getElementById("dcrtFiltroAnio");
  const year = Number(select?.value || new Date().getFullYear());

  if (s === 1) {
    dcrtAplicarFechas(
      new Date(year, 0, 1),
      new Date(year, 6, 0)
    );
  } else {
    dcrtAplicarFechas(
      new Date(year, 6, 1),
      new Date(year, 12, 0)
    );
  }
}

function dcrtAnioCompleto() {
  const select = document.getElementById("dcrtFiltroAnio");
  const year = Number(select?.value || new Date().getFullYear());

  dcrtAplicarFechas(
    new Date(year, 0, 1),
    new Date(year, 12, 0)
  );
}