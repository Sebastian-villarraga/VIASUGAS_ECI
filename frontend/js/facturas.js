async function initFacturas() {
  await cargarCatalogosFacturas();
  await cargarFacturas();
  eventosFacturas();
}

let catalogosFacturas = {};

// =========================
// CATALOGOS
// =========================
async function cargarCatalogosFacturas() {
  catalogosFacturas.manifiestos = await apiFetch("/api/facturas/manifiestos");

  // =========================
  // MODAL
  // =========================
  llenarSelectManifiesto(
    "manifiestoFactura",
    catalogosFacturas.manifiestos
  );

  // =========================
  // FILTROS
  // =========================
  llenarSelectManifiesto(
    "fManifiesto",
    catalogosFacturas.manifiestos
  );
}

let facturasData = [];

// =========================
// FACTURAS
// =========================
async function cargarFacturas() {
  try {
    facturasData = await apiFetch("/api/facturas");

    console.log("FACTURAS:", facturasData); // ?? DEBUG

    if (!Array.isArray(facturasData)) {
      console.error("No llegaron datos válidos");
      facturasData = [];
    }

    aplicarFiltrosFacturas();

  } catch (error) {
    console.error("Error cargando facturas:", error);
    facturasData = [];
  }
}
// =========================
// FILTRAR + RENDER
// =========================
function aplicarFiltrosFacturas() {

  const desde = document.getElementById("fDesde")?.value || "";
  const hasta = document.getElementById("fHasta")?.value || "";
  const codigo = document.getElementById("fCodigo")?.value?.toLowerCase() || "";
  const manifiesto = document.getElementById("fManifiesto")?.value || "";

  let filtradas = facturasData.filter(f => {

    const fecha = f.fecha_emision ? f.fecha_emision.split("T")[0] : "";

    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;

    if (codigo && !f.codigo_factura?.toLowerCase().includes(codigo)) return false;

    if (manifiesto && f.id_manifiesto !== manifiesto) return false;

    return true;
  });

  renderFacturas(filtradas);
}

// =========================
// RENDER
// =========================
function renderFacturas(data) {

  const tbody = document.getElementById("tablaFacturas");

  if (!tbody) {
    console.error("No existe tablaFacturas en el DOM");
    return;
  }

  tbody.innerHTML = "";

  // ?? FIX: colspan correcto (ahora tienes 10 columnas)
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">Sin datos</td></tr>`;
    return;
  }

  let totalFacturado = 0;
  let totalRetenciones = 0;

  data.forEach(f => {

    const valor = Number(f.valor || 0);
    const retFuente = Number(f.retencion_fuente || 0);
    const retIca = Number(f.retencion_ica || 0);
    const neto = valor - retFuente - retIca;

    totalFacturado += valor;
    totalRetenciones += (retFuente + retIca);

    // ?? DEBUG (puedes borrarlo luego)
    // console.log("Factura render:", f);

    const estadoHTML = getEstadoFactura(f);

    const accionesHTML = (f.estado === "pagada")
      ? `<span style="color:#27ae60;font-weight:600;">? Pagada</span>`
      : `<button class="btn-pagar" onclick="pagarFactura('${f.codigo_factura}')">Pagar</button>`;

    tbody.innerHTML += `
      <tr>
        <td>${f.codigo_factura || "-"}</td>
        <td>${f.id_manifiesto || "-"} - ${f.cliente_nombre || ""}</td>
        <td>${f.fecha_emision ? formatearFecha(f.fecha_emision.split("T")[0]) : "-"}</td>
        <td>${f.fecha_vencimiento ? formatearFecha(f.fecha_vencimiento.split("T")[0]) : "-"}</td>
        <td>$${valor.toLocaleString()}</td>
        <td>$${retFuente.toLocaleString()}</td>
        <td>$${retIca.toLocaleString()}</td>
        <td>$${neto.toLocaleString()}</td>
        <td>${estadoHTML}</td>
        <td>${accionesHTML}</td>
      </tr>
    `;
  });

  // ?? VALIDAR que existan antes de asignar
  const totalF = document.getElementById("totalFacturado");
  const totalR = document.getElementById("totalRetenciones");
  const totalN = document.getElementById("totalNeto");

  if (totalF) totalF.innerText = format(totalFacturado);
  if (totalR) totalR.innerText = format(totalRetenciones);
  if (totalN) totalN.innerText = format(totalFacturado - totalRetenciones);
}

// =========================
// EVENTOS
// =========================
function eventosFacturas() {

  // =========================
  // ABRIR MODAL
  // =========================
  document.getElementById("btnNuevaFactura")?.addEventListener("click", () => {
    document.getElementById("modalFactura").classList.remove("hidden");
  });

  // =========================
  // GUARDAR FACTURA
  // =========================
  document.getElementById("guardarFactura")?.addEventListener("click", async () => {

    const body = {
      codigo_factura: document.getElementById("codigoFactura").value,
      id_manifiesto: document.getElementById("manifiestoFactura").value,
      fecha_emision: document.getElementById("fechaEmision").value,
      fecha_vencimiento: document.getElementById("fechaVencimiento").value,
      valor: Number(document.getElementById("valorFactura").value),
      retencion_fuente: Number(document.getElementById("retencionFuente").value),
      retencion_ica: Number(document.getElementById("retencionIca").value),
      plazo_pago: Number(document.getElementById("plazoPago").value)
    };

    if (!body.codigo_factura || !body.id_manifiesto || !body.fecha_emision || !body.valor) {
      alert("Completa los campos obligatorios");
      return;
    }

    await apiFetch("/api/facturas", {
      method: "POST",
      body: JSON.stringify(body)
    });

    document.getElementById("modalFactura").classList.add("hidden");

    document.getElementById("codigoFactura").value = "";
    document.getElementById("manifiestoFactura").value = "";
    document.getElementById("fechaEmision").value = "";
    document.getElementById("fechaVencimiento").value = "";
    document.getElementById("valorFactura").value = "";
    document.getElementById("retencionFuente").value = "";
    document.getElementById("retencionIca").value = "";
    document.getElementById("plazoPago").value = "";

    await cargarFacturas();
  });

  // =========================
  // FILTROS
  // =========================
  ["fDesde", "fHasta", "fCodigo", "fManifiesto"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", aplicarFiltrosFacturas);
  });

  // =========================
  // LIMPIAR
  // =========================
  document.getElementById("btnLimpiarFacturas")?.addEventListener("click", () => {

    document.getElementById("fDesde").value = "";
    document.getElementById("fHasta").value = "";
    document.getElementById("fCodigo").value = "";
    document.getElementById("fManifiesto").value = "";

    aplicarFiltrosFacturas();
  });

  // =========================
  // ?? EVENTOS MODAL (FIX DEFINITIVO)
  // =========================
  document.addEventListener("click", (e) => {

    if (e.target.id === "btnConfirmar") {
      console.log("CONFIRMAR CLICK");

      if (confirmCallback) confirmCallback();

      cerrarConfirmacion();
    }

    if (e.target.id === "btnCancelar") {
      cerrarConfirmacion();
    }

  });
}

// =========================
// SELECT MANIFIESTO BONITO
// =========================
function llenarSelectManifiesto(id, data) {
  const select = document.getElementById(id);
  if (!select) return;

  select.innerHTML = `<option value="">Seleccione</option>`;

  data.forEach(m => {
    const option = document.createElement("option");
    option.value = m.id_manifiesto;
    option.textContent = `${m.id_manifiesto} - ${m.cliente_nombre || ""}`;
    select.appendChild(option);
  });
}

// =========================
// ESTADO DE FACTURA
// =========================
function getEstadoFactura(f) {

  const hoy = new Date().toISOString().split("T")[0];

  if (f.estado === "pagada") {
    return `<span class="badge pagada">Pagada</span>`;
  }

  if (f.fecha_vencimiento && f.fecha_vencimiento.split("T")[0] < hoy) {
    return `<span class="badge vencida">Vencida</span>`;
  }

  return `<span class="badge pendiente">Pendiente</span>`;
}

// =========================
// BOTON FACTURA PAGA
// =========================
async function pagarFactura(codigo) {

  abrirConfirmacion("¿Marcar esta factura como pagada?", async () => {

    try {
      await apiFetch(`/api/facturas/${codigo}/pagar`, {
        method: "PUT"
      });

      mostrarToast("Factura marcada como pagada ?", "success");

      await cargarFacturas();

    } catch (error) {
      console.error(error);
      mostrarToast("Error al actualizar la factura ?", "error");
    }

  });
}

// =========================
// VENTANA FACTURA PAGA
// =========================
let confirmCallback = null;

function abrirConfirmacion(mensaje, callback) {

  const modal = document.getElementById("modalConfirmacion");
  const mensajeEl = document.getElementById("confirmMensaje");

  if (!modal || !mensajeEl) {
    console.error("Modal no encontrado");
    return;
  }

  mensajeEl.innerText = mensaje;
  modal.classList.remove("hidden");

  confirmCallback = callback;

  console.log("Modal abierto"); 
}

function cerrarConfirmacion() {
  const modal = document.getElementById("modalConfirmacion");

  if (modal) {
    modal.classList.add("hidden");
  }

  confirmCallback = null;
}

// eventos confirmación
document.getElementById("btnConfirmar")?.addEventListener("click", () => {
  if (confirmCallback) confirmCallback();
  cerrarConfirmacion();
});

document.getElementById("btnCancelar")?.addEventListener("click", () => {
  cerrarConfirmacion();
});