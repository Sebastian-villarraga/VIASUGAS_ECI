-- =====================================================
-- CLEAN
-- =====================================================

DELETE FROM audit_logs;
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
-- CLIENTES (EMPRESAS REALES)
-- =====================================================

INSERT INTO cliente VALUES
('800100001','Alpina SA','contacto@alpina.com',573001111111,'Bogota','activo',NOW(),NULL),
('800100002','Coca Cola FEMSA','contacto@coca-cola.com',573002222222,'Bogota','activo',NOW(),NULL),
('800100003','Grupo Nutresa','contacto@nutresa.com',573003333333,'Medellin','activo',NOW(),NULL),
('800100004','Postobon SA','contacto@postobon.com',573004444444,'Medellin','activo',NOW(),NULL),
('800100005','Bavaria SA','contacto@bavaria.com',573005555555,'Bogota','activo',NOW(),NULL),
('800100006','Colanta LTDA','contacto@colanta.com',573006666666,'Antioquia','activo',NOW(),NULL),
('800100007','D1 SAS','contacto@d1.com',573007777777,'Bogota','activo',NOW(),NULL);

-- =====================================================
-- EMPRESAS A CARGO
-- =====================================================

INSERT INTO empresa_a_cargo VALUES
('900200001','Transportes Atlas','atlas@mail.com',573101111111,'Bogota','activo',NOW(),NULL),
('900200002','Logistica Express','express@mail.com',573102222222,'Cali','activo',NOW(),NULL),
('900200003','Carga Nacional','carga@mail.com',573103333333,'Medellin','activo',NOW(),NULL),
('900200004','Transporte Global','global@mail.com',573104444444,'Barranquilla','activo',NOW(),NULL),
('900200005','Distribuciones SAS','dist@mail.com',573105555555,'Cartagena','activo',NOW(),NULL),
('900200006','Carga Segura','segura@mail.com',573106666666,'Cucuta','activo',NOW(),NULL),
('900200007','MovilCarga','movil@mail.com',573107777777,'Pereira','activo',NOW(),NULL);

-- =====================================================
-- PROPIETARIOS (PERSONAS Y EMPRESAS)
-- =====================================================

INSERT INTO propietario VALUES
('10123456789','Juan Perez','juan@mail.com',573201111111,NOW(),NULL),
('10234567890','Carlos Gomez','carlos@mail.com',573202222222,NOW(),NULL),
('10345678901','Luis Martinez','luis@mail.com',573203333333,NOW(),NULL),
('10456789012','Pedro Ramirez','pedro@mail.com',573204444444,NOW(),NULL),
('10567890123','Andres Lopez','andres@mail.com',573205555555,NOW(),NULL),
('67926539-9','Transportes SAS','emp@mail.com',573206666666,NOW(),NULL),
('80034567-1','Logistica Colombia','log@mail.com',573207777777,NOW(),NULL);

-- =====================================================
-- CONDUCTORES
-- =====================================================
INSERT INTO conductor VALUES

-- ================= VENCIDOS (5) =================
(10000000001,'Juan Rodriguez','c1@mail.com',573301111111,'activo','2025-01-01','2026-12-01','2026-11-01',NOW(),NULL), -- licencia vencida
(10000000002,'Carlos Diaz','c2@mail.com',573302222222,'activo','2027-01-01','2025-02-01','2026-11-01',NOW(),NULL), -- manipulacion vencida
(10000000003,'Luis Torres','c3@mail.com',573303333333,'activo','2027-01-01','2026-12-01','2025-03-01',NOW(),NULL), -- sustancias vencida
(10000000004,'Pedro Vargas','c4@mail.com',573304444444,'activo','2025-06-01','2025-06-15','2026-11-01',NOW(),NULL), -- doble vencido
(10000000005,'Andres Ruiz','c5@mail.com',573305555555,'activo','2025-08-01','2026-12-01','2025-09-01',NOW(),NULL), -- doble vencido

-- ================= PROXIMOS A VENCER (3) =================
(10000000006,'Diego Castro','c6@mail.com',573306666666,'activo',CURRENT_DATE + INTERVAL '10 days','2026-12-01','2026-11-01',NOW(),NULL),
(10000000007,'Santiago Herrera','c7@mail.com',573307777777,'activo','2027-01-01',CURRENT_DATE + INTERVAL '15 days','2026-11-01',NOW(),NULL),
(10000000008,'Miguel Suarez','c8@mail.com',573308888888,'activo','2027-01-01','2026-12-01',CURRENT_DATE + INTERVAL '5 days',NOW(),NULL),

-- ================= VIGENTES (2) =================
(10000000009,'Daniel Moreno','c9@mail.com',573309999999,'activo','2027-05-01','2027-06-01','2027-07-01',NOW(),NULL),
(10000000010,'Jorge Castillo','c10@mail.com',573301010101,'activo','2027-08-01','2027-09-01','2027-10-01',NOW(),NULL);

-- =====================================================
-- VEHICULOS (FORMATO REAL)
-- =====================================================

INSERT INTO vehiculo VALUES

-- ================= VENCIDOS (7) =================
('ABC123','10123456789','activo','2024-12-01','2026-01-01','2026-02-01',NOW(),NULL),
('DEF456','10234567890','activo','2025-01-10','2026-02-10','2026-03-10',NOW(),NULL),
('GHI789','10345678901','activo','2025-03-01','2026-04-01','2026-05-01',NOW(),NULL),
('JKL321','10456789012','activo','2026-06-01','2026-06-15','2026-07-01',NOW(),NULL),
('MNO654','10567890123','activo','2026-08-01','2026-08-10','2025-09-01',NOW(),NULL),
('PQR987','67926539-9','activo','2026-09-15','2026-10-01','2026-10-20',NOW(),NULL),
('STU852','80034567-1','activo','2026-11-01','2026-11-10','2026-12-01',NOW(),NULL),

-- ================= PROXIMOS A VENCER (3) =================
('VWX963','10123456789','activo',CURRENT_DATE + INTERVAL '10 days','2026-12-01','2026-12-01',NOW(),NULL),
('YZA741','10234567890','activo','2026-12-01',CURRENT_DATE + INTERVAL '20 days','2026-12-01',NOW(),NULL),
('BCD852','10345678901','activo','2026-12-01','2026-12-01',CURRENT_DATE + INTERVAL '5 days',NOW(),NULL);

-- =====================================================
-- TRAILERS
-- =====================================================
INSERT INTO trailer VALUES

-- ================= VENCIDOS (2) =================
('T1001','10123456789','activo','2025-12-01',NOW(),NULL),
('T1002','10234567890','activo','2025-11-15',NOW(),NULL),

-- ================= PROXIMOS A VENCER (2) =================
('T1003','10345678901','activo',CURRENT_DATE + INTERVAL '10 days',NOW(),NULL),
('T1004','10456789012','activo',CURRENT_DATE + INTERVAL '18 days',NOW(),NULL),

-- ================= VIGENTES (3) =================
('T1005','10567890123','activo','2026-08-01',NOW(),NULL),
('T1006','67926539-9','activo','2026-09-01',NOW(),NULL),
('T1007','80034567-1','activo','2026-10-01',NOW(),NULL);

-- =====================================================
-- MANIFIESTOS (15)
-- =====================================================
INSERT INTO manifiesto VALUES

-- ================= ENERO =================
('MF-1011',12345688,'800100001',10000000001,'ABC123','T1001','900200001','2026-01-03','Bogota','Bogota','Cali','Cali','CREADO-EN TRANSITO',5200000,10,520000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1012',12345689,'800100002',10000000002,'DEF456','T1002','900200002','2026-01-08','Cali','Cali','Medellin','Medellin','CREADO-EN TRANSITO',6100000,10,610000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1013',12345690,'800100003',10000000003,'GHI789','T1003','900200003','2026-01-15','Medellin','Medellin','Bogota','Bogota','ENTREGADO POR COBRAR',7200000,10,720000,'ENTREGADOS','ENTREGADOS',false,'',NOW()),

-- ================= FEBRERO =================
('MF-1014',12345691,'800100004',10000000004,'JKL321','T1004','900200004','2026-02-02','Barranquilla','Barranquilla','Cali','Cali','CREADO-EN TRANSITO',8300000,10,830000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1015',12345692,'800100005',10000000005,'MNO654','T1005','900200005','2026-02-06','Cartagena','Cartagena','Bogota','Bogota','MANIFIESTO PAGO',9100000,10,910000,'ENTREGADOS','ENTREGADOS',false,'',NOW()),
('MF-1016',12345693,'800100006',10000000006,'PQR987','T1006','900200006','2026-02-10','Cucuta','Cucuta','Bogota','Bogota','CREADO-EN TRANSITO',4200000,10,420000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1017',12345694,'800100007',10000000007,'STU852','T1007','900200007','2026-02-18','Pereira','Pereira','Cali','Cali','ENTREGADO POR COBRAR',3100000,10,310000,'ENTREGADOS','ENTREGADOS',false,'',NOW()),

-- ================= MARZO =================
('MF-1018',12345695,'800100001',10000000001,'ABC123','T1001','900200001','2026-03-03','Bogota','Bogota','Medellin','Medellin','CREADO-EN TRANSITO',5400000,10,540000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1019',12345696,'800100002',10000000002,'DEF456','T1002','900200002','2026-03-07','Cali','Cali','Bogota','Bogota','MANIFIESTO PAGO',6600000,10,660000,'ENTREGADOS','ENTREGADOS',false,'',NOW()),
('MF-1020',12345697,'800100003',10000000003,'GHI789','T1003','900200003','2026-03-12','Medellin','Medellin','Cali','Cali','CREADO-EN TRANSITO',7700000,10,770000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1021',12345698,'800100004',10000000004,'JKL321','T1004','900200004','2026-03-18','Barranquilla','Barranquilla','Bogota','Bogota','ENTREGADO POR COBRAR',8500000,10,850000,'ENTREGADOS','ENTREGADOS',false,'',NOW()),

-- ================= ABRIL =================
('MF-1022',12345699,'800100005',10000000005,'MNO654','T1005','900200005','2026-04-05','Cartagena','Cartagena','Cali','Cali','CREADO-EN TRANSITO',9200000,10,920000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1023',12345700,'800100006',10000000006,'PQR987','T1006','900200006','2026-04-02','Cucuta','Cucuta','Bogota','Bogota','CREADO-EN TRANSITO',4300000,10,430000,'PENDIENTES','PENDIENTES',false,'',NOW()),
('MF-1024',12345701,'800100007',10000000007,'STU852','T1007','900200007','2026-04-01','Pereira','Pereira','Medellin','Medellin','MANIFIESTO PAGO',3200000,10,320000,'ENTREGADOS','ENTREGADOS',false,'',NOW()),
('MF-1025',12345702,'800100001',10000000001,'ABC123','T1001','900200001','2026-04-04','Bogota','Bogota','Cali','Cali','ENTREGADO POR COBRAR',5600000,10,560000,'ENTREGADOS','ENTREGADOS',false,'',NOW());


-- =====================================================
-- BANCOS
-- =====================================================

INSERT INTO banco VALUES
('B1','Alpina SA','800100001','Bancolombia','000111222','ahorros',NOW()),
('B2','Coca Cola FEMSA','800100002','Davivienda','000222333','corriente',NOW()),
('B3','Grupo Nutresa','800100003','BBVA','000333444','ahorros',NOW()),
('B4','Postobon SA','800100004','Banco de Bogota','000444555','corriente',NOW()),
('B5','Bavaria SA','800100005','Banco Popular','000555666','ahorros',NOW()),
('B6','Colanta LTDA','800100006','Caja Social','000666777','corriente',NOW()),
('B7','D1 SAS','800100007','Banco Agrario','000777888','ahorros',NOW());

-- =====================================================
-- TIPO TRANSACCION
-- =====================================================

INSERT INTO tipo_transaccion VALUES
('TT1','INGRESO MANIFIESTO','Ingreso por transporte','ingreso','manifiesto','activo',NOW()),
('TT2','EGRESO MANIFIESTO','Costo operativo viaje','egreso','manifiesto','activo',NOW()),
('TT3','EGRESO OPERACIONAL','Gasto administrativo','egreso','operacional','activo',NOW()),
('TT4','COMBUSTIBLE','Combustible viaje','egreso','manifiesto','activo',NOW()),
('TT5','PEAJES','Peajes','egreso','manifiesto','activo',NOW()),
('TT6','NOMINA','Pago nomina','egreso','operacional','activo',NOW()),
('TT7','MANTENIMIENTO','Mantenimiento vehiculo','egreso','operacional','activo',NOW());

-- =====================================================
-- FACTURAS (RELACIONADAS A MANIFIESTOS)
-- =====================================================

INSERT INTO factura VALUES
('F101','MF-1011','2026-01-03','2026-02-03',5200000,200000,100000,30,NOW()),
('F102','MF-1012','2026-01-08','2026-02-08',6100000,200000,100000,30,NOW()),
('F103','MF-1013','2026-01-15','2026-02-15',7200000,250000,120000,30,NOW()),
('F104','MF-1014','2026-02-02','2026-03-02',8300000,250000,120000,30,NOW()),
('F105','MF-1015','2026-02-06','2026-03-06',9100000,300000,150000,30,NOW()),
('F106','MF-1016','2026-02-10','2026-03-10',4200000,150000,80000,30,NOW()),
('F107','MF-1017','2026-02-18','2026-03-18',3100000,120000,60000,30,NOW()),
('F108','MF-1018','2026-03-03','2026-04-03',5400000,200000,100000,30,NOW()),
('F109','MF-1019','2026-03-07','2026-04-07',6600000,200000,100000,30,NOW()),
('F110','MF-1020','2026-03-12','2026-04-12',7700000,250000,120000,30,NOW());

-- =====================================================
-- TRANSACCIONES (FLUJO REAL)
-- =====================================================

INSERT INTO transaccion VALUES

-- INGRESOS (con factura)
('TR101','B1','TT1','ABC123','T1001','MF-1011','F101',5200000,'2026-01-05','Ingreso viaje MF-1011',NOW()),
('TR102','B2','TT1','DEF456','T1002','MF-1012','F102',6100000,'2026-01-10','Ingreso viaje MF-1012',NOW()),
('TR103','B3','TT1','GHI789','T1003','MF-1013','F103',7200000,'2026-01-20','Ingreso viaje MF-1013',NOW()),
('TR104','B4','TT1','JKL321','T1004','MF-1014','F104',8300000,'2026-02-05','Ingreso viaje MF-1014',NOW()),
('TR105','B5','TT1','MNO654','T1005','MF-1015','F105',9100000,'2026-02-10','Ingreso viaje MF-1015',NOW()),

-- EGRESOS MANIFIESTO
('TR106','B1','TT4','ABC123','T1001','MF-1011',NULL,300000,'2026-01-04','Combustible',NOW()),
('TR107','B2','TT5','DEF456','T1002','MF-1012',NULL,200000,'2026-01-09','Peajes',NOW()),
('TR108','B3','TT4','GHI789','T1003','MF-1013',NULL,350000,'2026-01-18','Combustible',NOW()),
('TR109','B4','TT5','JKL321','T1004','MF-1014',NULL,250000,'2026-02-04','Peajes',NOW()),
('TR110','B5','TT4','MNO654','T1005','MF-1015',NULL,400000,'2026-02-08','Combustible',NOW()),

-- EGRESOS OPERACIONALES
('TR111','B6','TT3',NULL,NULL,NULL,NULL,800000,'2026-02-15','Gasto administrativo',NOW()),
('TR112','B7','TT6',NULL,NULL,NULL,NULL,1200000,'2026-03-01','Nomina',NOW()),
('TR113','B1','TT7',NULL,NULL,NULL,NULL,500000,'2026-03-10','Mantenimiento',NOW());

-- =====================================================
-- GASTOS CONDUCTOR
-- =====================================================

INSERT INTO gastos_conductor VALUES
('GC101','TR107',10000000001,'MF-1011','Peaje conductor',NOW()),
('GC102','TR108',10000000002,'MF-1012','Combustible conductor',NOW()),
('GC103','TR109',10000000003,'MF-1013','Peaje conductor',NOW()),
('GC104','TR110',10000000004,'MF-1014','Combustible conductor',NOW());