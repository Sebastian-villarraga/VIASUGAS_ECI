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
-- TRANSACCIONES (FLUJO REAL)
-- =====================================================

INSERT INTO transaccion VALUES

-- ANTICIPO SIN FACTURA
('TRX1','BAN1','TT3','JGV196','T68945','MF1001',NULL,500000,'2026-04-01','Anticipo conductor MF1001',NOW()),

-- GASTOS VIAJE
('TRX2','BAN1','TT1','JGV196','T68945','MF1001',NULL,300000,'2026-04-01','Combustible viaje',NOW()),
('TRX3','BAN1','TT2','HGT678','T78452','MF1002',NULL,200000,'2026-04-02','Peajes viaje',NOW()),

-- INGRESO CON FACTURA
('TRX4','BAN1','TT4','HGT678','T78452','MF1002','FAC1002',6580000,'2026-04-05','Pago cliente MF1002',NOW()),

-- INGRESO MANIFIESTO PAGADO
('TRX5','BAN1','TT4','JGV196','T68945','MF1003','FAC1003',5640000,'2026-04-06','Pago cliente MF1003',NOW()),

-- GASTO OPERACIONAL
('TRX6','BAN1','TT5',NULL,NULL,NULL,NULL,2000000,'2026-04-07','Pago nomina',NOW());

-- =====================================================
-- GASTOS CONDUCTOR
-- =====================================================

INSERT INTO gastos_conductor VALUES
('GC1','TRX2',109668745,'MF1001','Combustible conductor',NOW()),
('GC2','TRX3',79854489,'MF1002','Peajes conductor',NOW());