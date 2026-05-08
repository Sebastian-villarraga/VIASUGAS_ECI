// =========================
// USER INFO
// =========================
function obtenerUsuarioActual() {

  try {

    return (
      JSON.parse(localStorage.getItem("usuario")) ||
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("usuarioData")) ||
      {}
    );

  } catch {

    return {};

  }

}

// =========================
// SOCKET.IO CLIENT
// =========================

const socket = io();

// =========================
// CONNECTION EVENTS
// =========================
socket.on("connect", () => {

  console.log("?? Socket conectado:", socket.id);

});

socket.on("disconnect", () => {

  console.log("?? Socket desconectado");

});

// =========================
// TEST EVENT
// =========================
socket.on("test", (data) => {

  console.log("?? Evento recibido:", data);

});

// =========================
// EDITING TRACKER
// =========================
const manifiestosEditando = {};

// =========================
// GASTOS EDITANDO
// =========================
const gastosEditando = {};

// =========================
// MANIFIESTO CREATED
// =========================
socket.on("manifiesto:created", async (data) => {

  console.log("?? Nuevo manifiesto:", data);

  // Solo si estamos en modulo manifiestos
  const tabla = document.getElementById("manifiestosTable");

  if (!tabla) return;

  // Recargar tabla automaticamente
  await filtrarManifiestos();

  showToast(
    "Nuevo manifiesto agregado",
    "success"
  );

});

// =========================
// MANIFIESTO UPDATED
// =========================
socket.on("manifiesto:updated", async (data) => {

  console.log(
    "?? Manifiesto actualizado:",
    data
  );

  const tabla =
    document.getElementById(
      "manifiestosTable"
    );

  if (tabla) {
    await filtrarManifiestos();
  }

  // =========================
  // DETALLE ABIERTO
  // =========================
  if (
    detalleManifiestoActual &&
    data?.manifiesto?.id_manifiesto ===
      detalleManifiestoActual.id_manifiesto
  ) {

    // =========================
    // SOLO AVISAR
    // =========================
    showToast(
      "Este manifiesto fue actualizado por otro usuario",
      "warning"
    );

  }

  showToast(
    "Manifiesto actualizado",
    "success"
  );

});

// =========================
// =========================
// MANIFIESTO EDITING
// =========================
socket.on(
  "manifiesto:editing",
  (data) => {

    console.log(
      "✏️ Editando:",
      data
    );

    // =========================
    // GUARDAR LOCK
    // =========================
    manifiestosEditando[
      data.id_manifiesto
    ] = data.usuario;

    // =========================
    // SOLO SI MODULO EXISTE
    // =========================
    const tabla =
      document.getElementById(
        "manifiestosTable"
      );

    if (!tabla) {
      return;
    }

    // =========================
    // BUSCAR FILA
    // =========================
    const fila =
      document.querySelector(
        `tr[data-id_manifiesto="${data.id_manifiesto}"]`
      );

    if (!fila) {
      return;
    }

    // =========================
    // BLOQUEAR BOTON
    // =========================
    const btn =
      fila.querySelector(
        ".btn-icon"
      );

    if (btn) {

      btn.disabled = true;

      btn.title =
        `Editando: ${data.usuario}`;

    }

    // =========================
    // HIGHLIGHT
    // =========================
    fila.classList.add(
      "mf-editando-otro"
    );

    // =========================
    // SI MODAL ABIERTO
    // =========================
    if (
      detalleManifiestoActual &&
      data.id_manifiesto ===
        detalleManifiestoActual.id_manifiesto
    ) {

      showToast(
        `${data.usuario} está editando este manifiesto`,
        "warning"
      );

    }

  }
);

// =========================
// STOP EDITING
// =========================
socket.on(
  "manifiesto:stop-editing",
  (data) => {

    console.log(
      "🛑 Usuario dejó de editar:",
      data
    );

    // =========================
    // BORRAR LOCK
    // =========================
    delete manifiestosEditando[
      data.id_manifiesto
    ];

    // =========================
    // BUSCAR FILA
    // =========================
    const fila =
      document.querySelector(
        `tr[data-id_manifiesto="${data.id_manifiesto}"]`
      );

    if (!fila) {
      return;
    }

    // =========================
    // DESBLOQUEAR
    // =========================
    fila.classList.remove(
      "mf-editando-otro"
    );

    const btn =
      fila.querySelector(
        ".btn-icon"
      );

    if (btn) {

      btn.disabled = false;

      btn.title = "";

    }

  }
);


// =========================
// AUDIT REALTIME
// =========================
socket.on(
  "audit:new-log",
  async () => {

    console.log(
      "📋 Nuevo log auditoría"
    );

    // Solo si la tabla existe
    const tabla =
      document.querySelector(
        "#tabla-audit tbody"
      );

    if (!tabla) {
      return;
    }

    await cargarAudit();

  }
);

// =========================
// FACTURA CREATED
// =========================
socket.on(
  "factura:created",
  async (data) => {

    console.log(
      "🧾 Nueva factura:",
      data
    );

    // Solo si estamos en facturas
    const tabla =
      document.getElementById(
        "tablaFacturas"
      );

    if (!tabla) {
      return;
    }

    try {

      // =========================
      // RECARGAR DATOS
      // =========================
      await cargarCatalogosFacturas();

      await cargarFacturas();

      // =========================
      // FORZAR RENDER
      // =========================
      aplicarFiltrosFacturas();

      showToast(
        "Nueva factura registrada",
        "success"
      );

    } catch (e) {

      console.error(
        "SOCKET FACTURA:",
        e
      );

    }

  }
);

// =========================
// TRANSACCION CREATED
// =========================
socket.on(
  "transaccion:created",
  async (data) => {

    console.log(
      "💰 Nueva transacción:",
      data
    );

    // =========================
    // SOLO SI ESTAMOS EN MODULO
    // =========================
    const tabla =
      document.getElementById(
        "tablaTransacciones"
      );

    if (!tabla) {
      return;
    }

    try {

      // =========================
      // RECARGAR TABLA
      // =========================
      await cargarTransacciones();

      showToast(
        "Nueva transacción registrada",
        "success"
      );

    } catch (e) {

      console.error(
        "SOCKET TRANSACCION:",
        e
      );

    }

  }
);

// =========================
// GASTO CONDUCTOR CREATED
// =========================
socket.on(
  "gasto-conductor:created",
  async (data) => {

    console.log(
      "🚛 Nuevo gasto conductor:",
      data
    );

    // =========================
    // SOLO SI ESTAMOS EN MODULO
    // =========================
    const tabla =
      document.getElementById(
        "tablaGastos"
      );

    if (!tabla) {
      return;
    }

    try {

      await gc_cargarGastos();

      showToast(
        "Nuevo gasto registrado",
        "success"
      );

    } catch (e) {

      console.error(
        "SOCKET GASTO:",
        e
      );

    }

  }
);

// =========================
// GASTO CONDUCTOR UPDATED
// =========================
socket.on(
  "gasto-conductor:updated",
  async (data) => {

    console.log(
      "✏️ Gasto actualizado:",
      data
    );

    // =========================
    // SOLO SI ESTAMOS EN MODULO
    // =========================
    const tabla =
      document.getElementById(
        "tablaGastos"
      );

    if (!tabla) {
      return;
    }

    try {

      await gc_cargarGastos();

      showToast(
        "Gasto actualizado",
        "info"
      );

    } catch (e) {

      console.error(
        "SOCKET UPDATE GASTO:",
        e
      );

    }

  }
);

// =========================
// GASTO CONDUCTOR EDITING
// =========================
socket.on(
  "gasto-conductor:editing",
  (data) => {

    console.log(
      "✏️ Gasto en edición:",
      data
    );

    // guardar lock
    gastosEditando[data.id] = data.usuario;

    // =========================
    // SOLO SI ESTAMOS EN MODULO
    // =========================
    const tabla =
      document.getElementById(
        "tablaGastos"
      );

    if (!tabla) {
      return;
    }

    // =========================
    // BUSCAR FILA
    // =========================
    const fila =
      document.querySelector(
        `tr[data-id="${data.id}"]`
      );

    if (!fila) {
      return;
    }

    // =========================
    // UI BLOQUEADA
    // =========================
    fila.classList.add(
      "gsx-editando-otro"
    );

    const btn =
      fila.querySelector(
        ".btn-icon"
      );

    if (btn) {
      btn.disabled = true;
      btn.title =
        `Editando: ${data.usuario}`;
    }

    showToast(
      `${data.usuario} está editando un gasto`,
      "warning"
    );

  }
);

// =========================
// GASTO CONDUCTOR STOP EDITING
// =========================
socket.on(
  "gasto-conductor:stop-editing",
  (data) => {

    console.log(
      "🛑 Fin edición gasto:",
      data
    );

    delete gastosEditando[data.id];

    const fila =
      document.querySelector(
        `tr[data-id="${data.id}"]`
      );

    if (!fila) {
      return;
    }

    fila.classList.remove(
      "gsx-editando-otro"
    );

    const btn =
      fila.querySelector(
        ".btn-icon"
      );

    if (btn) {
      btn.disabled = false;
      btn.title = "";
    }

  }
);