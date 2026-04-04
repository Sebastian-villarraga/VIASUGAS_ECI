-- =====================================================
-- LIMPIEZA
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
-- CLIENTES (5)
-- =====================================================

INSERT INTO cliente VALUES
('9001','Cliente A','a@mail.com',3001,'Bogota','activo',NOW(),NULL),
('9002','Cliente B','b@mail.com',3002,'Cali','activo',NOW(),NULL),
('9003','Cliente C','c@mail.com',3003,'Medellin','activo',NOW(),NULL),
('9004','Cliente D','d@mail.com',3004,'Barranquilla','activo',NOW(),NULL),
('9005','Cliente E','e@mail.com',3005,'Cartagena','activo',NOW(),NULL);



-- =====================================================
-- EMPRESAS (5)
-- =====================================================

INSERT INTO empresa_a_cargo VALUES
('8001','Empresa A','a@emp.com',301,'Bogota','activo',NOW(),NULL),
('8002','Empresa B','b@emp.com',302,'Cali','activo',NOW(),NULL),
('8003','Empresa C','c@emp.com',303,'Medellin','activo',NOW(),NULL),
('8004','Empresa D','d@emp.com',304,'Barranquilla','activo',NOW(),NULL),
('8005','Empresa E','e@emp.com',305,'Cartagena','activo',NOW(),NULL);



-- =====================================================
-- PROPIETARIOS (5)
-- =====================================================

INSERT INTO propietario VALUES
('111','Prop1','p1@mail.com',3001,NOW(),NULL),
('222','Prop2','p2@mail.com',3002,NOW(),NULL),
('333','Prop3','p3@mail.com',3003,NOW(),NULL),
('444','Prop4','p4@mail.com',3004,NOW(),NULL),
('555','Prop5','p5@mail.com',3005,NOW(),NULL);



-- =====================================================
-- CONDUCTORES (5)
-- =====================================================

INSERT INTO conductor VALUES
(1001,'Cond1','c1@mail.com',3001,'activo','2027-01-01','2026-12-01','2026-11-01',NOW(),NULL),
(1002,'Cond2','c2@mail.com',3002,'activo','2027-01-01','2026-12-01','2026-11-01',NOW(),NULL),
(1003,'Cond3','c3@mail.com',3003,'activo','2027-01-01','2026-12-01','2026-11-01',NOW(),NULL),
(1004,'Cond4','c4@mail.com',3004,'activo','2027-01-01','2026-12-01','2026-11-01',NOW(),NULL),
(1005,'Cond5','c5@mail.com',3005,'activo','2027-01-01','2026-12-01','2026-11-01',NOW(),NULL);



-- =====================================================
-- VEHICULOS (5)
-- =====================================================

INSERT INTO vehiculo VALUES
('V1','111','activo','2026-12-01','2026-10-01','2026-09-01',NOW(),NULL),
('V2','222','activo','2026-12-01','2026-10-01','2026-09-01',NOW(),NULL),
('V3','333','activo','2026-12-01','2026-10-01','2026-09-01',NOW(),NULL),
('V4','444','activo','2026-12-01','2026-10-01','2026-09-01',NOW(),NULL),
('V5','555','activo','2026-12-01','2026-10-01','2026-09-01',NOW(),NULL);



-- =====================================================
-- TRAILERS (5)
-- =====================================================

INSERT INTO trailer VALUES
('T1','111','activo','2026-08-01',NOW(),NULL),
('T2','222','activo','2026-08-01',NOW(),NULL),
('T3','333','activo','2026-08-01',NOW(),NULL),
('T4','444','activo','2026-08-01',NOW(),NULL),
('T5','555','activo','2026-08-01',NOW(),NULL);



-- =====================================================
-- MANIFIESTOS (5)
-- =====================================================

INSERT INTO manifiesto VALUES
('M1',1001,'9001',1001,'V1','T1','8001','2026-04-01','Magdalena','Cienaga','Cundinamarca','Cajica','CREADO-EN TRANSITO',5000000,10,500000,'PENDIENTES','PENDIENTES',false,'obs',NOW()),
('M2',1002,'9002',1002,'V2','T2','8002','2026-04-02','Valle','Cali','Antioquia','Medellin','CREADO-EN TRANSITO',6000000,10,600000,'PENDIENTES','PENDIENTES',false,'obs',NOW()),
('M3',1003,'9003',1003,'V3','T3','8003','2026-04-03','Antioquia','Medellin','Bogota','Bogota','CREADO-EN TRANSITO',7000000,10,700000,'PENDIENTES','PENDIENTES',false,'obs',NOW()),
('M4',1004,'9004',1004,'V4','T4','8004','2026-04-04','Atlantico','Barranquilla','Valle','Cali','CREADO-EN TRANSITO',8000000,10,800000,'PENDIENTES','PENDIENTES',false,'obs',NOW()),
('M5',1005,'9005',1005,'V5','T5','8005','2026-04-05','Bolivar','Cartagena','Bogota','Bogota','CREADO-EN TRANSITO',9000000,10,900000,'PENDIENTES','PENDIENTES',false,'obs',NOW());



-- =====================================================
-- BANCOS (5)
-- =====================================================

INSERT INTO banco VALUES
('B1','Tit1','111','BBVA','1111','ahorros',NOW()),
('B2','Tit2','222','Bancolombia','2222','corriente',NOW()),
('B3','Tit3','333','Davivienda','3333','ahorros',NOW()),
('B4','Tit4','444','CajaSocial','4444','corriente',NOW()),
('B5','Tit5','555','Popular','5555','ahorros',NOW());



-- =====================================================
-- TIPO TRANSACCION (ACTUALIZADO CON CATEGORIAS REALES)
-- =====================================================

INSERT INTO tipo_transaccion VALUES
('TT1','CARGUE','Cargue de mercancia','egreso','manifiesto','activo',NOW()),
('TT2','ANTICIPO RECIBIDO','Anticipo recibido','ingreso','manifiesto','activo',NOW()),
('TT3','TALLER','Gastos de taller','egreso','operacional','activo',NOW()),
('TT4','EXTRA','Gasto adicional','egreso','operacional','activo',NOW()),
('TT5','DESCARGUE','Descargue de mercancia','egreso','manifiesto','activo',NOW()),
('TT6','COMBUSTIBLE','Combustible','egreso','manifiesto','activo',NOW()),
('TT7','NOMINA','Pago nomina','egreso','operacional','activo',NOW()),
('TT8','CREDITOS','Creditos','egreso','operacional','activo',NOW()),
('TT9','SERVICIOS','Servicios','egreso','operacional','activo',NOW()),
('TT10','GRAVAMEN','Gravamen financiero','egreso','operacional','activo',NOW()),
('TT11','SEGURIDAD','Seguridad','egreso','operacional','activo',NOW()),
('TT12','SALDOS','Ajuste de saldos','egreso','operacional','activo',NOW()),
('TT13','PORCENTAJES','Porcentajes','egreso','operacional','activo',NOW()),
('TT14','ANTICIPO ENVIADO','Anticipo enviado','egreso','manifiesto','activo',NOW()),
('TT15','PAGO CESANTIAS','Pago cesantias','egreso','operacional','activo',NOW()),
('TT16','PRESTAMO','Prestamo','egreso','operacional','activo',NOW()),
('TT17','POLIZAS','Polizas','egreso','operacional','activo',NOW()),
('TT18','PEAJES','Peajes','egreso','manifiesto','activo',NOW()),
('TT19','COMISIONES','Comisiones','egreso','operacional','activo',NOW()),
('TT20','LIQUIDACIONES','Liquidaciones','egreso','operacional','activo',NOW());


-- =====================================================
-- FACTURAS (5)
-- =====================================================

INSERT INTO factura VALUES
('F1','M1','2026-04-01','2026-05-01',5000000,200000,100000,30,NOW()),
('F2','M2','2026-04-02','2026-05-02',6000000,200000,100000,30,NOW()),
('F3','M3','2026-04-03','2026-05-03',7000000,200000,100000,30,NOW()),
('F4','M4','2026-04-04','2026-05-04',8000000,200000,100000,30,NOW()),
('F5','M5','2026-04-05','2026-05-05',9000000,200000,100000,30,NOW());



-- =====================================================
-- TRANSACCIONES (5)
-- =====================================================

INSERT INTO transaccion VALUES
('TR1','B1','TT1','V1','T1','M1','F1',5000000,'2026-04-03','Ingreso',NOW()),
('TR2','B2','TT2','V2','T2','M2',NULL,200000,'2026-04-02','Peaje',NOW()),
('TR3','B3','TT3','V3','T3','M3',NULL,300000,'2026-04-03','Gasolina',NOW()),
('TR4','B4','TT4','V4','T4','M4',NULL,400000,'2026-04-04','Nomina',NOW()),
('TR5','B5','TT5','V5','T5','M5',NULL,500000,'2026-04-05','Mantenimiento',NOW());



-- =====================================================
-- GASTOS CONDUCTOR (5)
-- =====================================================

INSERT INTO gastos_conductor VALUES
('GC1','TR2',1001,'M1','Peaje',NOW()),
('GC2','TR3',1002,'M2','Gasolina',NOW()),
('GC3','TR4',1003,'M3','Nomina',NOW()),
('GC4','TR5',1004,'M4','Mantenimiento',NOW()),
('GC5','TR2',1005,'M5','Peaje',NOW());