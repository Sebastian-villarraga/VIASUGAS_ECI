-- =========================
-- CREACIÓN DE TABLAS BASE
-- =========================

CREATE TABLE usuario (
    id VARCHAR PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    correo VARCHAR UNIQUE NOT NULL,
    contrasena_hash TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permiso (
    id VARCHAR PRIMARY KEY,
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

-- =========================
-- CLIENTE
-- =========================
CREATE TABLE cliente (
    nit VARCHAR PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    correo VARCHAR,
    telefono BIGINT,
    direccion VARCHAR,
    estado VARCHAR,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CONDUCTOR
-- =========================
CREATE TABLE conductor (
    cedula BIGINT PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono BIGINT,
    estado VARCHAR,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PROPIETARIO
-- =========================
CREATE TABLE propietario (
    identificacion VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono BIGINT
);

-- =========================
-- VEHICULO
-- =========================
CREATE TABLE vehiculo (
    placa VARCHAR PRIMARY KEY,
    id_propietario VARCHAR,
    FOREIGN KEY (id_propietario) REFERENCES propietario(identificacion)
);

-- =========================
-- TRAILER
-- =========================
CREATE TABLE trailer (
    placa VARCHAR PRIMARY KEY,
    id_propietario VARCHAR,
    FOREIGN KEY (id_propietario) REFERENCES propietario(identificacion)
);

-- =========================
-- MANIFIESTO
-- =========================
CREATE TABLE manifiesto (
    id_manifiesto VARCHAR PRIMARY KEY,
    fecha DATE,
    origen_ciudad VARCHAR,
    destino_ciudad VARCHAR,
    origen_departamento VARCHAR,
    destino_departamento VARCHAR,
    estado VARCHAR,
    valor_flete NUMERIC,
    id_cliente VARCHAR,
    id_conductor BIGINT,
    id_vehiculo VARCHAR,
    id_trailer VARCHAR,
    FOREIGN KEY (id_cliente) REFERENCES cliente(nit),
    FOREIGN KEY (id_conductor) REFERENCES conductor(cedula),
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(placa),
    FOREIGN KEY (id_trailer) REFERENCES trailer(placa)
);

-- =========================
-- FACTURA
-- =========================
CREATE TABLE factura (
    codigo_factura VARCHAR PRIMARY KEY,
    id_manifiesto VARCHAR,
    fecha_emision DATE,
    fecha_vencimiento DATE,
    valor NUMERIC,
    retencion_fuente NUMERIC,
    retencion_ica NUMERIC,
    plazo_pago INT,
    FOREIGN KEY (id_manifiesto) REFERENCES manifiesto(id_manifiesto)
);

-- =========================
-- BANCO
-- =========================
CREATE TABLE banco (
    id VARCHAR PRIMARY KEY,
    nombre_banco VARCHAR,
    numero_cuenta VARCHAR,
    tipo_cuenta VARCHAR,
    nombre_titular VARCHAR
);

-- =========================
-- TRANSACCION
-- =========================
CREATE TABLE transaccion (
    id VARCHAR PRIMARY KEY,
    tipo VARCHAR,
    categoria VARCHAR,
    valor NUMERIC,
    descripcion VARCHAR,
    fecha_pago DATE,
    id_banco VARCHAR,
    id_factura VARCHAR,
    id_manifiesto VARCHAR,
    id_vehiculo VARCHAR,
    id_trailer VARCHAR,
    FOREIGN KEY (id_banco) REFERENCES banco(id),
    FOREIGN KEY (id_factura) REFERENCES factura(codigo_factura),
    FOREIGN KEY (id_manifiesto) REFERENCES manifiesto(id_manifiesto)
);

-- =========================
-- LOGS
-- =========================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    nombre_tabla VARCHAR,
    operacion VARCHAR,
    id_registro INT,
    id_usuario VARCHAR,
    dato_antiguo JSONB,
    dato_nuevo JSONB,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
