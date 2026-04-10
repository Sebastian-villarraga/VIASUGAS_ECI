let editandoManifiesto = false;
let catalogosManifiesto = null;
let debounceTimerManifiestos = null;

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
  ?.addEventListener("click", () => {
    document.getElementById("modalDetalleManifiesto")
      ?.classList.add("hidden");
  });
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
  const anio = document.getElementById("filtroAnio")?.value || "";
  const mes = document.getElementById("filtroMes")?.value || "";
  const idManifiesto = document.getElementById("filtroIdManifiesto")?.value.trim() || "";
  const fechaDesde = document.getElementById("filtroFechaDesde")?.value || "";
  const fechaHasta = document.getElementById("filtroFechaHasta")?.value || "";
  const estado = document.getElementById("filtroEstado")?.value || "";
  const idCliente = document.getElementById("filtroCliente")?.value || "";

  const params = new URLSearchParams();

  if (anio) params.append("anio", anio);
  if (mes) params.append("mes", mes);
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
  document.getElementById("filtroAnio").value = "";
  document.getElementById("filtroMes").value = "";
  document.getElementById("filtroIdManifiesto").value = "";
  document.getElementById("filtroFechaDesde").value = "";
  document.getElementById("filtroFechaHasta").value = "";
  document.getElementById("filtroEstado").value = "";
  document.getElementById("filtroCliente").value = "";

  cargarManifiestos();
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
      data-fecha="${m.fecha || ""}"
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
      data-id_vehiculo="${escapeHtml(m.id_vehiculo || "")}"
      data-id_trailer="${escapeHtml(m.id_trailer || "")}"
      data-id_empresa_a_cargo="${escapeHtml(m.id_empresa_a_cargo || "")}"
      data-novedades="${m.novedades}"
      data-observaciones="${escapeHtml(m.observaciones || "")}"
    >
      <td>${m.id_manifiesto}</td>
      <td>${m.radicado}</td>
      <td>${formatearFecha(m.fecha)}</td>
      <td>${m.cliente_nombre || m.id_cliente}</td>
      <td>${m.conductor_nombre || m.id_conductor}</td>
      <td>${m.origen_ciudad} -> ${m.destino_ciudad}</td>
      <td>${m.id_vehiculo}</td>
      <td>${m.id_trailer}</td>
      <td>${renderEstadoManifiesto(m.estado)}</td>
      <td>${renderNovedadBadge(m.novedades)}</td>

      <!-- ? NUEVA COLUMNA ACCIONES -->
      <td>
        <!-- ?? VER DETALLE -->
        <button class="btn-icon" onclick="verDetalleManifiesto('${m.id_manifiesto}')">
          <i class="fas fa-eye"></i>
        </button>

        <!-- ?? EDITAR -->
        <button class="btn-icon" onclick="editarManifiesto(this, '${m.id_manifiesto.replace(/'/g, "\\'")}')">
          <i class="fas fa-pen"></i>
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
  const texto = valor ? "Sí" : "No";
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

      valor_flete: document.getElementById("valor_flete").value,
      valor_flete_porcentaje: document.getElementById("valor_flete_porcentaje").value,
      anticipo_manifiesto: document.getElementById("anticipo_manifiesto").value,
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
// EDITAR INLINE
// =========================
async function editarManifiesto(btn, idManifiesto) {
  if (editandoManifiesto) {
    showToast("Termina de editar la fila actual primero", "info");
    return;
  }

  editandoManifiesto = true;

  const fila = btn.closest("tr");
  const d = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  // ?? INPUT FULL WIDTH
  const styleInput = `
    style="
      display:block;
      width:100%;
      min-width:0;
      box-sizing:border-box;
      padding:6px 8px;
      border-radius:6px;
      border:1px solid #ccc;
      font-size:12px;
    "
  `;

  // ?? SELECT FULL WIDTH (CLAVE)
  const styleSelect = `
    style="
      display:block;
      width:100%;
      min-width:0;
      box-sizing:border-box;
      padding:6px 8px;
      border-radius:6px;
      border:1px solid #ccc;
      font-size:12px;
    "
  `;

  // =========================
  // CAMPOS BASICOS
  // =========================
  celdas[1].innerHTML = `<input type="number" value="${d.radicado}" ${styleInput}>`;
  celdas[2].innerHTML = `<input type="date" value="${d.fecha}" ${styleInput}>`;

  celdas[3].innerHTML = `
    <select ${styleSelect}>
      ${catalogosManifiesto.clientes.map(c => `
        <option value="${c.nit}" ${c.nit === d.id_cliente ? "selected" : ""}>
          ${c.nombre} - ${c.nit}
        </option>
      `).join("")}
    </select>
  `;

  celdas[4].innerHTML = `
    <select ${styleSelect}>
      ${catalogosManifiesto.conductores.map(c => `
        <option value="${c.cedula}" ${String(c.cedula) === String(d.id_conductor) ? "selected" : ""}>
          ${c.nombre} - ${c.cedula}
        </option>
      `).join("")}
    </select>
  `;

  // =========================
  // ?? RUTA VERTICAL FULL WIDTH
  // =========================
  celdas[5].innerHTML = `
    <div style="display:flex; flex-direction:column; gap:6px; width:100%; min-width:0;">

      <div style="width:100%; min-width:0;">
        <span style="font-size:10px; color:#6b7280;">Origen</span>
        <select class="ciudad-origen" ${styleSelect}>
          <option value="">Seleccione</option>
        </select>
      </div>

      <div style="width:100%; min-width:0;">
        <span style="font-size:10px; color:#6b7280;">Destino</span>
        <select class="ciudad-destino" ${styleSelect}>
          <option value="">Seleccione</option>
        </select>
      </div>

    </div>
  `;

  const selectOrigen = celdas[5].querySelector(".ciudad-origen");
  const selectDestino = celdas[5].querySelector(".ciudad-destino");

  const ciudades = await apiFetch("/api/ubicaciones/municipios");

  if (!ciudades) {
    showToast("Error cargando ciudades", "error");
    return;
  }

  selectOrigen.innerHTML = `
    <option value="">Seleccione</option>
    ${ciudades.map(c => `
      <option value="${c.nombre_municipio}"
        data-departamento="${c.nombre_departamento}"
        ${c.nombre_municipio === d.origen_ciudad ? "selected" : ""}>
        ${c.nombre_municipio} (${c.nombre_departamento})
      </option>
    `).join("")}
  `;

  selectDestino.innerHTML = `
    <option value="">Seleccione</option>
    ${ciudades.map(c => `
      <option value="${c.nombre_municipio}"
        data-departamento="${c.nombre_departamento}"
        ${c.nombre_municipio === d.destino_ciudad ? "selected" : ""}>
        ${c.nombre_municipio} (${c.nombre_departamento})
      </option>
    `).join("")}
  `;

  // =========================
  // RESTO
  // =========================
  celdas[6].innerHTML = `
    <select ${styleSelect}>
      ${catalogosManifiesto.vehiculos.map(v => `
        <option value="${v.placa}" ${v.placa === d.id_vehiculo ? "selected" : ""}>
          ${v.placa}
        </option>
      `).join("")}
    </select>
  `;

  celdas[7].innerHTML = `
    <select ${styleSelect}>
      ${catalogosManifiesto.trailers.map(t => `
        <option value="${t.placa}" ${t.placa === d.id_trailer ? "selected" : ""}>
          ${t.placa}
        </option>
      `).join("")}
    </select>
  `;

  celdas[8].innerHTML = `
    <select ${styleSelect}>
      ${catalogosManifiesto.estados.map(e => `
        <option value="${e}" ${e === d.estado ? "selected" : ""}>
          ${e}
        </option>
      `).join("")}
    </select>
  `;

  celdas[9].innerHTML = `
    <select ${styleSelect}>
      <option value="true" ${d.novedades === "true" ? "selected" : ""}>Sí</option>
      <option value="false" ${d.novedades === "false" ? "selected" : ""}>No</option>
    </select>
  `;

  celdas[10].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarManifiesto(this, '${idManifiesto.replace(/'/g, "\\'")}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (!b.classList.contains("btn-save")) b.disabled = true;
  });
}
// =========================
// GUARDAR
// =========================
async function guardarManifiesto(btn, idManifiesto) {
  const fila = btn.closest("tr");
  const d = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  const radicado = celdas[1].querySelector("input").value;
  const fecha = celdas[2].querySelector("input").value;
  const idCliente = celdas[3].querySelector("select").value;
  const idConductor = celdas[4].querySelector("select").value;

  // ?? NUEVO: ciudades + departamento automático
  const selectOrigen = celdas[5].querySelector(".ciudad-origen");
  const selectDestino = celdas[5].querySelector(".ciudad-destino");

  const origenCiudad = selectOrigen.value;
  const destinoCiudad = selectDestino.value;

  const origenDepartamento = selectOrigen.selectedOptions[0]?.dataset.departamento || "";
  const destinoDepartamento = selectDestino.selectedOptions[0]?.dataset.departamento || "";

  const idVehiculo = celdas[6].querySelector("select").value;
  const idTrailer = celdas[7].querySelector("select").value;
  const estado = celdas[8].querySelector("select").value;
  const novedades = celdas[9].querySelector("select").value === "true";

  const payload = {
    radicado,
    fecha,
    origen_departamento: origenDepartamento,
    origen_ciudad: origenCiudad,
    destino_departamento: destinoDepartamento,
    destino_ciudad: destinoCiudad,
    estado,
    valor_flete: d.valor_flete,
    valor_flete_porcentaje: d.valor_flete_porcentaje,
    anticipo_manifiesto: d.anticipo_manifiesto,
    gastos: d.gastos,
    documentos: d.documentos,
    id_cliente: idCliente,
    id_conductor: idConductor,
    id_vehiculo: idVehiculo,
    id_trailer: idTrailer,
    id_empresa_a_cargo: d.id_empresa_a_cargo,
    novedades,
    observaciones: d.observaciones
  };

  const res = await apiFetch(`/api/manifiestos/${encodeURIComponent(idManifiesto)}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  if (!res) return;

  showToast("Manifiesto actualizado", "success");
  editandoManifiesto = false;

  document.querySelectorAll(".btn-icon").forEach(b => b.disabled = false);

  await cargarManifiestos();
  aplicarFiltroEsteMes();
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
    // =========================
    // ABRIR MODAL
    // =========================
    const modal = document.getElementById("modalDetalleManifiesto");
    modal?.classList.remove("hidden");

    // =========================
    // TRAER DATA (ENDPOINT NUEVO)
    // =========================
    const data = await apiFetch(`/api/manifiestos/${id}/detalle`);

    const manifiesto = data.manifiesto;
    const gastosFiltrados = data.gastos || [];
    const transacciones = data.transacciones || [];
    const factura = data.factura;

    // =========================
    // INFO GENERAL
    // =========================
    const contInfo = document.getElementById("detalleInfoManifiesto");

contInfo.innerHTML = `
  <div class="detalle-info-item">
    <span>ID</span>
    <strong>${manifiesto.id_manifiesto}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Cliente</span>
    <strong>${manifiesto.cliente_nombre || "-"}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Fecha</span>
    <strong>${manifiesto.fecha || "-"}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Ruta</span>
    <strong>${manifiesto.origen_ciudad} - ${manifiesto.destino_ciudad}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Vehículo</span>
    <strong>${manifiesto.id_vehiculo}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Trailer</span>
    <strong>${manifiesto.id_trailer}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Conductor</span>
    <strong>${manifiesto.id_conductor}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Estado</span>
    <strong>${manifiesto.estado}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Valor Flete</span>
    <strong>$${Number(manifiesto.valor_flete || 0).toLocaleString()}</strong>
  </div>

  <div class="detalle-info-item">
    <span>% Flete</span>
    <strong>$${Number(manifiesto.valor_flete_porcentaje || 0).toLocaleString()}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Anticipo</span>
    <strong>$${Number(manifiesto.anticipo_manifiesto || 0).toLocaleString()}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Empresa a cargo</span>
    <strong>${manifiesto.id_empresa_a_cargo}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Novedades</span>
    <strong>${manifiesto.novedades ? "Sí" : "No"}</strong>
  </div>

  <div class="detalle-info-item">
    <span>Observaciones</span>
    <strong>${manifiesto.observaciones || "-"}</strong>
  </div>
`;

    // =========================
    // GASTOS CONDUCTOR
    // =========================
    const contGastos = document.getElementById("detalleGastos");
    contGastos.innerHTML = "";

    let totalGastos = 0;

    gastosFiltrados.forEach(g => {
      const valor = Number(g.valor || 0);
      totalGastos += valor;

      contGastos.innerHTML += `
        <div class="detalle-item">
          <span>${g.descripcion || "-"}</span>
          <span class="valor-gasto">-$${valor.toLocaleString()}</span>
        </div>
      `;
    });

    if (gastosFiltrados.length === 0) {
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

      if (t.tipo === "INGRESO MANIFIESTO") {
        totalIngresos += valor;
        clase = "valor-ingreso";
        signo = "+";
      } else if (t.tipo === "EGRESO MANIFIESTO") {
        totalEgresos += valor;
        clase = "valor-egreso";
        signo = "-";
      } else {
        return;
      }

      contTrans.innerHTML += `
        <div class="detalle-item">
          <span>${t.tipo}</span>
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
      const valor = Number(factura.valor || 0);
      const ret =
        Number(factura.retencion_fuente || 0) +
        Number(factura.retencion_ica || 0);

      const neto = valor - ret;
      totalFactura = neto;

      contFactura.innerHTML = `
        <div class="detalle-item">
          <span>Factura: ${factura.codigo_factura}</span>
          <span class="valor-ingreso">$${neto.toLocaleString()}</span>
        </div>
      `;
    } else {
      contFactura.innerHTML = "<p>Sin factura</p>";
    }

    document.getElementById("totalFacturaDetalle").innerHTML =
      `<span class="total-ingreso">$${totalFactura.toLocaleString()}</span>`;

    // =========================
    // RESUMEN FINAL
    // =========================
    const balance = totalFactura - totalGastos;

    let texto = "";
    let clase = "";

    if (balance > 0) {
      texto = `UTILIDAD: $${balance.toLocaleString()}`;
      clase = "resumen-positivo";
    } else if (balance < 0) {
      texto = `PÉRDIDA: $${Math.abs(balance).toLocaleString()}`;
      clase = "resumen-negativo";
    } else {
      texto = "PUNTO DE EQUILIBRIO";
      clase = "resumen-cero";
    }

    document.getElementById("resumenDetalle").innerHTML =
      `<span class="${clase}">${texto}</span>`;

  } catch (error) {
    console.error("Error detalle manifiesto:", error);
    alert("Error cargando detalle");
  }
}