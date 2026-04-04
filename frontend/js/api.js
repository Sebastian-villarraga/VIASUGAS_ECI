const API_URL = ""; "http://100.50.64.39:3000"

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

    if (!res.ok) {
      const text = await res.text();

      // ?? IMPORTANTE: usa toast global
      if (typeof showToast === "function") {
        showToast(text || "Error en la API", "error");
      }

      return null;
    }

    return await res.json();

  } catch (err) {
    console.error("API ERROR:", err);

    if (typeof showToast === "function") {
      showToast("Error de conexión con el servidor", "error");
    }

    return null;
  }
}