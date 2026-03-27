-- propietario
INSERT INTO propietario VALUES
('1070017389', 'Carlos Trujillo', 'carlostg@gmail.com', 3207896524, NOW(), NOW());

-- usuario
INSERT INTO usuario VALUES 
('U1', 'Admin', 'admin@viasugas.com', 'hash123', true, NOW(), NOW());

-- permiso
INSERT INTO permiso VALUES
('P1', 'ADMIN', 'Administrador', 'Acceso total');

INSERT INTO usuario_permiso VALUES
('U1', 'P1');

-- cliente
INSERT INTO cliente VALUES
('12423534-1', 'Alpina', 'cliente@mail.com', 6018765346, 'Bogota', 'activo', NOW(), NOW());

-- empresa
INSERT INTO empresa_a_cargo VALUES
('45672349876-1', 'Transportes', 'empresa@mail.com', 3159986745, 'Bogota', 'activo', NOW(), NOW());

-- conductor
INSERT INTO conductor VALUES
(1070017347, 'Juan Ramirez', 'jjrojas@gmail.com', 3158827890, 'activo',
 '2026-09-10','2026-09-10','2026-09-10', NOW(), NOW());

-- vehiculo
INSERT INTO vehiculo VALUES
('JGV196','1070017389','activo','2026-09-10','2026-09-10','2026-09-10',NOW(),NOW());

-- trailer
INSERT INTO trailer VALUES
('TY9834','1070017389','activo','2026-09-10',NOW(),NOW());

-- manifiesto
INSERT INTO manifiesto VALUES
(
 'VG-123-4567',
 654987321,
 '12423534-1',
 1070017347,
 'JGV196',
 'TY9834',
 '45672349876-1',
 '2026-03-13',
 'Cundinamarca','Cajica',
 'Valle del Cauca','Cali',
 'en_curso',
 5000000,4800000,2000000,
 'pendiente','pendiente',
 true,'OK',
 NOW()
);

-- factura
INSERT INTO factura VALUES
(
 'FV-2-510','VG-123-4567',
 '2026-02-01','2026-03-01',
 10000000,500000,290000,30,NOW()
);

-- banco
INSERT INTO banco VALUES
('B1','Juan Ramirez','12365489','BBVA','24876435673','ahorros',NOW());

-- tipo transaccion
INSERT INTO tipo_transaccion VALUES
('TX1','combustible','gasolina','egreso','activo',NOW());

-- transaccion
INSERT INTO transaccion VALUES
(
 'T1','B1','TX1','JGV196',NULL,'VG-123-4567',NULL,
 4800000,'2026-02-20','pago',NOW()
);

-- gastos
INSERT INTO gastos_conductor VALUES
('GC1','T1',1070017347,'VG-123-4567','peaje',NOW());