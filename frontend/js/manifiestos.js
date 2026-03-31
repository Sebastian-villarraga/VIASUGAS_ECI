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
      <td>
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

    const data = {
      id_manifiesto: document.getElementById("id_manifiesto").value.trim(),
      radicado: document.getElementById("radicado").value.trim(),
      fecha: document.getElementById("fecha").value,
      origen_departamento: document.getElementById("origen_departamento").value,
      origen_ciudad: document.getElementById("origen_ciudad").value,
      destino_departamento: document.getElementById("destino_departamento").value,
      destino_ciudad: document.getElementById("destino_ciudad").value,
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
    await llenarSelectDepartamentos("origen_departamento");
    await llenarSelectDepartamentos("destino_departamento");
    await cargarManifiestos();
  });
}

// =========================
// MODAL
// =========================
function abrirModalManifiesto() {
  document.getElementById("modalManifiesto")?.classList.remove("hidden");

  const origenCiudad = document.getElementById("origen_ciudad");
  const destinoCiudad = document.getElementById("destino_ciudad");

  if (origenCiudad) {
    origenCiudad.innerHTML = `<option value="">Seleccione</option>`;
  }

  if (destinoCiudad) {
    destinoCiudad.innerHTML = `<option value="">Seleccione</option>`;
  }
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

  const departamentos = await apiFetch("/api/ubicaciones/departamentos");

  if (!departamentos) {
    showToast("No se pudieron cargar los departamentos", "error");
    editandoManifiesto = false;
    return;
  }

  celdas[1].innerHTML = `<input type="number" value="${d.radicado}">`;
  celdas[2].innerHTML = `<input type="date" value="${d.fecha}">`;

  celdas[3].innerHTML = `
    <select>
      ${catalogosManifiesto.clientes.map(c => `
        <option value="${c.nit}" ${c.nit === d.id_cliente ? "selected" : ""}>${c.nombre} - ${c.nit}</option>
      `).join("")}
    </select>
  `;

  celdas[4].innerHTML = `
    <select>
      ${catalogosManifiesto.conductores.map(c => `
        <option value="${c.cedula}" ${String(c.cedula) === String(d.id_conductor) ? "selected" : ""}>${c.nombre} - ${c.cedula}</option>
      `).join("")}
    </select>
  `;

  celdas[5].innerHTML = `
    <div class="ruta-inline">
      <div class="ruta-inline-item">
        <select class="dep-origen-inline">
          <option value="">Seleccione</option>
          ${departamentos.map(dep => `
            <option value="${dep.nombre_departamento}" ${dep.nombre_departamento === d.origen_departamento ? "selected" : ""}>
              ${dep.nombre_departamento}
            </option>
          `).join("")}
        </select>
        <select class="ciu-origen-inline">
          <option value="">Seleccione</option>
        </select>
      </div>
      <div class="ruta-inline-item">
        <select class="dep-destino-inline">
          <option value="">Seleccione</option>
          ${departamentos.map(dep => `
            <option value="${dep.nombre_departamento}" ${dep.nombre_departamento === d.destino_departamento ? "selected" : ""}>
              ${dep.nombre_departamento}
            </option>
          `).join("")}
        </select>
        <select class="ciu-destino-inline">
          <option value="">Seleccione</option>
        </select>
      </div>
    </div>
  `;

  celdas[6].innerHTML = `
    <select>
      ${catalogosManifiesto.vehiculos.map(v => `
        <option value="${v.placa}" ${v.placa === d.id_vehiculo ? "selected" : ""}>${v.placa}</option>
      `).join("")}
    </select>
  `;

  celdas[7].innerHTML = `
    <select>
      ${catalogosManifiesto.trailers.map(t => `
        <option value="${t.placa}" ${t.placa === d.id_trailer ? "selected" : ""}>${t.placa}</option>
      `).join("")}
    </select>
  `;

  celdas[8].innerHTML = `
    <select>
      ${catalogosManifiesto.estados.map(e => `
        <option value="${e}" ${e === d.estado ? "selected" : ""}>${e}</option>
      `).join("")}
    </select>
  `;

  celdas[9].innerHTML = `
    <select>
      <option value="true" ${d.novedades === "true" ? "selected" : ""}>Sí</option>
      <option value="false" ${d.novedades === "false" ? "selected" : ""}>No</option>
    </select>
  `;

  celdas[10].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarManifiesto(this, '${idManifiesto.replace(/'/g, "\\'")}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const depOrigen = celdas[5].querySelector(".dep-origen-inline");
  const ciuOrigen = celdas[5].querySelector(".ciu-origen-inline");
  const depDestino = celdas[5].querySelector(".dep-destino-inline");
  const ciuDestino = celdas[5].querySelector(".ciu-destino-inline");

  await cargarCiudadesInline(depOrigen.value, ciuOrigen, d.origen_ciudad);
  await cargarCiudadesInline(depDestino.value, ciuDestino, d.destino_ciudad);

  depOrigen.addEventListener("change", async () => {
    await cargarCiudadesInline(depOrigen.value, ciuOrigen);
  });

  depDestino.addEventListener("change", async () => {
    await cargarCiudadesInline(depDestino.value, ciuDestino);
  });

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (!b.classList.contains("btn-save")) b.disabled = true;
  });
}

async function guardarManifiesto(btn, idManifiesto) {
  const fila = btn.closest("tr");
  const d = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  const radicado = celdas[1].querySelector("input").value;
  const fecha = celdas[2].querySelector("input").value;
  const idCliente = celdas[3].querySelector("select").value;
  const idConductor = celdas[4].querySelector("select").value;
  const depOrigen = celdas[5].querySelector(".dep-origen-inline").value;
  const ciuOrigen = celdas[5].querySelector(".ciu-origen-inline").value;
  const depDestino = celdas[5].querySelector(".dep-destino-inline").value;
  const ciuDestino = celdas[5].querySelector(".ciu-destino-inline").value;
  const idVehiculo = celdas[6].querySelector("select").value;
  const idTrailer = celdas[7].querySelector("select").value;
  const estado = celdas[8].querySelector("select").value;
  const novedades = celdas[9].querySelector("select").value === "true";

  const payload = {
    radicado,
    fecha,
    origen_departamento: depOrigen,
    origen_ciudad: ciuOrigen,
    destino_departamento: depDestino,
    destino_ciudad: ciuDestino,
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