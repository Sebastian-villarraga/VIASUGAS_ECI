async function initGastosConductor() {
  await gc_cargarCatalogos();
  await gc_cargarGastos();
  gc_eventos();
}

let gc_catalogos = {};

// =========================
// CATALOGOS
// =========================
async function gc_cargarCatalogos() {
  try {
    gc_catalogos.conductores = await apiFetch("/api/conductores") || [];
    gc_catalogos.manifiestos = await apiFetch("/api/manifiestos") || [];
    gc_catalogos.tipos = await apiFetch("/api/tipo-transaccion?tipo=GASTO CONDUCTOR") || [];

    // FILTROS
    gc_llenarSelect("fConductor", gc_catalogos.conductores, "nombre", "cedula");
    gc_llenarSelect("fManifiesto", gc_catalogos.manifiestos, "id_manifiesto", "id_manifiesto");
    gc_llenarSelect("fTipo", gc_catalogos.tipos, "categoria", "id");

    // MODAL
    gc_llenarSelect("id_manifiesto", gc_catalogos.manifiestos, "id_manifiesto", "id_manifiesto");
    gc_llenarSelect("tipo_transaccion", gc_catalogos.tipos, "categoria", "id");

  } catch (error) {
    console.error("Error cargando catálogos:", error);
  }
}

// =========================
// GASTOS
// =========================
async function gc_cargarGastos() {
  const data = await apiFetch("/api/gastos-conductor") || [];

  window.gc_data = data;

  const tbody = document.getElementById("tablaGastos");
  if (!tbody) return;

  const fDesde = document.getElementById("fDesde")?.value;
  const fHasta = document.getElementById("fHasta")?.value;
  const fConductor = document.getElementById("fConductor")?.value;
  const fManifiesto = document.getElementById("fManifiesto")?.value;
  const fTipo = document.getElementById("fTipo")?.value;

  let filtrados = data;

  if (fDesde) filtrados = filtrados.filter(g => new Date(g.creado) >= new Date(fDesde));
  if (fHasta) filtrados = filtrados.filter(g => new Date(g.creado) <= new Date(fHasta));
  if (fConductor) filtrados = filtrados.filter(g => g.id_conductor == fConductor);
  if (fManifiesto) filtrados = filtrados.filter(g => g.id_manifiesto == fManifiesto);
  if (fTipo) filtrados = filtrados.filter(g => g.tipo_transaccion_id == fTipo);

  tbody.innerHTML = "";

  filtrados.forEach(g => {
    tbody.innerHTML += `
      <tr 
        data-id="${g.id}"
        data-manifiesto="${g.id_manifiesto}"
        data-valor="${g.valor}"
        data-descripcion="${g.descripcion || ""}"
      >
        <td>${gc_formatearFecha(g.creado)}</td>
        <td>${g.conductor_nombre || ""}</td>
        <td>${g.id_manifiesto || ""}</td>
        <td class="text-center">$${Number(g.valor || 0).toLocaleString()}</td>
        <td>${g.descripcion || ""}</td>

        <td class="text-center">
          <button class="btn-icon" onclick="gc_editarGasto(this, '${g.id}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  });

  gc_calcularTotales(filtrados);
}


// =========================
// EDITAR GASTOS
// =========================
function gc_editarGasto(btn, id) {

  if (window.gc_editando) {
    showToast("Termina de editar primero", "info");
    return;
  }

  window.gc_editando = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  // MANIFIESTO
  celdas[2].innerHTML = `
    <select id="editManifiesto">
      ${gc_catalogos.manifiestos.map(m => `
        <option value="${m.id_manifiesto}" ${m.id_manifiesto == data.manifiesto ? "selected" : ""}>
          ${m.id_manifiesto}
        </option>
      `).join("")}
    </select>
  `;

  // VALOR
  celdas[3].innerHTML = `
    <input type="text" id="editValor" value="${Number(data.valor).toLocaleString()}">
  `;

  // DESCRIPCIÓN + TIPO
  celdas[4].innerHTML = `
    <select id="editTipo">
      ${gc_catalogos.tipos.map(t => `
        <option value="${t.id}">
          ${t.categoria}
        </option>
      `).join("")}
    </select>

    <input type="text" id="editDescripcion" value="${data.descripcion}">
  `;

  // ACCIONES
  celdas[5].innerHTML = `
    <button class="btn-icon btn-save" onclick="gc_guardarGasto(this, '${id}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[5].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}


// =========================
// GUARDAR GASTOS
// =========================
async function gc_guardarGasto(btn, id) {

  const fila = btn.closest("tr");

  const manifiesto = fila.querySelector("#editManifiesto").value;
  const valorRaw = fila.querySelector("#editValor").value.replace(/\D/g, "");
  const descripcion = fila.querySelector("#editDescripcion").value;
  const tipo_transaccion = fila.querySelector("#editTipo").value;

  const data = {
    id,
    tipo_transaccion, // ?? CLAVE
    id_manifiesto: manifiesto,
    valor: Number(valorRaw),
    descripcion
  };

  try {

    await apiFetch("/api/gastos-conductor", {
      method: "POST",
      body: JSON.stringify(data)
    });

    showToast("Gasto actualizado", "success");

    window.gc_editando = false;

    document.querySelectorAll(".btn-icon").forEach(b => b.disabled = false);

    gc_cargarGastos();

  } catch (error) {
    console.error(error);
    showToast("Error actualizando gasto", "error");
  }
}

// =========================
// EVENTOS
// =========================
function gc_eventos() {

  // =========================
  // FORMATO VALOR EN VIVO ?? (FIX REAL)
  // =========================
  const inputValor = document.getElementById("valor");

  if (inputValor) {

    // ?? MUY IMPORTANTE
    inputValor.type = "text";

    inputValor.addEventListener("input", (e) => {

      let cursorPos = e.target.selectionStart;

      let valor = e.target.value;

      // limpiar todo excepto números
      let limpio = valor.replace(/\D/g, "");

      if (!limpio) {
        e.target.value = "";
        return;
      }

      // formatear con puntos
      let formateado = limpio.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

      e.target.value = formateado;

      // ?? RESTAURAR CURSOR (CLAVE)
      let nuevaPos = formateado.length - (limpio.length - cursorPos);
      e.target.setSelectionRange(nuevaPos, nuevaPos);
    });
  }

  // =========================
  // ABRIR MODAL
  // =========================
  document.getElementById("btnNuevoGasto")?.addEventListener("click", () => {
    gc_limpiarFormulario();
    document.getElementById("modalGasto").classList.remove("hidden");
  });

  // =========================
  // CERRAR MODAL
  // =========================
  document.getElementById("cerrarModal")?.addEventListener("click", () => {
    document.getElementById("modalGasto").classList.add("hidden");
  });

  // =========================
  // GUARDAR
  // =========================
  document.getElementById("guardarGasto")?.addEventListener("click", async () => {

    const valorInput = document.getElementById("valor");

    const body = {
      tipo_transaccion: document.getElementById("tipo_transaccion").value,
      valor: Number(valorInput.value.replace(/\D/g, "")),
      id_manifiesto: document.getElementById("id_manifiesto").value,
      descripcion: document.getElementById("descripcion").value,
      fecha: document.getElementById("fecha").value
    };

    if (!body.tipo_transaccion || !body.id_manifiesto || !body.valor) {
      showToast("Completa los campos obligatorios", "warning");
      return;
    }

    await apiFetch("/api/gastos-conductor", {
      method: "POST",
      body: JSON.stringify(body)
    });

    showToast("Gasto creado correctamente", "success");

    document.getElementById("modalGasto").classList.add("hidden");

    await gc_cargarGastos();
  });
}

// =========================
// UTILIDADES
// =========================
function gc_llenarSelect(id, data, labelKey, valueKey) {
  const select = document.getElementById(id);
  if (!select || !Array.isArray(data)) return;

  select.innerHTML = `<option value="">Seleccione</option>`;

  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item[valueKey];

    if (id === "tipo_transaccion" || id === "fTipo") {
      option.textContent = `${item.categoria}`;
    } else {
      option.textContent = item[labelKey];
    }

    select.appendChild(option);
  });
}

function gc_limpiarFormulario() {
  document.getElementById("tipo_transaccion").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("id_manifiesto").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("conductor_nombre").value = "";
}

function gc_formatearFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CO");
}

// =========================
// TOTALES
// =========================
function gc_calcularTotales(data) {
  const total = data.reduce((acc, g) => acc + Number(g.valor || 0), 0);
  const cantidad = data.length;
  const promedio = cantidad ? total / cantidad : 0;

  document.getElementById("totalGastos").textContent = `$${total.toLocaleString()}`;
  document.getElementById("totalCantidad").textContent = cantidad;
  document.getElementById("totalPromedio").textContent = `$${Math.round(promedio).toLocaleString()}`;
}


