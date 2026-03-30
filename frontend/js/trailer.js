// =========================
// INIT (SPA)
// =========================
function initTrailers() {
  console.log("INIT TRAILERS");

  cargarTrailers();
  cargarAlertas();
  initFormTrailer(); 
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

    if (placa) params.append("placa", placa);
    if (propietario) params.append("propietario", propietario);

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

// =========================
// LIMPIAR FILTROS
// =========================
function limpiarFiltros() {
  document.getElementById("filtroPlaca").value = "";
  document.getElementById("filtroPropietario").value = "";
  document.getElementById("filtroEstado").value = "";

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

  tabla.innerHTML = data.map(t => `
    <tr>
      <td>${t.placa}</td>
      <td>${t.propietario || "-"}</td>
      <td>${formatearFecha(t.vencimiento_cert_fumigacion)}</td>
      <td>${t.estado}</td>
      <td>
        <button type="button" class="btn-icon" onclick="editarTrailer(this, '${t.placa}')">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
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

  const valores = [...celdas].slice(0, 4).map(td => td.textContent.trim());

  celdas[0].innerHTML = `<input value="${valores[0]}" disabled>`;
  celdas[1].innerHTML = `<input value="${valores[1] === "-" ? "" : valores[1]}">`;
  celdas[2].innerHTML = `<input type="date" value="${formatoInputSeguro(valores[2])}">`;

  celdas[3].innerHTML = `
    <select>
      <option value="activo" ${valores[3] === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${valores[3] === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  celdas[4].innerHTML = `
    <button type="button" class="btn-icon btn-save" onclick="guardarEdicionTrailer(this, '${placa}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[4].querySelector("button");

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
  const inputs = fila.querySelectorAll("input, select");

  const data = {
    propietario: inputs[1].value,
    vencimiento_cert_fumigacion: inputs[2].value,
    estado: inputs[3].value
  };

  try {
    await apiFetch(`/api/trailers/${placa}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    editandoTrailer = false;

    // ?? reactivar botones
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

      cerrarModalVehiculo();
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

  try {
    return new Date(fecha).toLocaleDateString();
  } catch {
    return fecha;
  }
}

// =========================
// MODAL
// =========================
function abrirModalVehiculo() {
  document.getElementById("modalTrailer").classList.remove("hidden");
}

function cerrarModalVehiculo() {
  document.getElementById("modalTrailer").classList.add("hidden");
}

// =========================
// ALERTAS
// =========================
async function cargarAlertas() {
  try {
    const lista = document.getElementById("alertasList");

    const data = await apiFetch("/api/trailers/alertas");
    
    console.log("ALERTAS:", data); // DEBUG

    if (!data || data.length === 0) {
      lista.innerHTML = "<li>Sin alertas</li>";
      return;
    }

    lista.innerHTML = data.map(a => {
      const clase = a.estado === "vencido"
        ? "alerta-vencido"
        : "alerta-proximo";

      return `
        <li class="alerta-item ${clase}">
          <div class="alerta-titulo">
            <i class="fas fa-circle alerta-icono"></i>
            ${a.tipo} - ${a.placa}
          </div>
          <div class="alerta-fecha">
            ${formatearFecha(a.fecha)}
          </div>
        </li>
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