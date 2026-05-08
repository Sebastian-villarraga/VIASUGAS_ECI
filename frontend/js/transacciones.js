async function initTransacciones() {

  await cargarCatalogos();
  setearFechasPorDefecto();
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

  const tiposFiltrados = catalogos.tipos.filter(t =>
    t.tipo !== "GASTO CONDUCTOR"
  );

  llenarSelect("tipo", tiposFiltrados, "categoria", "id");
  llenarSelect("banco", catalogos.bancos, "nombre_banco", "id");
  llenarSelect("manifiesto", catalogos.manifiestos, "id_manifiesto", "id_manifiesto");

  llenarSelect("fTipo", catalogos.tipos, "categoria", "tipo");
  llenarSelect("fBanco", catalogos.bancos, "nombre_banco", "id");
  llenarSelect("fManifiesto", catalogos.manifiestos, "id_manifiesto", "id_manifiesto");

  // NUEVO: construir filtros únicos de cliente y empresa desde manifiestos
  const clientesMap = new Map();
  const empresasMap = new Map();

  catalogos.manifiestos.forEach(m => {
    if (m.id_cliente) {
      clientesMap.set(m.id_cliente, {
        value: m.id_cliente,
        label: m.cliente_nombre || m.id_cliente
      });
    }

    if (m.id_empresa_a_cargo) {
      empresasMap.set(m.id_empresa_a_cargo, {
        value: m.id_empresa_a_cargo,
        label: m.empresa_a_cargo_nombre || m.id_empresa_a_cargo
      });
    }
  });

  const clientes = Array.from(clientesMap.values());
  const empresas = Array.from(empresasMap.values());

  llenarSelectCustom("fCliente", clientes);
  llenarSelectCustom("fEmpresa", empresas);
}


function setearFechasPorDefecto() {

  document.getElementById("fDesde").value = "";
  document.getElementById("fHasta").value = "";

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
  const fCliente = document.getElementById("fCliente")?.value;
  const fEmpresa = document.getElementById("fEmpresa")?.value;

  if (fDesde) params.append("fecha_desde", fDesde);
  if (fHasta) params.append("fecha_hasta", fHasta);
  if (fTipo) params.append("tipo", fTipo);
  if (fBanco) params.append("id_banco", fBanco);
  if (fManifiesto) params.append("id_manifiesto", fManifiesto);
  if (fCliente) params.append("id_cliente", fCliente);
  if (fEmpresa) params.append("id_empresa_a_cargo", fEmpresa);

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
          <td>${formatearFechaDesdeUTC(t.fecha_pago)}</td>
          <td>${badge}</td>
          <td>${t.categoria || "-"}</td>
          <td>${t.nombre_banco || "-"}</td>
          <td>${t.id_manifiesto || "-"}</td>
          <td>${t.cliente_nombre || "-"}</td>
          <td>${t.empresa_a_cargo_nombre || "-"}</td>
          <td>$${Number(t.valor).toLocaleString()}</td>
          <td>${t.descripcion || "-"}</td>
        </tr>
      `;
    });

  document.getElementById("totalIngresos").innerText = format(ingresos);
  document.getElementById("totalEgresos").innerText = format(egresos);
  document.getElementById("totalUtilidad").innerText = format(ingresos - egresos);

  // =========================
  // 🔥 FIX DEFINITIVO CARD
  // =========================
  let textoFechas = "Sin filtro";

  if (fDesde && fHasta) {
    textoFechas = `${formatearFechaInputToDisplay(fDesde)} - ${formatearFechaInputToDisplay(fHasta)}`;
  } else if (fDesde) {
    textoFechas = `Desde ${formatearFechaInputToDisplay(fDesde)}`;
  } else if (fHasta) {
    textoFechas = `Hasta ${formatearFechaInputToDisplay(fHasta)}`;
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
  // 🔥 INPUT VALOR (FORMATO MONEDA)
  // =========================
  const inputValor = document.getElementById("valor");

  if (inputValor) {
    inputValor.type = "text"; // 🔥 cambiar a texto para controlar formato

    inputValor.addEventListener("input", (e) => {

      let valor = e.target.value;

      // ❌ eliminar todo lo que no sea número
      valor = valor.replace(/\D/g, "");

      // evitar vacío
      if (!valor) {
        e.target.value = "";
        return;
      }

      // 🔥 formatear con miles
      const numero = Number(valor);
      e.target.value = numero.toLocaleString("es-CO");

    });
  }

  // =========================
  // FILTROS DINAMICOS
  // =========================
  ["fDesde","fHasta","fTipo","fBanco","fManifiesto","fCliente","fEmpresa"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", cargarTransacciones);
  });

  // =========================
  // BOTON LIMPIAR
  // =========================
  document.getElementById("btnLimpiar")?.addEventListener("click", () => {

    ["fDesde","fHasta","fTipo","fBanco","fManifiesto","fCliente","fEmpresa"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    cargarTransacciones();
    showToast("Filtros limpiados", "info");
  });

  // =========================
  // CAMBIO DE TIPO (MODAL)
  // =========================
  document.getElementById("tipo")?.addEventListener("change", (e) => {

    const selectedOption = e.target.selectedOptions[0];
    const tipo = selectedOption.dataset.tipo;

    const formFields = document.getElementById("formFields");
    const wrapManifiesto = document.getElementById("wrapManifiesto");

    if (!tipo) return;

    formFields.style.display = "block";
    wrapManifiesto.style.display = "none";

    if (
      tipo === "INGRESO MANIFIESTO" ||
      tipo === "EGRESO MANIFIESTO"
    ) {
      wrapManifiesto.style.display = "block";
    }

  });

  // =========================
  // GUARDAR
  // =========================
  document.getElementById("guardarTransaccion")?.addEventListener("click", async () => {

    const btn = document.getElementById("guardarTransaccion");

    try {

      btn.disabled = true;
      btn.innerText = "Guardando...";

      const tipoSelect = document.getElementById("tipo");
      const selectedOption = tipoSelect.selectedOptions[0];
      const tipo = selectedOption?.dataset.tipo;

      // 🔥 LIMPIAR FORMATO (quitar comas antes de enviar)
      const valorLimpio = document.getElementById("valor").value.replace(/\D/g, "");

      const payload = {
        id: "TR" + Date.now(),
        id_banco: document.getElementById("banco").value,
        id_tipo_transaccion: tipoSelect.value,
        id_manifiesto: document.getElementById("manifiesto")?.value || null,
        valor: Number(valorLimpio),
        fecha_pago: document.getElementById("fecha").value,
        descripcion: document.getElementById("descripcion").value
      };

      // =========================
      // VALIDACIONES
      // =========================

      if (!payload.id_tipo_transaccion) {
        return showToast("Seleccione tipo de transacción", "error");
      }

      if (!payload.id_banco) {
        return showToast("Seleccione banco", "error");
      }

      if (!payload.valor || payload.valor <= 0) {
        return showToast("Ingrese un valor válido", "error");
      }

      if (!payload.fecha_pago) {
        return showToast("Seleccione fecha de pago", "error");
      }

      if (
        (tipo === "INGRESO MANIFIESTO" || tipo === "EGRESO MANIFIESTO") &&
        !payload.id_manifiesto
      ) {
        return showToast("Seleccione manifiesto", "error");
      }

      if (tipo === "EGRESO OPERACIONAL") {
        payload.id_manifiesto = null;
      }

      // =========================
      // API
      // =========================
      await apiFetch("/api/transacciones", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showToast("Transacción creada correctamente", "success");

      limpiarFormularioTransaccion();
      document.getElementById("modalTransaccion").classList.add("hidden");

      cargarTransacciones();

    } catch (error) {
      console.error(error);
      showToast("Error creando la transacción", "error");
    } finally {
      btn.disabled = false;
      btn.innerText = "Guardar";
    }

  });

  // =========================
  // ABRIR MODAL
  // =========================
  document.getElementById("btnNuevaTransaccion")?.addEventListener("click", () => {

    limpiarFormularioTransaccion();
    document.getElementById("modalTransaccion").classList.remove("hidden");

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

    // ?? ESTA ES LA CLAVE QUE TE FALTABA
    if (item.tipo) {
      option.dataset.tipo = item.tipo;
    }

    select.appendChild(option);
  });
}

function limpiarFormularioTransaccion() {

  // Limpiar selects
  document.getElementById("tipo").value = "";
  document.getElementById("banco").value = "";
  document.getElementById("manifiesto").value = "";

  // Limpiar inputs
  document.getElementById("valor").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("descripcion").value = "";

  // Ocultar din�micos
  document.getElementById("formFields").style.display = "none";
  document.getElementById("wrapManifiesto").style.display = "none";

}


function setearFechasMesActual() {
  const hoy = new Date();

  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy);

  document.getElementById("fDesde").value = formatearFechaInput(inicioMes);
  document.getElementById("fHasta").value = formatearFechaInput(finMes);
}

function llenarSelectCustom(id, data) {
  const select = document.getElementById(id);
  if (!select) return;

  select.innerHTML = `<option value="">Seleccione</option>`;

  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
}