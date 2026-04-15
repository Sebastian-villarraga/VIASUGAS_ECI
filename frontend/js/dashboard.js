let chartCategorias;

let filtroDashboard = {
  desde: null,
  hasta: null
};

// =========================
// INIT
// =========================
function initDashboard() {
  cargarDashboard();
}

// =========================
// CARGAR TODO
// =========================
async function cargarDashboard() {
  await cargarKPI();
  await cargarGraficaIngresosEgresos(); 
  await cargarRentabilidad();
  await cargarGraficaCategorias();
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

  container.innerHTML = `
    <div class="card ingreso">
      <h3>Ingresos</h3>
      <p>${formatearMoneda(data.ingresos)}</p>
    </div>

    <div class="card egreso">
      <h3>Egresos</h3>
      <p>${formatearMoneda(data.egresos)}</p>
    </div>

    <div class="card utilidad">
      <h3>Utilidad</h3>
      <p>${formatearMoneda(data.utilidad)}</p>
    </div>

    <div class="card viajes">
      <h3>Viajes</h3>
      <p>${data.viajes}</p>
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
  if (!tbody) return;

  tbody.innerHTML = "";

  data.forEach(row => {

    const tr = document.createElement("tr");

    const margen = calcularMargen(row.ingreso, row.egreso);

    tr.innerHTML = `
      <td>${row.id_manifiesto}</td>
      <td>${row.cliente || "-"}</td>
      <td class="text-green">${formatearMoneda(row.ingreso)}</td>
      <td class="text-red">${formatearMoneda(row.egreso)}</td>
      <td>${formatearMoneda(row.utilidad)}</td>
      <td>${margen}%</td>
    `;

    tbody.appendChild(tr);
  });
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
    const ingresos = data.map(d => Number(d.ingresos));
    const egresos = data.map(d => Number(d.egresos));

    const canvas = document.getElementById("graficaIE");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (window.graficaIEChart) {
      window.graficaIEChart.destroy();
    }

    window.graficaIEChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Ingresos", data: ingresos },
          { label: "Egresos", data: egresos }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

  } catch (error) {
    console.error("Error gráfica:", error);
  }
}

async function cargarGraficaCategorias() {
  try {

    const query = getQueryFiltro();
    const data = await apiFetch(`/api/dashboard/gastos-categoria${query}`);

    renderGraficaCategorias(data);

  } catch (error) {
    console.error("Error gráfica categorías:", error);
  }
}


// =========================
// RENDER GRAFICA
// =========================
function renderGraficaCategorias(data) {

  const ctx = document.getElementById("graficaCategorias");
  if (!ctx) return;

  // ?? destruir instancia previa
  if (window.chartCategorias) {
    window.chartCategorias.destroy();
  }

  const labels = data.map(d => d.tipo);
  const valores = data.map(d => Number(d.total));

  // ?? TOTAL
  const total = valores.reduce((acc, val) => acc + val, 0);

  // ?? PORCENTAJES
  const porcentajes = valores.map(v => total ? ((v / total) * 100) : 0);

  // ?? TEXTO CENTRAL (FIX REAL)
  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
      const { width, height } = chart;
      const ctx = chart.ctx;

      ctx.save();

      // ?? tamaño fijo (evita deformación)
      ctx.font = "600 16px sans-serif";
      ctx.fillStyle = "#2c3e50";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const text = "$ " + total.toLocaleString("es-CO");

      ctx.fillText(text, width / 2, height / 2);

      ctx.restore();
    }
  };

  window.chartCategorias = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels,
      datasets: [{
        data: valores,

        // ?? COLORES LIMPIOS
        backgroundColor: [
          "#3498db", // azul
          "#e74c3c", // rojo
          "#f39c12"  // naranja
        ],

        borderWidth: 0
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false, // ?? CLAVE
      cutout: "70%",

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 12 },
            padding: 15
          }
        },

        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const porcentaje = porcentajes[context.dataIndex].toFixed(1);

              return `${context.label}: $ ${value.toLocaleString("es-CO")} (${porcentaje}%)`;
            }
          }
        }
      }
    },

    plugins: [centerTextPlugin]
  });
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