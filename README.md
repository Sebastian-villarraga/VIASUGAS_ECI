# VIASUGAS - Plataforma de Gestión de Transporte

---

## Descripción General

VIASUGAS es una plataforma web para la gestión integral de operaciones de transporte de carga.

Permite administrar:

* Vehículos
* Propietarios
* Conductores
* Empresas a Cargo (Terceros)
* Manifiestos (viajes)
* Alertas de vencimientos

La aplicación sigue una arquitectura **fullstack desacoplada**, con enfoque en escalabilidad tipo SaaS.

---

## Arquitectura General

```
Frontend (SPA)  <-->  Backend (Express API)  <-->  PostgreSQL
```

---

## Tecnologías

### Frontend

* HTML5
* CSS3 (modular por módulo)
* JavaScript Vanilla
* SPA custom (router propio)
* Font Awesome

### Backend

* Node.js
* Express.js
* PostgreSQL (pg)

### Base de Datos

* PostgreSQL
* Relaciones con claves foráneas
* Tipos ENUM
* Modelo normalizado

---

## Estructura del Proyecto

```
frontend/
  js/
    api.js
    app.js
    vehiculos.js
    propietarios.js
    conductores.js
    empresas-a-cargo.js
    ui.js

  styles/
    vehiculo.css
    conductores.css
    propietarios.css
    empresas-a-cargo.css
    global.css

  pages/views/
    vehiculos.html
    propietarios.html
    conductores.html
    empresas-a-cargo.html

backend/
  controllers/
    vehiculo.controller.js
    propietario.controller.js
    conductor.controller.js
    empresaACargo.controller.js

  routes/
    vehiculo.routes.js
    propietario.routes.js
    conductor.routes.js
    empresaACargo.routes.js

  config/
    db.js

  index.js
```

---

## API Backend

### Conductores

* GET `/api/conductores`
* POST `/api/conductores`
* PUT `/api/conductores/:cedula`
* GET `/api/conductores/alertas`

Filtros:

* nombre
* cedula
* estado

---

### Propietarios

* GET `/api/propietarios`
* POST `/api/propietarios`
* PUT `/api/propietarios/:identificacion`

Filtros:

* nombre
* identificacion

---

### Vehículos

* GET `/api/vehiculos`
* GET `/api/vehiculos/alertas`
* GET `/api/vehiculos/filtro-alertas`
* POST `/api/vehiculos`
* PUT `/api/vehiculos/:placa`

Filtros:

* placa
* propietario
* estado

---

### Empresas a Cargo (Terceros)

Nuevo módulo implementado.

* GET `/api/empresas-a-cargo`
* GET `/api/empresas-a-cargo/:nit`
* POST `/api/empresas-a-cargo`
* PUT `/api/empresas-a-cargo/:nit`

Filtros:

* nit
* nombre
* estado

Relación con manifiestos:

* Se usa `nit` como identificador (FK)

---

## Frontend (SPA)

### Router (`app.js`)

* Navegación sin recarga
* Carga dinámica de vistas
* Inicialización por módulo:

```js
initVehiculos()
initPropietarios()
initConductores()
initEmpresas()
```

---

### Navegación

Se usa:

```js
navigate("nombre-vista")
```

Ejemplo:

```js
navigate("empresas-a-cargo")
```

---

### Problema resuelto importante

Se corrigió error:

```
Unexpected token '<'
```

Causa:

* rutas mal conectadas en el sidebar

Solución:

* uso correcto de `navigate()`
* alineación entre router y vistas

---

## API Client (`api.js`)

* Manejo centralizado de fetch
* Headers automáticos
* Manejo de errores con toast
* Uso de rutas relativas:

```js
const API_URL = "";
```

Esto permite trabajar en mismo dominio sin problemas de entorno.

---

## UI Global (`ui.js`)

Incluye:

* Toast global (success, error, info)
* Helpers reutilizables:

  * `renderEstadoBadge()`
  * `formatDate()`

---

## Estandarización de Layout (IMPORTANTE)

Se implementó un nuevo patrón visual consistente:

### Antes

* Layout en 2 columnas (grid)
* Botón en panel derecho

### Ahora

* Layout de 1 sola columna
* Botón alineado con el título (header)

Ejemplo:

```html
<div class="modulo-header">
  <h2>Título</h2>
  <button>Agregar</button>
</div>
```

---

## CSS Modular por Módulo

Cada módulo tiene su propio CSS:

* conductores.css
* propietarios.css
* empresas-a-cargo.css

Beneficios:

* desacople total
* mantenibilidad
* escalabilidad
* evita conflictos entre módulos

---

## Módulo Empresas a Cargo

### Funcionalidades

* Listado
* Filtros dinámicos
* Creación con modal
* Edición inline
* Estados visuales

### UI

* Layout consistente con otros módulos
* Tabla full width
* Sin columna derecha
* Header con acción principal

---

## Filtros Dinámicos

Todos los módulos usan:

* input ? filtro automático
* debounce (300ms)
* sin botón obligatorio

---

## Manejo de Fechas

Problema resuelto:

* desfase por timezone

Solución:

* backend retorna `YYYY-MM-DD`
* frontend evita `new Date()`

---

## Estados Visuales

Sistema global reutilizable:

* Activo
* Inactivo

Representados como badges.

---

## UX Implementada

* Filtros en tiempo real
* Edición inline
* Feedback inmediato (toast)
* Layout limpio tipo dashboard
* Tablas con scroll interno

---

## Datos de Prueba

Incluye:

* datos mixtos
* activos / inactivos
* casos reales simulados

---

## Limitaciones actuales

* autenticación en modo desarrollo
* sin roles/permisos
* sin paginación
* validaciones backend básicas

---

## Roadmap

* integración completa con manifiestos
* select dinámico de empresas
* paginación
* autenticación JWT real
* roles y permisos
* auditoría
* dashboard avanzado

---

## Autor

Alejandro Villarraga
Arquitectura enfocada en soluciones cloud sobre AWS
