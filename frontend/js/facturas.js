async function initFacturas() {
  await cargarCatalogosFacturas();
  aplicarFiltroEsteMesFacturas();
  await cargarFacturas();
  eventosFacturas();
}

let catalogosFacturas = {};

// =========================
// CATALOGOS
// =========================
async function cargarCatalogosFacturas() {

  const manifiestos = await apiFetch("/api/facturas/manifiestos");
  const facturas = await apiFetch("/api/facturas");

  // ?? IDs ya usados
  const usados = new Set(
    (facturas || []).map(f => f.id_manifiesto)
  );

  catalogosFacturas.manifiestos = manifiestos;

  // =========================
  // MODAL (CON DESHABILITADOS)
  // =========================
  llenarSelectManifiesto(
    "manifiestoFactura",
    manifiestos,
    usados // ?? nuevo parámetro
  );

  // =========================
  // FILTROS (NORMAL)
  // =========================
  llenarSelectManifiesto(
    "fManifiesto",
    manifiestos
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
        t.id_manifiesto === f.id_manifiesto &&
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
        <td>${f.empresa_a_cargo_nombre || "-"}</td>
        <td>${f.fecha_emision ? formatearFechaDesdeUTC(f.fecha_emision) : "-"}</td>
        <td>${f.fecha_vencimiento ? formatearFechaDesdeUTC(f.fecha_vencimiento) : "-"}</td>
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
  // =========================
  // HELPERS
  // =========================
  function getModalFactura() {
    return document.getElementById("modalFactura");
  }

  function limpiarNumero(val) {
    if (!val) return 0;
    return Number(String(val).replace(/\./g, "").replace(/\D/g, "")) || 0;
  }

  function cerrarModalFactura() {
    const modal = getModalFactura();
    modal?.classList.add("hidden");

    const codigoFactura = document.getElementById("codigoFactura");
    const fechaEmision = document.getElementById("fechaEmision");
    const fechaVencimiento = document.getElementById("fechaVencimiento");
    const valorFactura = document.getElementById("valorFactura");
    const retencionFuente = document.getElementById("retencionFuente");
    const retencionIca = document.getElementById("retencionIca");
    const plazoPago = document.getElementById("plazoPago");

    if (codigoFactura) codigoFactura.value = "";
    if (fechaEmision) fechaEmision.value = "";
    if (fechaVencimiento) fechaVencimiento.value = "";
    if (valorFactura) valorFactura.value = "";
    if (retencionFuente) retencionFuente.value = "";
    if (retencionIca) retencionIca.value = "";
    if (plazoPago) plazoPago.value = "";

    const wrapper = document.querySelector("#modalFactura .select-search-wrapper");
    if (wrapper) {
      const input = wrapper.querySelector("input");
      if (input) input.value = "";
      wrapper._value = "";
    }
  }

  function abrirModalFactura() {
    const modal = getModalFactura();
    if (!modal) return;
    modal.classList.remove("hidden");
  }

  function aplicarFormatoMonedaInput(input) {
    if (!input) return;

    input.addEventListener("input", (e) => {
      let limpio = e.target.value.replace(/\D/g, "");

      if (!limpio) {
        e.target.value = "";
        return;
      }

      e.target.value = limpio.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });
  }

  // =========================
  // FORMATO DINERO
  // =========================
  aplicarFormatoMonedaInput(document.getElementById("valorFactura"));
  aplicarFormatoMonedaInput(document.getElementById("retencionFuente"));
  aplicarFormatoMonedaInput(document.getElementById("retencionIca"));

  // =========================
  // LISTENERS GLOBALES SOLO UNA VEZ
  // =========================
  if (!window.__facturasEventosDelegadosInit) {
    window.__facturasEventosDelegadosInit = true;

    document.addEventListener("click", async (e) => {
      const btnNuevaFactura = e.target.closest("#btnNuevaFactura");
      if (btnNuevaFactura) {
        abrirModalFactura();
        return;
      }

      const fondoModalFactura = e.target.closest("#modalFactura");
      if (fondoModalFactura && e.target.id === "modalFactura") {
        cerrarModalFactura();
        return;
      }

      const btnGuardarFactura = e.target.closest("#guardarFactura");
      if (btnGuardarFactura) {
        try {
          const codigo_factura = document.getElementById("codigoFactura")?.value.trim() || "";
          const valorInput = document.getElementById("valorFactura");
          const fuenteInput = document.getElementById("retencionFuente");
          const icaInput = document.getElementById("retencionIca");

          const wrapper = document.querySelector("#modalFactura .select-search-wrapper");
          const id_manifiesto = wrapper && wrapper._value ? wrapper._value : "";

          const valor = limpiarNumero(valorInput?.value);
          const retencion_fuente = limpiarNumero(fuenteInput?.value);
          const retencion_ica = limpiarNumero(icaInput?.value);

          const body = {
            codigo_factura,
            id_manifiesto,
            fecha_emision: document.getElementById("fechaEmision")?.value || "",
            fecha_vencimiento: document.getElementById("fechaVencimiento")?.value || "",
            valor,
            retencion_fuente,
            retencion_ica,
            plazo_pago: Number(document.getElementById("plazoPago")?.value) || 0
          };

          if (!codigo_factura) {
            showToast("El ID de factura es obligatorio", "warning");
            return;
          }

          if (!body.id_manifiesto) {
            showToast("Selecciona un manifiesto válido", "warning");
            return;
          }

          if (!body.fecha_emision) {
            showToast("La fecha de emisión es obligatoria", "warning");
            return;
          }

          if (!body.valor || body.valor <= 0) {
            showToast("El valor debe ser mayor a 0", "warning");
            return;
          }

          await apiFetch("/api/facturas", {
            method: "POST",
            body: JSON.stringify(body)
          });

          showToast("Factura creada correctamente", "success");
          cerrarModalFactura();
          await cargarCatalogosFacturas();
          await cargarFacturas();

        } catch (error) {
          console.error("Error guardando factura:", error);

          if (error.message?.toLowerCase().includes("manifiesto")) {
            showToast("Este manifiesto ya tiene una factura", "error");
            return;
          }

          if (error.message?.toLowerCase().includes("código")) {
            showToast("Ya existe una factura con ese código", "error");
            return;
          }

          showToast("Error al guardar la factura", "error");
        }

        return;
      }

      const btnLimpiarFacturas = e.target.closest("#btnLimpiarFacturas");
      if (btnLimpiarFacturas) {
        const fDesde = document.getElementById("fDesde");
        const fHasta = document.getElementById("fHasta");
        const fCodigo = document.getElementById("fCodigo");

        if (fDesde) fDesde.value = "";
        if (fHasta) fHasta.value = "";
        if (fCodigo) fCodigo.value = "";

        const wrapper = document.querySelector(".transacciones-filtros .select-search-wrapper");
        if (wrapper) {
          const input = wrapper.querySelector("input");
          if (input) input.value = "";
          wrapper._value = "";
        }

        aplicarFiltrosFacturas();
        return;
      }

      const btnEsteMes = e.target.closest("#btnEsteMesFacturas");
      if (btnEsteMes) {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy);

        const fDesde = document.getElementById("fDesde");
        const fHasta = document.getElementById("fHasta");

        if (fDesde) fDesde.value = formatearFechaInput(inicioMes);
        if (fHasta) fHasta.value = formatearFechaInput(finMes);

        aplicarFiltrosFacturas();
        return;
      }

      const btnMesAnterior = e.target.closest("#btnMesAnteriorFacturas");
      if (btnMesAnterior) {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

        const fDesde = document.getElementById("fDesde");
        const fHasta = document.getElementById("fHasta");

        if (fDesde) fDesde.value = formatearFechaInput(inicioMes);
        if (fHasta) fHasta.value = formatearFechaInput(finMes);

        aplicarFiltrosFacturas();
      }
    });

    document.addEventListener("input", (e) => {
      const target = e.target;

      if (
        target?.id === "fDesde" ||
        target?.id === "fHasta" ||
        target?.id === "fCodigo" ||
        target?.id === "fManifiesto"
      ) {
        aplicarFiltrosFacturas();
      }
    });

    document.addEventListener("change", (e) => {
      const target = e.target;

      if (
        target?.id === "fDesde" ||
        target?.id === "fHasta" ||
        target?.id === "fCodigo" ||
        target?.id === "fManifiesto"
      ) {
        aplicarFiltrosFacturas();
      }
    });
  }
}


// =========================
// SELECT MANIFIESTO BONITO
// =========================
function llenarSelectManifiesto(id, data, usados = new Set()) {
  const select = document.getElementById(id);
  if (!select) return;

  // ?? evitar duplicar
  if (select.parentNode.classList.contains("select-search-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.classList.add("select-search-wrapper");

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Buscar manifiesto...";
  input.classList.add("select-search-input");

  const dropdown = document.createElement("div");
  dropdown.classList.add("select-search-dropdown");

  wrapper.appendChild(input);
  wrapper.appendChild(dropdown);

  select.parentNode.replaceChild(wrapper, select);

  let valorSeleccionado = "";
  wrapper._value = "";

  function renderOpciones(filtro = "") {
    dropdown.innerHTML = "";

    const filtrados = data.filter(m => {
      const texto = `${m.id_manifiesto} ${m.cliente_nombre || ""}`.toLowerCase();
      return texto.includes(filtro.toLowerCase());
    });

    if (filtrados.length === 0) {
      dropdown.innerHTML = `<div class="no-results">Sin resultados</div>`;
      return;
    }

    filtrados.forEach(m => {

      const yaUsado = usados.has(m.id_manifiesto);

      const option = document.createElement("div");
      option.classList.add("select-option");

      // ?? TEXTO CON ESTADO
      option.textContent = `${m.id_manifiesto} - ${m.cliente_nombre || ""}${
        yaUsado ? " (Ya facturado)" : ""
      }`;

      // ?? ESTILO VISUAL
      if (yaUsado) {
        option.classList.add("disabled");
      }

      option.addEventListener("click", () => {

        // ?? BLOQUEAR SELECCIÓN
        if (yaUsado) {
          showToast("Este manifiesto ya tiene factura", "warning");
          return;
        }

        input.value = option.textContent;

        valorSeleccionado = m.id_manifiesto;
        wrapper._value = m.id_manifiesto;

        dropdown.innerHTML = "";
      });

      dropdown.appendChild(option);
    });
  }

  input.addEventListener("input", (e) => {
    renderOpciones(e.target.value);
  });

  input.addEventListener("focus", () => {
    renderOpciones(input.value);
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.innerHTML = "";
    }
  });

  wrapper.getValue = () => valorSeleccionado;
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

}

function cerrarConfirmacion() {
  const modal = document.getElementById("modalConfirmacion");

  if (modal) {
    modal.classList.add("hidden");
  }

  confirmCallback = null;
}

function aplicarFiltroEsteMesFacturas() {
  const hoy = new Date();

  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy);

  document.getElementById("fDesde").value = formatearFechaInput(inicioMes);
  document.getElementById("fHasta").value = formatearFechaInput(finMes);
}