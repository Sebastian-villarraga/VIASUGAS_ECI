// =========================
// CONFIG
// =========================

// ?? IMPORTANTE: mismo servidor ? usar ruta relativa
const API_URL = "";

// =========================
// FETCH GLOBAL
// =========================

async function apiFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    });

    // ?? intentar parsear respuesta
    let data = {};
    try {
      data = await res.json();
    } catch {
      // puede no venir JSON
    }

    // =========================
    // ERROR HANDLING ??
    // =========================
    if (!res.ok) {
      const message = data.error || "Error en la API";

      // mostrar toast SOLO aquí (centralizado)
      if (typeof showToast === "function") {
        showToast(message, "error");
      }

      throw new Error(message);
    }

    return data;

  } catch (err) {
    console.error("API ERROR:", err);

    // ?? evitar doble toast
    if (typeof showToast === "function") {
      showToast(
        err.message || "Error de conexión con el servidor",
        "error"
      );
    }

    throw err; // ?? CLAVE
  }
}