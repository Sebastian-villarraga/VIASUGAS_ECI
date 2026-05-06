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

  setTimeout(async () => {
    await cargarTipos();
    eventosRegistroConductor();
  }, 50);
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
  
    try {
  
      const tipo = document.getElementById("rc-tipo")?.value;
      const valorInput = document.getElementById("rc-valor")?.value;
      
      // ?? quitar puntos antes de enviar
      const valor = valorInput.replace(/\./g, "");
  
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
  
      await apiFetch("/api/gastos-conductor", {
        method: "POST",
        body: JSON.stringify(body)
      });
  
      await cargarGastos();   // primero refresca tabla
      limpiarFormRC();         // luego limpia
  
    } catch (err) {
      console.error("Error guardando:", err);
    }
  
  });
  
  const inputValor = document.getElementById("rc-valor");
  
  if (inputValor) {
    inputValor.addEventListener("input", (e) => {
      
      let valor = e.target.value;
  
      // quitar todo lo que no sea número
      valor = valor.replace(/\D/g, "");
  
      // formatear con separadores de miles (Colombia)
      valor = Number(valor).toLocaleString("es-CO");
  
      e.target.value = valor;
    });
  }
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
function limpiarFormRC() {

  const tipo = document.getElementById("rc-tipo");
  const valor = document.getElementById("rc-valor");
  const fecha = document.getElementById("rc-fecha");
  const descripcion = document.getElementById("rc-descripcion");

  if (tipo) tipo.selectedIndex = 0;
  if (valor) valor.value = "";
  if (fecha) fecha.value = "";
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