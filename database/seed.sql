-- =====================================================
-- CLEAN
-- =====================================================

DELETE FROM gastos_conductor;
DELETE FROM transaccion;
DELETE FROM factura;
DELETE FROM tipo_transaccion;
DELETE FROM banco;
DELETE FROM manifiesto;
DELETE FROM vehiculo;
DELETE FROM trailer;
DELETE FROM conductor;
DELETE FROM propietario;
DELETE FROM empresa_a_cargo;
DELETE FROM cliente;
DELETE FROM usuario_permiso;
DELETE FROM permiso;
DELETE FROM usuario;
DELETE FROM audit_logs;

-- =====================================================
-- CLIENTES
-- =====================================================

INSERT INTO cliente VALUES
('860025900-2','Alpina','alpina@mail.com',573001111111,'Bogota','activo',NOW(),NULL),
('893624584-1','Postobon','postobon@mail.com',573002222222,'Medellin','activo',NOW(),NULL),
('904125236-7','D1','d1@mail.com',573003333333,'Bogota','activo',NOW(),NULL);

-- =====================================================
-- EMPRESAS A CARGO
-- =====================================================

INSERT INTO empresa_a_cargo VALUES
('993225236-7','TransLogistica','trans@mail.com',573101111111,'Bogota','activo',NOW(),NULL),
('879853685-4','CargaExpress','carga@mail.com',573102222222,'Cali','activo',NOW(),NULL);

-- =====================================================
-- PROPIETARIOS
-- =====================================================

INSERT INTO propietario VALUES
('1070017389','Juan Perez','juan@mail.com',573201111111,NOW(),NULL),
('51972658','Carlos Gomez','carlos@mail.com',573202222222,NOW(),NULL);

-- =====================================================
-- CONDUCTORES
-- =====================================================

INSERT INTO conductor VALUES
(109668745,'Pedro Ruiz','pedro@mail.com',573301111111,'activo','2027-01-01','2027-01-01','2027-01-01',NOW(),NULL),
(79854489,'Luis Torres','luis@mail.com',573302222222,'activo','2026-01-01','2026-01-01','2026-01-01',NOW(),NULL);

-- =====================================================
-- VEHICULOS
-- =====================================================

INSERT INTO vehiculo VALUES
('JGV196','1070017389','activo','2026-12-01','2026-12-01','2026-12-01',NOW(),NULL),
('HGT678','51972658','activo','2026-10-01','2026-10-01','2026-10-01',NOW(),NULL);

-- =====================================================
-- TRAILERS
-- =====================================================

INSERT INTO trailer VALUES
('T68945','1070017389','activo','2026-12-01','2026-12-01',NOW(),NULL),
('T78452','51972658','activo','2026-10-01','2026-10-01',NOW(),NULL);

-- =====================================================
-- MANIFIESTOS (CASOS REALES)
-- =====================================================

INSERT INTO manifiesto VALUES

-- SIN FACTURA (ANTICIPO)
('MF1001',5001,'860025900-2',109668745,'JGV196','T68945','993225236-7',
'2026-04-01','Cundinamarca','Bogota','Valle','Cali',
'CREADO-EN TRANSITO',5000000,10,500000,'PENDIENTES','PENDIENTES',false,'',NOW()),

-- CON FACTURA - POR COBRAR
('MF1002',5002,'893624584-1',79854489,'HGT678','T78452','879853685-4',
'2026-04-02','Antioquia','Medellin','Cundinamarca','Bogota',
'ENTREGADO POR COBRAR',7000000,10,700000,'ENTREGADOS','ENTREGADOS',false,'',NOW()),

-- CON FACTURA - PAGADO
('MF1003',5003,'904125236-7',109668745,'JGV196','T68945','993225236-7',
'2026-04-03','Cundinamarca','Bogota','Antioquia','Medellin',
'MANIFIESTO PAGO',6000000,10,600000,'ENTREGADOS','ENTREGADOS',false,'',NOW());

-- =====================================================
-- FACTURAS
-- =====================================================

INSERT INTO factura VALUES
('FAC1002','MF1002','2026-04-02','2026-05-02',7000000,280000,140000,30,NOW()),
('FAC1003','MF1003','2026-04-03','2026-05-03',6000000,240000,120000,30,NOW());

-- =====================================================
-- BANCOS
-- =====================================================

INSERT INTO banco VALUES
('BAN1','Empresa Principal','860025900-2','Bancolombia','123456789','ahorros',NOW());

-- =====================================================
-- TIPOS DE TRANSACCION
-- =====================================================

INSERT INTO tipo_transaccion VALUES
('TT1','COMBUSTIBLE','Gasto combustible','GASTO CONDUCTOR','activo',NOW()),
('TT2','PEAJES','Gasto peajes','GASTO CONDUCTOR','activo',NOW()),
('TT3','ANTICIPO','Anticipo conductor','EGRESO MANIFIESTO','activo',NOW()),
('TT4','PAGO CLIENTE','Ingreso cliente','INGRESO MANIFIESTO','activo',NOW()),
('TT5','NOMINA','Pago nomina','EGRESO OPERACIONAL','activo',NOW());

-- =====================================================
-- TRANSACCIONES COHERENTES
-- =====================================================

INSERT INTO transaccion VALUES

-- MF1001 SIN FACTURA
('TRX1','BAN1','TT3','JGV196','T68945','MF1001',NULL,500000,'2026-04-01','Anticipo conductor MF1001',NOW()),

('TRX2','BAN1','TT1','JGV196','T68945','MF1001',NULL,300000,'2026-04-01','Combustible viaje',NOW()),

-- MF1002 / FAC1002 = PAGO PARCIAL
-- Factura 7.000.000
-- Retenciones 420.000
-- Neto 6.580.000
-- Pago parcial 3.000.000

('TRX3','BAN1','TT2','HGT678','T78452','MF1002',NULL,200000,'2026-04-02','Peajes viaje',NOW()),

('TRX4','BAN1','TT4','HGT678','T78452','MF1002','FAC1002',3000000,'2026-04-05','Pago parcial cliente MF1002',NOW()),

-- MF1003 / FAC1003 = PAGADA TOTAL
-- Neto = 5.640.000

('TRX5','BAN1','TT4','JGV196','T68945','MF1003','FAC1003',5640000,'2026-04-06','Pago total cliente MF1003',NOW()),

-- GASTO OPERACIONAL

('TRX6','BAN1','TT5',NULL,NULL,NULL,NULL,2000000,'2026-04-07','Pago nomina',NOW());

-- =====================================================
-- GASTOS CONDUCTOR
-- =====================================================

INSERT INTO gastos_conductor VALUES
('GC1','TRX2',109668745,'MF1001','Combustible conductor',NOW()),
('GC2','TRX3',79854489,'MF1002','Peajes conductor',NOW());


-- =====================================================
-- USUARIOS 
-- =====================================================

INSERT INTO usuario (
    id,
    nombre,
    correo,
    contrasena_hash,
    activo,
    debe_cambiar_contrasena,
    creado
) VALUES
('US1', 'ADMIN', 'admin@viasugas.com', '$2b$10$DNgjGZhmUKNzmHo6AeUQfeZXVK/3arkSrPL16Bg1lq5kecIsoqA3e', TRUE, FALSE, NOW());

-- =====================================================
-- PERMISOS
-- =====================================================

INSERT INTO permiso (id, codigo, nombre, descripcion) VALUES
('P1','manifiestos', 'Manifiestos', 'Acceso a manifiestos'),
('P2','vehiculos', 'Vehiculos', 'Acceso a vehiculos'),
('P3','trailer', 'Trailer', 'Acceso a trailer'),
('P4','propietarios', 'Propietarios', 'Acceso a propietarios'),
('P5','conductores', 'Conductores', 'Acceso a conductores'),
('P6','clientes', 'Clientes', 'Acceso a clientes'),
('P7','empresas-a-cargo', 'Terceros', 'Acceso a terceros'),

('P8','bancos', 'Bancos', 'Acceso a bancos'),
('P9','tipo-transaccion', 'Categoria gastos', 'Acceso a categorias de gasto'),
('P10','transacciones', 'Transacciones', 'Acceso a transacciones'),
('P11','gastos-conductor', 'Gastos conductor', 'Acceso a gastos de conductor'),
('P12','registro-conductor', 'Registro conductor', 'Acceso a registro de conductor'),
('P13','facturas', 'Facturas', 'Acceso a facturas'),

('P14','dashboard', 'Gerencial', 'Acceso a dashboard gerencial'),
('P15','dashboard-contable', 'Contable', 'Acceso a dashboard contable'),
('P16','dashboard-cartera', 'Cartera', 'Acceso a dashboard cartera'),
('P17','dashboard-proyecciones', 'Proyecciones', 'Acceso a dashboard proyecciones'),
('P18','dashboard-conductores', 'Conductores', 'Acceso a dashboard conductores'),

('P19','usuarios', 'Usuarios', 'Gestion de usuarios'),
('P20','auditoria', 'Auditoria', 'Acceso a auditoria'),
('P21','admin', 'Administrador', 'Acceso total'),
('P22','inicio', 'Inicio', 'Acceso a inicio');

-- =====================================================
-- USUARIO PERMISO
-- =====================================================


INSERT INTO usuario_permiso (id_usuario, id_permiso)
SELECT 'US1', id FROM permiso WHERE codigo IN (
'manifiestos',
'vehiculos',
'trailer',
'propietarios',
'conductores',
'clientes',
'empresas-a-cargo',
'bancos', 'Bancos',
'tipo-transaccion',
'transacciones',
'gastos-conductor',
'registro-conductor',
'facturas', 
'dashboard', 
'dashboard-contable',  
'dashboard-cartera',
'dashboard-proyecciones',
'usuarios', 
'auditoria',
'admin',
'inicio'
);
