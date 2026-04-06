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
  const data = await apiFetch("/api/transacciones");

  const tbody = document.getElementById("tablaTransacciones");
  tbody.innerHTML = "";

  let ingresos = 0;
  let egresos = 0;

  data.forEach(t => {

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
}

// =========================
// BADGES
// =========================
function getBadge(t) {

  if (t.es_gasto_conductor) {
    return `<span class="badge conductor">Gasto conductor</span>`;
  }

  if (t.tipo === "INGRESO MANIFIESTO") {
    return `<span class="badge ingreso">Ingreso</span>`;
  }

  if (t.tipo === "EGRESO OPERACIONAL") {
    return `<span class="badge operacional">Operacional</span>`;
  }

  return `<span class="badge egreso">Egreso</span>`;
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
  // CAMBIO DE TIPO
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

