async function initTransacciones() {
  await cargarCatalogos();
  await cargarTransacciones();
  eventos();
}

let catalogos = {};

// =========================
// CATALOGOS
// =========================
async function cargarCatalogos() {
  catalogos.tipos = await apiFetch("/api/tipo-transaccion");
  catalogos.bancos = await apiFetch("/api/bancos");
  catalogos.manifiestos = await apiFetch("/api/manifiestos");

  // =========================
  // MODAL
  // =========================
  llenarSelect("tipo", catalogos.tipos, "categoria", "id");
  llenarSelect("banco", catalogos.bancos, "nombre_banco", "id");
  llenarSelect("manifiesto", catalogos.manifiestos, "id_manifiesto", "id_manifiesto");

  // =========================
  // FILTROS
  // =========================
  llenarSelect("fTipo", catalogos.tipos, "categoria", "tipo");
  llenarSelect("fBanco", catalogos.bancos, "nombre_banco", "id");
  llenarSelect("fManifiesto", catalogos.manifiestos, "id_manifiesto", "id_manifiesto");
}

// =========================
// TRANSACCIONES
// =========================
async function cargarTransacciones() {

  const params = new URLSearchParams();

  const fDesde = document.getElementById("fDesde").value;
  const fHasta = document.getElementById("fHasta").value;
  const fTipo = document.getElementById("fTipo").value;
  const fBanco = document.getElementById("fBanco").value;
  const fManifiesto = document.getElementById("fManifiesto").value;

  if (fDesde) params.append("fecha_desde", fDesde);
  if (fHasta) params.append("fecha_hasta", fHasta);
  if (fTipo) params.append("tipo", fTipo);
  if (fBanco) params.append("id_banco", fBanco);
  if (fManifiesto) params.append("id_manifiesto", fManifiesto);

  const url = `/api/transacciones?${params.toString()}`;

  const data = await apiFetch(url) || [];

  const tbody = document.getElementById("tablaTransacciones");
  tbody.innerHTML = "";

  let ingresos = 0;
  let egresos = 0;

  data.forEach(t => {

    if (t.es_gasto_conductor) return;

    if (t.tipo === "INGRESO MANIFIESTO") ingresos += Number(t.valor);
    else egresos += Number(t.valor);

    const badge = getBadge(t);

    tbody.innerHTML += `
      <tr>
        <td>${formatearFecha(t.fecha_pago?.split("T")[0])}</td>
        <td>${badge}</td>
        <td>${t.nombre_banco || ""}</td>
        <td>${t.id_manifiesto || "-"}</td>
        <td>$${Number(t.valor).toLocaleString()}</td>
        <td>${t.descripcion || ""}</td>
      </tr>
    `;
  });

  document.getElementById("totalIngresos").innerText = format(ingresos);
  document.getElementById("totalEgresos").innerText = format(egresos);
  document.getElementById("totalUtilidad").innerText = format(ingresos - egresos);
  

  
  let textoFechas = "Sin filtro";
  
  if (fDesde && fHasta) {
    textoFechas = `${formatearFecha(fDesde)} - ${formatearFecha(fHasta)}`;
  } else if (fDesde) {
    textoFechas = `Desde ${formatearFecha(fDesde)}`;
  } else if (fHasta) {
    textoFechas = `Hasta ${formatearFecha(fHasta)}`;
  }
  
  document.getElementById("fechasConsultadas").innerText = textoFechas;
}

// =========================
// BADGES
// =========================
function getBadge(t) {

  if (t.tipo === "INGRESO MANIFIESTO") {
    return `<span class="badge ingreso">Ingreso Manifiesto</span>`;
  }

  if (t.tipo === "EGRESO MANIFIESTO") {
    return `<span class="badge egreso">Egreso Manifiesto</span>`;
  }

  if (t.tipo === "EGRESO OPERACIONAL") {
    return `<span class="badge operacional">Egreso Operacional</span>`;
  }

  return `<span class="badge">Sin tipo</span>`;
}

// =========================
// EVENTOS
// =========================
function eventos() {

  // =========================
  // ABRIR MODAL
  // =========================
  document.getElementById("btnNuevaTransaccion")?.addEventListener("click", () => {
    document.getElementById("modalTransaccion").classList.remove("hidden");
  });

  // =========================
  // FILTROS DINAMICOS
  // =========================
  ["fDesde","fHasta","fTipo","fBanco","fManifiesto"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", cargarTransacciones);
  });

  // =========================
  // BOTON LIMPIAR
  // =========================
  document.getElementById("btnLimpiar")?.addEventListener("click", () => {

    ["fDesde","fHasta","fTipo","fBanco","fManifiesto"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    cargarTransacciones();
  });

  // =========================
  // CAMBIO DE TIPO (MODAL)
  // =========================
  document.getElementById("tipo")?.addEventListener("change", (e) => {
    const tipo = e.target.value;

    const wrapManifiesto = document.getElementById("wrapManifiesto");
    const wrapFactura = document.getElementById("wrapFactura");

    if (tipo === "EGRESO OPERACIONAL") {
      wrapManifiesto.style.display = "none";
      wrapFactura.style.display = "none";
    } else {
      wrapManifiesto.style.display = "block";

      if (tipo === "INGRESO MANIFIESTO") {
        wrapFactura.style.display = "block";
      } else {
        wrapFactura.style.display = "none";
      }
    }
  });

  // =========================
  // ESTE MES
  // =========================
  document.getElementById("btnEsteMes")?.addEventListener("click", () => {

    const hoy = new Date();

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = hoy;

    document.getElementById("fDesde").value = formatearFechaInput(inicioMes);
    document.getElementById("fHasta").value = formatearFechaInput(finMes);

    cargarTransacciones();
  });

  // =========================
  // MES ANTERIOR
  // =========================
  document.getElementById("btnMesAnterior")?.addEventListener("click", () => {

    const hoy = new Date();

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    document.getElementById("fDesde").value = formatearFechaInput(inicioMes);
    document.getElementById("fHasta").value = formatearFechaInput(finMes);

    cargarTransacciones();
  });

}


function llenarSelect(id, data, labelKey, valueKey) {
  const select = document.getElementById(id);

  if (!select) return;

  select.innerHTML = `<option value="">Seleccione</option>`;

  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = item[labelKey];
    select.appendChild(option);
  });
}

