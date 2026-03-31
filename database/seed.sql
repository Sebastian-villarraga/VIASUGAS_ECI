-- =========================================
-- LIMPIEZA EN ORDEN CORRECTO
-- =========================================
DELETE FROM manifiesto;
DELETE FROM vehiculo;
DELETE FROM trailer;
DELETE FROM conductor;
DELETE FROM propietario;
DELETE FROM empresa_a_cargo;
DELETE FROM cliente;

-- =========================================
-- CLIENTES (5)
-- =========================================
INSERT INTO cliente (
  nit, nombre, correo, telefono, direccion, estado, creado, actualizado
) VALUES
('900100001', 'Alimentos del Valle SAS', 'operaciones@alimentosdelvalle.com', 3001000001, 'Cali, Valle del Cauca', 'activo', NOW(), NOW()),
('900100002', 'Distribuciones Bogota SAS', 'contacto@distbogota.com', 3001000002, 'Bogota D.C.', 'activo', NOW(), NOW()),
('900100003', 'Carga Express Colombia SAS', 'servicio@cargaexpress.com', 3001000003, 'Medellin, Antioquia', 'activo', NOW(), NOW()),
('900100004', 'Agroinsumos Nacionales SAS', 'logistica@agroinsumos.com', 3001000004, 'Bucaramanga, Santander', 'activo', NOW(), NOW()),
('900100005', 'Retail de la Costa SAS', 'trafico@retailcosta.com', 3001000005, 'Barranquilla, Atlantico', 'activo', NOW(), NOW());

-- =========================================
-- EMPRESAS A CARGO (5)
-- =========================================
INSERT INTO empresa_a_cargo (
  nit, nombre, correo, telefono, direccion, estado, creado, actualizado
) VALUES
('800200001', 'Transporte Seguro SAS', 'admin@transporteseguro.com', 3012000001, 'Medellin, Antioquia', 'activo', NOW(), NOW()),
('800200002', 'Logistica Nacional Integrada SAS', 'ops@logisticanacional.com', 3012000002, 'Bogota D.C.', 'activo', NOW(), NOW()),
('800200003', 'Carga Pesada del Occidente SAS', 'despachos@cargapesada.com', 3012000003, 'Cali, Valle del Cauca', 'activo', NOW(), NOW()),
('800200004', 'Transportes del Norte SAS', 'contacto@tnorte.com', 3012000004, 'Barranquilla, Atlantico', 'activo', NOW(), NOW()),
('800200005', 'Movilidad Integral de Colombia SAS', 'servicio@movilidadintegral.com', 3012000005, 'Cartagena, Bolivar', 'activo', NOW(), NOW());

-- =========================================
-- PROPIETARIOS (5)
-- =========================================
INSERT INTO propietario (
  identificacion, nombre, correo, telefono, creado, actualizado
) VALUES
('10001', 'Carlos Perez', 'carlos.perez@mail.com', 3100000001, NOW(), NOW()),
('10002', 'Luis Gomez', 'luis.gomez@mail.com', 3100000002, NOW(), NOW()),
('10003', 'Andres Ruiz', 'andres.ruiz@mail.com', 3100000003, NOW(), NOW()),
('10004', 'Jorge Ramirez', 'jorge.ramirez@mail.com', 3100000004, NOW(), NOW()),
('10005', 'Miguel Torres', 'miguel.torres@mail.com', 3100000005, NOW(), NOW());

-- =========================================
-- CONDUCTORES (5)
-- =========================================
INSERT INTO conductor (
  cedula, nombre, correo, telefono, estado,
  vencimiento_licencia, vencimiento_manip_alimentos, vencimiento_sustancia_peligrosa,
  creado, actualizado
) VALUES
(20001, 'Juan Rodriguez', 'juan.rodriguez@mail.com', 3200000001, 'activo', '2026-12-31', '2026-08-30', '2026-09-15', NOW(), NOW()),
(20002, 'Pedro Martinez', 'pedro.martinez@mail.com', 3200000002, 'activo', '2026-11-20', '2026-07-15', '2026-10-01', NOW(), NOW()),
(20003, 'Santiago Lopez', 'santiago.lopez@mail.com', 3200000003, 'activo', '2026-10-10', '2026-06-20', '2026-11-05', NOW(), NOW()),
(20004, 'Camilo Herrera', 'camilo.herrera@mail.com', 3200000004, 'activo', '2026-09-15', '2026-05-01', '2026-08-01', NOW(), NOW()),
(20005, 'David Castro', 'david.castro@mail.com', 3200000005, 'activo', '2026-12-05', '2026-09-10', '2026-12-20', NOW(), NOW());

-- =========================================
-- VEHICULOS (5)
-- =========================================
INSERT INTO vehiculo (
  placa, id_propietario, estado,
  vencimiento_soat, vencimiento_tecno, vencimiento_todo_riesgo,
  creado, actualizado
) VALUES
('AAA111', '10001', 'activo', '2026-08-01', '2026-07-01', '2026-12-01', NOW(), NOW()),
('BBB222', '10002', 'activo', '2026-09-15', '2026-06-30', '2027-01-10', NOW(), NOW()),
('CCC333', '10003', 'activo', '2026-10-20', '2026-08-05', '2027-02-01', NOW(), NOW()),
('DDD444', '10004', 'activo', '2026-07-25', '2026-07-10', '2026-11-30', NOW(), NOW()),
('EEE555', '10005', 'activo', '2026-11-01', '2026-09-01', '2027-03-15', NOW(), NOW());

-- =========================================
-- TRAILERS (5)
-- =========================================
INSERT INTO trailer (
  placa, id_propietario, estado, vencimiento_cert_fumigacion, creado, actualizado
) VALUES
('TRL111', '10001', 'activo', '2026-08-01', NOW(), NOW()),
('TRL222', '10002', 'activo', '2026-09-01', NOW(), NOW()),
('TRL333', '10003', 'activo', '2026-10-01', NOW(), NOW()),
('TRL444', '10004', 'activo', '2026-07-15', NOW(), NOW()),
('TRL555', '10005', 'activo', '2026-11-20', NOW(), NOW());

-- =========================================
-- MANIFIESTOS (15)
-- =========================================
INSERT INTO manifiesto (
  id_manifiesto, radicado, id_cliente, id_conductor, id_vehiculo, id_trailer, id_empresa_a_cargo,
  fecha,
  origen_departamento, origen_ciudad, destino_departamento, destino_ciudad,
  estado,
  valor_flete, valor_flete_porcentaje, anticipo_manifiesto,
  gastos, documentos,
  novedades, observaciones,
  creado
) VALUES
('M001', 10001, '900100001', 20001, 'AAA111', 'TRL111', '800200001', '2026-03-01', 'Cundinamarca', 'Bogota', 'Valle del Cauca', 'Cali', 'CREADO-EN TRANSITO', 2500000.00, 10.00, 500000.00, 'PENDIENTES', 'PENDIENTES', false, 'Transporte de alimentos.', NOW()),
('M002', 10002, '900100002', 20002, 'BBB222', 'TRL222', '800200002', '2026-03-02', 'Antioquia', 'Medellin', 'Cundinamarca', 'Bogota', 'CREADO-EN TRANSITO', 3100000.00, 12.00, 700000.00, 'PENDIENTES', 'PENDIENTES', false, 'Despacho de mercancia seca.', NOW()),
('M003', 10003, '900100003', 20003, 'CCC333', 'TRL333', '800200003', '2026-03-03', 'Valle del Cauca', 'Cali', 'Santander', 'Bucaramanga', 'CREADO-EN TRANSITO', 2800000.00, 11.00, 600000.00, 'PENDIENTES', 'PENDIENTES', false, 'Carga general.', NOW()),
('M004', 10004, '900100004', 20004, 'DDD444', 'TRL444', '800200004', '2026-03-04', 'Atlantico', 'Barranquilla', 'Bolivar', 'Cartagena', 'CREADO-EN TRANSITO', 1650000.00, 9.00, 300000.00, 'PENDIENTES', 'PENDIENTES', false, 'Insumos agricolas.', NOW()),
('M005', 10005, '900100005', 20005, 'EEE555', 'TRL555', '800200005', '2026-03-05', 'Cundinamarca', 'Bogota', 'Meta', 'Villavicencio', 'CREADO-EN TRANSITO', 1950000.00, 8.00, 400000.00, 'PENDIENTES', 'PENDIENTES', false, 'Productos de consumo masivo.', NOW()),

('M006', 10006, '900100001', 20002, 'AAA111', 'TRL111', '800200002', '2026-02-20', 'Cundinamarca', 'Bogota', 'Tolima', 'Ibague', 'ENTREGADO POR COBRAR', 2050000.00, 10.00, 450000.00, 'ENTREGADOS', 'PENDIENTES', true, 'Entrega con novedad menor.', NOW()),
('M007', 10007, '900100002', 20003, 'BBB222', 'TRL222', '800200003', '2026-02-18', 'Antioquia', 'Medellin', 'Caldas', 'Manizales', 'ENTREGADO POR COBRAR', 2250000.00, 10.00, 500000.00, 'ENTREGADOS', 'PENDIENTES', false, 'Entrega normal pendiente de cobro.', NOW()),
('M008', 10008, '900100003', 20004, 'CCC333', 'TRL333', '800200004', '2026-02-15', 'Valle del Cauca', 'Cali', 'Narino', 'Pasto', 'ENTREGADO POR COBRAR', 2750000.00, 12.00, 650000.00, 'ENTREGADOS', 'PENDIENTES', true, 'Retraso por cierre vial.', NOW()),
('M009', 10009, '900100004', 20005, 'DDD444', 'TRL444', '800200005', '2026-02-12', 'Atlantico', 'Barranquilla', 'Magdalena', 'Santa Marta', 'ENTREGADO POR COBRAR', 1700000.00, 9.00, 320000.00, 'ENTREGADOS', 'PENDIENTES', false, 'Servicio completado.', NOW()),
('M010', 10010, '900100005', 20001, 'EEE555', 'TRL555', '800200001', '2026-02-10', 'Cundinamarca', 'Bogota', 'Boyaca', 'Tunja', 'ENTREGADO POR COBRAR', 1980000.00, 8.00, 410000.00, 'ENTREGADOS', 'PENDIENTES', false, 'Pendiente soporte documental final.', NOW()),

('M011', 10011, '900100001', 20003, 'AAA111', 'TRL111', '800200003', '2026-01-20', 'Cundinamarca', 'Bogota', 'Santander', 'Bucaramanga', 'MANIFIESTO PAGO', 2150000.00, 10.00, 500000.00, 'ENTREGADOS', 'ENTREGADOS', false, 'Servicio cerrado y pago confirmado.', NOW()),
('M012', 10012, '900100002', 20004, 'BBB222', 'TRL222', '800200004', '2026-01-18', 'Antioquia', 'Medellin', 'Cundinamarca', 'Bogota', 'MANIFIESTO PAGO', 2350000.00, 11.00, 520000.00, 'ENTREGADOS', 'ENTREGADOS', false, 'Manifiesto finalizado.', NOW()),
('M013', 10013, '900100003', 20005, 'CCC333', 'TRL333', '800200005', '2026-01-15', 'Valle del Cauca', 'Cali', 'Huila', 'Neiva', 'MANIFIESTO PAGO', 2600000.00, 12.00, 600000.00, 'ENTREGADOS', 'ENTREGADOS', false, 'Cierre exitoso.', NOW()),
('M014', 10014, '900100004', 20001, 'DDD444', 'TRL444', '800200001', '2026-01-12', 'Atlantico', 'Barranquilla', 'Cesar', 'Valledupar', 'MANIFIESTO PAGO', 1750000.00, 9.00, 350000.00, 'ENTREGADOS', 'ENTREGADOS', false, 'Pago recibido y validado.', NOW()),
('M015', 10015, '900100005', 20002, 'EEE555', 'TRL555', '800200002', '2026-01-10', 'Cundinamarca', 'Bogota', 'Quindio', 'Armenia', 'MANIFIESTO PAGO', 2020000.00, 8.00, 420000.00, 'ENTREGADOS', 'ENTREGADOS', false, 'Documentacion completa.', NOW());