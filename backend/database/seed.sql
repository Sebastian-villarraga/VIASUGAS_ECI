-- =========================
-- CLIENTE
-- =========================
INSERT INTO cliente (nit, nombre, correo, telefono, direccion)
VALUES 
('123', 'Cliente Demo', 'cliente@test.com', 3001234567, 'Calle 1');

-- =========================
-- CONDUCTOR
-- =========================
INSERT INTO conductor (cedula, nombre, correo, telefono)
VALUES 
(123456789, 'Juan Perez', 'juan@test.com', 3009876543);

-- =========================
-- PROPIETARIO
-- =========================
INSERT INTO propietario (identificacion, nombre, correo, telefono)
VALUES 
('999', 'Carlos Gomez', 'carlos@test.com', 3001111111);

-- =========================
-- VEHICULO
-- =========================
INSERT INTO vehiculo (placa, id_propietario)
VALUES 
('ABC123', '999');

-- =========================
-- TRAILER
-- =========================
INSERT INTO trailer (placa, id_propietario)
VALUES 
('TRL123', '999');
