// =========================
// INIT (SPA)
// =========================
function initVehiculos() {
  editando = false;
  const tabla = document.getElementById("vehiculosTable");


  cargarVehiculos();
  cargarAlertasVehiculos();
  initFormVehiculo();
}

// =========================
// CONTROL EDICIÓN
// =========================
let editando = false;

// =========================
// CARGAR VEHICULOS
// =========================
async function cargarVehiculos() {
  const data = await apiFetch("/api/vehiculos");
  renderTablaVehiculos(data);
}

// =========================
// FILTRAR
// =========================
async function filtrarVehiculos() {
  const placa = document.getElementById("filtroPlaca").value.trim();
  const propietario = document.getElementById("filtroPropietario").value.trim();
  const estado = document.getElementById("filtroEstado").value;

  let params = [];

  if (placa) params.push(`placa=${encodeURIComponent(placa)}`);
  if (propietario) params.push(`propietario=${encodeURIComponent(propietario)}`);
  if (estado) params.push(`estado=${estado}`);

  const url = `/api/vehiculos${params.length ? "?" + params.join("&") : ""}`;

  const data = await apiFetch(url);

  renderTablaVehiculos(data);
}

// =========================
// LIMPIAR
// =========================
function limpiarFiltrosVehiculos() {
  document.getElementById("filtroPlaca").value = "";
  document.getElementById("filtroPropietario").value = "";
  document.getElementById("filtroEstado").value = "";

  // ?? recargar sin filtros (igual que propietarios)
  cargarVehiculos();
}

let debounceTimerVehiculos;

function aplicarFiltrosVehiculos() {
  clearTimeout(debounceTimerVehiculos);

  debounceTimerVehiculos = setTimeout(() => {
    filtrarVehiculos();
  }, 300);
}
// =========================
// RENDER TABLA (FIX CLAVE)
// =========================
function renderTablaVehiculos(data) {
  const tabla = document.getElementById("vehiculosTable");


  if (!data || data.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">No hay resultados</td></tr>`;
    return;
  }

  tabla.innerHTML = data.map(v => {

    const todo = v.vencimiento_todo_riesgo || "";
    const soat = v.vencimiento_soat || "";
    const tecno = v.vencimiento_tecno || "";

    return `
      <tr 
        data-placa="${v.placa}"
        data-propietario="${v.propietario || ""}"
        data-todo="${todo}"
        data-soat="${soat}"
        data-tecno="${tecno}"
        data-estado="${v.estado}"
      >
        <td>${v.placa}</td>
        <td>${v.propietario || "-"}</td>

        <td>${todo ? formatearFechaDesdeUTC(todo) : "-"}</td>
        <td>${soat ? formatearFechaDesdeUTC(soat) : "-"}</td>
        <td>${tecno ? formatearFechaDesdeUTC(tecno) : "-"}</td>

        <td>${renderEstadoBadge(v.estado)}</td>

        <td class="acciones">
          <button class="btn-icon editar" onclick="editarVehiculo(this, '${v.placa}')">
            <i class="fas fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// =========================
// EDITAR
// =========================
function editarVehiculo(btn, placa) {

  if (editando) {
    alert("Termina de editar primero");
    return;
  }

  editando = true;

  const fila = btn.closest("tr");
  const data = fila.dataset;
  const celdas = fila.querySelectorAll("td");

  celdas[1].innerHTML = `<select class="select-propietario"></select>`;

  const selectProp = celdas[1].querySelector("select");
  cargarPropietariosEnSelect(selectProp, data.propietario);

  // FECHAS
  celdas[2].innerHTML = `<input type="date" value="${formatFechaInput(data.todo)}">`;
  celdas[3].innerHTML = `<input type="date" value="${formatFechaInput(data.soat)}">`;
  celdas[4].innerHTML = `<input type="date" value="${formatFechaInput(data.tecno)}">`;

  // ESTADO
  celdas[5].innerHTML = `
    <select>
      <option value="activo" ${data.estado === "activo" ? "selected" : ""}>Activo</option>
      <option value="inactivo" ${data.estado === "inactivo" ? "selected" : ""}>Inactivo</option>
    </select>
  `;

  // BOTÓN GUARDAR
  celdas[6].innerHTML = `
    <button class="btn-icon guardar" onclick="guardarEdicion(this, '${placa}')">
      <i class="fas fa-save"></i>
    </button>
  `;

  const btnGuardar = celdas[6].querySelector("button");

  // ?? bloquear otros botones mientras edita
  document.querySelectorAll(".btn-icon").forEach(b => {
    if (b !== btnGuardar) b.disabled = true;
  });
}

// =========================
// LISTA DESPLEGABPLE PROPIETARIOS
// =========================
async function cargarPropietariosEnSelect(select, seleccionado) {
  try {
    const propietarios = await apiFetch("/api/propietarios?estado=activo");

    select.innerHTML = `<option value="">Seleccionar</option>`;

    propietarios.forEach(p => {
      const option = document.createElement("option");
      option.value = p.identificacion;
      option.textContent = `${p.nombre} - ${p.identificacion}`;

      // ?? marcar el actual
      if (p.nombre === seleccionado || p.identificacion === seleccionado) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando propietarios:", error);
  }
}

// =========================
// GUARDAR
// =========================
async function guardarEdicion(btn, placa) {
  const fila = btn.closest("tr");

  const propietario = fila.querySelector(".select-propietario")?.value;

  const inputsFecha = fila.querySelectorAll("input[type='date']");
  const estado = fila.querySelector("td:nth-child(6) select")?.value;

  const data = {
    propietario: propietario, 
    vencimiento_todo_riesgo: inputsFecha[0]?.value || null,
    vencimiento_soat: inputsFecha[1]?.value || null,
    vencimiento_tecno: inputsFecha[2]?.value || null,
    estado: estado
  };

  try {
    await apiFetch(`/api/vehiculos/${placa}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    mostrarToast("Vehículo actualizado correctamente");

    editando = false;

    document.querySelectorAll(".btn-icon").forEach(b => {
      b.disabled = false;
    });

    cargarVehiculos();
    cargarAlertasVehiculos();

  } catch (error) {
    console.error("Error actualizando veh�culo:", error);
    alert("Error al guardar los cambios");
  }
}

// =========================
// MOSTRAR TOAST
// =========================
function mostrarToast(mensaje, tipo = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = mensaje;

  // colores según tipo
  toast.style.background =
    tipo === "error" ? "#dc3545" :
    tipo === "warning" ? "#ffc107" :
    "#28a745";

  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 300);
  }, 2500);
}
// =========================
// FORMATO FECHA (DISPLAY)
// =========================
function formatearFecha(fecha) {
  return formatearFechaDesdeUTC(fecha);
}

// =========================
// FORMATO INPUT (CLAVE)
// =========================
function formatFechaInput(fecha) {
  if (!fecha) return "";

  return fecha.split("T")[0];
}

// =========================
// BADGE ESTADO (IGUAL CONDUCTORES)
// =========================
function renderEstadoBadge(estado) {
  const clase = estado === "activo" ? "badge-activo" : "badge-inactivo";
  const texto = estado === "activo" ? "Activo" : "Inactivo";
  return `<span class="${clase}">${texto}</span>`;
}

// =========================
// ALERTAS
// =========================
async function cargarAlertasVehiculos() {
  try {
    const data = await apiFetch("/api/vehiculos/alertas");

    window._alertasVehiculos = data || [];

    renderAlertas(window._alertasVehiculos);

  } catch (error) {
    console.error("ERROR ALERTAS VEHICULOS:", error);
  }
}

// =========================
// FILTROS RAPIDOS
// =========================
function filtrarVehiculosVencidos() {
  activarBoton("vencido");

  const data = window._alertasVehiculos || [];

  const filtrados = data.filter(a => a.estado === "vencido");

  renderAlertas(filtrados);

  const placas = [...new Set(filtrados.map(a => a.placa))];

  filtrarTablaPorPlacas(placas);
}

function filtrarVehiculosProximos() {
  activarBoton("proximo");

  const data = window._alertasVehiculos || [];

  const filtrados = data.filter(a => a.estado === "proximo");

  renderAlertas(filtrados);

  const placas = [...new Set(filtrados.map(a => a.placa))];

  filtrarTablaPorPlacas(placas);
}

function activarBoton(tipo) {
  const btnV = document.getElementById("btnVencidos");
  const btnP = document.getElementById("btnProximos");

  if (!btnV || !btnP) return;

  btnV.classList.remove("activo");
  btnP.classList.remove("activo");

  if (tipo === "vencido") {
    btnV.classList.add("activo");
  } else if (tipo === "proximo") {
    btnP.classList.add("activo");
  }
}





function filtrarTablaPorPlacas(placas) {
  const filas = document.querySelectorAll("#vehiculosTable tr");

  filas.forEach(fila => {
    const placa = fila.dataset?.placa;

    if (!placa) return;

    if (placas.includes(placa)) {
      fila.style.display = "";
    } else {
      fila.style.display = "none";
    }
  });
}


// =========================
// RENDER ALERTAS
// =========================
function renderAlertas(data) {
  const lista = document.getElementById("alertasList");
  const btnV = document.getElementById("btnVencidos");
  const btnP = document.getElementById("btnProximos");

  if (!lista) return;

  const all = window._alertasVehiculos || [];

  const vencidos = all.filter(a => a.estado === "vencido").length;
  const proximos = all.filter(a => a.estado === "proximo").length;

  if (btnV) btnV.textContent = `${vencidos} vencidos`;
  if (btnP) btnP.textContent = `${proximos} por vencer`;

  if (!data || data.length === 0) {
    lista.innerHTML = `<li class="sin-alertas">Sin alertas</li>`;
    return;
  }

  lista.innerHTML = data.map(a => {

    const clase = a.estado === "vencido"
      ? "vencido"
      : "proximo";

    return `
      <li class="${clase}">
        <strong>${a.propietario || "Sin nombre"} - ${a.placa}</strong>
        ${a.tipo || "-"}
        <small>${a.fecha ? formatearFechaDesdeUTC(a.fecha) : "-"}</small>
      </li>
    `;
  }).join("");
}


// =========================
// FORM
// =========================
function initFormVehiculo() {
  const form = document.getElementById("formVehiculo");
  if (!form) return;

  const inputPlaca = document.getElementById("placa");

  // ?? VALIDACIÓN EN TIEMPO REAL
  if (inputPlaca) {
    inputPlaca.addEventListener("input", () => {
      let valor = inputPlaca.value.toUpperCase();
      inputPlaca.value = valor;

      const regexPlaca = /^[A-Z]{3}[0-9]{3}$/;

      if (!valor || regexPlaca.test(valor)) {
        inputPlaca.style.border = "1px solid #ccc";
      } else {
        inputPlaca.style.border = "1px solid #dc3545";
      }
    });
  }

  // Evitar duplicar listeners
  if (form._handlerVehiculo) {
    form.removeEventListener("submit", form._handlerVehiculo);
  }

  const handler = async (e) => {
    e.preventDefault();

    let placa = inputPlaca?.value.trim().toUpperCase();

    const propietario = document.getElementById("propietario")?.value;
    const soat = document.getElementById("soat")?.value;
    const tecno = document.getElementById("tecno")?.value;
    const todoRiesgo = document.getElementById("todoRiesgo")?.value;
    const estado = document.getElementById("estado")?.value;

    const regexPlaca = /^[A-Z]{3}[0-9]{3}$/;

    // =========================
    // VALIDACIONES
    // =========================
    if (!placa) {
      inputPlaca.style.border = "1px solid #dc3545";
      mostrarToast("La placa es obligatoria", "error");
      return;
    }

    if (!regexPlaca.test(placa)) {
      inputPlaca.style.border = "1px solid #dc3545";
      mostrarToast("Formato inválido (Ej: ABC123)", "error");
      return;
    }

    // ?? OK ? limpiar error visual
    inputPlaca.style.border = "1px solid #ccc";

    if (!propietario) {
      mostrarToast("Debe seleccionar un propietario", "warning");
      return;
    }

    // =========================
    // PAYLOAD
    // =========================
    const data = {
      placa,
      propietario,
      vencimiento_soat: soat || null,
      vencimiento_tecno: tecno || null,
      vencimiento_todo_riesgo: todoRiesgo || null,
      estado: estado || "activo"
    };

    try {
      const res = await apiFetch("/api/vehiculos", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!res) return;

      // ?? AQUÍ ESTÁ EL CAMBIO CLAVE
      mostrarToast("Vehículo creado correctamente", "success");

      cerrarModalVehiculo();
      form.reset();
      cargarVehiculos();
      cargarAlertasVehiculos();

    } catch (error) {
      console.error("Error creando vehículo:", error);
      mostrarToast("Error al crear vehículo", "error");
    }
  };

  form._handlerVehiculo = handler;
  form.addEventListener("submit", handler);
}
// =========================
// MODAL
// =========================
function abrirModalVehiculo() {
  const modal = document.getElementById("modalVehiculo");

  if (!modal) {
    console.error("Modal no encontrado");
    return;
  }

  modal.classList.remove("hidden");
  cargarPropietariosSelect();
}

function cerrarModalVehiculo() {
  const modal = document.getElementById("modalVehiculo");
  if (modal) modal.classList.add("hidden");
}


window.abrirModalVehiculo = abrirModalVehiculo;
window.cerrarModalVehiculo = cerrarModalVehiculo;


// =========================
// CARGAR PROPIETARIOS ACTIVOS
// =========================
async function cargarPropietariosSelect() {
  try {
    const select = document.getElementById("propietario");
    if (!select) return;

    // limpiar opciones
    select.innerHTML = `<option value="">Seleccionar propietario</option>`;

    const propietarios = await apiFetch("/api/propietarios?estado=activo");

    if (!propietarios || propietarios.length === 0) return;

    propietarios.forEach(p => {
      const option = document.createElement("option");
      option.value = p.identificacion;   // ?? CLAVE REAL
      option.textContent = `${p.nombre} - ${p.identificacion}`;
      select.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando propietarios:", error);
  }
}
