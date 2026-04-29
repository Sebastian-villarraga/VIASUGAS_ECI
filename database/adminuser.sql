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
('P17','dashboard-proyecciones', 'Proyecciones', 'Acceso a proyecciones'),
('P18','usuarios', 'Usuarios', 'Gestion de usuarios'),
('P19','auditoria', 'Auditoria', 'Acceso a auditoria'),
('P20', 'admin', 'Administrador', 'Acceso total'),
('P21', 'inicio', 'Inicio', 'Acceso a inicio');

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