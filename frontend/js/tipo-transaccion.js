let editandoTipo = false;

// ================= INIT
function initTiposTransaccion() {
  cargarTipos();
  initFormTipo();

  document.getElementById("filtroCategoria")
    .addEventListener("input", aplicarFiltrosTipos);

  document.getElementById("filtroTipo")
    .addEventListener("change", aplicarFiltrosTipos);

  document.getElementById("filtroEstado")
    .addEventListener("change", aplicarFiltrosTipos);
}

// ================= CARGAR
async function cargarTipos() {

  console.log("?? cargando tipos...");

  const data = await apiFetch("/api/tipo-transaccion");
  renderTablaTipos(data);
}

// ================= RENDER
function renderTablaTipos(data) {
  const tabla = document.getElementById("tiposTable");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6">Sin datos</td></tr>`;
    return;
  }

  let html = "";

  data.forEach(t => {
    html += `
      <tr 
        data-categoria="${t.categoria}"
        data-descripcion="${t.descripcion || ""}"
        data-tipo="${t.tipo}"
        data-estado="${t.estado}"
      >
        <td data-label="Categoría">${t.categoria}</td>
        <td data-label="Descripción">${t.descripcion || "-"}</td>
        <td data-label="Tipo">${renderTipoTexto(t.tipo)}</td>
        <td data-label="Estado">${renderEstadoBadge(t.estado)}</td>
        <td data-label="Acciones">
          <button class="btn-icon" onclick="editarTipo(this, '${t.id}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tabla.innerHTML = html;
}


function renderTipoTexto(tipo) {
  if (!tipo) return "-";

  let clase = "";
  let texto = "";

  if (tipo === "INGRESO MANIFIESTO") {
    clase = "ingreso";
    texto = "Ingreso Manifiesto";
  }

  if (tipo === "EGRESO MANIFIESTO") {
    clase = "egreso";
    texto = "Egreso Manifiesto";
  }

  if (tipo === "EGRESO OPERACIONAL") {
    clase = "operacional";
    texto = "Egreso Operacional";
  }

  if (tipo === "GASTO CONDUCTOR") {
    clase = "conductor";
    texto = "Gasto Conductor";
  }

  return `<span class="badge ${clase}">${texto}</span>`;
}

// ================= FILTROS
async function filtrarTipos() {
  const categoria = document.getElementById("filtroCategoria").value.trim();
  const tipo = document.getElementById("filtroTipo").value;
  const estado = document.getElementById("filtroEstado").value;

  let params = [];

  if (categoria) params.push(`categoria=${encodeURIComponent(categoria)}`);
  if (tipo) params.push(`tipo=${tipo}`);
  if (estado) params.push(`estado=${estado}`);

  const url = `/api/tipo-transaccion${params.length ? "?" + params.join("&") : ""}`;

  const data = await apiFetch(url);
  renderTablaTipos(data);
}

function limpiarFiltrosTipos() {
  document.getElementById("filtroCategoria").value = "";
  document.getElementById("filtroTipo").value = "";
  document.getElementById("filtroEstado").value = "";

  cargarTipos();
}

// ================= FORM
function initFormTipo() {
  const form = document.getElementById("formTipo");

  // ?? FIX CRÍTICO
  if (!form) {
    console.warn("formTipo no existe aún");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      categoria: document.getElementById("categoria").value,
      descripcion: document.getElementById("descripcion").value,
      tipo: document.getElementById("tipo").value,
      estado: document.getElementById("estado").value
    };

    const res = await apiFetch("/api/tipo-transaccion", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res) return;

    showToast("Tipo creado correctamente", "success");

    cerrarModalTipo();
    form.reset();
    cargarTipos();
  });
}

// ================= EDITAR
function editarTipo(btn, id) {

  if (window.editandoTipo) {
    showToast("Termina de editar primero", "info");
    return;
  }

  window.editandoTipo = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  celdas[0].innerHTML = `<input value="${data.categoria}">`;

  celdas[1].innerHTML = `<input value="${data.descripcion || ""}">`;

  celdas[2].innerHTML = `
    <select>
      <option value="INGRESO MANIFIESTO" ${data.tipo === "INGRESO MANIFIESTO" ? "selected" : ""}>Ingreso Manifiesto</option>
      <option value="EGRESO MANIFIESTO" ${data.tipo === "EGRESO MANIFIESTO" ? "selected" : ""}>Egreso Manifiesto</option>
      <option value="EGRESO OPERACIONAL" ${data.tipo === "EGRESO OPERACIONAL" ? "selected" : ""}>Egreso Operacional</option>
      <option value="GASTO CONDUCTOR" ${data.tipo === "GASTO CONDUCTOR" ? "selected" : ""}>Gasto Conductor</option>
    </select>
  `;

  celdas[3].innerHTML = `
    <select>
      <option value="activo" ${data.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${data.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  celdas[4].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarTipo(this, '${id}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[4].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// ================= GUARDAR
async function guardarTipo(btn, id) {
  const fila = btn.closest("tr");
  const inputs = fila.querySelectorAll("input, select");

  const data = {
    categoria: inputs[0].value,
    descripcion: inputs[1].value,
    tipo: inputs[2].value,
    estado: inputs[3].value
  };

  try {

    await apiFetch(`/api/tipo-transaccion/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    showToast("Tipo actualizado", "success");

    window.editandoTipo = false;

    document.querySelectorAll(".btn-icon").forEach(b => b.disabled = false);

    cargarTipos();

  } catch (error) {
    console.error(error);
    showToast("Error actualizando", "error");
  }
}

// ================= MODAL
function abrirModalTipo() {
  document.getElementById("modalTipo").classList.remove("hidden");
}

function cerrarModalTipo() {
  document.getElementById("modalTipo").classList.add("hidden");
}

// ================= DEBOUNCE
let debounceTimerTipos;

function aplicarFiltrosTipos() {
  clearTimeout(debounceTimerTipos);

  debounceTimerTipos = setTimeout(() => {
    filtrarTipos();
  }, 300);
}

// ================= BADGES
function renderTipoBadge(tipo) {
  if (!tipo) return "-";

  tipo = tipo.toUpperCase();

  if (tipo.includes("INGRESO")) {
    return `<span class="tipo-badge ingreso">Ingreso</span>`;
  }

  if (tipo.includes("OPERACIONAL")) {
    return `<span class="tipo-badge egreso-operacional">Operacional</span>`;
  }

  if (tipo.includes("EGRESO")) {
    return `<span class="tipo-badge egreso-manifiesto">Egreso</span>`;
  }

  return tipo;
}

