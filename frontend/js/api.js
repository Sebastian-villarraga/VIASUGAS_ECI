// =========================
// CONFIG
// =========================
const API_URL = "";

// =========================
// FETCH GLOBAL
// =========================
async function apiFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("token");

    // =========================
    // USUARIO LOGUEADO
    // =========================
    let user = {};

    try {
      user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      user = {};
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",

        ...(token && {
          Authorization: `Bearer ${token}`
        }),

        // =========================
        // HEADERS AUDITORIA
        // =========================
        "x-usuario-id": user.id || "",
        "x-usuario-nombre": user.nombre || "",

        ...(options.headers || {})
      },

      ...options
    });

    // =========================
    // PARSE JSON
    // =========================
    let data = {};

    try {
      data = await res.json();
    } catch {
      data = {};
    }

    // =========================
    // ERROR HANDLING
    // =========================
    if (!res.ok) {
      const message =
        data.error || "Error en la API";

      if (typeof showToast === "function") {
        showToast(message, "error");
      }

      throw new Error(message);
    }

    return data;

  } catch (err) {
    console.error("API ERROR:", err);

    if (typeof showToast === "function") {
      showToast(
        err.message ||
        "Error de conexión con el servidor",
        "error"
      );
    }

    throw err;
  }
}