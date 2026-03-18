// Esperar a que el DOM cargue completamente
document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // LOGIN
  // =========================
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    // Validación básica
    if (!email || !passwordInput) {
      alert("Por favor completa todos los campos");
      return;
    }

    console.log("Login:", email, passwordInput);

    // ?? AQUÍ luego conectamos con backend
    // fetch("http://TU_IP:PUERTO/login", {...})
  });

  // =========================
  // VER / OCULTAR CONTRASEÑA
  // =========================
  const toggle = document.getElementById("togglePassword");
  const passwordField = document.getElementById("password");

  toggle.addEventListener("click", () => {
    if (passwordField.type === "password") {
      passwordField.type = "text";
    } else {
      passwordField.type = "password";
    }
  });

});
