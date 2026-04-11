let conductorActual = null;
let manifiestoActual = null;

// =========================
// INIT
// =========================
async function initRegistroConductor() {

  // ?? validar vista correcta (SPA safe)
  if (!document.querySelector("#rc-container")) {
    return;
  }

  await cargarTipos();
  eventosRegistroConductor();
}

// =========================
// EVENTOS
// =========================
function eventosRegistroConductor() {

  const inputCedula = document.getElementById("rc-cedula");
  const selectManifiesto = document.getElementById("rc-manifiesto");
  const form = document.getElementById("rc-form");
  const btnGuardar = document.getElementById("rc-guardar");

  // ?? seguridad DOM
  if (!inputCedula || !selectManifiesto || !form || !btnGuardar) {
    return;
  }

  // =========================
  // BUSCAR CONDUCTOR
  // =========================
  inputCedula.addEventListener("blur", async (e) => {

    const cedula = e.target.value?.trim();
    if (!cedula) return;

    try {
      const data = await apiFetch(`/api/registro-conductor/manifiestos/${cedula}`);

      selectManifiesto.innerHTML = `<option value="">Seleccione</option>`;

      data.forEach(m => {
        selectManifiesto.innerHTML += `
          <option value="${m.id_manifiesto}">
            ${m.id_manifiesto}
          </option>
        `;
      });

      selectManifiesto.disabled = false;
      conductorActual = cedula;

      // reset UI
      form.classList.add("rc-hidden");
      limpiarTabla();

    } catch (err) {
      console.error("Error cargando manifiestos:", err);
    }
  });

  // =========================
  // SELECCIONAR MANIFIESTO
  // =========================
  selectManifiesto.addEventListener("change", async (e) => {

    manifiestoActual = e.target.value;

    if (!manifiestoActual) {
      form.classList.add("rc-hidden");
      limpiarTabla();
      return;
    }

    // mostrar form
    form.classList.remove("rc-hidden");

    await cargarGastos();
  });

  // =========================
  // GUARDAR GASTO
  // =========================
  btnGuardar.addEventListener("click", async () => {

    const tipo = document.getElementById("rc-tipo")?.value;
    const valor = document.getElementById("rc-valor")?.value;

    if (!tipo || !valor) {
      alert("Completa tipo y valor");
      return;
    }

    const body = {
      tipo_transaccion: tipo,
      valor,
      id_manifiesto: manifiestoActual,
      descripcion: document.getElementById("rc-descripcion")?.value,
      fecha: document.getElementById("rc-fecha")?.value
    };

    try {
      await apiFetch("/api/gastos-conductor", {
        method: "POST",
        body: JSON.stringify(body)
      });

      limpiarForm();
      await cargarGastos();

    } catch (err) {
      console.error("Error guardando:", err);
    }
  });
}

// =========================
// TIPOS
// =========================
async function cargarTipos() {
  try {
    const tipos = await apiFetch("/api/tipo-transaccion?tipo=GASTO CONDUCTOR");

    const select = document.getElementById("rc-tipo");
    if (!select) return;

    select.innerHTML = `<option value="">Seleccione</option>`;

    tipos.forEach(t => {
      select.innerHTML += `
        <option value="${t.id}">${t.categoria}</option>
      `;
    });

  } catch (err) {
    console.error("Error cargando tipos:", err);
  }
}

// =========================
// GASTOS
// =========================
async function cargarGastos() {

  if (!manifiestoActual) return;

  try {
    const data = await apiFetch(
      `/api/registro-conductor/gastos?manifiesto=${manifiestoActual}`
    );

    const tbody = document.getElementById("rc-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="color:#999;">Sin gastos registrados</td>
        </tr>
      `;
      return;
    }

    data.forEach(g => {
      tbody.innerHTML += `
        <tr>
          <td>${formatearFecha(g.creado)}</td>
          <td class="rc-valor">$${Number(g.valor).toLocaleString()}</td>
          <td>${g.descripcion || "-"}</td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("Error cargando gastos:", err);
  }
}

// =========================
// UTILS
// =========================
function limpiarForm() {
  const valor = document.getElementById("rc-valor");
  const descripcion = document.getElementById("rc-descripcion");

  if (valor) valor.value = "";
  if (descripcion) descripcion.value = "";
}

function limpiarTabla() {
  const tbody = document.getElementById("rc-body");
  if (tbody) tbody.innerHTML = "";
}

function formatearFecha(f) {
  if (!f) return "-";
  return new Date(f).toLocaleDateString("es-CO");
}