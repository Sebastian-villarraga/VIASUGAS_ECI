// =========================
// INIT (SPA)
// =========================
function initTrailers() {

  cargarTrailers();
  cargarAlertas();
  initFormTrailer(); 
  initEventosFiltros(); 
}

// =========================
// CONTROL EDICIÓN
// =========================
let editandoTrailer = false;

// =========================
// CARGAR TRAILERS
// =========================
async function cargarTrailers() {
  try {
    const tabla = document.getElementById("trailerTable");
    if (!tabla) return;

    tabla.innerHTML = `<tr><td colspan="5">Cargando trailers...</td></tr>`;

    const data = await apiFetch("/api/trailers");


    renderTablaTrailer(data);

  } catch (error) {
    console.error("Error cargando trailers:", error);

    const tabla = document.getElementById("trailerTable");
    if (tabla) {
      tabla.innerHTML = `
        <tr>
          <td colspan="5">Error cargando datos</td>
        </tr>
      `;
    }
  }
}

// =========================
// FILTRAR TRAILERS
// =========================
async function filtrarTrailers() {
  try {
    const placa = document.getElementById("filtroPlaca")?.value.trim() || "";
    const propietario = document.getElementById("filtroPropietario")?.value.trim() || "";
    let estado = document.getElementById("filtroEstado")?.value || "";

    const params = new URLSearchParams();

    if (placa !== "") params.append("placa", placa);
    if (propietario !== "") params.append("propietario", propietario);

    if (estado !== "") {
      params.append("estado", estado.toLowerCase().trim());
    }

    const url = `/api/trailers${params.toString() ? "?" + params.toString() : ""}`;


    const data = await apiFetch(url);


    renderTablaTrailer(data);

  } catch (error) {
    console.error("Error filtrando trailers:", error);
  }
}

function initEventosFiltros() {
  const placa = document.getElementById("filtroPlaca");
  const propietario = document.getElementById("filtroPropietario");
  const estado = document.getElementById("filtroEstado");

  if (!placa || !propietario || !estado) return;

  // ENTER en inputs
  [placa, propietario].forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        filtrarTrailers();
      }
    });
  });

  // cambio en select
  estado.addEventListener("change", () => {
    filtrarTrailers();
  });
}

// =========================
// LIMPIAR FILTROS
// =========================
function limpiarFiltros() {
  const placa = document.getElementById("filtroPlaca");
  const propietario = document.getElementById("filtroPropietario");
  const estado = document.getElementById("filtroEstado");

  if (placa) placa.value = "";
  if (propietario) propietario.value = "";
  if (estado) estado.value = "";

  cargarTrailers();
}

// =========================
// RENDER TABLA
// =========================
function renderTablaTrailer(data) {
  const tabla = document.getElementById("trailerTable");

  if (!tabla) return;

  if (!data || data.length === 0) {
    tabla.innerHTML = `
      <tr>
        <td colspan="5">No hay resultados</td>
      </tr>
    `;
    return;
  }

  tabla.innerHTML = data.map(t => {

    const estadoClass = t.estado === "activo"
      ? "badge-activo"
      : "badge-inactivo";

    return `
      <tr>
        <td>${t.placa}</td>
        <td>${t.propietario || "-"}</td>
        <td>${formatearFecha(t.vencimiento_cert_fumigacion)}</td>

        <td>
          <span class="badge ${estadoClass}">
            ${t.estado}
          </span>
        </td>

        <td>
          <button type="button" class="btn-icon" onclick="editarTrailer(this, '${t.placa}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// =========================
// EDITAR TABLATRAILER
// =========================
function editarTrailer(btn, placa) {

  if (editandoTrailer) {
    alert("Termina de editar primero");
    return;
  }

  editandoTrailer = true;

  const fila = btn.closest("tr");
  const celdas = fila.querySelectorAll("td");

  const valores = {
    placa: celdas[0].innerText.trim(),
    propietario: celdas[1].innerText.trim(),
    fecha: celdas[2].innerText.trim(),
    estado: celdas[3].innerText.trim().toLowerCase()
  };

  // ?? placa (no editable)
  celdas[0].innerHTML = `<input value="${valores.placa}" disabled>`;

  // ?? PROPIETARIO COMO SELECT
  celdas[1].innerHTML = `<select class="select-propietario-trailer"></select>`;

  const selectProp = celdas[1].querySelector("select");
  cargarPropietariosEnSelectTrailer(selectProp, valores.propietario);

  // FECHA
  celdas[2].innerHTML = `
    <input type="date" value="${formatoInputSeguro(valores.fecha)}">
  `;

  // ESTADO
  celdas[3].innerHTML = `
    <select>
      <option value="activo" ${valores.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${valores.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  // BOTÓN GUARDAR
  celdas[4].innerHTML = `
    <button type="button" class="btn-icon btn-save" onclick="guardarEdicionTrailer(this, '${placa}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[4].querySelector("button");

  // ?? deshabilitar otros botones
  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// =========================
// LISTA PROPIETARIOS EN EDICION
// =========================

async function cargarPropietariosEnSelectTrailer(select, seleccionado) {
  try {
    const propietarios = await apiFetch("/api/propietarios?estado=activo");

    select.innerHTML = `<option value="">Seleccionar</option>`;

    propietarios.forEach(p => {
      const option = document.createElement("option");
      option.value = p.identificacion;
      option.textContent = `${p.nombre} - ${p.identificacion}`;

      // ?? seleccionar el actual
      if (p.nombre === seleccionado || p.identificacion === seleccionado) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando propietarios trailer:", error);
  }
}
// =========================
// GUARDAR EDICION TRAILER
// =========================
async function guardarEdicionTrailer(btn, placa) {
  const fila = btn.closest("tr");

  const propietario = fila.querySelector(".select-propietario-trailer")?.value;
  const fecha = fila.querySelector("input[type='date']")?.value;
  const estado = fila.querySelector("td:nth-child(4) select")?.value;

  const data = {
    propietario: propietario, // ?? FK correcta (identificación)
    vencimiento_cert_fumigacion: fecha || null,
    estado: estado
  };

  try {
    await apiFetch(`/api/trailers/${placa}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    // ?? TOAST (si ya lo implementaste)
    mostrarToast("Trailer actualizado correctamente");

    editandoTrailer = false;

    document.querySelectorAll(".btn-icon").forEach(b => {
      b.disabled = false;
    });

    cargarTrailers();
    cargarAlertas();

  } catch (error) {
    console.error("Error actualizando trailer:", error);
    mostrarToast("Error al guardar", "error");
  }
}
// =========================
// FORMATO FECHA INPUT
// =========================
function formatoInputSeguro(fecha) {
  if (!fecha || fecha === "-") return "";

  const partes = fecha.split("/");
  if (partes.length !== 3) return "";

  const [dia, mes, anio] = partes;

  return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

// =========================
// FORM 
// =========================
function initFormTrailer() {
  const form = document.getElementById("formTrailer");
  if (!form) return;

  if (form._handlerTrailer) {
    form.removeEventListener("submit", form._handlerTrailer);
  }

  const handler = async (e) => {
    e.preventDefault();

    const placa = document.getElementById("placaTrailer")?.value.trim().toUpperCase();
    const propietario = document.getElementById("propietarioTrailer")?.value;
    const fumigacion = document.getElementById("fumigacion")?.value;
    const estado = document.getElementById("estadoTrailer")?.value;

    if (!placa) {
      alert("La placa del trailer es obligatoria");
      return;
    }

    if (!propietario) {
      alert("Debe seleccionar un propietario");
      return;
    }

    const data = {
      placa,
      propietario, // ?? ahora es identificacion
      vencimiento_fumigacion: fumigacion || null,
      estado: estado || "activo"
    };

    try {
      const res = await apiFetch("/api/trailers", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res) return;

      cerrarModalTrailer();
      form.reset();
      cargarTrailers();

    } catch (error) {
      console.error("Error creando trailer:", error);
    }
  };

  form._handlerTrailer = handler;
  form.addEventListener("submit", handler);
}

// =========================
// UTILIDADES
// =========================
function formatearFecha(fecha) {
  if (!fecha) return "-";

  const f = new Date(fecha);

  if (isNaN(f)) return "-";

  const dia = String(f.getDate()).padStart(2, "0");
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const anio = f.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

// =========================
// MODAL
// =========================
function abrirModalTrailer() {
  document.getElementById("modalTrailer").classList.remove("hidden");
  cargarPropietariosTrailerSelect();
}

function cerrarModalTrailer() {
  document.getElementById("modalTrailer").classList.add("hidden");
}

// =========================
// ALERTAS
// =========================
// =========================
// ALERTAS (FILTRABLES)
// =========================
async function cargarAlertas(tipo = null) {
  try {
    const lista = document.getElementById("alertasList");
    const countV = document.getElementById("countVencidos");
    const countP = document.getElementById("countProximos");

    if (!lista) return;

    const data = await apiFetch("/api/trailers/alertas");

    if (!data || data.length === 0) {
      lista.innerHTML = "<div>Sin alertas</div>";
      if (countV) countV.textContent = 0;
      if (countP) countP.textContent = 0;
      return;
    }

    // ?? CONTADORES SIEMPRE COMPLETOS
    const vencidos = data.filter(a => a.estado === "vencido");
    const proximos = data.filter(a => a.estado === "proximo");

    if (countV) countV.textContent = vencidos.length;
    if (countP) countP.textContent = proximos.length;

    // ?? FILTRAR VISUALMENTE SI SE PASA TIPO
    let dataMostrar = data;

    if (tipo === "vencido") {
      dataMostrar = vencidos;
    }

    if (tipo === "proximo") {
      dataMostrar = proximos;
    }

    if (dataMostrar.length === 0) {
      lista.innerHTML = "<div>Sin alertas</div>";
      return;
    }

    lista.innerHTML = dataMostrar.map(a => {

      const clase = a.estado === "vencido"
        ? "alerta-item vencido"
        : "alerta-item proximo";

      return `
        <div class="${clase}">
          <div class="alerta-titulo">
            ${a.tipo} - ${a.placa}
          </div>
          <div class="alerta-fecha">
            ${formatearFecha(a.fecha)}
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Error alertas trailer:", error);
  }
}

// =========================
// FILTROS RAPIDOS
// =========================
async function filtrarVencidos() {
  const data = await apiFetch("/api/trailers/filtro-alertas?tipo=vencido");
  renderTablaTrailer(data);

  // ?? FILTRAR ALERTAS VISUALES
  cargarAlertas("vencido");
}

async function filtrarProximos() {
  const data = await apiFetch("/api/trailers/filtro-alertas?tipo=proximo");
  renderTablaTrailer(data);

  // ?? FILTRAR ALERTAS VISUALES
  cargarAlertas("proximo");
}


// =========================
// CARGAR PROPIETARIOS ACTIVOS (TRAILER)
// =========================
async function cargarPropietariosTrailerSelect() {
  try {
    const select = document.getElementById("propietarioTrailer");
    if (!select) return;

    select.innerHTML = `<option value="">Seleccionar propietario</option>`;

    const propietarios = await apiFetch("/api/propietarios?estado=activo");

    if (!propietarios || propietarios.length === 0) return;

    propietarios.forEach(p => {
      const option = document.createElement("option");
      option.value = p.identificacion; // ?? FK real
      option.textContent = `${p.nombre} - ${p.identificacion}`;
      select.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando propietarios trailer:", error);
  }
}