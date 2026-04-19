let editandoBanco = false;

// =========================
// INIT
// =========================
function initBancos() {
  editandoBanco = false;
  cargarBancos();
  initFormBanco();
  aplicarRestriccionesInputsBanco();
  llenarSelectBanco();

  document.getElementById("filtroBanco")
    ?.addEventListener("input", aplicarFiltrosBancos);

  document.getElementById("filtroCuenta")
    ?.addEventListener("input", aplicarFiltrosBancos);
}

// =========================
// CARGAR
// =========================
async function cargarBancos() {
  const tabla = document.getElementById("bancosTable");

  const data = await apiFetch("/api/bancos");

  window.bancosData = data;

  renderTablaBancos(data);
}

// =========================
// RENDER
// =========================
function renderTablaBancos(data) {
  const tabla = document.getElementById("bancosTable");

  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="6">Sin resultados</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(b => `
    <tr 
      data-id="${b.id}"
      data-nombre_banco="${b.nombre_banco}"
      data-numero_cuenta="${b.numero_cuenta}"
      data-tipo_cuenta="${b.tipo_cuenta}"
      data-nombre_titular="${b.nombre_titular || ""}"
      data-identificacion="${b.identificacion || ""}"
    >
      <td>${b.nombre_banco}</td>
      <td>${b.numero_cuenta}</td>
      <td>${b.tipo_cuenta}</td>
      <td>${b.nombre_titular || "-"}</td>
      <td>${b.identificacion || "-"}</td>
      <td>
        <button class="btn-icon" onclick="editarBanco(this, '${b.id}')">
          <i class="fas fa-pen"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// =========================
// FILTROS
// =========================
async function filtrarBancos() {
  const banco = document.getElementById("filtroBanco").value.trim().toLowerCase();
  const cuenta = document.getElementById("filtroCuenta").value.trim();

  const data = await apiFetch("/api/bancos");

  let filtrados = data;

  if (banco) {
    filtrados = filtrados.filter(b =>
      b.nombre_banco.toLowerCase().includes(banco)
    );
  }

  if (cuenta) {
    filtrados = filtrados.filter(b =>
      b.numero_cuenta.includes(cuenta)
    );
  }

  renderTablaBancos(filtrados);
}

function limpiarFiltrosBanco() {
  document.getElementById("filtroBanco").value = "";
  document.getElementById("filtroCuenta").value = "";

  cargarBancos();
}

let debounceTimerBanco;

function aplicarFiltrosBancos() {
  clearTimeout(debounceTimerBanco);

  debounceTimerBanco = setTimeout(() => {
    filtrarBancos();
  }, 300);
}

// =========================
// FORM
// =========================
function initFormBanco() {
  const form = document.getElementById("formBanco");

  if (!form) return;

  const inputBanco = document.getElementById("nombre_banco");
  const inputCuenta = document.getElementById("numero_cuenta");

  // =========================
  // ?? LISTA DE BANCOS (TIPO TRANSACCIONES)
  // =========================
  const bancosCatalogo = [
    "Bancolombia",
    "Nequi",
    "Daviplata",
    "Banco de Bogot·",
    "Davivienda",
    "BBVA Colombia",
    "Banco Popular",
    "Banco AV Villas",
    "Banco de Occidente",
    "Banco Caja Social",
    "Scotiabank Colpatria",
    "Banco Agrario de Colombia",
    "Banco Falabella",
    "Banco Pichincha",
    "Bancoomeva",
    "Citibank Colombia",
    "GNB Sudameris",
    "Banco Finandina",
    "Banco Mundo Mujer",
    "Banco W",
    "Banco Santander Colombia",
    "Banco Serfinanza",
    "Banco Cooperativo Coopcentral",
    "Ita˙ Colombia",
    "JP Morgan Colombia",
    "Mibanco",
    "Lulo Bank",
    "Nubank Colombia",
    "RappiPay",
    "Movii",
    "Ual· Colombia",
    "Iris Bank",
    "Banco BTG Pactual Colombia",
    "Banco Credifinanciera",
    "Coltefinanciera",
    "Finandina",
    "Confiar Cooperativa Financiera",
    "CFA Cooperativa Financiera",
    "Juriscoop",
    "Cotrafa",
    "Coofinep",
    "Credifamilia",
    "Tuya"
  ];

  // ?? AUTOCOMPLETE SIMPLE
  inputBanco.addEventListener("input", () => {
    const valor = inputBanco.value.toLowerCase();

    const sugerencias = bancosCatalogo.filter(b =>
      b.toLowerCase().includes(valor)
    );

    // puedes luego conectar esto a un dropdown visual si quieres
  });

  // =========================
  // VALIDAR DUPLICADOS
  // =========================
  function cuentaDuplicada(numero) {
    if (!window.bancosData) return false;

    return window.bancosData.some(b =>
      b.numero_cuenta === numero
    );
  }

  // =========================
  // SUBMIT
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const nombre_banco = inputBanco.value.trim();
      const numero_cuenta = inputCuenta.value.trim();
      let tipo_cuenta = document.getElementById("tipo_cuenta").value;
      const nombre_titular = document.getElementById("nombre_titular").value.trim();
      const identificacion = document.getElementById("identificacion").value.trim();

      // =========================
      // VALIDACIONES
      // =========================

      if (!nombre_banco || !numero_cuenta) {
        showToast("Nombre banco y n˙mero de cuenta son obligatorios", "error");
        return;
      }

      // ?? DUPLICADO
      if (cuentaDuplicada(numero_cuenta)) {
        inputCuenta.style.border = "1px solid #dc3545";
        showToast("La cuenta ya existe", "error");
        return;
      } else {
        inputCuenta.style.border = "1px solid #ccc";
      }

      if (!tipo_cuenta) {
        showToast("Debes seleccionar tipo de cuenta", "error");
        return;
      }

      tipo_cuenta = tipo_cuenta.toLowerCase().trim();

      if (!["ahorros", "corriente"].includes(tipo_cuenta)) {
        showToast("Tipo de cuenta inv·lido", "error");
        return;
      }

      const data = {
        nombre_banco,
        numero_cuenta,
        tipo_cuenta,
        nombre_titular: nombre_titular || null,
        identificacion: identificacion || null
      };

      const res = await apiFetch("/api/bancos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!res) {
        showToast("Error creando banco", "error");
        return;
      }

      showToast("Banco creado correctamente", "success");

      cerrarModalBanco();
      form.reset();
      cargarBancos();

    } catch (error) {
      console.error("Error creando banco:", error);
      showToast("Error inesperado al crear banco", "error");
    }
  });
}

// =========================
// MODAL
// =========================
function abrirModalBanco() {
  document.getElementById("modalBanco").classList.remove("hidden");
}

function cerrarModalBanco() {
  document.getElementById("modalBanco").classList.add("hidden");
}

// =========================
// EDITAR BANCO INLINE
// =========================
function editarBanco(btn, id) {

  if (editandoBanco) {
    alert("Termina de editar la fila actual primero");
    return;
  }

  editandoBanco = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  const bancos = [
    "Bancolombia",
    "Nequi",
    "Daviplata",
    "Banco de Bogot·",
    "Davivienda",
    "BBVA Colombia",
    "Banco Popular",
    "Banco AV Villas",
    "Banco de Occidente",
    "Banco Caja Social",
    "Scotiabank Colpatria",
    "Banco Agrario de Colombia",
    "Banco Falabella",
    "Banco Pichincha",
    "Bancoomeva",
    "Citibank Colombia",
    "GNB Sudameris",
    "Banco Finandina",
    "Banco Mundo Mujer",
    "Banco W",
    "Banco Santander Colombia",
    "Banco Serfinanza",
    "Banco Cooperativo Coopcentral",
    "Ita˙ Colombia",
    "JP Morgan Colombia",
    "Mibanco",
    "Lulo Bank",
    "Nubank Colombia",
    "RappiPay",
    "Movii",
    "Ual· Colombia",
    "Iris Bank",
    "Banco BTG Pactual Colombia",
    "Banco Credifinanciera",
    "Coltefinanciera",
    "Finandina",
    "Confiar Cooperativa Financiera",
    "CFA Cooperativa Financiera",
    "Juriscoop",
    "Cotrafa",
    "Coofinep",
    "Credifamilia",
    "Tuya"
  ];

  const opcionesBanco = bancos.map(b => `
    <option value="${b}" ${b === data.nombre_banco ? "selected" : ""}>
      ${b}
    </option>
  `).join("");

  celdas[0].innerHTML = `
    <select>
      <option value="">Seleccione</option>
      ${opcionesBanco}
    </select>
  `;

  celdas[1].innerHTML = `<input value="${data.numero_cuenta}">`;

  celdas[2].innerHTML = `
    <select>
      <option value="ahorros" ${data.tipo_cuenta === "ahorros" ? "selected" : ""}>Ahorros</option>
      <option value="corriente" ${data.tipo_cuenta === "corriente" ? "selected" : ""}>Corriente</option>
    </select>
  `;

  celdas[3].innerHTML = `<input value="${data.nombre_titular}">`;
  celdas[4].innerHTML = `<input value="${data.identificacion}">`;

  celdas[5].innerHTML = `
    <button class="btn-icon btn-save" onclick="guardarBanco(this, '${id}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[5].querySelector("button");

  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// =========================
// GUARDAR BANCO
// =========================
async function guardarBanco(btn, id) {

  const fila = btn.closest("tr");

  const selects = fila.querySelectorAll("select");
  const inputs = fila.querySelectorAll("input");

  const data = {
    nombre_banco: selects[0].value.trim(),
    numero_cuenta: inputs[0].value.trim(),
    tipo_cuenta: selects[1].value.trim(),
    nombre_titular: inputs[1].value.trim() || null,
    identificacion: inputs[2].value.trim() || null
  };

  if (!data.nombre_banco || !data.numero_cuenta) {
    showToast("Banco y cuenta obligatorios", "error");
    return;
  }

  try {

    await apiFetch(`/api/bancos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    showToast("Banco actualizado", "success");

    editandoBanco = false;
    cargarBancos();

  } catch (error) {
    showToast("Error actualizando banco", "error");
  }
}


// =========================
// RESTRICCIONES INPUTS ??
// =========================
function aplicarRestriccionesInputsBanco() {

  const soloNumeros = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  };

  const soloLetras = (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z·ÈÌÛ˙¡…Õ”⁄Ò—\s]/g, "");
  };

  document.getElementById("numero_cuenta")
    ?.addEventListener("input", soloNumeros);

  document.getElementById("identificacion")
    ?.addEventListener("input", soloNumeros);

  document.getElementById("nombre_banco")
    ?.addEventListener("input", soloLetras);

  document.getElementById("nombre_titular")
    ?.addEventListener("input", soloLetras);
}




function llenarSelectBanco() {
  const select = document.getElementById("nombre_banco");

  const bancos = [
    "Bancolombia",
    "Nequi",
    "Daviplata",
    "Banco de Bogot·",
    "Davivienda",
    "BBVA Colombia",
    "Banco Popular",
    "Banco AV Villas",
    "Banco de Occidente",
    "Banco Caja Social",
    "Scotiabank Colpatria",
    "Banco Agrario de Colombia",
    "Banco Falabella",
    "Banco Pichincha",
    "Bancoomeva",
    "Citibank Colombia",
    "GNB Sudameris",
    "Banco Finandina",
    "Banco Mundo Mujer",
    "Banco W",
    "Banco Santander Colombia",
    "Banco Serfinanza",
    "Banco Cooperativo Coopcentral",
    "Ita˙ Colombia",
    "JP Morgan Colombia",
    "Mibanco",
    "Lulo Bank",
    "Nubank Colombia",
    "RappiPay",
    "Movii",
    "Ual· Colombia",
    "Iris Bank",
    "Banco BTG Pactual Colombia",
    "Banco Credifinanciera",
    "Coltefinanciera",
    "Finandina",
    "Confiar Cooperativa Financiera",
    "CFA Cooperativa Financiera",
    "Juriscoop",
    "Cotrafa",
    "Coofinep",
    "Credifamilia",
    "Tuya"
  ];

  select.innerHTML = `<option value="">Seleccione</option>`;

  bancos.forEach(b => {
    const option = document.createElement("option");
    option.value = b;
    option.textContent = b;
    select.appendChild(option);
  });
}
