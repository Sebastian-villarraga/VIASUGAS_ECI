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
// MANIFIESTO EDITING
// =========================
socket.on("manifiesto:editing", (data) => {

  console.log(
    "?? Editando:",
    data
  );

  if (
    !detalleManifiestoActual ||
    data.id_manifiesto !==
      detalleManifiestoActual.id_manifiesto
  ) {
    return;
  }

  showToast(
    `${data.usuario} está editando este manifiesto`,
    "warning"
  );

});

// =========================
// STOP EDITING
// =========================
socket.on(
  "manifiesto:stop-editing",
  () => {

    console.log(
      "? Usuario dejó de editar"
    );

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