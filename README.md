# ?? VIASUGAS - Plataforma de Gestión de Transporte

## ?? Descripción General

VIASUGAS es una plataforma web para la gestión integral de operaciones de transporte de carga.
Permite administrar vehículos, monitorear vencimientos, gestionar viajes (manifiestos), y controlar procesos financieros asociados.

La aplicación está construida con una arquitectura **fullstack desacoplada**, compuesta por:

* Frontend SPA (Single Page Application)
* Backend API REST en Node.js
* Base de datos relacional en PostgreSQL

---

## ??? Arquitectura General

```
Frontend (SPA)  <--->  Backend (Express API)  <--->  PostgreSQL
```

* El frontend consume la API mediante `fetch`
* El backend expone endpoints REST
* PostgreSQL gestiona toda la persistencia

---

## ?? Tecnologías Utilizadas

### ??? Frontend

* HTML5
* CSS3 (modularizado por vistas)
* JavaScript Vanilla (sin frameworks)
* SPA custom (router propio con `history.pushState`)
* Font Awesome (iconos)

### ?? Backend

* Node.js
* Express.js
* PostgreSQL (pg driver)
* Arquitectura basada en:

  * Routes
  * Controllers

### ??? Base de Datos

* PostgreSQL
* Tipos ENUM personalizados
* Relaciones con claves foráneas
* Modelo altamente normalizado

---

## ?? Estructura del Proyecto

```
viasugas/
¦
+-- backend/
¦   +-- config/
¦   ¦   +-- db.js
¦   ¦
¦   +-- controllers/
¦   ¦   +-- auth.controller.js
¦   ¦   +-- vehiculo.controller.js
¦   ¦   +-- manifiesto.controller.js
¦   ¦
¦   +-- routes/
¦   ¦   +-- auth.routes.js
¦   ¦   +-- vehiculo.routes.js
¦   ¦   +-- manifiesto.routes.js
¦   ¦
¦   +-- index.js
¦
+-- frontend/
¦   +-- assets/
¦   ¦   +-- images/
¦   ¦
¦   +-- styles/
¦   ¦   +-- global.css
¦   ¦   +-- layout.css
¦   ¦   +-- sidebar.css
¦   ¦   +-- topbar.css
¦   ¦   +-- home.css
¦   ¦   +-- login.css
¦   ¦   +-- vehiculo.css
¦   ¦
¦   +-- js/
¦   ¦   +-- api.js
¦   ¦   +-- app.js
¦   ¦   +-- auth.js
¦   ¦   +-- dashboard.js
¦   ¦   +-- vehiculos.js
¦   ¦
¦   +-- pages/
¦   ¦   +-- index.html
¦   ¦   +-- home.html
¦   ¦   +-- forgot.html
¦   ¦   +-- views/
¦   ¦       +-- dashboard.html
¦   ¦       +-- vehiculos.html
¦
+-- database/
¦   +-- init.sql
¦   +-- seed.sql
¦
+-- package.json
```

---

## ?? Autenticación

Actualmente el sistema tiene un **login en modo desarrollo**:

* No valida credenciales reales
* Retorna un token simulado (`dev-token`)
* Guarda usuario en `localStorage`

Flujo:

1. Usuario ingresa credenciales
2. Se llama `/api/login`
3. Se guarda token en frontend
4. Se redirige a la SPA (`home.html`)

---

## ?? API Backend

### Base URL

```
http://<host>:3000/api
```

---

### ?? Auth

#### POST `/api/login`

```json
{
  "email": "usuario@mail.com",
  "password": "123456"
}
```

Respuesta:

```json
{
  "token": "dev-token",
  "user": {
    "email": "usuario@mail.com",
    "nombre": "Usuario Demo"
  }
}
```

---

### ?? Vehículos

#### GET `/api/vehiculos`

* Lista todos los vehículos
* Permite filtros:

  * `placa`
  * `propietario`
  * `estado`

---

#### POST `/api/vehiculos`

Crea un vehículo

```json
{
  "placa": "ABC123",
  "propietario": "Carlos",
  "vencimiento_soat": "2026-01-01",
  "estado": "activo"
}
```

---

#### PUT `/api/vehiculos/:placa`

Actualiza vehículo

---

#### GET `/api/vehiculos/alertas`

* Retorna vencimientos:

  * SOAT
  * Tecnomecánica
  * Todo riesgo

---

#### GET `/api/vehiculos/filtro-alertas`

Filtros:

```
?tipo=vencido
?tipo=proximo
```

---

### ?? Manifiestos

#### GET `/api/manifiestos`

Lista viajes

#### POST `/api/manifiestos`

Crea un manifiesto

---

## ?? Frontend SPA

### ?? Router (`app.js`)

* Navegación por hash (`#vehiculos`)
* Carga vistas dinámicamente:

```
/pages/views/{view}.html
```

* Ejecuta funciones por vista:

```js
initVehiculos()
initDashboard()
```

---

### ?? API Client (`api.js`)

* Maneja todas las llamadas HTTP
* Agrega automáticamente:

  * headers
  * token

---

### ?? Módulo Vehículos

Funcionalidades:

* Listado de vehículos
* Filtros dinámicos
* Edición inline
* Creación mediante modal
* Alertas de vencimientos
* Acciones rápidas

Flujo:

```
initVehiculos()
  ? cargarVehiculos()
      ? apiFetch()
          ? renderTabla()
```

---

### ?? Dashboard

* KPIs:

  * viajes activos
  * finalizados
  * facturación pendiente
* tabla de viajes
* resumen financiero

---

## ??? Modelo de Datos

El sistema incluye entidades clave:

* usuario
* permisos
* cliente
* conductor
* vehículo
* trailer
* manifiesto (viaje)
* factura
* transacciones
* gastos
* auditoría

Características:

* uso de ENUMs
* relaciones fuertes (FK)
* estructura escalable tipo ERP

---

## ?? Limitaciones actuales

* Autenticación no segura (modo dev)
* Sin middleware de autorización
* Sin validación de datos (backend)
* Arquitectura backend no separada en capas
* Manejo de errores básico

---

## ?? Roadmap sugerido

* Implementar JWT real
* Middleware de seguridad
* Módulo completo de manifiestos (frontend)
* Facturación automatizada
* Gestión de conductores
* Dashboard avanzado (financiero)

---

## ?? Ejecución del proyecto

### Backend

```bash
cd backend
npm install
node index.js
```

### Frontend

* Servido desde Express (static)
* Acceder a:

```
http://localhost:3000
```

---

## ?? Notas para desarrollo futuro

* Mantener SPA sin scripts en vistas
* Centralizar lógica en `app.js`
* Evitar duplicación de estilos
* Separar lógica backend en servicios

---

## ????? Autor

Proyecto desarrollado por Alejandro Villarraga
Plataforma enfocada en soluciones logísticas sobre arquitectura cloud.

---
