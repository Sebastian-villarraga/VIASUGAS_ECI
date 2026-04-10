let editandoConductor = false;
let alertaActiva = null;

// ================= INIT
function initConductores() {
  cargarConductores();
  cargarAlertasConductores();
  initFormConductor();

  // ?? listeners dinámicos
  document.getElementById("filtroNombre")
    .addEventListener("input", aplicarFiltrosConductores);

  document.getElementById("filtroCedula")
    .addEventListener("input", aplicarFiltrosConductores);

  document.getElementById("filtroEstado")
    .addEventListener("change", aplicarFiltrosConductores);
}

// ================= CARGAR
async function cargarConductores() {
  const data = await apiFetch("/api/conductores");
  renderTablaConductores(data);
}

// ================= RENDER
function renderTablaConductores(data) {
  const tabla = document.getElementById("conductoresTable");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">Sin datos</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(c => `
    <tr 
      data-id="${c.cedula}"
      data-nombre="${c.nombre}"
      data-correo="${c.correo || ""}"
      data-telefono="${c.telefono || ""}"
      data-estado="${c.estado}"
      data-licencia="${c.vencimiento_licencia?.split("T")[0]}"
      data-alimentos="${c.vencimiento_manip_alimentos?.split("T")[0]}"
      data-sustancias="${c.vencimiento_sustancia_peligrosa?.split("T")[0]}"
    >
      <td>${c.cedula}</td>
      <td>${c.nombre}</td>
      <td>${formatearFecha(c.vencimiento_licencia)}</td>
      <td>${formatearFecha(c.vencimiento_manip_alimentos)}</td>
      <td>${formatearFecha(c.vencimiento_sustancia_peligrosa)}</td>
      <td>${renderEstadoBadge(c.estado)}</td>
      <td>
        <button class="btn-icon" onclick="editarConductor(this, ${c.cedula})">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// ================= FILTROS
async function filtrarConductores() {
  const nombre = document.getElementById("filtroNombre").value.trim();
  const cedula = document.getElementById("filtroCedula").value.trim();
  const estado = document.getElementById("filtroEstado").value;

  let params = [];

  if (nombre) params.push(`nombre=${encodeURIComponent(nombre)}`);
  if (cedula) params.push(`cedula=${encodeURIComponent(cedula)}`);
  if (estado) params.push(`estado=${estado}`);

  const url = `/api/conductores${params.length ? "?" + params.join("&") : ""}`;

  const data = await apiFetch(url);

  renderTablaConductores(data);
}

function limpiarFiltrosConductores() {
  // limpiar inputs
  document.getElementById("filtroNombre").value = "";
  document.getElementById("filtroCedula").value = "";
  document.getElementById("filtroEstado").value = "";

  // recargar datos completos
  cargarConductores();
}

// ================= FORM
function initFormConductor() {
  const form = document.getElementById("formConductor");
  if (!form) return;

  const inputCedula = document.getElementById("cedula");
  const inputNombre = document.getElementById("nombre");
  const inputCorreo = document.getElementById("correo");
  const inputTelefono = document.getElementById("telefono");

  const inputLicencia = document.getElementById("licencia");
  const inputAlimentos = document.getElementById("alimentos");
  const inputSustancias = document.getElementById("sustancias");

  const inputsFecha = [inputLicencia, inputAlimentos, inputSustancias];

  // =========================
  // HELPERS VISUALES
  // =========================

  function marcarError(input) {
    input.style.border = "1px solid #dc3545";
  }

  function limpiarError(input) {
    input.style.border = "1px solid #ccc";
  }

  // =========================
  // VALIDACIONES EN TIEMPO REAL
  // =========================

  // CÉDULA
  inputCedula.addEventListener("input", () => {
    inputCedula.value = inputCedula.value.replace(/\D/g, "");
    inputCedula.value ? limpiarError(inputCedula) : marcarError(inputCedula);
  });

  // NOMBRE
  inputNombre.addEventListener("input", () => {
    inputNombre.value = inputNombre.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    inputNombre.value.trim() ? limpiarError(inputNombre) : marcarError(inputNombre);
  });

  // TELÉFONO
  inputTelefono.addEventListener("input", () => {
    inputTelefono.value = inputTelefono.value.replace(/\D/g, "").slice(0, 10);
    inputTelefono.value.length === 10 ? limpiarError(inputTelefono) : marcarError(inputTelefono);
  });

  // CORREO
  inputCorreo.addEventListener("input", () => {
    const correo = inputCorreo.value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correo || regex.test(correo)) {
      limpiarError(inputCorreo);
    } else {
      marcarError(inputCorreo);
    }
  });

  // FECHAS (?? MEJORA VISUAL CLAVE)
  inputsFecha.forEach(input => {
    input.addEventListener("change", () => {
      if (input.value) {
        limpiarError(input);
      } else {
        marcarError(input);
      }
    });

    // cuando enfoca ? mejora visual
    input.addEventListener("focus", () => {
      input.style.outline = "none";
      input.style.border = "1px solid #2a5298";
    });

    // cuando sale ? vuelve a normal
    input.addEventListener("blur", () => {
      if (!input.value) {
        marcarError(input);
      } else {
        limpiarError(input);
      }
    });
  });

  // =========================
  // SUBMIT
  // =========================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cedula = inputCedula.value.trim();
    const nombre = inputNombre.value.trim();
    const correo = inputCorreo.value.trim();
    const telefono = inputTelefono.value.trim();

    const licencia = inputLicencia.value;
    const alimentos = inputAlimentos.value;
    const sustancias = inputSustancias.value;
    const estado = document.getElementById("estado").value;

    let hayError = false;

    if (!cedula) {
      marcarError(inputCedula);
      hayError = true;
    }

    if (!nombre) {
      marcarError(inputNombre);
      hayError = true;
    }

    if (telefono && telefono.length !== 10) {
      marcarError(inputTelefono);
      hayError = true;
    }

    if (!licencia) {
      marcarError(inputLicencia);
      hayError = true;
    }

    if (!alimentos) {
      marcarError(inputAlimentos);
      hayError = true;
    }

    if (!sustancias) {
      marcarError(inputSustancias);
      hayError = true;
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !regexCorreo.test(correo)) {
      marcarError(inputCorreo);
      hayError = true;
    }

    if (hayError) {
      showToast("Corrige los campos marcados", "warning");
      return;
    }

    const data = {
      cedula,
      nombre,
      correo,
      telefono,
      estado,
      vencimiento_licencia: licencia,
      vencimiento_manip_alimentos: alimentos,
      vencimiento_sustancia_peligrosa: sustancias
    };

    try {
      const res = await apiFetch("/api/conductores", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res) {
        showToast("No se pudo crear el conductor", "error");
        return;
      }

      showToast("Conductor creado correctamente", "success");

      cerrarModalConductor();
      form.reset();
      cargarConductores();
      cargarAlertasConductores();

    } catch (error) {
      console.error(error);
      showToast("Error inesperado al crear conductor", "error");
    }
  });
}

// ================= MODAL
function abrirModalConductor() {
  document.getElementById("modalConductor").classList.remove("hidden");
}

function cerrarModalConductor() {
  document.getElementById("modalConductor").classList.add("hidden");
}

// ================= ALERTAS
async function cargarAlertasConductores() {
  const lista = document.getElementById("alertasConductores");

  const data = await apiFetch("/api/conductores/alertas");

  if (!data || data.length === 0) {
    lista.innerHTML = "<p>Sin alertas</p>";
    return;
  }

  const vencidos = data.filter(a => a.estado === "vencido");
  const proximos = data.filter(a => a.estado === "proximo");

  lista.innerHTML = `
    <div class="alert-summary">

      <div class="alert-counter red" onclick="toggleGrupo('vencidos')">
        ${vencidos.length} vencidos
      </div>

      <div class="alert-counter yellow" onclick="toggleGrupo('proximos')">
        ${proximos.length} por vencer
      </div>

    </div>

    <div class="alertas-container">

      <div id="grupo-vencidos">
        ${vencidos.map(renderAlerta).join("")}
      </div>

      <div id="grupo-proximos" style="display:none;">
        ${proximos.map(renderAlerta).join("")}
      </div>

    </div>
  `;
}

function toggleGrupo(tipo) {
  const v = document.getElementById("grupo-vencidos");
  const p = document.getElementById("grupo-proximos");

  if (tipo === "vencidos") {
    v.style.display = "block";
    p.style.display = "none";
    filtrarConductoresPorAlerta("vencido");
  } else {
    v.style.display = "none";
    p.style.display = "block";
    filtrarConductoresPorAlerta("proximo");
  }
}

function renderAlerta(a) {
  const clase = a.estado === "vencido"
    ? "alert-vencido"
    : "alert-proximo";

  return `
    <div class="alert-item ${clase}">
      <div class="alert-title">
        ${a.nombre} - ${a.cedula}
      </div>
      <div class="alert-title">
        ${a.tipo}
      </div>
      <div class="alert-date">
        ${formatearFecha(a.fecha)}
      </div>
    </div>
  `;
}

// ================= UTILS
function formatearFecha(fecha) {
  if (!fecha) return "-";

  // tomar solo YYYY-MM-DD sin timezone
  const clean = fecha.split("T")[0];

  const [year, month, day] = clean.split("-");

  return `${day}/${month}/${year}`;
}

// ================= EDITAR CONDUCTOR
function editarConductor(btn, id) {

  if (editandoConductor) {
    showToast("Termina de editar la fila actual", "info");
    return;
  }

  editandoConductor = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  // Nombre
  celdas[1].innerHTML = `<input value="${data.nombre}">`;

  // Fechas
  celdas[2].innerHTML = `<input type="date" value="${data.licencia}">`;
  celdas[3].innerHTML = `<input type="date" value="${data.alimentos}">`;
  celdas[4].innerHTML = `<input type="date" value="${data.sustancias}">`;

  // Estado
  celdas[5].innerHTML = `
    <select>
      <option value="activo" ${data.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${data.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  // Botón guardar
  celdas[6].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarConductor(this, ${id})">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[6].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// ================= GUARDAR CONDUCTOR
async function guardarConductor(btn, id) {
  const fila = btn.closest("tr");
  const inputs = fila.querySelectorAll("input, select");

  const data = {
    nombre: inputs[0].value,
    vencimiento_licencia: inputs[1].value,
    vencimiento_manip_alimentos: inputs[2].value,
    vencimiento_sustancia_peligrosa: inputs[3].value,
    estado: inputs[4].value
  };

  try {
    const res = await apiFetch(`/api/conductores/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    if (!res) {
      showToast("Error actualizando conductor", "error");
      return;
    }

    showToast("Conductor actualizado correctamente", "success");

    editandoConductor = false;

    document.querySelectorAll(".btn-icon").forEach(b => {
      b.disabled = false;
    });

    cargarConductores();
    cargarAlertasConductores();

  } catch (error) {
    console.error(error);
    showToast("Error inesperado", "error");
  }
  
}

let debounceTimer;

function aplicarFiltrosConductores() {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    filtrarConductores();
  }, 300);
}


// ================= FILTRAR POR ALERTA (CORREGIDO)
async function filtrarConductoresPorAlerta(tipo) {

  const alertas = await apiFetch("/api/conductores/alertas");

  if (!alertas || alertas.length === 0) {
    renderTablaConductores([]);
    return;
  }

  // ?? FILTRAR SOLO POR EL TIPO CORRECTO
  const alertasFiltradas = alertas.filter(a => a.estado === tipo);

  // Obtener cedulas únicas SOLO del tipo seleccionado
  const cedulas = [...new Set(alertasFiltradas.map(a => a.cedula))];

  if (cedulas.length === 0) {
    renderTablaConductores([]);
    return;
  }

  // Traer todos los conductores
  const conductores = await apiFetch("/api/conductores");

  // ?? FILTRAR SOLO LOS QUE COINCIDEN EXACTAMENTE
  const filtrados = conductores.filter(c =>
    cedulas.includes(c.cedula)
  );

  renderTablaConductores(filtrados);
}