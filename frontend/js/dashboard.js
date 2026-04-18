let chartCategorias;

let filtroDashboard = {
  desde: null,
  hasta: null
};

// =========================
// INIT
// =========================
function initDashboard() {
  eventosDashboard(); 
  aplicarFiltroEsteMesPorDefecto();
  cargarDashboard();
}

// =========================
// CARGAR TODO
// =========================
async function cargarDashboard() {
  await cargarKPI();
  await cargarGraficaIngresosEgresos(); 
  await cargarRentabilidad();
  await cargarEstadoFacturacion();
  await cargarTopClientes(); 
}

// =========================
// KPI
// =========================
async function cargarKPI() {
  try {

    const query = getQueryFiltro();
    const data = await apiFetch(`/api/dashboard/kpi${query}`);

    renderKPIs(data);

  } catch (error) {
    console.error("Error KPI:", error);
  }
}

// =========================
// RENDER KPI
// =========================
function renderKPIs(data) {

  const container = document.getElementById("cardsDashboard");
  if (!container) return;

  const facturadosCantidad =
    data.facturas?.facturados?.cantidad ?? 0;

  const facturadosValor =
    data.facturas?.facturados?.valor ?? 0;

  const pendientesCantidad =
    data.facturas?.pendientes?.cantidad ?? 0;

  const pendientesValor =
    data.facturas?.pendientes?.valor ?? 0;

  const desde = data.periodo?.desde
    ? formatearFechaSafe(data.periodo.desde)
    : "--";
  
  const hasta = data.periodo?.hasta
    ? formatearFechaSafe(data.periodo.hasta)
    : "--";

  container.innerHTML = `

    <div class="card periodo">
      <h3>Periodo Consultado</h3>
      <p class="small-kpi">${desde}<br>${hasta}</p>
    </div>

    <div class="card ingreso">
      <h3>Ingresos Totales</h3>
      <p>${formatearMoneda(data.ingresos)}</p>
    </div>

    <div class="card egreso">
      <h3>Egresos Totales</h3>
      <p>${formatearMoneda(data.egresos)}</p>
    </div>

    <div class="card utilidad">
      <h3>Utilidad Neta</h3>
      <p>${formatearMoneda(data.utilidad)}</p>
    </div>

    <div class="card margen">
      <h3>Margen Rentabilidad</h3>
      <p>${Number(data.margen || 0).toFixed(1)}%</p>
    </div>

    <div class="card viajes">
      <h3>Total Viajes</h3>
      <p>${data.viajes}</p>
    </div>

    <div class="card facturas">
      <h3>Estado Facturación</h3>
    
      <p class="facturas-kpi">
        Total facturado:
        ${formatearMoneda(data.facturas.totalFacturado)}
        <br><br>
    
        Manifiestos facturados:
        ${data.facturas.facturados}
    
        <br>
    
        Pendientes por facturar:
        ${data.facturas.pendientes}
      </p>
    </div>

    <div class="card operacional">
      <h3>Gastos Operacionales</h3>
      <p>${formatearMoneda(data.gastosOperacionales)}</p>
    </div>
  `;
}


// =========================
// RENTABILIDAD
// =========================
async function cargarRentabilidad() {
  try {

    const query = getQueryFiltro();
    const data = await apiFetch(`/api/dashboard/rentabilidad${query}`);

    renderTablaRentabilidad(data);

  } catch (error) {
    console.error("Error rentabilidad:", error);
  }
}

// =========================
// TABLA RENTABILIDAD
// =========================
function renderTablaRentabilidad(data) {

  const tbody = document.getElementById("tablaRentabilidad");
  const tfoot = document.getElementById("tablaRentabilidadTotal");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (tfoot) {
    tfoot.innerHTML = "";
  }

  let totalFacturado = 0;
  let totalRetenciones = 0;
  let totalIngreso = 0;
  let totalEgreso = 0;
  let totalConductor = 0;
  let totalUtilidad = 0;

  data.forEach(row => {

    const facturado = Number(row.valor_facturado || 0);
    const retenciones = Number(row.retenciones || 0);
    const ingreso = Number(row.ingreso || 0);
    const egreso = Number(row.egreso || 0);
    const conductor = Number(row.gasto_conductor || 0);
    const utilidad = Number(row.utilidad || 0);

    const margen =
      ingreso > 0
        ? ((utilidad / ingreso) * 100).toFixed(1)
        : "0.0";

    totalFacturado += facturado;
    totalRetenciones += retenciones;
    totalIngreso += ingreso;
    totalEgreso += egreso;
    totalConductor += conductor;
    totalUtilidad += utilidad;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.id_manifiesto || "-"}</td>

      <td>${row.cliente || "Sin cliente"}</td>

      <td>${row.empresa_a_cargo || "Sin empresa"}</td>

      <td>${formatearMoneda(facturado)}</td>

      <td>${formatearMoneda(retenciones)}</td>

      <td>${formatearMoneda(ingreso)}</td>

      <td>${formatearMoneda(egreso)}</td>

      <td>${formatearMoneda(conductor)}</td>

      <td>${formatearMoneda(utilidad)}</td>

      <td>${margen}%</td>
    `;

    tbody.appendChild(tr);
  });

  if (tfoot) {

    const margenTotal =
      totalIngreso > 0
        ? ((totalUtilidad / totalIngreso) * 100).toFixed(1)
        : "0.0";

    tfoot.innerHTML = `
      <tr>
        <td colspan="3"><strong>TOTALES</strong></td>

        <td>${formatearMoneda(totalFacturado)}</td>

        <td>${formatearMoneda(totalRetenciones)}</td>

        <td>${formatearMoneda(totalIngreso)}</td>

        <td>${formatearMoneda(totalEgreso)}</td>

        <td>${formatearMoneda(totalConductor)}</td>

        <td>${formatearMoneda(totalUtilidad)}</td>

        <td>${margenTotal}%</td>
      </tr>
    `;
  }
}

// =========================
// HELPERS
// =========================
function formatearMoneda(valor) {
  if (!valor) return "$0";

  return "$ " + Number(valor).toLocaleString("es-CO");
}

function calcularMargen(ingreso, egreso) {
  if (!ingreso || ingreso === 0) return 0;

  const utilidad = ingreso - egreso;
  return ((utilidad / ingreso) * 100).toFixed(1);
}

// =========================
// GRAFICA INGRESO EGRESO
// =========================
async function cargarGraficaIngresosEgresos() {
  try {
    const query = getQueryFiltro();
    const data = await apiFetch(`/api/dashboard/grafica-ingresos-egresos${query}`);

    const labels = data.map(d => d.mes);
    const ingresos = data.map(d => Number(d.ingresos || 0));
    const egresos = data.map(d => Number(d.egresos || 0));

    const canvas = document.getElementById("graficaIE");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (window.graficaIEChart) {
      window.graficaIEChart.destroy();
    }

    const valueLabelsPlugin = {
      id: "valueLabelsPlugin",
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);

          meta.data.forEach((bar, index) => {
            const value = Number(dataset.data[index] || 0);
            if (!value) return;

            const label = "$ " + value.toLocaleString("es-CO");

            ctx.font = "bold 11px Arial";
            ctx.fillStyle = "#111";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            let y = bar.y - 8;
            if (y < 16) y = 16;

            ctx.fillText(label, bar.x, y);
          });
        });

        ctx.restore();
      }
    };

    window.graficaIEChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Ingresos",
            data: ingresos,
            backgroundColor: "#00a63e"
          },
          {
            label: "Egresos",
            data: egresos,
            backgroundColor: "#e53935"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: {
          padding: {
            top: 28
          }
        },
        plugins: {
          legend: {
            position: "top"
          },
          tooltip: {
            enabled: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grace: "10%",
            ticks: {
              callback(value) {
                return "$ " + Number(value).toLocaleString("es-CO");
              }
            }
          }
        }
      },
      plugins: [valueLabelsPlugin]
    });

  } catch (error) {
    console.error("Error gráfica:", error);
  }
}





// =========================
// EVENTOS FILTROS
// =========================
function eventosDashboard() {

  document.getElementById("btnMesActual")?.addEventListener("click", () => {
    const hoy = new Date();

    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    setFiltroFechas(inicio, fin);
  });

  document.getElementById("btnMesAnterior")?.addEventListener("click", () => {
    const hoy = new Date();

    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    setFiltroFechas(inicio, fin);
  });

  document.getElementById("btnLimpiarDashboard")?.addEventListener("click", () => {
    filtroDashboard = { desde: null, hasta: null };

    document.getElementById("fDesdeDashboard").value = "";
    document.getElementById("fHastaDashboard").value = "";

    cargarDashboard();
  });

  // inputs manuales
  ["fDesdeDashboard", "fHastaDashboard"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => {
      filtroDashboard.desde = document.getElementById("fDesdeDashboard").value;
      filtroDashboard.hasta = document.getElementById("fHastaDashboard").value;

      cargarDashboard();
    });
  });
  
  cargarSelectAniosDashboard();
  

  
  document.getElementById("btnQ1")?.addEventListener("click",()=>aplicarQuarter(1));
  document.getElementById("btnQ2")?.addEventListener("click",()=>aplicarQuarter(2));
  document.getElementById("btnQ3")?.addEventListener("click",()=>aplicarQuarter(3));
  document.getElementById("btnQ4")?.addEventListener("click",()=>aplicarQuarter(4));
  
  document.getElementById("btnS1")?.addEventListener("click",()=>aplicarSemestre(1));
  document.getElementById("btnS2")?.addEventListener("click",()=>aplicarSemestre(2));
  
  document.getElementById("btnAnioCompleto")?.addEventListener("click", () => {
    aplicarAnioCompleto();
  });
  
}



function setFiltroFechas(inicio, fin) {

  const desde = inicio.toISOString().split("T")[0];
  const hasta = fin.toISOString().split("T")[0];

  filtroDashboard.desde = desde;
  filtroDashboard.hasta = hasta;

  document.getElementById("fDesdeDashboard").value = desde;
  document.getElementById("fHastaDashboard").value = hasta;

  cargarDashboard();
}



function getQueryFiltro() {
  const params = new URLSearchParams();

  if (filtroDashboard.desde) params.append("desde", filtroDashboard.desde);
  if (filtroDashboard.hasta) params.append("hasta", filtroDashboard.hasta);

  return params.toString() ? `?${params.toString()}` : "";
}




async function cargarEstadoFacturacion() {
  try {

    const query = getQueryFiltro();
    const data = await apiFetch(`/api/dashboard/estado-facturacion${query}`);

    renderTablaEstadoFacturacion(data);

  } catch (error) {
    console.error("Error estado facturación:", error);
  }
}


function renderTablaEstadoFacturacion(data) {

  const tbody = document.getElementById("tablaEstadoFacturacion");
  const tfoot = document.getElementById("tablaEstadoFacturacionTotal");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (tfoot) {
    tfoot.innerHTML = "";
  }

  let totalFacturado = 0;
  let totalRetenciones = 0;
  let totalPagado = 0;
  let totalPendiente = 0;

  data.forEach(row => {

    const facturado = Number(row.total_facturado || 0);
    const retenciones = Number(row.retenciones || 0);
    const pagado = Number(row.pagado || 0);
    const pendiente = Number(row.pendiente || 0);

    totalFacturado += facturado;
    totalRetenciones += retenciones;
    totalPagado += pagado;
    totalPendiente += pendiente;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.cliente || "Sin cliente"}</td>

      <td>${row.empresa_a_cargo || "Sin empresa"}</td>

      <td>${formatearMoneda(facturado)}</td>

      <td>${formatearMoneda(retenciones)}</td>

      <td>${formatearMoneda(pagado)}</td>

      <td>${formatearMoneda(pendiente)}</td>
    `;

    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="2"><strong>TOTALES</strong></td>

        <td>${formatearMoneda(totalFacturado)}</td>

        <td>${formatearMoneda(totalRetenciones)}</td>

        <td>${formatearMoneda(totalPagado)}</td>

        <td>${formatearMoneda(totalPendiente)}</td>
      </tr>
    `;
  }
}



async function cargarTopClientes() {
  try {

    const query = getQueryFiltro();
    const data = await apiFetch(`/api/dashboard/top-clientes${query}`);

   

  } catch (error) {
    console.error("Error top clientes:", error);
  }
}





// ======================
// AÑOS
// ======================
function cargarSelectAniosDashboard() {
  const select = document.getElementById("filtroAnio");
  if (!select) return;

  const actual = new Date().getFullYear();

  select.innerHTML = "";

  for (let y = actual; y >= actual - 10; y--) {
    const op = document.createElement("option");
    op.value = y;
    op.textContent = y;
    select.appendChild(op);
  }
}

// ======================
// QUARTERS
// ======================
function aplicarQuarter(q) {
  const year = Number(document.getElementById("filtroAnio").value);

  const rangos = {
    1:[0,2],
    2:[3,5],
    3:[6,8],
    4:[9,11]
  };

  const [m1,m2] = rangos[q];

  const desde = new Date(year,m1,1);
  const hasta = new Date(year,m2+1,0);

  setFiltroFechas(desde,hasta);
}

// ======================
// SEMESTRES
// ======================
function aplicarSemestre(s) {
  const year = Number(document.getElementById("filtroAnio").value);

  const desde = new Date(year, s===1 ? 0 : 6,1);
  const hasta = new Date(year, s===1 ? 6 : 12,0);

  setFiltroFechas(desde,hasta);
}

function aplicarAnioCompleto() {
  const year = Number(document.getElementById("filtroAnio").value);

  const desde = new Date(year, 0, 1);
  const hasta = new Date(year, 11, 31);

  setFiltroFechas(desde, hasta);
}

function aplicarFiltroEsteMesPorDefecto() {
  const hoy = new Date();

  const desde = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  );

  const hasta = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + 1,
    0
  );

  setFiltroFechas(desde, hasta);
}