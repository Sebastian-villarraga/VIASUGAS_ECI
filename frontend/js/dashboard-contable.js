let dbcxChartFlujoBancos = null;
// =====================================
// DASHBOARD CONTABLE V2
// Visual igual al Gerencial
// Prefix total independiente: dbcx-
// =====================================

let dbcxFiltro = {
  desde: null,
  hasta: null
};

let dbcxChartEstadoResultados = null;
let dbcxChartUtilidadMensual = null;
let dbcxChartGastosCategoria = null;

// =====================================
// INIT
// =====================================
function initDashboardContable() {
  dbcxEventosDashboard();
  dbcxAplicarEsteMesPorDefecto();
  dbcxCargarDashboard();
}

// =====================================
// LOAD ALL
// =====================================
async function dbcxCargarDashboard() {
  await Promise.all([
    dbcxCargarKPI(),
    dbcxCargarEstadoResultadosMensual(),
    dbcxCargarUtilidadMensual(),
    dbcxCargarResumenMensual()
  ]);
}

// =====================================
// HELPERS
// =====================================
function dbcxGetQueryFiltro() {
  const params = new URLSearchParams();

  if (dbcxFiltro.desde) params.append("desde", dbcxFiltro.desde);
  if (dbcxFiltro.hasta) params.append("hasta", dbcxFiltro.hasta);

  return params.toString() ? `?${params.toString()}` : "";
}

function dbcxMoney(valor) {
  return "$ " + Number(valor || 0).toLocaleString("es-CO");
}

function dbcxPercent(valor) {
  return `${Number(valor || 0).toFixed(1)}%`;
}

function dbcxMes(mes) {
  if (!mes) return "-";

  const [anio, month] = mes.split("-");
  const fecha = new Date(Number(anio), Number(month) - 1, 1);

  return fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short"
  });
}

function dbcxFechaInput(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function dbcxFechaDisplay(fecha) {
  if (!fecha) return "--";

  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

// =====================================
// KPI
// =====================================
async function dbcxCargarKPI() {
  try {
    const data = await apiFetch(
      `/api/dashboard-contable/kpi${dbcxGetQueryFiltro()}`
    );

    dbcxRenderKPIs(data);

  } catch (error) {
    console.error("Error KPI:", error);
  }
}

function dbcxRenderKPIs(data) {

  const container = document.getElementById("dbcxCardsDashboard");
  if (!container) return;

  const desde = data.periodo?.desde
    ? dbcxFechaDisplay(data.periodo.desde)
    : "--";

  const hasta = data.periodo?.hasta
    ? dbcxFechaDisplay(data.periodo.hasta)
    : "--";

  container.innerHTML = `

    <div class="dbcx-card dbcx-periodo">
      <h3>Periodo Consultado</h3>
      <p class="dbcx-small-kpi">${desde}<br>${hasta}</p>
    </div>

    <div class="dbcx-card dbcx-ingreso">
      <h3>Ingresos Totales</h3>
      <p>${dbcxMoney(data.ingresos)}</p>
    </div>

    <div class="dbcx-card dbcx-egreso">
      <h3>Egresos Totales</h3>
      <p>${dbcxMoney(data.egresos)}</p>
    </div>

    <div class="dbcx-card dbcx-utilidad">
      <h3>Utilidad Contable</h3>
      <p>${dbcxMoney(data.utilidad)}</p>
    </div>

    <div class="dbcx-card dbcx-margen">
      <h3>Margen Contable</h3>
      <p>${dbcxPercent(data.margen)}</p>
    </div>

    <div class="dbcx-card dbcx-facturas">
      <h3>Facturas Emitidas</h3>
      <p>${Number(data.facturas_emitidas || 0)}</p>
    </div>

    <div class="dbcx-card dbcx-viajes">
      <h3>Egresos Operativos</h3>
      <p>${dbcxMoney(data.egresos_operativos)}</p>
    </div>

    <div class="dbcx-card dbcx-promedio">
      <h3>Facturación Total</h3>
      <p>${dbcxMoney(data.facturacion_total)}</p>
    </div>

  `;
}

// =====================================
// ESTADO RESULTADOS
// =====================================
async function dbcxCargarEstadoResultadosMensual() {
  try {

    const data = await apiFetch(
      `/api/dashboard-contable/estado-resultados-mensual${dbcxGetQueryFiltro()}`
    );

    dbcxRenderEstadoResultados(data);

  } catch (error) {
    console.error(error);
  }
}

function dbcxRenderEstadoResultados(data) {

  const canvas = document.getElementById("dbcxGraficaEstadoResultados");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dbcxChartEstadoResultados) {
    dbcxChartEstadoResultados.destroy();
  }

  dbcxChartEstadoResultados = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(x => dbcxMes(x.mes)),
      datasets: [
        {
          label: "Ingresos",
          data: data.map(x => Number(x.ingresos)),
          backgroundColor: "#00a63e"
        },
        {
          label: "Egresos",
          data: data.map(x => Number(x.egresos)),
          backgroundColor: "#e53935"
        },
        {
          label: "Utilidad",
          data: data.map(x => Number(x.utilidad)),
          type: "line",
          borderColor: "#2457ff",
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// =====================================
// UTILIDAD MENSUAL
// =====================================
async function dbcxCargarUtilidadMensual() {
  try {

    const data = await apiFetch(
      `/api/dashboard-contable/utilidad-mensual${dbcxGetQueryFiltro()}`
    );

    const canvas = document.getElementById("dbcxGraficaUtilidadMensual");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (dbcxChartUtilidadMensual) {
      dbcxChartUtilidadMensual.destroy();
    }

    dbcxChartUtilidadMensual = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map(x => dbcxMes(x.mes)),
        datasets: [{
          label: "Utilidad",
          data: data.map(x => Number(x.utilidad)),
          borderColor: "#2457ff",
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

  } catch (error) {
    console.error(error);
  }
}


// =====================================
// TABLA RESUMEN
// =====================================
async function dbcxCargarResumenMensual() {
  try {

    const data = await apiFetch(
      `/api/dashboard-contable/resumen-mensual${dbcxGetQueryFiltro()}`
    );

    const tbody = document.getElementById("dbcxTablaResumenMensual");
    if (!tbody) return;

    tbody.innerHTML = "";

    data.forEach(row => {

      tbody.innerHTML += `
        <tr>
          <td>${dbcxMes(row.mes)}</td>

          <td>
            ${row.facturas_emitidas}
          </td>

          <td class="dbcx-blue">
            ${dbcxMoney(row.total_facturado)}
          </td>

          <td class="dbcx-green">
            ${dbcxMoney(row.ingresos)}
          </td>

          <td class="dbcx-red">
            ${dbcxMoney(row.egresos)}
          </td>

          <td>
            ${dbcxMoney(row.utilidad)}
          </td>

          <td>
            ${dbcxPercent(row.margen)}
          </td>
        </tr>
      `;
    });

  } catch (error) {
    console.error(error);
  }
}



// =====================================
// FILTROS
// =====================================
function dbcxEventosDashboard() {

  document.getElementById("dbcxBtnMesActual")
  ?.addEventListener("click", () => {

    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0);

    dbcxSetFiltro(inicio, fin);
  });

  document.getElementById("dbcxBtnMesAnterior")
  ?.addEventListener("click", () => {

    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    dbcxSetFiltro(inicio, fin);
  });

  document.getElementById("dbcxBtnLimpiar")
  ?.addEventListener("click", () => {

    dbcxFiltro = { desde:null, hasta:null };

    document.getElementById("dbcxFechaDesde").value = "";
    document.getElementById("dbcxFechaHasta").value = "";

    dbcxCargarDashboard();
  });

  ["dbcxFechaDesde","dbcxFechaHasta"].forEach(id => {
    document.getElementById(id)
    ?.addEventListener("change", () => {

      dbcxFiltro.desde =
        document.getElementById("dbcxFechaDesde").value || null;

      dbcxFiltro.hasta =
        document.getElementById("dbcxFechaHasta").value || null;

      dbcxCargarDashboard();
    });
  });

  dbcxCargarSelectAnios();

  document.getElementById("dbcxBtnQ1")?.addEventListener("click",()=>dbcxQuarter(1));
  document.getElementById("dbcxBtnQ2")?.addEventListener("click",()=>dbcxQuarter(2));
  document.getElementById("dbcxBtnQ3")?.addEventListener("click",()=>dbcxQuarter(3));
  document.getElementById("dbcxBtnQ4")?.addEventListener("click",()=>dbcxQuarter(4));

  document.getElementById("dbcxBtnS1")?.addEventListener("click",()=>dbcxSemestre(1));
  document.getElementById("dbcxBtnS2")?.addEventListener("click",()=>dbcxSemestre(2));

  document.getElementById("dbcxBtnAnioCompleto")
  ?.addEventListener("click", dbcxAnioCompleto);
}

// =====================================
// FECHAS
// =====================================
function dbcxSetFiltro(inicio, fin){

  const desde = dbcxFechaInput(inicio);
  const hasta = dbcxFechaInput(fin);

  dbcxFiltro.desde = desde;
  dbcxFiltro.hasta = hasta;

  document.getElementById("dbcxFechaDesde").value = desde;
  document.getElementById("dbcxFechaHasta").value = hasta;

  dbcxCargarDashboard();
}

function dbcxAplicarEsteMesPorDefecto(){
  const hoy = new Date();

  dbcxSetFiltro(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    new Date(hoy.getFullYear(), hoy.getMonth()+1, 0)
  );
}

function dbcxCargarSelectAnios(){

  const select = document.getElementById("dbcxFiltroAnio");
  if(!select) return;

  const actual = new Date().getFullYear();

  for(let i=actual+1;i>=2023;i--){
    select.innerHTML += `<option value="${i}">${i}</option>`;
  }

  select.value = actual;

  select.addEventListener("change", dbcxAnioCompleto);
}

function dbcxQuarter(n){

  const anio = Number(
    document.getElementById("dbcxFiltroAnio").value
  );

  const inicioMes = (n-1)*3;

  dbcxSetFiltro(
    new Date(anio, inicioMes, 1),
    new Date(anio, inicioMes+3, 0)
  );
}

function dbcxSemestre(n){

  const anio = Number(
    document.getElementById("dbcxFiltroAnio").value
  );

  if(n===1){
    dbcxSetFiltro(
      new Date(anio,0,1),
      new Date(anio,6,0)
    );
  }else{
    dbcxSetFiltro(
      new Date(anio,6,1),
      new Date(anio,12,0)
    );
  }
}

function dbcxAnioCompleto(){

  const anio = Number(
    document.getElementById("dbcxFiltroAnio").value
  );

  dbcxSetFiltro(
    new Date(anio,0,1),
    new Date(anio,11,31)
  );
}




// -------------------------------------
// 1) Agregar al LOAD ALL
// Busca dbcxCargarDashboard()
// y agrega:
// -------------------------------------

async function dbcxCargarDashboard() {
  await Promise.all([
    dbcxCargarKPI(),
    dbcxCargarEstadoResultadosMensual(),
    dbcxCargarUtilidadMensual(),
    dbcxCargarResumenMensual(),
    dbcxCargarFlujoBancos()
  ]);
}


// -------------------------------------
// 2) NUEVA FUNCION COMPLETA
// -------------------------------------

async function dbcxCargarFlujoBancos() {
  try {

    const data = await apiFetch(
      `/api/dashboard-contable/flujo-bancos${dbcxGetQueryFiltro()}`
    );

    dbcxRenderTablaFlujoBancos(data);
    dbcxRenderGraficaFlujoBancos(data);

  } catch (error) {
    console.error("Error flujo bancos:", error);
  }
}


// -------------------------------------
// TABLA
// -------------------------------------

function dbcxRenderTablaFlujoBancos(data){

  const tbody = document.getElementById("dbcxTablaFlujoBancos");
  if(!tbody) return;

  tbody.innerHTML = "";

  if(!data.length){
    tbody.innerHTML = `
      <tr>
        <td colspan="3">Sin información</td>
      </tr>
    `;
    return;
  }

  data.forEach(row => {

    tbody.innerHTML += `
      <tr>
        <td>${row.banco}</td>

        <td class="dbcx-green">
          ${dbcxMoney(row.ingresos)}
        </td>

        <td class="dbcx-red">
          ${dbcxMoney(row.egresos)}
        </td>
      </tr>
    `;
  });
}


// -------------------------------------
// GRAFICA
// -------------------------------------

function dbcxRenderGraficaFlujoBancos(data){

  const canvas =
    document.getElementById("dbcxGraficaFlujoBancos");

  if(!canvas) return;

  const ctx = canvas.getContext("2d");

  if(dbcxChartFlujoBancos){
    dbcxChartFlujoBancos.destroy();
  }

  dbcxChartFlujoBancos = new Chart(ctx, {
    type:"bar",

    data:{
      labels:data.map(x => x.banco),

      datasets:[
        {
          label:"Entró",
          data:data.map(x => Number(x.ingresos)),
          backgroundColor:"#00a63e"
        },
        {
          label:"Salió",
          data:data.map(x => Number(x.egresos)),
          backgroundColor:"#e53935"
        }
      ]
    },

    options:{
      responsive:true,
      maintainAspectRatio:false,

      plugins:{
        legend:{
          position:"top"
        }
      },

      scales:{
        y:{
          beginAtZero:true,
          ticks:{
            callback(value){
              return "$ " + Number(value)
                .toLocaleString("es-CO");
            }
          }
        }
      }
    }
  });
}
