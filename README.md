# ?? VIASUGAS - Plataforma de Gestión de Transporte

---

## ?? Descripción General

VIASUGAS es una plataforma web para la gestión integral de operaciones de transporte de carga.

Permite administrar:

* ?? Vehículos
* ?? Propietarios
* ????? Conductores
* ?? Manifiestos (viajes)
* ?? Alertas de vencimientos

La aplicación sigue una arquitectura **fullstack desacoplada**, con enfoque en escalabilidad tipo SaaS.

---

## ?? Arquitectura General

```
Frontend (SPA)  <--->  Backend (Express API)  <--->  PostgreSQL
```

---

## ?? Tecnologías

### Frontend

* HTML5
* CSS3 (modular)
* JavaScript Vanilla
* SPA custom (router propio)
* Font Awesome

### Backend

* Node.js
* Express.js
* PostgreSQL (pg)

### Base de Datos

* PostgreSQL
* Relaciones con FK
* Tipos ENUM
* Modelo normalizado

---

## ?? Estructura del Proyecto

```
frontend/
  js/
    api.js
    app.js
    vehiculos.js
    propietarios.js
    conductores.js
    ui.js

backend/
  controllers/
    vehiculo.controller.js
    propietario.controller.js
    conductor.controller.js

  routes/
    vehiculo.routes.js
    propietario.routes.js
    conductor.routes.js
```

---

## ?? API Backend

### ?? Conductores

#### GET `/api/conductores`

Filtros soportados:

* nombre
* cedula
* estado

#### POST `/api/conductores`

Crear conductor

#### PUT `/api/conductores/:cedula`

Actualizar conductor

#### GET `/api/conductores/alertas`

Retorna:

* vencimientos de licencia
* curso alimentos
* sustancias peligrosas

Incluye:

```json
{
  "cedula": 1001,
  "nombre": "Juan Pérez",
  "tipo": "Licencia",
  "estado": "vencido",
  "fecha": "2026-03-28"
}
```

---

### ?? Propietarios

#### GET `/api/propietarios`

Filtros:

* nombre
* identificacion

#### POST `/api/propietarios`

Crear propietario

#### PUT `/api/propietarios/:identificacion`

Actualizar propietario

---

### ?? Vehículos

#### GET `/api/vehiculos`

Filtros:

* placa
* propietario
* estado

#### GET `/api/vehiculos/alertas`

Alertas de:

* SOAT
* Tecnomecánica
* Todo riesgo

---

## ?? Frontend (SPA)

### ?? Router (`app.js`)

* Navegación dinámica
* Carga vistas sin recargar
* Inicializa módulos:

  * `initVehiculos()`
  * `initPropietarios()`
  * `initConductores()`

---

## ?? API Client (`api.js`)

* Manejo centralizado de fetch
* Headers automáticos
* Manejo de errores
* Integración con toast global

---

## ?? UI Global (`ui.js`)

Incluye:

### ?? Toast global

* Éxito
* Error
* Info

### ?? Helpers reutilizables

* `formatDate()`
* `renderEstadoBadge()`

---

## ????? Módulo Conductores

### Funcionalidades

* ? Listado
* ? Filtros dinámicos (sin botón)
* ? Edición inline
* ? Creación con modal
* ? Alertas inteligentes
* ? Estados visuales (badge)

---

## ?? Sistema de Alertas

### Características

* ?? Vencidos
* ?? Por vencer (30 días)
* Scroll interno
* Contadores dinámicos
* Agrupación por estado

### UI

* Cards visuales
* Scroll estilizado
* Contador interactivo

---

## ?? Filtros Dinámicos (Global)

Todos los módulos usan:

* input ? filtra automáticamente
* debounce (300ms)
* sin botón obligatorio

---

## ?? Manejo de Fechas (CRÍTICO)

Problema resuelto:

? desfase por timezone
? solución aplicada:

* Backend devuelve `YYYY-MM-DD`
* Frontend NO usa `new Date()`

```js
function formatDate(fecha) {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}
```

---

## ?? Estados Visuales

Sistema global de badges:

* ?? Activo
* ?? Inactivo

Reusable en toda la app.

---

## ? UX Implementada

* Filtros en tiempo real
* Scroll interno elegante
* Alertas agrupadas
* Feedback visual inmediato (toasts)
* Edición inline fluida

---

## ?? Datos de Prueba

Se incluye dataset con:

* vencidos
* próximos
* mixtos
* inactivos
* casos borde

---

## ?? Limitaciones actuales

* Auth en modo dev
* Sin validaciones backend robustas
* Sin roles/permisos
* Sin paginación

---

## ?? Roadmap

* Dashboard avanzado
* Click en alertas ? filtrar tabla
* Colores en vencimientos
* Paginación
* JWT real
* Roles y permisos
* Auditoría

---

## ????? Autor

Alejandro Villarraga
Arquitectura enfocada en soluciones cloud sobre AWS ??

---
