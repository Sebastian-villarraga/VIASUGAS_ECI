// =========================
// LOGIN INIT
// =========================
function initLogin() {
  const form = document.getElementById("loginForm");

  if (!form) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorBox = document.getElementById("login-error");

  function mostrarError(msg) {
    if (!errorBox) return;

    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");

    emailInput.classList.add("input-error");
    passwordInput.classList.add("input-error");
  }

  function limpiarError() {
    if (!errorBox) return;

    errorBox.textContent = "";
    errorBox.classList.add("hidden");

    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
  }

  // ?? limpiar error cuando el usuario escribe
  emailInput?.addEventListener("input", limpiarError);
  passwordInput?.addEventListener("input", limpiarError);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    limpiarError();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
      mostrarError("Completa todos los campos");
      return;
    }

    try {
      const data = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!data || data.error) {
        mostrarError(data?.error || "Credenciales incorrectas");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("permisos", JSON.stringify(data.permisos || []));
      localStorage.setItem("user", JSON.stringify(data.user || {}));

      if (data.user?.debe_cambiar_password) {
        mostrarModalCambioPassword();
      } else {
        window.location.href = "/pages/home.html";
      }

    } catch (error) {
        console.error("Login error:", error);
      
        // ?? si el backend manda mensaje, usarlo
        if (error?.message && error.message !== "Failed to fetch") {
          mostrarError(error.message);
        } else {
          mostrarError("Credenciales incorrectas");
        }
      }
  });

  // toggle password
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
// MOSTRAR MODAL CAMBIO PASSWORD
// =========================
function mostrarModalCambioPassword() {
  const modal = document.getElementById("modal-password");

  if (!modal) return;

  modal.classList.remove("hidden");

  // ?? activar validación
  setTimeout(() => {
    initPasswordValidation();
  }, 100);
}

// =========================
// GUARDAR NUEVA PASSWORD
// =========================
async function guardarNuevaPassword() {

  const pass1 = document.getElementById("new-password");
  const pass2 = document.getElementById("confirm-password");
  const btn = document.querySelector("#modal-password button");

  if (!pass1 || !pass2) return;

  const nueva = pass1.value.trim();
  const confirm = pass2.value.trim();

  pass1.classList.remove("input-error", "input-success");
  pass2.classList.remove("input-error", "input-success");

  if (!nueva || !confirm) {
    showToast("Completa todos los campos", "error");
    pass1.classList.add("input-error");
    pass2.classList.add("input-error");
    return;
  }

  if (nueva.length < 6) {
    showToast("Mínimo 6 caracteres", "error");
    pass1.classList.add("input-error");
    return;
  }

  if (nueva !== confirm) {
    showToast("Las contraseñas no coinciden", "error");
    pass1.classList.add("input-error");
    pass2.classList.add("input-error");
    return;
  }

  pass1.classList.add("input-success");
  pass2.classList.add("input-success");

  try {

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    const res = await apiFetch("/api/usuarios/cambiar-password", {
      method: "POST",
      body: JSON.stringify({ password: nueva }),
    });

    if (res?.error) {
      throw new Error(res.error);
    }

    showToast("Contraseña actualizada correctamente", "success");

    document.getElementById("modal-password")?.classList.add("hidden");

    pass1.value = "";
    pass2.value = "";

    window.location.href = "/pages/home.html";

  } catch (err) {
    console.error(err);
    showToast(err.message || "Error cambiando contraseña", "error");

  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Guardar";
    }
  }
}

// =========================
// LOGOUT
// =========================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("permisos");

  window.location.href = "/index.html";
}

// =========================
// CHECK AUTH (PRO)
// =========================
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isLoginPage =
    window.location.pathname === "/" ||
    window.location.pathname.includes("index.html");

  // ? No token ? fuera
  if (!token && !isLoginPage) {
    window.location.href = "/index.html";
    return;
  }

  // ?? SI DEBE CAMBIAR PASSWORD ? NO REDIRIGIR
  if (user?.debe_cambiar_password) {
    console.log("?? Usuario debe cambiar contraseña");
    return;
  }

  // ? Ya logueado ? evitar volver al login
  if (token && isLoginPage) {
    window.location.href = "/pages/home.html";
  }
}


// =========================
// TOGGLE PASSWORD
// =========================
function togglePass(id, el) {
  const input = document.getElementById(id);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    el.style.opacity = "1";
  } else {
    input.type = "password";
    el.style.opacity = "0.6";
  }
}

// =========================
// VALIDACIÓN EN TIEMPO REAL
// =========================
function initPasswordValidation() {
  const pass1 = document.getElementById("new-password");
  const pass2 = document.getElementById("confirm-password");

  if (!pass1 || !pass2) return;

  function validar() {
    const v1 = pass1.value.trim();
    const v2 = pass2.value.trim();

    // limpiar clases
    pass1.classList.remove("input-error", "input-success");
    pass2.classList.remove("input-error", "input-success");

    if (!v1 || !v2) return;

    if (v1 === v2) {
      pass1.classList.add("input-success");
      pass2.classList.add("input-success");
    } else {
      pass1.classList.add("input-error");
      pass2.classList.add("input-error");
    }
  }

  pass1.addEventListener("input", validar);
  pass2.addEventListener("input", validar);
}


function setUserName() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.correo) return;

  const nombre = user.correo.split("@")[0];

  const span = document.getElementById("userName");
  if (span) span.textContent = nombre;
}