const API_URL = "";

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
      const errorText = await res.text();
      throw new Error(errorText || "Error en API");
    }

    return await res.json();
  } catch (err) {
    console.error("API ERROR:", err);
    return null;
  }
}