const API_URL = "http://100.50.64.39:3000";

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
      throw new Error("Error en API");
    }

    return await res.json();
  } catch (err) {
    console.error("API ERROR:", err);
    return null;
  }
}