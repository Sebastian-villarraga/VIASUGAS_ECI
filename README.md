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
* Transacciones financieras
* Facturación
* Gastos de conductor

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
* Tipos ENUM (ingreso/egreso)
* Modelo normalizado

---

## ?? CAMBIOS IMPLEMENTADOS EN ESTA SESIÓN (DETALLADO)

---

# ?? Módulo: Gastos de Conductor (REFACTOR TOTAL)

## Problema original

El modelo anterior obligaba a:

```
Crear Transacción ? Luego crear Gasto
```

Esto generaba:

* Dependencia innecesaria
* Errores de integridad (`id_transaccion`)
* Flujo poco natural
* Complejidad en frontend

---

## Nueva arquitectura implementada

### Nuevo flujo:

```
Crear Gasto ? automáticamente crea ? Transacción
```

---

## Backend (cambio crítico)

Archivo:

```
gastosConductor.controller.js
```

### Lógica nueva:

1. Se inicia transacción SQL (`BEGIN`)
2. Se crea la transacción financiera
3. Se crea el gasto asociado
4. Se hace `COMMIT`

---

## Problemas solucionados

* ? `null value in column id_transaccion`
* ? dependencia manual de transacciones
* ? errores de sincronización
* ? duplicidad lógica frontend/backend

---

## Base de datos

### Cambio importante

```sql
ALTER TABLE transaccion
ALTER COLUMN id_banco DROP NOT NULL;
```

? Ahora los gastos de conductor **no requieren banco**

---

# ?? Módulo: Transacciones (CORREGIDO Y LIMPIO)

---

## Problemas detectados

* Error 500 al usar tipo **GASTO CONDUCTOR**
* Problemas con ENUM
* Mezcla incorrecta de tipos

---

## Soluciones

? Validación correcta de `tipo_transaccion`
? Ajuste de ENUM
? Separación clara de categorías

---

## Regla nueva

Las transacciones tipo:

```
GASTO CONDUCTOR
```

? NO aparecen en el módulo de transacciones
? SOLO viven en el módulo de gastos

---

# ?? Módulo: Detalle de Manifiesto (MEJORADO)

---

## Cambios clave

### 1. Datos enriquecidos

Ahora incluye:

? Cliente completo
? Conductor completo
? Empresa completa
? Transacciones con tipo
? Gastos con su transacción completa

---

### 2. Lógica corregida

? Se excluyen transacciones tipo `GASTO CONDUCTOR`
? Se integran dentro de `gastos`

---

### 3. Estructura final

```json
{
  "manifiesto": {},
  "gastos": [],
  "transacciones": [],
  "factura": {}
}
```

---

# ?? Módulo NUEVO: Registro de Conductor

---

## Objetivo

Permitir que el conductor registre gastos directamente sobre sus viajes.

---

## UX implementada

### Layout

```
[ IZQUIERDA ] ? Formulario
[ DERECHA ]   ? Tabla de gastos
```

---

## Flujo

1. Ingresa cédula
2. Se cargan manifiestos
3. Selecciona manifiesto
4. Se habilita formulario
5. Registra gasto
6. Se actualiza tabla automáticamente

---

## Endpoints nuevos

```
GET  /api/registro-conductor/manifiestos/:cedula
GET  /api/registro-conductor/gastos?manifiesto=ID
POST /api/gastos-conductor
```

---

## Frontend nuevo

Archivos:

```
registro-conductor.html
registro-conductor.js
registro-conductor.css
```

---

## Namespacing (CRÍTICO)

Se implementó prefijo:

```
rc-
```

Ejemplo:

```
rc-cedula
rc-manifiesto
rc-tipo
rc-valor
rc-tabla
```

? evita conflictos globales
? permite escalabilidad

---

## CSS encapsulado

Todo el módulo usa:

```
#rc-container
```

? no rompe otros módulos

---

## Problemas solucionados

* ? rutas 404
* ? controllers mal exportados
* ? IDs duplicados
* ? errores null en JS
* ? estilos globales rompiendo UI

---

# ?? MEJORAS VISUALES

---

## Estandarización

? uso de cards
? jerarquía tipográfica
? inputs modernos
? botones consistentes

---

## Tablas

? separación de header
? mejor padding
? valores formateados
? estado vacío

---

## Layout

? grid balanceado
? espaciado consistente
? diseño tipo SaaS

---

# ?? ERRORES IMPORTANTES RESUELTOS

---

## Backend

* `argument handler must be a function`
* `Cannot find module 'uuid'`
* `null value in column id`
* `invalid input value for enum`
* `500 Internal Server Error`

---

## Frontend

* `Cannot read properties of null`
* rutas API incorrectas
* eventos mal inicializados
* formularios no renderizados

---

# ?? DECISIONES DE ARQUITECTURA IMPORTANTES

---

## 1. Separación de dominios

* Transacciones ? financiero global
* Gastos conductor ? operación del viaje

---

## 2. Flujo natural

El usuario crea un gasto
NO una transacción

---

## 3. Backend como orquestador

? el backend maneja la lógica
? el frontend solo envía datos

---

## 4. Encapsulación total por módulo

? CSS aislado
? IDs únicos
? JS independiente

---

# ?? ESTADO ACTUAL

---

? CRUD completo de gastos conductor
? Registro autónomo por conductor
? Integración con manifiestos
? Transacciones automáticas
? UI consistente
? Arquitectura escalable

---

## Autor

Alejandro Villarraga
Arquitectura enfocada en soluciones cloud sobre AWS
