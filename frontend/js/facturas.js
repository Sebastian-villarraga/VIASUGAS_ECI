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

    const transacciones = await apiFetch("/api/transacciones");
    window._transaccionesFacturas = transacciones || [];

    console.log("FACTURAS:", facturasData);

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

  const codigoInput = document.getElementById("fCodigo");
  const codigo = codigoInput && codigoInput.value
    ? codigoInput.value.toLowerCase()
    : "";

  const manifiesto = document.getElementById("fManifiesto")?.value || "";

  let filtradas = facturasData.filter(f => {

    const fecha = f.fecha_emision ? f.fecha_emision.split("T")[0] : "";

    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;

    if (codigo && !(f.codigo_factura || "").toLowerCase().includes(codigo)) return false;

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

  const totalF = document.getElementById("totalFacturado");
  const totalC = document.getElementById("totalCobrado");
  const totalP = document.getElementById("totalPendiente");
  const porcentaje = document.getElementById("porcentajeCobro");

  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">Sin datos</td></tr>`;
    
    if (totalF) totalF.innerText = "$0";
    if (totalC) totalC.innerText = "$0";
    if (totalP) totalP.innerText = "$0";
    if (porcentaje) porcentaje.innerText = "0%";

    return;
  }

  const hoy = new Date().toISOString().split("T")[0];

  let totalFacturado = 0;
  let totalCobrado = 0;
  let totalPendiente = 0;

  data.forEach(f => {

    const valor = Number(f.valor || 0);
    const retFuente = Number(f.retencion_fuente || 0);
    const retIca = Number(f.retencion_ica || 0);
    const neto = valor - retFuente - retIca;

    totalFacturado += valor;

    // =========================
    // ?? PAGOS REALES DESDE TRANSACCIONES
    // =========================
    const pagos = (window._transaccionesFacturas || [])
      .filter(t =>
        t.id_factura === f.codigo_factura &&
        t.tipo === "INGRESO MANIFIESTO"
      )
      .reduce((sum, t) => sum + Number(t.valor || 0), 0);

    const saldo = neto - pagos;

    // =========================
    // ESTADO REAL
    // =========================
    let estado;

    if (saldo <= 0) {
      estado = "pagada";
      totalCobrado += neto;
    } else {
      totalPendiente += saldo;

      if (f.fecha_vencimiento && f.fecha_vencimiento.split("T")[0] < hoy) {
        estado = "vencida";
      } else {
        estado = "pendiente";
      }
    }

    const estadoHTML = getEstadoFactura({ ...f, estado });

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
        <td>$${saldo.toLocaleString()}</td>
        <td>${estadoHTML}</td>
      </tr>
    `;
  });

  const porcentajeCobro = totalFacturado > 0
    ? ((totalCobrado / totalFacturado) * 100).toFixed(1)
    : 0;

  if (totalF) totalF.innerText = format(totalFacturado);
  if (totalC) totalC.innerText = format(totalCobrado);
  if (totalP) totalP.innerText = format(totalPendiente);
  if (porcentaje) porcentaje.innerText = porcentajeCobro + "%";
}

// =========================
// EVENTOS
// =========================
function eventosFacturas() {

  if (window._eventosFacturasInit) return;
  window._eventosFacturasInit = true;

  const modal = document.getElementById("modalFactura");

  // =========================
  // ?? FORMATO DINERO (3 CAMPOS)
  // =========================
  function aplicarFormatoMoneda(input) {

    if (!input) return;

    input.addEventListener("input", (e) => {

      let valor = e.target.value;

      // ?? solo números
      let limpio = valor.replace(/\D/g, "");

      if (!limpio) {
        e.target.value = "";
        return;
      }

      // ?? FORMATEO SIN Number (clave para evitar límite)
      let formateado = limpio.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

      e.target.value = formateado;
    });
  }

  aplicarFormatoMoneda(document.getElementById("valorFactura"));
  aplicarFormatoMoneda(document.getElementById("retencionFuente"));
  aplicarFormatoMoneda(document.getElementById("retencionIca"));

  // =========================
  // ABRIR MODAL
  // =========================
  document.getElementById("btnNuevaFactura")?.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  // =========================
  // CERRAR MODAL
  // =========================
  document.getElementById("cancelarFactura")?.addEventListener("click", () => {
    cerrarModalFactura();
  });

  modal?.addEventListener("click", (e) => {
    if (e.target.id === "modalFactura") {
      cerrarModalFactura();
    }
  });

  function cerrarModalFactura() {
    modal.classList.add("hidden");

    document.getElementById("codigoFactura").value = "";
    document.getElementById("manifiestoFactura").value = "";
    document.getElementById("fechaEmision").value = "";
    document.getElementById("fechaVencimiento").value = "";
    document.getElementById("valorFactura").value = "";
    document.getElementById("retencionFuente").value = "";
    document.getElementById("retencionIca").value = "";
    document.getElementById("plazoPago").value = "";
  }

  // =========================
  // GUARDAR FACTURA
  // =========================
  document.getElementById("guardarFactura")?.addEventListener("click", async () => {

    try {

      const valorInput = document.getElementById("valorFactura");
      const fuenteInput = document.getElementById("retencionFuente");
      const icaInput = document.getElementById("retencionIca");

      const body = {
        id_manifiesto: document.getElementById("manifiestoFactura").value,
        fecha_emision: document.getElementById("fechaEmision").value,
        fecha_vencimiento: document.getElementById("fechaVencimiento").value,

        // ?? limpiar formato
        valor: Number(valorInput.value.replace(/\D/g, "")),
        retencion_fuente: Number(fuenteInput.value.replace(/\D/g, "")),
        retencion_ica: Number(icaInput.value.replace(/\D/g, "")),

        plazo_pago: Number(document.getElementById("plazoPago").value)
      };

      if (!body.id_manifiesto || !body.fecha_emision || !body.valor) {
        alert("Completa los campos obligatorios");
        return;
      }

      await apiFetch("/api/facturas", {
        method: "POST",
        body: JSON.stringify(body)
      });

      cerrarModalFactura();
      await cargarFacturas();

    } catch (error) {
      console.error("Error guardando factura:", error);
      alert("Error al guardar la factura");
    }
  });

  // =========================
  // FILTROS
  // =========================
  ["fDesde", "fHasta", "fCodigo", "fManifiesto"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", aplicarFiltrosFacturas);
  });

  document.getElementById("btnLimpiarFacturas")?.addEventListener("click", () => {

    document.getElementById("fDesde").value = "";
    document.getElementById("fHasta").value = "";
    document.getElementById("fCodigo").value = "";
    document.getElementById("fManifiesto").value = "";

    aplicarFiltrosFacturas();
  });

  document.addEventListener("click", (e) => {

    if (e.target.id === "btnConfirmar") {
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

  // ?? PRIORIDAD TOTAL A PAGADA
  if (f.estado === "pagada") {
    return `<span class="badge pagada">Pagada</span>`;
  }

  if (f.fecha_vencimiento && f.fecha_vencimiento.split("T")[0] < hoy) {
    return `<span class="badge vencida">Vencida</span>`;
  }

  return `<span class="badge pendiente">Pendiente</span>`;
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

