-- =========================
-- CLEAN TOTAL DB (DEV MODE)
-- =========================

-- ?? CUIDADO: ESTO BORRA TODO

-- =========================
-- DROP TABLES (orden seguro con CASCADE)
-- =========================
DROP TABLE IF EXISTS 
  audit_logs,
  gastos_conductor,
  transaccion,
  tipo_transaccion,
  banco,
  factura,
  manifiesto,
  trailer,
  vehiculo,
  conductor,
  propietario,
  empresa_a_cargo,
  cliente,
  usuario_permiso,
  permiso,
  usuario,
  ubicacion_colombia
CASCADE;

-- =========================
-- DROP ENUMS
-- =========================
DROP TYPE IF EXISTS testadomanifiesto CASCADE;
DROP TYPE IF EXISTS tentrega CASCADE;
DROP TYPE IF EXISTS tingresoegreso CASCADE;
DROP TYPE IF EXISTS toperacion CASCADE;
DROP TYPE IF EXISTS tvalidacion CASCADE;
DROP TYPE IF EXISTS tcuentabanco CASCADE;
DROP TYPE IF EXISTS tactivo CASCADE;

-- =========================
-- DROP DOMAINS
-- =========================
DROP DOMAIN IF EXISTS moneda CASCADE;

-- =========================
-- ENUMS 
-- =========================

CREATE TYPE tactivo AS ENUM ('activo', 'inactivo');
CREATE TYPE tcuentabanco AS ENUM ('ahorros', 'corriente');
CREATE TYPE tvalidacion AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE toperacion AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE tingresoegreso AS ENUM ('INGRESO MANIFIESTO', 'EGRESO MANIFIESTO', 'EGRESO OPERACIONAL', 'GASTO CONDUCTOR');


-- ENUMS FINALES PARA MANIFIESTO
CREATE TYPE testadomanifiesto AS ENUM (
  'CREADO-EN TRANSITO',
  'ENTREGADO POR COBRAR',
  'MANIFIESTO PAGO'
);

CREATE TYPE tentrega AS ENUM (
  'PENDIENTES',
  'ENTREGADOS'
);

-- =========================
-- DOMINIOS
-- =========================

CREATE DOMAIN moneda AS NUMERIC(15,2);

-- =========================
-- TABLAS
-- =========================

CREATE TABLE usuario (
    id VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR UNIQUE,
    contrasena_hash VARCHAR,
    activo BOOLEAN,
    debe_cambiar_contrasena BOOLEAN DEFAULT TRUE,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE permiso (
    id VARCHAR PRIMARY KEY,
    codigo VARCHAR UNIQUE,
    nombre VARCHAR,
    descripcion VARCHAR
);

CREATE TABLE usuario_permiso (
    id_usuario VARCHAR,
    id_permiso VARCHAR,
    PRIMARY KEY (id_usuario, id_permiso),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id),
    FOREIGN KEY (id_permiso) REFERENCES permiso(id)
);

CREATE TABLE cliente (
    nit VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono BIGINT,
    direccion VARCHAR,
    estado tactivo,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE empresa_a_cargo (
    nit VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono BIGINT,
    direccion VARCHAR,
    estado tactivo,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE propietario (
    identificacion VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono BIGINT,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE conductor (
    cedula BIGINT PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono BIGINT,
    estado tactivo,
    vencimiento_licencia DATE,
    vencimiento_manip_alimentos DATE,
    vencimiento_sustancia_peligrosa DATE,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE vehiculo (
    placa VARCHAR PRIMARY KEY,
    id_propietario VARCHAR,
    estado tactivo,
    vencimiento_soat DATE,
    vencimiento_tecno DATE,
    vencimiento_todo_riesgo DATE,
    creado TIMESTAMP,
    actualizado TIMESTAMP,
    FOREIGN KEY (id_propietario) REFERENCES propietario(identificacion)
);

CREATE TABLE trailer (
    placa VARCHAR PRIMARY KEY,
    id_propietario VARCHAR,
    estado tactivo,
    vencimiento_cert_fumigacion DATE,
    vencimiento_cert_sanidad DATE,
    creado TIMESTAMP,
    actualizado TIMESTAMP,
    FOREIGN KEY (id_propietario) REFERENCES propietario(identificacion)
);

CREATE TABLE manifiesto (
    id_manifiesto VARCHAR PRIMARY KEY,
    radicado BIGINT,
    id_cliente VARCHAR,
    id_conductor BIGINT,
    id_vehiculo VARCHAR,
    id_trailer VARCHAR,
    id_empresa_a_cargo VARCHAR,

    fecha DATE,

    origen_departamento VARCHAR,
    origen_ciudad VARCHAR,
    destino_departamento VARCHAR,
    destino_ciudad VARCHAR,

    estado testadomanifiesto,

    valor_flete moneda,
    valor_flete_porcentaje moneda,
    anticipo_manifiesto moneda,

    gastos tentrega,
    documentos tentrega,

    novedades BOOLEAN,
    observaciones VARCHAR,

    creado TIMESTAMP,

    FOREIGN KEY (id_cliente) REFERENCES cliente(nit),
    FOREIGN KEY (id_conductor) REFERENCES conductor(cedula),
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(placa),
    FOREIGN KEY (id_trailer) REFERENCES trailer(placa),
    FOREIGN KEY (id_empresa_a_cargo) REFERENCES empresa_a_cargo(nit)
);

CREATE TABLE factura (
    codigo_factura VARCHAR PRIMARY KEY,
    id_manifiesto VARCHAR UNIQUE,
    fecha_emision DATE,
    fecha_vencimiento DATE,
    valor moneda,
    retencion_fuente moneda,
    retencion_ica moneda,
    plazo_pago INT,
    creado TIMESTAMP,
    FOREIGN KEY (id_manifiesto) REFERENCES manifiesto(id_manifiesto)
);

CREATE TABLE banco (
    id VARCHAR PRIMARY KEY,
    nombre_titular VARCHAR,
    identificacion VARCHAR,
    nombre_banco VARCHAR,
    numero_cuenta VARCHAR,
    tipo_cuenta tcuentabanco,
    creado TIMESTAMP
);

CREATE TABLE tipo_transaccion (
    id VARCHAR PRIMARY KEY,
    categoria VARCHAR,
    descripcion VARCHAR,
    tipo tingresoegreso,     
    estado tactivo,
    creado TIMESTAMP
);

CREATE TABLE transaccion (
    id VARCHAR PRIMARY KEY,
    id_banco VARCHAR NULL,
    id_tipo_transaccion VARCHAR,

    id_vehiculo VARCHAR,
    id_trailer VARCHAR,
    id_manifiesto VARCHAR,
    id_factura VARCHAR,

    valor moneda,
    fecha_pago DATE,
    descripcion VARCHAR,

    creado TIMESTAMP,

    FOREIGN KEY (id_banco) REFERENCES banco(id),
    FOREIGN KEY (id_tipo_transaccion) REFERENCES tipo_transaccion(id),
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(placa),
    FOREIGN KEY (id_trailer) REFERENCES trailer(placa),
    FOREIGN KEY (id_manifiesto) REFERENCES manifiesto(id_manifiesto),
    FOREIGN KEY (id_factura) REFERENCES factura(codigo_factura)
);

CREATE TABLE gastos_conductor (
    id VARCHAR PRIMARY KEY,
    id_transaccion VARCHAR NOT NULL,
    id_conductor BIGINT NOT NULL,
    id_manifiesto VARCHAR NOT NULL,
    descripcion VARCHAR,
    creado TIMESTAMP,

    FOREIGN KEY (id_transaccion) REFERENCES transaccion(id),
    FOREIGN KEY (id_conductor) REFERENCES conductor(cedula),
    FOREIGN KEY (id_manifiesto) REFERENCES manifiesto(id_manifiesto)
);


CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    nombre_tabla VARCHAR(100) NOT NULL,
    operacion toperacion NOT NULL,
    id_registro VARCHAR(50) NOT NULL,
    id_usuario VARCHAR NOT NULL,
    dato_antiguo JSONB,
    dato_nuevo JSONB,
    ip VARCHAR(50),
    user_agent TEXT,
    creado TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id)
);

CREATE TABLE ubicacion_colombia (
    id SERIAL PRIMARY KEY,
    codigo_departamento VARCHAR(10) NOT NULL,
    nombre_departamento VARCHAR(100) NOT NULL,
    codigo_municipio VARCHAR(10) NOT NULL UNIQUE,
    nombre_municipio VARCHAR(120) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Municipio',
    creado TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ubicacion_departamento
  ON ubicacion_colombia(nombre_departamento);

CREATE INDEX idx_ubicacion_codigo_departamento
  ON ubicacion_colombia(codigo_departamento);

CREATE INDEX idx_ubicacion_municipio
  ON ubicacion_colombia(nombre_municipio);
