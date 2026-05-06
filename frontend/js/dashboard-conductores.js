let dcFiltro = {
  desde: null,
  hasta: null,
  conductor: null
};

// =========================
// INIT
// =========================
function initDashboardConductores() {
  dcEventos();
  dcSetDefaultDates();
  dcCargarConductores();
  dcCargarTabla();
}

// =========================
// DEFAULT FECHAS
// =========================
function dcSetDefaultDates() {
  const hoy = new Date();

  const desde = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  );

  const hasta = hoy;

  const d1 = formatearFechaInput(desde);
  const d2 = formatearFechaInput(hasta);

  document.getElementById("dcDesde").value = d1;
  document.getElementById("dcHasta").value = d2;

  dcFiltro.desde = d1;
  dcFiltro.hasta = d2;
}

// =========================
// QUERY
// =========================
function dcGetQuery() {
  const params = new URLSearchParams();

  if (dcFiltro.desde) params.append("desde", dcFiltro.desde);
  if (dcFiltro.hasta) params.append("hasta", dcFiltro.hasta);
  if (dcFiltro.conductor) params.append("conductor", dcFiltro.conductor);

  return params.toString() ? `?${params.toString()}` : "";
}

// =========================
// CARGAR CONDUCTORES
// =========================
async function dcCargarConductores() {
  try {
    const data = await apiFetch("/api/dashboard-conductores/conductores");

    const select = document.getElementById("dcConductor");

    data.forEach(c => {
      const op = document.createElement("option");
      op.value = c.nombre;
      op.textContent = c.nombre;
      select.appendChild(op);
    });

  } catch (error) {
    console.error("Error conductores:", error);
  }
}

// =========================
// CARGAR TABLA
// =========================
async function dcCargarTabla() {
  try {
    const data = await apiFetch(
      `/api/dashboard-conductores${dcGetQuery()}`
    );

    dcRenderTabla(data);

  } catch (error) {
    console.error("Error tabla:", error);
  }
}

// =========================
// RENDER TABLA
// =========================
function dcRenderTabla(data) {

  const tbody = document.getElementById("dcBody");
  const tfoot = document.getElementById("dcFooter");

  if (!tbody) return;

  tbody.innerHTML = "";
  tfoot.innerHTML = "";

  let tValor = 0;
  let tComisiones = 0;
  let tBase = 0;
  let tPorcentaje = 0;
  let tAnticipo = 0;
  let tGastos = 0;
  let tSaldo = 0;
  let tTotal = 0;

  data.forEach(r => {

    const valor = Number(r.valor_total || 0);
    const comisiones = Number(r.comisiones || 0);
    const base = Number(r.base || 0);
    const porcentaje = Number(r.porcentaje_conductor || 0);
    const anticipo = Number(r.anticipo || 0);
    const gastos = Number(r.gastos || 0);
    const saldo = Number(r.saldo || 0);
    const total = Number(r.total_pago || 0);

    tValor += valor;
    tComisiones += comisiones;
    tBase += base;
    tPorcentaje += porcentaje;
    tAnticipo += anticipo;
    tGastos += gastos;
    tSaldo += saldo;
    tTotal += total;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.id_manifiesto}</td>
      <td>${formatearFechaSafe(r.fecha)}</td>
      <td>${r.conductor}</td>
      <td>${format(valor)}</td>
      <td>${format(comisiones)}</td>
      <td>${format(base)}</td>
      <td>${format(porcentaje)}</td>
      <td>${format(anticipo)}</td>
      <td>${format(gastos)}</td>
      <td>${format(saldo)}</td>
      <td>${format(total)}</td>
    `;

    tbody.appendChild(tr);
  });

  tfoot.innerHTML = `
    <tr>
      <td colspan="3"><strong>TOTALES</strong></td>
      <td>${format(tValor)}</td>
      <td>${format(tComisiones)}</td>
      <td>${format(tBase)}</td>
      <td>${format(tPorcentaje)}</td>
      <td>${format(tAnticipo)}</td>
      <td>${format(tGastos)}</td>
      <td>${format(tSaldo)}</td>
      <td>${format(tTotal)}</td>
    </tr>
  `;
}

// =========================
// EVENTOS
// =========================
function dcEventos() {

  document.getElementById("dcDesde")?.addEventListener("change", e => {
    dcFiltro.desde = e.target.value;
    dcCargarTabla();
  });

  document.getElementById("dcHasta")?.addEventListener("change", e => {
    dcFiltro.hasta = e.target.value;
    dcCargarTabla();
  });

  document.getElementById("dcConductor")?.addEventListener("change", e => {
    dcFiltro.conductor = e.target.value;
    dcCargarTabla();
  });

  document.getElementById("dcLimpiar")?.addEventListener("click", () => {
    dcSetDefaultDates();
    dcFiltro.conductor = null;
    document.getElementById("dcConductor").value = "";
    dcCargarTabla();
  });
}