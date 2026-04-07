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
    tbody.innerHTML = `<tr><td colspan="10">Sin datos</td></tr>`;
    
    if (totalF) totalF.innerText = "$0";
    if (totalC) totalC.innerText = "$0";
    if (totalP) totalP.innerText = "$0";
    if (porcentaje) porcentaje.innerText = "0%";

    return;
  }

  const hoy = new Date().toISOString().split("T")[0];

  // =========================
  // ?? FACTURAS PAGADAS (LOCAL)
  // =========================
  const pagadas = JSON.parse(localStorage.getItem("facturasPagadas") || "[]");

  // =========================
  // ORDENAR SIN ROMPER UI
  // =========================
  const prioridadEstado = {
    "vencida": 1,
    "pendiente": 2,
    "pagada": 3
  };

  data = [...data].sort((a, b) => {

    const estadoA = pagadas.includes(a.codigo_factura)
      ? "pagada"
      : (a.fecha_vencimiento && a.fecha_vencimiento.split("T")[0] < hoy
        ? "vencida"
        : "pendiente");

    const estadoB = pagadas.includes(b.codigo_factura)
      ? "pagada"
      : (b.fecha_vencimiento && b.fecha_vencimiento.split("T")[0] < hoy
        ? "vencida"
        : "pendiente");

    return prioridadEstado[estadoA] - prioridadEstado[estadoB];
  });

  let totalFacturado = 0;
  let totalCobrado = 0;
  let totalPendiente = 0;

  // =========================
  // RENDER
  // =========================
  data.forEach(f => {

    const valor = Number(f.valor || 0);
    const retFuente = Number(f.retencion_fuente || 0);
    const retIca = Number(f.retencion_ica || 0);
    const neto = valor - retFuente - retIca;

    totalFacturado += valor;

    // =========================
    // ?? CALCULAR ESTADO REAL
    // =========================
    let estado;

    if (pagadas.includes(f.codigo_factura)) {
      estado = "pagada";
    } else if (f.fecha_vencimiento && f.fecha_vencimiento.split("T")[0] < hoy) {
      estado = "vencida";
    } else {
      estado = "pendiente";
    }

    if (estado === "pagada") {
      totalCobrado += neto;
    } else {
      totalPendiente += neto;
    }

    const estadoHTML = getEstadoFactura({ ...f, estado });

    const accionesHTML = (estado === "pagada")
      ? `<span class="texto-pagada">Pagada</span>`
      : `<button type="button" class="btn-pagar" onclick="pagarFactura('${f.codigo_factura}')">Pagar</button>`;

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

  // ?? EVITAR DUPLICAR EVENTOS (CLAVE EN SPA)
  if (window._eventosFacturasInit) return;
  window._eventosFacturasInit = true;

  const modal = document.getElementById("modalFactura");

  // =========================
  // ABRIR MODAL
  // =========================
  document.getElementById("btnNuevaFactura")?.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  // =========================
  // CERRAR MODAL (BOTON CANCELAR)
  // =========================
  document.getElementById("cancelarFactura")?.addEventListener("click", () => {
    cerrarModalFactura();
  });

  // =========================
  // CERRAR MODAL (CLICK FUERA)
  // =========================
  modal?.addEventListener("click", (e) => {
    if (e.target.id === "modalFactura") {
      cerrarModalFactura();
    }
  });

  function cerrarModalFactura() {
    modal.classList.add("hidden");

    // limpiar formulario
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

      const body = {
        id_manifiesto: document.getElementById("manifiestoFactura").value,
        fecha_emision: document.getElementById("fechaEmision").value,
        fecha_vencimiento: document.getElementById("fechaVencimiento").value,
        valor: Number(document.getElementById("valorFactura").value),
        retencion_fuente: Number(document.getElementById("retencionFuente").value),
        retencion_ica: Number(document.getElementById("retencionIca").value),
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

  // =========================
  // LIMPIAR FILTROS
  // =========================
  document.getElementById("btnLimpiarFacturas")?.addEventListener("click", () => {

    document.getElementById("fDesde").value = "";
    document.getElementById("fHasta").value = "";
    document.getElementById("fCodigo").value = "";
    document.getElementById("fManifiesto").value = "";

    aplicarFiltrosFacturas();
  });

  // =========================
  // MODAL CONFIRMACION
  // =========================
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
// BOTON FACTURA PAGA
// =========================
async function pagarFactura(codigo) {

  abrirConfirmacion("¿Marcar esta factura como pagada?", async () => {

    try {
      await apiFetch(`/api/facturas/${codigo}/pagar`, {
        method: "PUT"
      });

      // =========================
      // ?? GUARDAR EN LOCALSTORAGE
      // =========================
      let pagadas = JSON.parse(localStorage.getItem("facturasPagadas") || "[]");

      if (!pagadas.includes(codigo)) {
        pagadas.push(codigo);
        localStorage.setItem("facturasPagadas", JSON.stringify(pagadas));
      }

      // =========================
      // ?? ACTUALIZAR DATA LOCAL
      // =========================
      facturasData = facturasData.map(f => {
        if (f.codigo_factura === codigo) {
          return { ...f, estado: "pagada" };
        }
        return f;
      });

      mostrarToast("Factura marcada como pagada", "success");

      aplicarFiltrosFacturas();

    } catch (error) {
      console.error("Error pagando factura:", error);
      mostrarToast("Error al actualizar la factura", "error");
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

