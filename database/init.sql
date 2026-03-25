-- =========================
-- TABLAS
-- =========================
CREATE TABLE Usuario (
    id VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR UNIQUE,
    contraseña_hash VARCHAR,
    activo BOOLEAN,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE Permiso (
    id VARCHAR PRIMARY KEY,
    codigo VARCHAR UNIQUE,
    nombre VARCHAR,
    descripcion VARCHAR
);

CREATE TABLE usuario_permiso (
    id_usuario VARCHAR,
    id_permiso VARCHAR,
    PRIMARY KEY (id_usuario, id_permiso),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id),
    FOREIGN KEY (id_permiso) REFERENCES Permiso(id)
);

CREATE TABLE Cliente (
    nit VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono INT,
    direccion VARCHAR,
    estado TActivo,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE EmpresaACargo (
    nit VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono INT,
    direccion VARCHAR,
    estado TActivo,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE Conductor (
    cedula INT PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono INT,
    estado TActivo,
    vencimiento_licencia DATE,
    vencimiento_manip_alimentos DATE,
    vencimiento_sustancia_peligrosa DATE,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE Vehiculo (
    placa VARCHAR PRIMARY KEY,
    id_propietario INT,
    estado TActivo,
    vencimiento_soat DATE,
    vencimiento_tecno DATE,
    vencimiento_todo_riesgo DATE,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE Trailer (
    placa VARCHAR PRIMARY KEY,
    id_propietario INT,
    estado TActivo,
    vencimiento_cert_fumigacion DATE,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE Propietario (
    identificacion VARCHAR PRIMARY KEY,
    nombre VARCHAR,
    correo VARCHAR,
    telefono INT,
    creado TIMESTAMP,
    actualizado TIMESTAMP
);

CREATE TABLE Manifiesto (
    id_manifiesto VARCHAR PRIMARY KEY,
    radicado INT UNIQUE,
    id_cliente VARCHAR,
    id_conductor INT,
    id_vehiculo VARCHAR,
    id_trailer VARCHAR,
    id_empresa_a_cargo VARCHAR,

    fecha DATE,

    origen_departamento VARCHAR,
    origen_ciudad VARCHAR,
    destino_departamento VARCHAR,
    destino_ciudad VARCHAR,

    estado TEstadoViaje,

    valor_flete Moneda,
    valor_flete_porcentaje Moneda,
    anticipo_manifiesto Moneda,

    gastos TValidacion,
    documentos TValidacion,

    novedades BOOLEAN,
    observaciones VARCHAR,

    creado TIMESTAMP,

    FOREIGN KEY (id_cliente) REFERENCES Cliente(nit),
    FOREIGN KEY (id_conductor) REFERENCES Conductor(cedula),
    FOREIGN KEY (id_vehiculo) REFERENCES Vehiculo(placa),
    FOREIGN KEY (id_trailer) REFERENCES Trailer(placa),
    FOREIGN KEY (id_empresa_a_cargo) REFERENCES EmpresaACargo(nit)
);

CREATE TABLE Factura (
    codigo_factura VARCHAR PRIMARY KEY,
    id_manifiesto VARCHAR,
    fecha_emision DATE,
    fecha_vencimiento DATE,
    valor Moneda,
    retencion_fuente Moneda,
    retencion_ica Moneda,
    plazo_pago INT,
    creado TIMESTAMP,

    FOREIGN KEY (id_manifiesto) REFERENCES Manifiesto(id_manifiesto)
);

CREATE TABLE Banco (
    id VARCHAR PRIMARY KEY,
    nombre_titular VARCHAR,
    identificacion VARCHAR,
    nombre_banco VARCHAR,
    numero_cuenta VARCHAR,
    tipo_cuenta TCuentaBanco,
    creado TIMESTAMP
);

CREATE TABLE TipoTransaccion (
    id VARCHAR PRIMARY KEY,
    categoria VARCHAR,
    descripcion VARCHAR,
    tipo TIngresoEgreso,
    estado TActivo,
    creado TIMESTAMP
);

CREATE TABLE Transaccion (
    id VARCHAR PRIMARY KEY,
    id_banco VARCHAR,
    id_tipo_transaccion VARCHAR,

    id_vehiculo VARCHAR NULL,
    id_trailer VARCHAR NULL,
    id_manifiesto VARCHAR NULL,
    id_factura VARCHAR NULL,

    valor Moneda,
    fecha_pago DATE,
    descripcion VARCHAR,

    creado TIMESTAMP,

    FOREIGN KEY (id_banco) REFERENCES Banco(id),
    FOREIGN KEY (id_tipo_transaccion) REFERENCES TipoTransaccion(id),
    FOREIGN KEY (id_vehiculo) REFERENCES Vehiculo(placa),
    FOREIGN KEY (id_trailer) REFERENCES Trailer(placa),
    FOREIGN KEY (id_manifiesto) REFERENCES Manifiesto(id_manifiesto),
    FOREIGN KEY (id_factura) REFERENCES Factura(codigo_factura)
);

CREATE TABLE GastosConductor (
    id VARCHAR PRIMARY KEY,
    id_transaccion VARCHAR NOT NULL,
    id_conductor INT NOT NULL,
    id_manifiesto VARCHAR NOT NULL,
    descripcion VARCHAR,
    creado TIMESTAMP,

    FOREIGN KEY (id_transaccion) REFERENCES Transaccion(id),
    FOREIGN KEY (id_conductor) REFERENCES Conductor(cedula),
    FOREIGN KEY (id_manifiesto) REFERENCES Manifiesto(id_manifiesto)
);

CREATE TABLE AuditLogs (
    id SERIAL PRIMARY KEY,
    nombreTabla VARCHAR,
    operacion TOperacion,
    id_registro INT,
    id_usuario VARCHAR,
    dato_antiguo JSONB,
    dato_nuevo JSONB,
    creado TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES Usuario(id)
);


-- =========================
-- ENUMS
-- =========================

CREATE TYPE TActivo AS ENUM ('activo', 'inactivo');

CREATE TYPE TCuentaBanco AS ENUM ('ahorros', 'corriente');

CREATE TYPE TEstadoViaje AS ENUM ('pendiente', 'en_curso', 'finalizado', 'cancelado');

CREATE TYPE TValidacion AS ENUM ('pendiente', 'aprobado', 'rechazado');

CREATE TYPE TOperacion AS ENUM ('INSERT', 'UPDATE', 'DELETE');

CREATE TYPE TIngresoEgreso AS ENUM ('ingreso', 'egreso');

-- =========================
-- DOMINIOS
-- =========================

CREATE DOMAIN Moneda AS NUMERIC(15,2);