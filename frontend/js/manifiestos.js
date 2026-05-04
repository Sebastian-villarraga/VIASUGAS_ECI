let editandoManifiesto = false;
let catalogosManifiesto = null;
let debounceTimerManifiestos = null;
let detalleManifiestoActual = null;
let detalleDataActual = null;
let modoEdicionDetalle = false;

// =========================
// INIT
// =========================
async function initManifiestos() {
  await cargarCatalogosManifiesto();
  llenarAniosManifiesto();

  await llenarSelectDepartamentos("origen_departamento");
  await llenarSelectDepartamentos("destino_departamento");

  initEventosManifiestos();
  initFormManifiesto();

  // ?? NUEVO: aplicar filtro automático
  aplicarFiltroFechaActual();

  // ?? Cargar con filtros activos
  await filtrarManifiestos();
  
  document.getElementById("btnVerEsteMes")
  ?.addEventListener("click", aplicarFiltroEsteMes);
  
  document.getElementById("btnVerMesAnterior")
  ?.addEventListener("click", aplicarFiltroMesAnterior);
  
}

function safe(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

// =========================
// EVENTOS
// =========================
function initEventosManifiestos() {
  document.getElementById("btnAbrirModalManifiesto")
    ?.addEventListener("click", abrirModalManifiesto);

  document.getElementById("btnCerrarModalManifiesto")
    ?.addEventListener("click", cerrarModalManifiesto);

  document.getElementById("btnLimpiarFiltrosManifiestos")
    ?.addEventListener("click", limpiarFiltrosManifiestos);
    
  document.getElementById("btnExportarExcelManifiestos")
    ?.addEventListener("click", exportarExcelManifiestos);

  document.getElementById("filtroAnio")
    ?.addEventListener("change", filtrarManifiestos);

  document.getElementById("filtroMes")
    ?.addEventListener("change", filtrarManifiestos);

  document.getElementById("filtroFechaDesde")
    ?.addEventListener("change", filtrarManifiestos);

  document.getElementById("filtroFechaHasta")
    ?.addEventListener("change", filtrarManifiestos);

  document.getElementById("filtroEstado")
    ?.addEventListener("change", filtrarManifiestos);

  document.getElementById("filtroCliente")
    ?.addEventListener("change", filtrarManifiestos);

  document.getElementById("filtroIdManifiesto")
    ?.addEventListener("input", aplicarFiltrosManifiestos);

  document.getElementById("origen_departamento")
    ?.addEventListener("change", async () => {
      await llenarCiudadesPorDepartamento("origen_departamento", "origen_ciudad");
    });

  document.getElementById("destino_departamento")
    ?.addEventListener("change", async () => {
      await llenarCiudadesPorDepartamento("destino_departamento", "destino_ciudad");
    });
    document.getElementById("cerrarDetalleManifiesto")
    ?.addEventListener("click", cerrarModalDetalleManifiesto);

  document.getElementById("btnEditarDetalle")
    ?.addEventListener("click", activarEdicionDetalle);

  document.getElementById("btnCancelarEdicionDetalle")
    ?.addEventListener("click", cancelarEdicionDetalle);

  document.getElementById("btnGuardarDetalle")
    ?.addEventListener("click", guardarEdicionDetalle);
}

function aplicarFiltrosManifiestos() {
  clearTimeout(debounceTimerManifiestos);
  debounceTimerManifiestos = setTimeout(() => {
    filtrarManifiestos();
  }, 300);
}

// =========================
// CATALOGOS
// =========================
async function cargarCatalogosManifiesto() {
  const data = await apiFetch("/api/manifiestos/catalogos");

  if (!data) {
    showToast("No se pudieron cargar los catálogos de manifiestos", "error");
    return;
  }

  catalogosManifiesto = data;

  llenarSelectEstados();
  llenarSelectClientes();
  llenarSelectForm();
}

function llenarAniosManifiesto() {
  const select = document.getElementById("filtroAnio");
  if (!select) return;

  const actual = new Date().getFullYear();
  const inicio = actual - 3;
  const fin = actual + 2;

  let html = `<option value="">Todos</option>`;

  for (let anio = fin; anio >= inicio; anio--) {
    html += `<option value="${anio}">${anio}</option>`;
  }

  select.innerHTML = html;
}

function llenarSelectEstados() {
  const filtroEstado = document.getElementById("filtroEstado");
  if (!catalogosManifiesto || !filtroEstado) return;

  filtroEstado.innerHTML = `
    <option value="">Todos</option>
    ${catalogosManifiesto.estados.map(e => `
      <option value="${e}">${e}</option>
    `).join("")}
  `;
}

function llenarSelectClientes() {
  const filtroCliente = document.getElementById("filtroCliente");
  if (!filtroCliente || !catalogosManifiesto) return;

  filtroCliente.innerHTML = `
    <option value="">Todos</option>
    ${catalogosManifiesto.clientes.map(c => `
      <option value="${c.nit}">${c.nombre} - ${c.nit}</option>
    `).join("")}
  `;
}

function llenarSelectForm() {
  if (!catalogosManifiesto) return;

  const cliente = document.getElementById("id_cliente");
  const conductor = document.getElementById("id_conductor");
  const vehiculo = document.getElementById("id_vehiculo");
  const trailer = document.getElementById("id_trailer");
  const empresa = document.getElementById("id_empresa_a_cargo");

  if (cliente) {
    cliente.innerHTML = `
      <option value="">Seleccione</option>
      ${catalogosManifiesto.clientes.map(c => `
        <option value="${c.nit}">${c.nombre} - ${c.nit}</option>
      `).join("")}
    `;
  }

  if (conductor) {
    conductor.innerHTML = `
      <option value="">Seleccione</option>
      ${catalogosManifiesto.conductores.map(c => `
        <option value="${c.cedula}">${c.nombre} - ${c.cedula}</option>
      `).join("")}
    `;
  }

  if (vehiculo) {
    vehiculo.innerHTML = `
      <option value="">Seleccione</option>
      ${catalogosManifiesto.vehiculos.map(v => `
        <option value="${v.placa}">${v.placa}</option>
      `).join("")}
    `;
  }

  if (trailer) {
    trailer.innerHTML = `
      <option value="">Seleccione</option>
      ${catalogosManifiesto.trailers.map(t => `
        <option value="${t.placa}">${t.placa}</option>
      `).join("")}
    `;
  }

  if (empresa) {
    empresa.innerHTML = `
      <option value="">Seleccione</option>
      ${catalogosManifiesto.empresas.map(e => `
        <option value="${e.nit}">${e.nombre} - ${e.nit}</option>
      `).join("")}
    `;
  }
}

// =========================
// UBICACIONES
// =========================
async function llenarSelectDepartamentos(idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  const data = await apiFetch("/api/ubicaciones/departamentos");

  if (!data) {
    select.innerHTML = `<option value="">Error cargando</option>`;
    return;
  }

  select.innerHTML = `
    <option value="">Seleccione</option>
    ${data.map(dep => `
      <option value="${dep.nombre_departamento}">
        ${dep.nombre_departamento}
      </option>
    `).join("")}
  `;
}

async function llenarCiudadesPorDepartamento(idDepartamento, idCiudad, ciudadSeleccionada = "") {
  const depSelect = document.getElementById(idDepartamento);
  const ciudadSelect = document.getElementById(idCiudad);

  if (!depSelect || !ciudadSelect) return;

  const departamento = depSelect.value;

  if (!departamento) {
    ciudadSelect.innerHTML = `<option value="">Seleccione</option>`;
    return;
  }

  const data = await apiFetch(
    `/api/ubicaciones/municipios?nombre_departamento=${encodeURIComponent(departamento)}`
  );

  if (!data) {
    ciudadSelect.innerHTML = `<option value="">Error cargando</option>`;
    return;
  }

  ciudadSelect.innerHTML = `
    <option value="">Seleccione</option>
    ${data.map(item => `
      <option value="${item.nombre_municipio}" ${item.nombre_municipio === ciudadSeleccionada ? "selected" : ""}>
        ${item.nombre_municipio}
      </option>
    `).join("")}
  `;
}

async function cargarCiudadesInline(nombreDepartamento, ciudadSelect, ciudadSeleccionada = "") {
  if (!ciudadSelect) return;

  if (!nombreDepartamento) {
    ciudadSelect.innerHTML = `<option value="">Seleccione</option>`;
    return;
  }

  const data = await apiFetch(
    `/api/ubicaciones/municipios?nombre_departamento=${encodeURIComponent(nombreDepartamento)}`
  );

  if (!data) {
    ciudadSelect.innerHTML = `<option value="">Error cargando</option>`;
    return;
  }

  ciudadSelect.innerHTML = `
    <option value="">Seleccione</option>
    ${data.map(item => `
      <option value="${item.nombre_municipio}" ${item.nombre_municipio === ciudadSeleccionada ? "selected" : ""}>
        ${item.nombre_municipio}
      </option>
    `).join("")}
  `;
}

// =========================
// CARGAR / FILTRAR
// =========================
async function cargarManifiestos() {
  const data = await apiFetch("/api/manifiestos");
  renderTablaManifiestos(data);
}

async function filtrarManifiestos() {
  const idManifiesto = document.getElementById("filtroIdManifiesto")?.value.trim() || "";
  const fechaDesde = document.getElementById("filtroFechaDesde")?.value || "";
  const fechaHasta = document.getElementById("filtroFechaHasta")?.value || "";
  const estado = document.getElementById("filtroEstado")?.value || "";
  const idCliente = document.getElementById("filtroCliente")?.value || "";

  const params = new URLSearchParams();

  if (idManifiesto) params.append("id_manifiesto", idManifiesto);
  if (fechaDesde) params.append("fecha_desde", fechaDesde);
  if (fechaHasta) params.append("fecha_hasta", fechaHasta);
  if (estado) params.append("estado", estado);
  if (idCliente) params.append("id_cliente", idCliente);

  const url = `/api/manifiestos${params.toString() ? "?" + params.toString() : ""}`;
  const data = await apiFetch(url);
  renderTablaManifiestos(data);
}

function limpiarFiltrosManifiestos() {
  document.getElementById("filtroIdManifiesto").value = "";
  document.getElementById("filtroFechaDesde").value = "";
  document.getElementById("filtroFechaHasta").value = "";
  document.getElementById("filtroEstado").value = "";
  document.getElementById("filtroCliente").value = "";

  cargarManifiestos();
}

function obtenerParamsFiltrosManifiestos() {
  const idManifiesto = document.getElementById("filtroIdManifiesto")?.value.trim() || "";
  const fechaDesde = document.getElementById("filtroFechaDesde")?.value || "";
  const fechaHasta = document.getElementById("filtroFechaHasta")?.value || "";
  const estado = document.getElementById("filtroEstado")?.value || "";
  const idCliente = document.getElementById("filtroCliente")?.value || "";

  const params = new URLSearchParams();

  if (idManifiesto) params.append("id_manifiesto", idManifiesto);
  if (fechaDesde) params.append("fecha_desde", fechaDesde);
  if (fechaHasta) params.append("fecha_hasta", fechaHasta);
  if (estado) params.append("estado", estado);
  if (idCliente) params.append("id_cliente", idCliente);

  return params;
}

async function exportarExcelManifiestos() {
  try {
    const params = obtenerParamsFiltrosManifiestos();
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/manifiestos/exportar-excel?${params.toString()}`, {
      method: "GET",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!res.ok) {
      throw new Error("No se pudo exportar el Excel");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const hoy = new Date().toISOString().split("T")[0];
    link.download = `Manifiestos_${hoy}.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    showToast("Excel descargado correctamente", "success");

  } catch (error) {
    console.error("Error exportando Excel:", error);
    showToast("Error descargando Excel", "error");
  }
}

// =========================
// RENDER
// =========================
function renderTablaManifiestos(data) {
  const tabla = document.getElementById("manifiestosTable");
  if (!tabla) return;

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="11">Sin resultados</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(m => `
    <tr
      data-id_manifiesto="${escapeHtml(m.id_manifiesto)}"
      data-radicado="${m.radicado}"
      data-fecha="${m.fecha ? m.fecha.split("T")[0] : ""}"
      data-origen_departamento="${escapeHtml(m.origen_departamento || "")}"
      data-origen_ciudad="${escapeHtml(m.origen_ciudad || "")}"
      data-destino_departamento="${escapeHtml(m.destino_departamento || "")}"
      data-destino_ciudad="${escapeHtml(m.destino_ciudad || "")}"
      data-estado="${escapeHtml(m.estado || "")}"
      data-valor_flete="${m.valor_flete ?? ""}"
      data-valor_flete_porcentaje="${m.valor_flete_porcentaje ?? ""}"
      data-anticipo_manifiesto="${m.anticipo_manifiesto ?? ""}"
      data-gastos="${escapeHtml(m.gastos || "")}"
      data-documentos="${escapeHtml(m.documentos || "")}"
      data-id_cliente="${escapeHtml(m.id_cliente || "")}"
      data-id_conductor="${m.id_conductor || ""}"
      data-id_vehiculo="${m.id_vehiculo || ""}"
      data-id_trailer="${m.id_trailer || ""}"
      data-id_empresa_a_cargo="${escapeHtml(m.id_empresa_a_cargo || "")}"
      data-novedades="${m.novedades}"
      data-observaciones="${escapeHtml(m.observaciones || "")}"
    >
      <td>${m.id_manifiesto}</td>
      <td>${safe(m.radicado)}</td>
      <td>${m.fecha ? formatearFechaSafe(m.fecha) : "-"}</td>
      <td>${safe(m.empresa_a_cargo_nombre) || safe(m.id_empresa_a_cargo)}</td>
      <td>${safe(m.cliente_nombre) || safe(m.id_cliente)}</td>
      <td>${m.conductor_nombre || m.id_conductor}</td>
      <td>${m.origen_ciudad} -> ${m.destino_ciudad}</td>
      <td>${m.id_vehiculo}</td>
      <td>${m.id_trailer}</td>
      <td>${renderEstadoManifiesto(m.estado)}</td>
      <td>${renderNovedadBadge(m.novedades)}</td>
      <td>
        <button class="btn-icon" onclick="verDetalleManifiesto('${m.id_manifiesto}')">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join("");

  actualizarCardsGerenciales(data);
}

function renderEstadoManifiesto(estado) {
  return `<span class="estado-manifiesto">${estado}</span>`;
}

function renderNovedadBadge(valor) {
  const clase = valor ? "badge-si" : "badge-no";
  const texto = valor ? "Si" : "No";
  return `<span class="novedad-badge ${clase}">${texto}</span>`;
}

// =========================
// FORM
// =========================
function initFormManifiesto() {
  const form = document.getElementById("formManifiesto");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectOrigen = document.getElementById("origen_ciudad");
    const selectDestino = document.getElementById("destino_ciudad");

    const origenCiudad = selectOrigen.value;
    const destinoCiudad = selectDestino.value;

    const origenDepartamento =
      selectOrigen.selectedOptions[0]?.dataset.departamento || "";

    const destinoDepartamento =
      selectDestino.selectedOptions[0]?.dataset.departamento || "";

    const data = {
      id_manifiesto: document.getElementById("id_manifiesto").value.trim(),
      radicado: document.getElementById("radicado").value.trim(),
      fecha: document.getElementById("fecha").value,

      origen_departamento: origenDepartamento,
      origen_ciudad: origenCiudad,
      destino_departamento: destinoDepartamento,
      destino_ciudad: destinoCiudad,

      valor_flete: limpiarNumeroInput(
          document.getElementById("valor_flete").value
        ),
        
        valor_flete_porcentaje: limpiarNumeroInput(
          document.getElementById("valor_flete_porcentaje").value
        ),
        
        anticipo_manifiesto: limpiarNumeroInput(
          document.getElementById("anticipo_manifiesto").value
        ),
      id_cliente: document.getElementById("id_cliente").value,
      id_conductor: document.getElementById("id_conductor").value,
      id_vehiculo: document.getElementById("id_vehiculo").value,
      id_trailer: document.getElementById("id_trailer").value,
      id_empresa_a_cargo: document.getElementById("id_empresa_a_cargo").value,
      observaciones: document.getElementById("observaciones").value.trim()
    };

    const res = await apiFetch("/api/manifiestos", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res) return;

    showToast("Manifiesto creado correctamente", "success");
    cerrarModalManifiesto();
    form.reset();

    await cargarCatalogosManifiesto();
    await cargarManifiestos();
  });
}

// =========================
// CARGAR CIUDADES MODAL
// =========================
async function cargarCiudadesModal() {
  const selectOrigen = document.getElementById("origen_ciudad");
  const selectDestino = document.getElementById("destino_ciudad");

  const ciudades = await apiFetch("/api/ubicaciones/municipios");

  if (!ciudades) {
    showToast("Error cargando ciudades", "error");
    return;
  }

  const opciones = ciudades.map(c => `
    <option value="${c.nombre_municipio}" data-departamento="${c.nombre_departamento}">
      ${c.nombre_municipio} (${c.nombre_departamento})
    </option>
  `).join("");

  if (selectOrigen) {
    selectOrigen.innerHTML = `<option value="">Seleccione</option>` + opciones;
  }

  if (selectDestino) {
    selectDestino.innerHTML = `<option value="">Seleccione</option>` + opciones;
  }
}

// =========================
// MODAL
// =========================
function abrirModalManifiesto() {
  document.getElementById("modalManifiesto")?.classList.remove("hidden");

  cargarCiudadesModal();

  aplicarFormatoMonedaInputsManifiesto();
}


function cerrarModalManifiesto() {
  document.getElementById("modalManifiesto")?.classList.add("hidden");
  document.getElementById("formManifiesto")?.reset();

  const origenCiudad = document.getElementById("origen_ciudad");
  const destinoCiudad = document.getElementById("destino_ciudad");

  if (origenCiudad) origenCiudad.innerHTML = `<option value="">Seleccione</option>`;
  if (destinoCiudad) destinoCiudad.innerHTML = `<option value="">Seleccione</option>`;
}



// =========================
// UTILS
// =========================
function escapeHtml(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function aplicarFiltroFechaActual() {
  const inputDesde = document.getElementById("filtroFechaDesde");
  const inputHasta = document.getElementById("filtroFechaHasta");

  if (!inputDesde || !inputHasta) return;

  const hoy = new Date();

  const anio = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0-based

  const primerDia = new Date(anio, mes, 1);

  const format = (fecha) => {
    return fecha.toISOString().split("T")[0];
  };

  inputDesde.value = format(primerDia);
  inputHasta.value = format(hoy);
}

function actualizarCardsGerenciales(data) {
  actualizarCardPeriodo();
  actualizarCardEstados(data);
}

function actualizarCardPeriodo() {
  const desde = document.getElementById("filtroFechaDesde")?.value;
  const hasta = document.getElementById("filtroFechaHasta")?.value;
  const anio = document.getElementById("filtroAnio")?.value;
  const mes = document.getElementById("filtroMes")?.value;

  const card = document.getElementById("cardPeriodo");
  if (!card) return;

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  // ?? PRIORIDAD 1: Rango exacto
  if (desde && hasta) {
    card.innerHTML = `
      ${formatearFechaLarga(desde)}
      <br>
      ${formatearFechaLarga(hasta)}
    `;
    return;
  }

  // ?? PRIORIDAD 2: Año + Mes
  if (anio && mes) {
    card.textContent = `${meses[Number(mes) - 1]} ${anio}`;
    return;
  }

  // ?? PRIORIDAD 3: Solo Año
  if (anio) {
    card.textContent = `Año ${anio}`;
    return;
  }

  // ?? Default
  card.textContent = "Todos los periodos";
}

function actualizarCardEstados(data) {
  const card = document.getElementById("cardEstados");
  if (!card) return;

  if (!data || data.length === 0) {
    card.textContent = "Sin datos";
    return;
  }

  const estados = {
    "CREADO-EN TRANSITO": 0,
    "ENTREGADO POR COBRAR": 0,
    "MANIFIESTO PAGO": 0
  };

  data.forEach(m => {
    if (estados.hasOwnProperty(m.estado)) {
      estados[m.estado]++;
    }
  });

  card.innerHTML = `
    Creados -En transito: <strong>${estados["CREADO-EN TRANSITO"]}</strong><br>
    Entregados por cobrar: <strong>${estados["ENTREGADO POR COBRAR"]}</strong><br>
    Manifiestos pagados: <strong>${estados["MANIFIESTO PAGO"]}</strong>
  `;
}


function aplicarFiltroEsteMes() {
  const inputDesde = document.getElementById("filtroFechaDesde");
  const inputHasta = document.getElementById("filtroFechaHasta");
  const selectAnio = document.getElementById("filtroAnio");
  const selectMes = document.getElementById("filtroMes");

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();

  const primerDia = new Date(anio, mes, 1);

  const format = (fecha) => fecha.toISOString().split("T")[0];

  if (inputDesde) inputDesde.value = format(primerDia);
  if (inputHasta) inputHasta.value = format(hoy);

  // Limpiar filtros de año/mes para evitar conflicto
  if (selectAnio) selectAnio.value = "";
  if (selectMes) selectMes.value = "";

  filtrarManifiestos();
}


function aplicarFiltroMesAnterior() {
  const inputDesde = document.getElementById("filtroFechaDesde");
  const inputHasta = document.getElementById("filtroFechaHasta");
  const selectAnio = document.getElementById("filtroAnio");
  const selectMes = document.getElementById("filtroMes");

  const hoy = new Date();

  // Primer día del mes anterior
  const primerDiaMesAnterior = new Date(
    hoy.getFullYear(),
    hoy.getMonth() - 1,
    1
  );

  // Último día del mes anterior
  const ultimoDiaMesAnterior = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    0
  );

  const format = (fecha) => fecha.toISOString().split("T")[0];

  if (inputDesde) inputDesde.value = format(primerDiaMesAnterior);
  if (inputHasta) inputHasta.value = format(ultimoDiaMesAnterior);

  // Limpiar filtros de año/mes
  if (selectAnio) selectAnio.value = "";
  if (selectMes) selectMes.value = "";

  filtrarManifiestos();
}

function formatearFechaLarga(fechaStr) {
  if (!fechaStr) return "";

  // Separar manualmente YYYY-MM-DD
  const [anio, mes, dia] = fechaStr.split("-").map(Number);

  // Crear fecha en horario LOCAL (no UTC)
  const fecha = new Date(anio, mes - 1, dia);

  const opciones = {
    day: "2-digit",
    month: "long",
    year: "numeric"
  };

  return fecha.toLocaleDateString("es-CO", opciones);
}



// =========================
// VER DETALLE MANIFIESTO 
// =========================
async function verDetalleManifiesto(id) {
  try {
    const modal = document.getElementById("modalDetalleManifiesto");
    modal?.classList.remove("hidden");

    const data = await apiFetch(`/api/manifiestos/${id}/detalle`);
    if (!data) return;

    detalleDataActual = data;
    detalleManifiestoActual = data.manifiesto;
    modoEdicionDetalle = false;

    actualizarBotonesDetalle();
    renderDetalleModoLectura(data);

  } catch (error) {
    console.error("Error cargando detalle del manifiesto:", error);
    showToast("No se pudo cargar el detalle del manifiesto", "error");
  }
}

function actualizarBotonesDetalle() {
  document.getElementById("btnEditarDetalle")?.classList.toggle("hidden", modoEdicionDetalle);
  document.getElementById("btnGuardarDetalle")?.classList.toggle("hidden", !modoEdicionDetalle);
  document.getElementById("btnCancelarEdicionDetalle")?.classList.toggle("hidden", !modoEdicionDetalle);
}

function cerrarModalDetalleManifiesto() {
  document.getElementById("modalDetalleManifiesto")?.classList.add("hidden");
  modoEdicionDetalle = false;
  detalleManifiestoActual = null;
  detalleDataActual = null;
  actualizarBotonesDetalle();
}

function renderDetalleModoLectura(data) {
  if (!data || !data.manifiesto) return;

  const manifiesto = data.manifiesto;
  const gastosConductor = data.gastos || [];
  const transacciones = data.transacciones || [];
  const factura = data.factura;

  const contInfo = document.getElementById("detalleInfoManifiesto");

  contInfo.innerHTML = `
    <div class="detalle-info-item">
      <span>ID</span>
      <strong>${safe(manifiesto.id_manifiesto)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Radicado</span>
      <strong>${safe(manifiesto.radicado)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Cliente</span>
      <strong>${safe(manifiesto.cliente_nombre)}, NIT: ${safe(manifiesto.id_cliente)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Fecha</span>
      <strong>${formatearFechaSafe(manifiesto.fecha) || "-"}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Origen</span>
      <strong>${safe(manifiesto.origen_ciudad)}, ${safe(manifiesto.origen_departamento)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Destino</span>
      <strong>${safe(manifiesto.destino_ciudad)}, ${safe(manifiesto.destino_departamento)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Vehículo</span>
      <strong>${safe(manifiesto.id_vehiculo)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Trailer</span>
      <strong>${safe(manifiesto.id_trailer)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Conductor</span>
      <strong>${safe(manifiesto.conductor_nombre)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Estado</span>
      <strong>${safe(manifiesto.estado)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Valor Flete</span>
      <strong>$${Number(manifiesto.valor_flete || 0).toLocaleString()}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Porcentaje Flete</span>
      <strong>$${Number(manifiesto.valor_flete_porcentaje || 0).toLocaleString()}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Anticipo</span>
      <strong>$${Number(manifiesto.anticipo_manifiesto || 0).toLocaleString()}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Empresa a cargo</span>
      <strong>${safe(manifiesto.empresa_nombre)}, Nit: ${safe(manifiesto.empresa_nit)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Docs. gastos</span>
      <strong>${safe(manifiesto.gastos)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Documentos</span>
      <strong>${safe(manifiesto.documentos)}</strong>
    </div>

    <div class="detalle-info-item">
      <span>Novedades</span>
      <strong>${manifiesto.novedades ? "Si" : "No"}</strong>
    </div>

    <div class="detalle-info-item full-span">
      <span>Observaciones</span>
      <strong>${safe(manifiesto.observaciones)}</strong>
    </div>
  `;

  // =========================
  // GASTOS CONDUCTOR
  // =========================
  const contGastos = document.getElementById("detalleGastos");
  contGastos.innerHTML = "";

  let totalGastos = 0;

  gastosConductor.forEach(g => {
    const valor = Number(g.transaccion_valor || 0);
    totalGastos += valor;

    contGastos.innerHTML += `
      <div class="detalle-item">
        <span>${g.tipo_transaccion_categoria || "-"}</span>
        <span class="valor-gasto">-$${valor.toLocaleString()}</span>
      </div>
    `;
  });

  if (gastosConductor.length === 0) {
    contGastos.innerHTML = "<p>Sin gastos</p>";
  }

  document.getElementById("totalGastosDetalle").innerHTML =
    `<span class="total-egreso">$${totalGastos.toLocaleString()}</span>`;

  // =========================
  // TRANSACCIONES
  // =========================
  const contTrans = document.getElementById("detalleTransacciones");
  contTrans.innerHTML = "";

  let totalIngresos = 0;
  let totalEgresos = 0;

  transacciones.forEach(t => {
    const valor = Number(t.valor || 0);

    let clase = "";
    let signo = "";

    if (t.tipo_transaccion_tipo === "INGRESO MANIFIESTO") {
      totalIngresos += valor;
      clase = "valor-ingreso";
      signo = "+";
    } else if (t.tipo_transaccion_tipo === "EGRESO MANIFIESTO") {
      totalEgresos += valor;
      clase = "valor-egreso";
      signo = "-";
    } else {
      return;
    }

    contTrans.innerHTML += `
      <div class="detalle-item">
        <span>${t.tipo_transaccion_categoria}</span>
        <span class="${clase}">${signo}$${valor.toLocaleString()}</span>
      </div>
    `;
  });

  if (transacciones.length === 0) {
    contTrans.innerHTML = "<p>Sin transacciones</p>";
  }

  const utilidad = totalIngresos - totalEgresos;

  document.getElementById("totalTransaccionesDetalle").innerHTML =
    `<span class="${utilidad >= 0 ? "total-ingreso" : "total-egreso"}">
      $${utilidad.toLocaleString()}
    </span>`;


  // =========================
  // FACTURA
  // =========================
  const contFactura = document.getElementById("detalleFactura");
  contFactura.innerHTML = "";
  
  let totalFactura = 0;
  
  if (factura) {
  
    totalFactura = Number(factura.valor || 0);
  
    contFactura.innerHTML = `
      <div class="detalle-item">
        <span>Factura: ${safe(factura.codigo_factura)}</span>
        <span class="valor-ingreso">
          $${totalFactura.toLocaleString("es-CO")}
        </span>
      </div>
  
      <div class="detalle-item">
        <span>Fecha emisión</span>
        <span>${formatearFechaSafe(factura.fecha_emision)}</span>
      </div>
  
      <div class="detalle-item">
        <span>Vencimiento</span>
        <span>${formatearFechaSafe(factura.fecha_vencimiento)}</span>
      </div>
    `;
  
  } else {
    contFactura.innerHTML = "<p>Sin factura</p>";
  }
  
  document.getElementById("totalFacturaDetalle").innerHTML =
    `<span class="total-ingreso">
      $${totalFactura.toLocaleString("es-CO")}
    </span>`;

  // =========================
  // RESUMEN
  // =========================
  // Regla solicitada:
  // RESUMEN = FACTURA - TOTAL TRANSACCIONES
  // Donde "utilidad" ya representa el neto de transacciones:
  // totalIngresos - totalEgresos
  
  const resumen = utilidad;
  const resumenEl = document.getElementById("resumenDetalle");
  
  resumenEl.className =
    resumen > 0 ? "resumen-positivo" :
    resumen < 0 ? "resumen-negativo" :
    "resumen-cero";
  
  resumenEl.textContent =
    `${resumen < 0 ? "-$" : "$"}${Math.abs(resumen).toLocaleString("es-CO")}`;
  actualizarTrackingEstado(manifiesto.estado);
}

  // =========================
  // ACTIVAR EDICION
  // =========================
async function activarEdicionDetalle() {
  if (!detalleManifiestoActual || !catalogosManifiesto) return;

  modoEdicionDetalle = true;
  actualizarBotonesDetalle();

  const manifiesto = detalleManifiestoActual;
  const contInfo = document.getElementById("detalleInfoManifiesto");

  const ciudades = await apiFetch("/api/ubicaciones/municipios");
  if (!ciudades) {
    showToast("No se pudieron cargar las ciudades", "error");
    modoEdicionDetalle = false;
    actualizarBotonesDetalle();
    return;
  }

  const opcionesCiudades = ciudades.map(c => `
    <option
      value="${escapeHtml(c.nombre_municipio)}"
      data-departamento="${escapeHtml(c.nombre_departamento)}"
    >
      ${c.nombre_municipio} (${c.nombre_departamento})
    </option>
  `).join("");

  contInfo.innerHTML = `
    <div class="detalle-info-item readonly-soft">
      <span>ID</span>
      <strong>${safe(manifiesto.id_manifiesto)}</strong>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditRadicado">Radicado</label>
      <input
        type="text"
        id="detalleEditRadicado"
        placeholder="Opcional"
        value="${safe(manifiesto.radicado) === "-" ? "" : manifiesto.radicado}"
      >
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditCliente">Cliente</label>
      <select id="detalleEditCliente">
        <option value="">Seleccione</option>
        ${catalogosManifiesto.clientes.map(c => `
          <option value="${c.nit}" ${String(c.nit) === String(manifiesto.id_cliente) ? "selected" : ""}>
            ${c.nombre} - ${c.nit}
          </option>
        `).join("")}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditFecha">Fecha</label>
      <input type="date" id="detalleEditFecha" value="${manifiesto.fecha ? String(manifiesto.fecha).split("T")[0] : ""}">
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditOrigen">Origen</label>
      <select id="detalleEditOrigen">
        <option value="">Seleccione</option>
        ${opcionesCiudades}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditDestino">Destino</label>
      <select id="detalleEditDestino">
        <option value="">Seleccione</option>
        ${opcionesCiudades}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditVehiculo">Vehículo</label>
      <select id="detalleEditVehiculo">
        <option value="">Seleccione</option>
        ${catalogosManifiesto.vehiculos.map(v => `
          <option value="${v.placa}" ${v.placa === manifiesto.id_vehiculo ? "selected" : ""}>
            ${v.placa}
          </option>
        `).join("")}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditTrailer">Trailer</label>
      <select id="detalleEditTrailer">
        <option value="">Seleccione</option>
        ${catalogosManifiesto.trailers.map(t => `
          <option value="${t.placa}" ${t.placa === manifiesto.id_trailer ? "selected" : ""}>
            ${t.placa}
          </option>
        `).join("")}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditConductor">Conductor</label>
      <select id="detalleEditConductor">
        <option value="">Seleccione</option>
        ${catalogosManifiesto.conductores.map(c => `
          <option value="${c.cedula}" ${String(c.cedula) === String(manifiesto.id_conductor) ? "selected" : ""}>
            ${c.nombre} - ${c.cedula}
          </option>
        `).join("")}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditEstado">Estado</label>
      <select id="detalleEditEstado">
        <option value="">Seleccione</option>
        ${catalogosManifiesto.estados.map(e => `
          <option value="${e}" ${e === manifiesto.estado ? "selected" : ""}>
            ${e}
          </option>
        `).join("")}
      </select>
    </div>

    <div class="detalle-info-item readonly-soft">
      <span>Valor Flete</span>
      <strong>$${Number(manifiesto.valor_flete || 0).toLocaleString()}</strong>
    </div>

    <div class="detalle-info-item readonly-soft">
      <span>Porcentaje Flete</span>
      <strong>$${Number(manifiesto.valor_flete_porcentaje || 0).toLocaleString()}</strong>
    </div>

    <div class="detalle-info-item readonly-soft">
      <span>Anticipo</span>
      <strong>$${Number(manifiesto.anticipo_manifiesto || 0).toLocaleString()}</strong>
    </div>

    <div class="detalle-info-item readonly-soft">
      <span>Empresa a cargo</span>
      <strong>${safe(manifiesto.empresa_nombre)}, Nit: ${safe(manifiesto.empresa_nit)}</strong>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditGastos">Docs. gastos</label>
      <select id="detalleEditGastos">
        ${(catalogosManifiesto.entregas || ["PENDIENTES", "ENTREGADOS"]).map(e => `
          <option value="${e}" ${e === manifiesto.gastos ? "selected" : ""}>${e}</option>
        `).join("")}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditDocumentos">Documentos</label>
      <select id="detalleEditDocumentos">
        ${(catalogosManifiesto.entregas || ["PENDIENTES", "ENTREGADOS"]).map(e => `
          <option value="${e}" ${e === manifiesto.documentos ? "selected" : ""}>${e}</option>
        `).join("")}
      </select>
    </div>

    <div class="detalle-info-item editando">
      <label for="detalleEditNovedades">Novedades</label>
      <select id="detalleEditNovedades">
        <option value="true" ${manifiesto.novedades ? "selected" : ""}>Si</option>
        <option value="false" ${!manifiesto.novedades ? "selected" : ""}>No</option>
      </select>
    </div>

    <div class="detalle-info-item editando full-span">
      <label for="detalleEditObservaciones">Observaciones</label>
      <textarea id="detalleEditObservaciones">${manifiesto.observaciones || ""}</textarea>
    </div>
  `;

  const origenSelect = document.getElementById("detalleEditOrigen");
  const destinoSelect = document.getElementById("detalleEditDestino");

  if (origenSelect) origenSelect.value = manifiesto.origen_ciudad || "";
  if (destinoSelect) destinoSelect.value = manifiesto.destino_ciudad || "";
}

function cancelarEdicionDetalle() {
  if (!detalleDataActual) return;
  modoEdicionDetalle = false;
  actualizarBotonesDetalle();
  renderDetalleModoLectura(detalleDataActual);
}

async function guardarEdicionDetalle() {
  if (!detalleManifiestoActual) return;

  const origenSelect = document.getElementById("detalleEditOrigen");
  const destinoSelect = document.getElementById("detalleEditDestino");

  const payload = {
    radicado:  document.getElementById("detalleEditRadicado")?.value?.trim() || null,
    fecha: document.getElementById("detalleEditFecha")?.value || "",
    origen_ciudad: origenSelect?.value || "",
    origen_departamento: origenSelect?.selectedOptions?.[0]?.dataset?.departamento || "",
    destino_ciudad: destinoSelect?.value || "",
    destino_departamento: destinoSelect?.selectedOptions?.[0]?.dataset?.departamento || "",
    estado: document.getElementById("detalleEditEstado")?.value || "",
    valor_flete: detalleManifiestoActual.valor_flete,
    valor_flete_porcentaje: detalleManifiestoActual.valor_flete_porcentaje,
    anticipo_manifiesto: detalleManifiestoActual.anticipo_manifiesto,
    gastos: document.getElementById("detalleEditGastos")?.value || "",
    documentos: document.getElementById("detalleEditDocumentos")?.value || "",
    id_cliente: document.getElementById("detalleEditCliente")?.value || "",
    id_conductor: document.getElementById("detalleEditConductor")?.value || "",
    id_vehiculo: document.getElementById("detalleEditVehiculo")?.value || "",
    id_trailer: document.getElementById("detalleEditTrailer")?.value || "",
    id_empresa_a_cargo: detalleManifiestoActual.id_empresa_a_cargo,
    novedades: document.getElementById("detalleEditNovedades")?.value === "true",
    observaciones: document.getElementById("detalleEditObservaciones")?.value?.trim() || ""
  };

  const res = await apiFetch(`/api/manifiestos/${encodeURIComponent(detalleManifiestoActual.id_manifiesto)}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  if (!res) return;

  showToast("Manifiesto actualizado correctamente", "success");

  modoEdicionDetalle = false;

  const dataActualizada = await apiFetch(`/api/manifiestos/${encodeURIComponent(detalleManifiestoActual.id_manifiesto)}/detalle`);
  if (!dataActualizada) return;

  detalleDataActual = dataActualizada;
  detalleManifiestoActual = dataActualizada.manifiesto;

  actualizarBotonesDetalle();
  renderDetalleModoLectura(dataActualizada);

  await filtrarManifiestos();
}


function formatearMilesInput(valor) {
  if (!valor) return "";

  // solo números
  valor = valor.replace(/\D/g, "");

  return valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function limpiarNumeroInput(valor) {
  if (!valor) return "";
  return valor.replace(/\./g, "").replace(/\D/g, "");
}

function aplicarFormatoMonedaInputsManifiesto() {
  const ids = [
    "valor_flete",
    "valor_flete_porcentaje",
    "anticipo_manifiesto"
  ];

  ids.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", (e) => {
      const cursorFinal = e.target.value.length;
      e.target.value = formatearMilesInput(e.target.value);
      e.target.setSelectionRange(cursorFinal, cursorFinal);
    });

    input.addEventListener("blur", (e) => {
      e.target.value = formatearMilesInput(e.target.value);
    });
  });
}

function actualizarTrackingEstado(estado) {
  const truck = document.querySelector(".mfx-truck");
  const line = document.querySelector(".mfx-track-line");
  const steps = document.querySelectorAll(".mfx-track-step");

  let paso = 1;

  if (estado === "CREADO-EN TRANSITO") paso = 1;
  if (estado === "ENTREGADO POR COBRAR") paso = 2;
  if (estado === "MANIFIESTO PAGO") paso = 3;

  // ?? obtener posición REAL del step
  const step = steps[paso - 1];

  if (step && truck) {
    const rect = step.getBoundingClientRect();
    const parentRect = step.parentElement.getBoundingClientRect();

    const center = rect.left + rect.width / 2 - parentRect.left;

    truck.style.left = `${center}px`;
  }

  // progreso visual
  const porcentaje = ((paso - 1) / 2) * 100;

  if (line) {
    line.style.setProperty("--progress", `${porcentaje}%`);
  }
}