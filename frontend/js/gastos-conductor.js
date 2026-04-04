async function initGastosConductor() {
  await gc_cargarCatalogos();
  await gc_cargarGastos();
  gc_eventos();
}

let gc_catalogos = {};

// =========================
// CATALOGOS
// =========================
async function gc_cargarCatalogos() {
  try {
    gc_catalogos.conductores = await apiFetch("/api/conductores") || [];
    gc_catalogos.manifiestos = await apiFetch("/api/manifiestos") || [];
    gc_catalogos.transacciones = await apiFetch("/api/transacciones") || [];

    // ?? FILTROS
    gc_llenarSelect("fConductor", gc_catalogos.conductores, "nombre", "cedula");
    gc_llenarSelect("fManifiesto", gc_catalogos.manifiestos, "id_manifiesto", "id_manifiesto");
    gc_llenarSelect("fTipo", gc_catalogos.transacciones, "categoria", "id");

    // ?? MODAL
    gc_llenarSelect("id_conductor", gc_catalogos.conductores, "nombre", "cedula");
    gc_llenarSelect("id_manifiesto", gc_catalogos.manifiestos, "id_manifiesto", "id_manifiesto");
    gc_llenarSelect("id_transaccion", gc_catalogos.transacciones, "categoria", "id");

  } catch (error) {
    console.error("Error cargando catálogos:", error);
  }
}

// =========================
// GASTOS
// =========================
async function gc_cargarGastos() {
  const data = await apiFetch("/api/gastos-conductor") || [];

  const tbody = document.getElementById("tablaGastos");
  if (!tbody) return;

  // ?? FILTROS
  const fDesde = document.getElementById("fDesde")?.value;
  const fHasta = document.getElementById("fHasta")?.value;
  const fConductor = document.getElementById("fConductor")?.value;
  const fManifiesto = document.getElementById("fManifiesto")?.value;
  const fTipo = document.getElementById("fTipo")?.value;

  let filtrados = data;

  if (fDesde) filtrados = filtrados.filter(g => new Date(g.creado) >= new Date(fDesde));
  if (fHasta) filtrados = filtrados.filter(g => new Date(g.creado) <= new Date(fHasta));
  if (fConductor) filtrados = filtrados.filter(g => g.id_conductor == fConductor);
  if (fManifiesto) filtrados = filtrados.filter(g => g.id_manifiesto == fManifiesto);
  if (fTipo) filtrados = filtrados.filter(g => g.id_transaccion == fTipo);

  tbody.innerHTML = "";

  filtrados.forEach(g => {
    tbody.innerHTML += `
      <tr>
        <td>${gc_formatearFecha(g.creado)}</td>
        <td>${g.conductor_nombre || ""}</td>
        <td>${g.id_manifiesto || ""}</td>
        <td class="text-center">$${Number(g.valor || 0).toLocaleString()}</td>
        <td>${g.descripcion || ""}</td>
      </tr>
    `;
  });

  gc_calcularTotales(filtrados);
}

// =========================
// EVENTOS
// =========================
function gc_eventos() {

  // ABRIR MODAL
  document.getElementById("btnNuevoGasto")?.addEventListener("click", () => {
    gc_limpiarFormulario();
    document.getElementById("modalGasto").classList.remove("hidden");
  });

  // CERRAR MODAL
  document.getElementById("cerrarModal")?.addEventListener("click", () => {
    document.getElementById("modalGasto").classList.add("hidden");
  });

  // GUARDAR
  document.getElementById("guardarGasto")?.addEventListener("click", async () => {

    const body = {
      id_transaccion: document.getElementById("id_transaccion").value,
      id_conductor: document.getElementById("id_conductor").value,
      id_manifiesto: document.getElementById("id_manifiesto").value,
      descripcion: document.getElementById("descripcion").value,
      fecha: document.getElementById("fecha").value
    };

    if (!body.id_conductor || !body.id_transaccion) {
      alert("Completa los campos obligatorios");
      return;
    }

    await apiFetch("/api/gastos-conductor", {
      method: "POST",
      body: JSON.stringify(body)
    });

    document.getElementById("modalGasto").classList.add("hidden");

    await gc_cargarGastos();
  });

  // FILTRAR
  document.getElementById("btnFiltrar")?.addEventListener("click", gc_cargarGastos);

  // LIMPIAR FILTROS
  document.getElementById("btnLimpiar")?.addEventListener("click", () => {
    document.getElementById("fDesde").value = "";
    document.getElementById("fHasta").value = "";
    document.getElementById("fConductor").value = "";
    document.getElementById("fManifiesto").value = "";
    document.getElementById("fTipo").value = "";

    gc_cargarGastos();
  });
}

// =========================
// UTILIDADES
// =========================
function gc_llenarSelect(id, data, labelKey, valueKey) {
  const select = document.getElementById(id);
  if (!select || !Array.isArray(data)) return;

  select.innerHTML = `<option value="">Seleccione</option>`;

  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item[valueKey];

    // ?? MEJORA PARA TRANSACCIONES
    if (id === "id_transaccion" || id === "fTipo") {
      option.textContent = `${item.categoria} (${item.contexto})`;
    } else {
      option.textContent = item[labelKey];
    }

    select.appendChild(option);
  });
}

function gc_limpiarFormulario() {
  document.getElementById("id_conductor").value = "";
  document.getElementById("id_manifiesto").value = "";
  document.getElementById("id_transaccion").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("fecha").value = "";
}

function gc_formatearFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CO");
}

// =========================
// TOTALES
// =========================
function gc_calcularTotales(data) {
  const total = data.reduce((acc, g) => acc + Number(g.valor || 0), 0);
  const cantidad = data.length;
  const promedio = cantidad ? total / cantidad : 0;

  document.getElementById("totalGastos").textContent = `$${total.toLocaleString()}`;
  document.getElementById("totalCantidad").textContent = cantidad;
  document.getElementById("totalPromedio").textContent = `$${Math.round(promedio).toLocaleString()}`;
}