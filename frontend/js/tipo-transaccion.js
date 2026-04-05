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
    tabla.innerHTML = `<tr><td colspan="7">Sin datos</td></tr>`;
    return;
  }

  let html = "";

  data.forEach(t => {
    html += `
      <tr 
        data-id="${t.id}"
        data-categoria="${t.categoria}"
        data-descripcion="${t.descripcion || ""}"
        data-tipo="${t.tipo}"
        data-estado="${t.estado}"
        data-contexto="${t.contexto}"
      >
        <td>${t.id}</td>
        <td>${t.categoria}</td>
        <td>${t.descripcion || "-"}</td>
        <td>${renderTipoBadge(t.tipo)}</td>
        <td>${renderContextoBadge(t.contexto)}</td>
        <td>${renderEstadoBadge(t.estado)}</td>
        <td>
          <button class="btn-icon" onclick="editarTipo(this, '${t.id}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tabla.innerHTML = html;
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      id: document.getElementById("id").value,
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

  if (editandoTipo) {
    showToast("Termina de editar primero", "info");
    return;
  }

  editandoTipo = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  celdas[1].innerHTML = `<input value="${data.categoria}">`;
  celdas[2].innerHTML = `<input value="${data.descripcion}">`;

  celdas[3].innerHTML = `
    <select>
      <option value="INGRESO MANIFIESTO" ${data.tipo === "INGRESO MANIFIESTO" ? "selected" : ""}>Ingreso Manifiesto</option>
      <option value="EGRESO MANIFIESTO" ${data.tipo === "EGRESO MANIFIESTO" ? "selected" : ""}>Egreso Manifiesto</option>
      <option value="EGRESO OPERACIONAL" ${data.tipo === "EGRESO OPERACIONAL" ? "selected" : ""}>Egreso Operacional</option>
    </select>
  `;

  celdas[4].innerHTML = `<span>${data.contexto}</span>`;

  celdas[5].innerHTML = `
    <select>
      <option value="activo" ${data.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${data.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  celdas[6].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarTipo(this, '${id}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[6].querySelector("button");

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

  const res = await apiFetch(`/api/tipo-transaccion/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  if (!res) return;

  showToast("Tipo actualizado", "success");

  editandoTipo = false;

  document.querySelectorAll(".btn-icon").forEach(b => b.disabled = false);

  cargarTipos();
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

function renderContextoBadge(ctx) {
  if (ctx === "manifiesto") {
    return `<span class="tipo-badge ingreso">Manifiesto</span>`;
  }
  if (ctx === "operacional") {
    return `<span class="tipo-badge egreso-operacional">Operacional</span>`;
  }
  return ctx;
}