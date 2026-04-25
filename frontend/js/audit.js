let auditLogs = [];
let auditFiltrado = [];

// =========================
// INIT
// =========================
function initAudit() {
  setFechasDefaultAudit();
  cargarAudit();
}

// =====================
// FECHAS DEFAULT
// =====================
function setFechasDefaultAudit() {
  const hoy = new Date();

  const desde = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  );

  document.getElementById("audit-fecha-desde").value =
    formatearInputDate(desde);

  document.getElementById("audit-fecha-hasta").value =
    formatearInputDate(hoy);
}

function formatearInputDate(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

// =========================
// CARGAR AUDITORÍA
// =========================
async function cargarAudit() {
  try {
    const data = await apiFetch("/api/audit");

    auditLogs = Array.isArray(data) ? data : [];

    aplicarFiltroAudit();

  } catch (error) {
    console.error("Error cargando auditoría:", error);
  }
}

// =========================
// RENDER TABLA
// =========================
function renderAudit() {
  const tbody = document.querySelector("#tabla-audit tbody");

  if (!tbody) return;

  if (!auditFiltrado.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">No hay registros de auditoría</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = auditFiltrado.map(log => {
    const cambios = obtenerCambios(log.dato_antiguo, log.dato_nuevo);
    const badge = getBadgeOperacion(log.operacion);

    return `
      <tr>
        <td>${formatearFechaHoraAudit(log.creado)}</td>
        <td>${log.usuario || log.id_usuario || "-"}</td>
        <td>${log.nombre_tabla || "-"}</td>
        <td>
          <span class="audit-badge ${badge}">
            ${log.operacion || "-"}
          </span>
        </td>
        <td>${log.id_registro || "-"}</td>
        <td>${resumenCambios(log.operacion, cambios)}</td>
        <td>${log.ip || "-"}</td>
        <td>
          <button class="audit-btn-detail" onclick="abrirDetalleAudit(${log.id})">
            Ver detalle
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// =========================
// DETALLE MODAL
// =========================
function abrirDetalleAudit(id) {
  const log = auditLogs.find(x => x.id === id);
  if (!log) return;

  const modal = document.getElementById("audit-modal");
  const content = document.getElementById("audit-modal-content");

  const cambios = obtenerCambios(log.dato_antiguo, log.dato_nuevo);

  content.innerHTML = `
    <div class="audit-detail-grid">

      <div class="audit-detail-item">
        <small>Usuario</small>
        <strong>${log.usuario || log.id_usuario || "-"}</strong>
      </div>

      <div class="audit-detail-item">
        <small>Fecha</small>
        <strong>${formatearFechaHoraAudit(log.creado)}</strong>
      </div>

      <div class="audit-detail-item">
        <small>Tabla</small>
        <strong>${log.nombre_tabla || "-"}</strong>
      </div>

      <div class="audit-detail-item">
        <small>Operación</small>
        <strong>${log.operacion || "-"}</strong>
      </div>

      <div class="audit-detail-item">
        <small>Registro afectado</small>
        <strong>${log.id_registro || "-"}</strong>
      </div>

      <div class="audit-detail-item">
        <small>IP</small>
        <strong>${log.ip || "-"}</strong>
      </div>

      <div class="audit-detail-item">
        <small>Navegador</small>
        <strong>${obtenerNavegador(log.user_agent)}</strong>
      </div>

      <div class="audit-detail-item">
        <small>Total cambios</small>
        <strong>${cambios.length}</strong>
      </div>

    </div>

    <h4>Campos modificados</h4>

    ${renderCambios(log.operacion, cambios, log.dato_antiguo, log.dato_nuevo)}
<br>
    <details>
      <summary>Ver JSON completo</summary>

      <div class="audit-json-box">
        <strong>Dato anterior:</strong>
        <pre>${escapeHtml(JSON.stringify(log.dato_antiguo, null, 2))}</pre>

        <strong>Dato nuevo:</strong>
        <pre>${escapeHtml(JSON.stringify(log.dato_nuevo, null, 2))}</pre>
      </div>
    </details>
  `;

  modal.classList.remove("hidden");
}

function cerrarModalAudit() {
  const modal = document.getElementById("audit-modal");
  if (modal) modal.classList.add("hidden");
}

// =========================
// COMPARAR CAMBIOS
// =========================
function obtenerCambios(viejo, nuevo) {
  viejo = viejo || {};
  nuevo = nuevo || {};

  const keys = new Set([
    ...Object.keys(viejo),
    ...Object.keys(nuevo)
  ]);

  const cambios = [];

  keys.forEach(key => {
    const antes = viejo[key];
    const despues = nuevo[key];

    const antesNorm = normalizarValorAudit(antes);
    const despuesNorm = normalizarValorAudit(despues);

    if (antesNorm !== despuesNorm) {
      cambios.push({
        campo: key,
        antes,
        despues
      });
    }
  });

  return cambios;
}

function renderCambios(operacion, cambios, viejo, nuevo) {
  if (operacion === "CREATE") {
    return renderObjetoComoTabla(nuevo, "Valor creado");
  }

  if (operacion === "DELETE") {
    return renderObjetoComoTabla(viejo, "Valor eliminado");
  }

  if (!cambios.length) {
    return `<p>No se detectaron diferencias en los datos.</p>`;
  }

  return `
    <table class="audit-changes-table">
      <thead>
        <tr>
          <th>Campo</th>
          <th>Antes</th>
          <th>Después</th>
        </tr>
      </thead>
      <tbody>
        ${cambios.map(c => `
          <tr>
            <td><strong>${formatearCampoAudit(c.campo)}</strong></td>
            <td class="audit-old">${formatearValorAudit(c.antes)}</td>
            <td class="audit-new">${formatearValorAudit(c.despues)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderObjetoComoTabla(obj, titulo) {
  if (!obj) return `<p>Sin datos</p>`;

  return `
    <table class="audit-changes-table">
      <thead>
        <tr>
          <th>Campo</th>
          <th>${titulo}</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(obj).map(([key, value]) => `
          <tr>
            <td><strong>${formatearCampoAudit(key)}</strong></td>
            <td>${formatearValorAudit(value)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// =========================
// HELPERS
// =========================
function resumenCambios(operacion, cambios) {
  if (operacion === "CREATE") return "Registro creado";
  if (operacion === "DELETE") return "Registro eliminado";

  if (!cambios.length) return "Sin cambios visibles";

  return `${cambios.length} campo${cambios.length === 1 ? "" : "s"} modificado${cambios.length === 1 ? "" : "s"}`;
}

function getBadgeOperacion(operacion) {
  if (operacion === "CREATE") return "audit-create";
  if (operacion === "DELETE") return "audit-delete";
  return "audit-update";
}

function formatearFechaHoraAudit(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);

  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatearValorAudit(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";

  if (typeof valor === "string" && valor.includes("T00:00:00.000Z")) {
    return formatearFechaDesdeUTC(valor);
  }

  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return valor;
}

function normalizarValorAudit(valor) {
  if (valor === null || valor === undefined) return "";

  if (typeof valor === "string" && valor.includes("T00:00:00.000Z")) {
    return valor.split("T")[0];
  }

  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return String(valor);
}

function formatearCampoAudit(campo) {
  const nombres = {
    placa: "Placa",
    estado: "Estado",
    id_propietario: "Propietario",
    vencimiento_soat: "Vencimiento SOAT",
    vencimiento_tecno: "Vencimiento Tecnomecánica",
    vencimiento_todo_riesgo: "Vencimiento Todo Riesgo",
    creado: "Creado",
    actualizado: "Actualizado"
  };

  return nombres[campo] || campo;
}

function obtenerNavegador(userAgent) {
  if (!userAgent) return "-";

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";

  return userAgent;
}

function escapeHtml(text) {
  if (!text) return "";

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// =====================
// FILTRO
// =====================
function aplicarFiltroAudit() {
  const desde = document.getElementById("audit-fecha-desde").value;
  const hasta = document.getElementById("audit-fecha-hasta").value;

  auditFiltrado = auditLogs.filter(log => {
    if (!log.creado) return false;

    const fechaLog = new Date(log.creado);

    const yyyy = fechaLog.getFullYear();
    const mm = String(fechaLog.getMonth() + 1).padStart(2, "0");
    const dd = String(fechaLog.getDate()).padStart(2, "0");

    const fechaLocalLog = `${yyyy}-${mm}-${dd}`;

    return fechaLocalLog >= desde && fechaLocalLog <= hasta;
  });

  renderAudit();
}





window.cerrarModalAudit = cerrarModalAudit;
window.abrirDetalleAudit = abrirDetalleAudit;
window.cargarAudit = cargarAudit;
window.aplicarFiltroAudit = aplicarFiltroAudit;
window.initAudit = initAudit;


