-- Usuarios
INSERT INTO Usuario VALUES 
('U1', 'Admin', 'admin@viasugas.com', 'hash123', true, NOW(), NOW()),
('U2', 'Operador', 'op@viasugas.com', 'hash456', true, NOW(), NOW());

-- Permisos
INSERT INTO Permiso VALUES
('P1', 'ADMIN', 'Administrador', 'Acceso total'),
('P2', 'OPER', 'Operador', 'Acceso limitado');

-- Relación usuario_permiso
INSERT INTO usuario_permiso VALUES
('U1', 'P1'),
('U2', 'P2');

INSERT INTO Cliente VALUES
('900123456', 'Cliente Demo', 'cliente@mail.com', 3001234567, 'Cali', 'activo', NOW(), NOW());

INSERT INTO EmpresaACargo VALUES
('800987654', 'Empresa Transporte', 'empresa@mail.com', 3009876543, 'Bogotá', 'activo', NOW(), NOW());

INSERT INTO Propietario VALUES
('111111111', 'Juan Propietario', 'prop@mail.com', 3011111111, NOW(), NOW());

INSERT INTO Conductor VALUES
(12345678, 'Carlos Ruiz', 'conductor@mail.com', 3022222222, 'activo',
 '2027-01-01', '2026-12-01', '2026-11-01',
 NOW(), NOW());

INSERT INTO Vehiculo VALUES
('ABC123', 111111111, 'activo',
 '2026-10-01', '2026-09-01', '2026-12-01',
 NOW(), NOW());

INSERT INTO Trailer VALUES
('TRL456', 111111111, 'activo',
 '2026-08-01',
 NOW(), NOW());

INSERT INTO Manifiesto VALUES
(
 'M1', 1001,
 '900123456',   -- cliente
 12345678,      -- conductor
 'ABC123',      -- vehiculo
 'TRL456',      -- trailer
 '800987654',   -- empresa

 '2026-03-25',

 'Valle', 'Cali',
 'Antioquia', 'Medellín',

 'en_curso',

 5000000,       -- valor_flete
 10,            -- porcentaje
 1000000,       -- anticipo

 'pendiente',   -- gastos
 'aprobado',    -- documentos

 true,
 'Carga delicada',

 NOW()
);

INSERT INTO Factura VALUES
(
 'F001',
 'M1',
 '2026-03-25',
 '2026-04-25',
 5000000,
 500000,
 250000,
 30,
 NOW()
);

INSERT INTO Banco VALUES
(
 'B1',
 'Juan Propietario',
 '111111111',
 'Bancolombia',
 '1234567890',
 'ahorros',
 NOW()
);

INSERT INTO TipoTransaccion VALUES
('T1', 'Combustible', 'Pago gasolina', 'egreso', 'activo', NOW()),
('T2', 'Flete', 'Pago cliente', 'ingreso', 'activo', NOW());

INSERT INTO Transaccion VALUES
(
 'TR1',
 'B1',
 'T1',

 'ABC123',
 NULL,
 'M1',
 NULL,

 200000,
 '2026-03-25',
 'Carga de gasolina',

 NOW()
),

(
 'TR2',
 'B1',
 'T2',

 NULL,
 NULL,
 'M1',
 'F001',

 5000000,
 '2026-03-26',
 'Pago del cliente',

 NOW()
);

INSERT INTO GastosConductor VALUES
(
 'GC1',
 'TR1',
 12345678,
 'M1',
 'Gasolina viaje',
 NOW()
);

INSERT INTO AuditLogs (
nombreTabla, operacion, id_registro, id_usuario, dato_antiguo, dato_nuevo, creado
) VALUES
(
 'Manifiesto',
 'INSERT',
 1,
 'U1',
 NULL,
 '{"estado":"en_curso"}',
 NOW()
);






