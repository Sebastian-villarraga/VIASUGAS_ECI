// =========================
// LOGIN INIT
// =========================
function initLogin() {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
      alert("Completa todos los campos");
      return;
    }

    try {
      const data = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // ?? Error backend o conexión
      if (!data || data.error) {
        alert(data?.error || "Credenciales incorrectas");
        return;
      }

      // ? Guardar token
      localStorage.setItem("token", data.token);

      // (opcional) guardar usuario
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // ?? Redirección
      window.location.href = "/pages/home.html";

    } catch (error) {
      console.error("Login error:", error);
      alert("Error conectando con el servidor");
    }
  });

  // =========================
  // TOGGLE PASSWORD
  // =========================
  const toggle = document.getElementById("togglePassword");
  const passwordField = document.getElementById("password");

  if (toggle && passwordField) {
    toggle.addEventListener("click", () => {
      passwordField.type =
        passwordField.type === "password" ? "text" : "password";
    });
  }
}

// =========================
// LOGOUT
// =========================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/index.html";
}

// =========================
// CHECK AUTH (PRO)
// =========================
function checkAuth() {
  const token = localStorage.getItem("token");

  const isLoginPage =
    window.location.pathname === "/" ||
    window.location.pathname.includes("index.html");

  // ?? No token ? fuera
  if (!token && !isLoginPage) {
    window.location.href = "/index.html";
    return;
  }

  // ?? Ya logueado ? no volver a login
  if (token && isLoginPage) {
    window.location.href = "/pages/home.html";
  }
}