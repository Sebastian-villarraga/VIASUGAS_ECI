// =========================
// INIT (SPA)
// =========================
function initTrailers() {
  console.log("INIT TRAILERS");

  cargarTrailers();
  cargarAlertas();
  initFormTrailer(); 
  initEventosFiltros(); 
}

// =========================
// CONTROL EDICION
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

    console.log("DATA TRAILERS:", data);

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

    console.log("URL FILTRO:", url);

    const data = await apiFetch(url);

    console.log("RESULTADO:", data);

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

  // inputs
  celdas[0].innerHTML = `<input value="${valores.placa}" disabled>`;

  celdas[1].innerHTML = `
    <input value="${valores.propietario === "-" ? "" : valores.propietario}">
  `;

  celdas[2].innerHTML = `
    <input type="date" value="${formatoInputSeguro(valores.fecha)}">
  `;

  celdas[3].innerHTML = `
    <select>
      <option value="activo" ${valores.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${valores.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  // botÓn guardar
  celdas[4].innerHTML = `
    <button type="button" class="btn-icon btn-save" onclick="guardarEdicionTrailer(this, '${placa}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[4].querySelector("button");

  // deshabilitar otros botones
  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) {
      b.disabled = true;
    }
  });
}

// =========================
// GUARDAR EDICION TRAILER
// =========================
async function guardarEdicionTrailer(btn, placa) {
  const fila = btn.closest("tr");

  const propietario = fila.querySelector("input").value;
  const fecha = fila.querySelector("input[type='date']").value;
  const estado = fila.querySelector("select").value;

  const data = {
    propietario,
    vencimiento_cert_fumigacion: fecha,
    estado
  };

  try {
    await apiFetch(`/api/trailers/${placa}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    editandoTrailer = false;

    // reactivar botones
    document.querySelectorAll(".btn-icon").forEach(b => {
      b.disabled = false;
    });

    cargarTrailers();

  } catch (error) {
    console.error("Error actualizando trailer:", error);
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      placa: document.getElementById("placa").value,
      propietario: document.getElementById("propietario").value,
      vencimiento_cert_fumigacion: document.getElementById("fumigacion").value,
      estado: document.getElementById("estado").value
    };

    try {
      await apiFetch("/api/trailers", {
        method: "POST",
        body: JSON.stringify(data)
      });

      cerrarModalTrailer();
      form.reset();

      await cargarTrailers();

    } catch (error) {
      console.error("Error creando trailer:", error);
    }
  });
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
}

function cerrarModalTrailer() {
  document.getElementById("modalTrailer").classList.add("hidden");
}

// =========================
// ALERTAS
// =========================
async function cargarAlertas() {
  try {
    const lista = document.getElementById("alertasList");
    const countV = document.getElementById("countVencidos");
    const countP = document.getElementById("countProximos");

    if (!lista) return;

    const data = await apiFetch("/api/trailers/alertas");

    console.log("ALERTAS:", data);

    if (!data || data.length === 0) {
      lista.innerHTML = "<div>Sin alertas</div>";
      countV.textContent = 0;
      countP.textContent = 0;
      return;
    }

    let vencidos = 0;
    let proximos = 0;

    data.forEach(a => {
      if (a.estado === "vencido") vencidos++;
      else proximos++;
    });

    countV.textContent = vencidos;
    countP.textContent = proximos;

    lista.innerHTML = data.map(a => {

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
  try {
    const data = await apiFetch("/api/trailers/filtro-alertas?tipo=vencido");
    renderTablaTrailer(data);
  } catch (error) {
    console.error(error);
  }
}

async function filtrarProximos() {
  try {
    const data = await apiFetch("/api/trailers/filtro-alertas?tipo=proximo");
    renderTablaTrailer(data);
  } catch (error) {
    console.error(error);
  }
}


