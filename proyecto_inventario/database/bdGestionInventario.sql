-- Copia CORREGIDA de bdGestionInventario.sql (solo sintaxis: se quitaron SELECT sueltos sin ';',
-- el SELECT previo al CREATE y se completó el INSERT sin VALUES). Los datos no cambian.
-- Nota: los hashes '$2a$12$eImi...' de ejemplo están truncados (un bcrypt válido mide 60 caracteres):
-- esos usuarios no pueden iniciar sesión hasta ejecutar scripts/reset-password.js.

CREATE DATABASE IF NOT EXISTS gestion_inventario
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gestion_inventario;

-- 1. Tabla de Usuarios (para autenticación en la app móvil)
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado') DEFAULT 'empleado',
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Categorías
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 3. Tabla de Proveedores
CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- 4. Tabla de Productos
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE, -- Ideal para escáneres o cámara del móvil
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5, -- Alerta para reposición
    id_categoria INT,
    id_proveedor INT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
);

-- 5. Historial de Movimientos de Inventario (Entradas, Salidas, Ajustes)
CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL, -- Usuario del móvil que realizó la operación
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    cantidad INT NOT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

INSERT INTO usuarios (nombre,email,password_hash,rol)
VALUES ('María López', 'maria.lopez@empresa.com', 'maria.lopez1234', 'empleado');
INSERT INTO usuarios (nombre,email,password_hash,rol)
VALUES('Carlos Gómez', 'carlos.gomez@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANk', 'empleado'),
('Ana Martínez', 'ana.martinez@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANl', 'admin'),
('Juan Rodríguez', 'juan.rodriguez@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANm', 'empleado'),
('Laura Hernández', 'laura.hernandez@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANn', 'empleado'),
('Pedro Sánchez', 'pedro.sanchez@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANo', 'empleado'),
('Sofía Ramírez', 'sofia.ramirez@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANp', 'admin'),
('Javier Torres', 'javier.torres@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANq', 'empleado'),
('Valentina Díaz', 'valentina.diaz@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANr', 'empleado'),
('Alejandro Castro', 'alejandro.castro@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANs', 'empleado'),
('Camila Morales', 'camila.morales@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANt', 'empleado'),
('Mateo Vargas', 'mateo.vargas@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANu', 'empleado'),
('Isabella Ortiz', 'isabella.ortiz@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANv', 'admin'),
('Daniel Silva', 'daniel.silva@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANw', 'empleado'),
('Natalia Mendoza', 'natalia.mendoza@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANx', 'empleado'),
('Andrés Romero', 'andres.romero@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANy', 'empleado'),
('Gabriela Navarro', 'gabriela.navarro@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JANz', 'empleado'),
('Lucas Gutiérrez', 'lucas.gutierrez@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JA0a', 'empleado'),
('Elena Rojas', 'elena.rojas@empresa.com', '$2a$12$eImiTXuWVxfM37uY4JA0b', 'empleado');


INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónica y Tecnología', 'Smartphones, laptops, tablets, componentes y accesorios tecnológicos.'),
('Alimentos y Bebidas', 'Productos comestibles, enlatados, bebidas y insumos perecederos.'),
('Ropa y Moda', 'Vestimenta, calzado y accesorios para damas, caballeros y niños.'),
('Hogar y Muebles', 'Artículos de decoración, muebles para el hogar, cocina y jardín.'),
('Salud y Belleza', 'Productos de cuidado personal, cosméticos, dermocosmética y suplementos.'),
('Deportes y Recreación', 'Equipamiento deportivo, ropa de entrenamiento y artículos para camping.'),
('Ferretería y Herramientas', 'Herramientas manuales, eléctricas, plomería y pintura.'),
('Papelería y Oficina', 'Materiales escolares, papelería fina y suministros para oficina.'),
('Juguetes y Juegos', 'Juegos de mesa, juguetes infantiles y artículos coleccionables.'),
('Automotriz', 'Repuestos para vehículos, aceites, lubricantes y accesorios para autos.'),
('Mascotas', 'Alimentos, juguetes y artículos de cuidado e higiene para mascotas.'),
('Farmacia y Médicos', 'Medicamentos de venta libre, botiquines e insumos médicos básicos.');

INSERT INTO proveedores (nombre_empresa, contacto, telefono, email) VALUES
('TechData Distribuciones S.A.', 'Carlos Mendoza', '+57 300 123 4567', 'carlos.mendoza@techdata.com'),
('Comercializadora Los Andes Ltda.', 'Ana María Gómez', '+57 311 987 6543', 'ventas@losandes.co'),
('Distribuidora Global Textil', 'Roberto Silva', '+52 55 4123 8900', 'rsilva@globaltextil.com'),
('Insumos & Herramientas del Norte', 'Laura Fernández', '+54 11 4567 8901', 'info@inhenorte.com'),
('Importadora Alimentos del Pacífico', 'Jorge Ramírez', '+56 9 8765 4321', 'pedidos@alimentospacifico.cl'),
('Suministros de Oficina Alfa S.A.S.', 'Patricia Torres', '+57 315 555 0192', 'ventas@alfaoficina.com'),
('Fármacos & Salud Internacional', 'Diego Morales', '+51 1 234 5678', 'contacto@farmacosalud.pe'),
('AutoRepuestos Express', 'Gabriel Ortiz', '+57 310 444 3322', 'g.ortiz@repuestosexpress.com'),
('Corporación Plásticos y Empaques', 'Sofía Castro', '+52 81 8300 1122', 'scastro@plasticosempaques.mx'),
('Moda y Estilo Mayorista', 'Mariana Vargas', '+57 301 777 8899', 'contacto@modamayorista.com'),
('Deportes Extremos S.A.', 'Esteban Ríos', '+57 318 999 1122', 'ventas@deportesextremos.co'),
('Mascotas & Nutrición Animal', 'Valeria Delgado', '+57 312 333 4455', 'vdelgado@nutricionanimal.com');


INSERT INTO productos 
(codigo_barras, nombre, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo, id_categoria, id_proveedor) 
VALUES
('7701234567012', 'Smartphone Galaxy A14', 'Pantalla 6.6 pulgadas, 64GB almacenamiento, 4GB RAM.', 120.00, 180.00, 15, 5, 1, 1),
('7701234567029', 'Laptop HP 15-DW', 'Procesador Intel Core i5, 8GB RAM, 256GB SSD.', 450.00, 620.00, 8, 3, 1, 1),
('7701234567036', 'Aceite de Oliva Extra Virgen 500ml', 'Aceite de oliva prensado en frío, origen importado.', 4.50, 7.90, 45, 10, 2, 5),
('7701234567043', 'Camiseta Algodón Hombre Talla L', 'Camiseta de algodón 100% cuello redondo color negro.', 5.00, 12.50, 30, 8, 3, 3),
('7701234567050', 'Juego de Sábanas Queen Size', 'Juego de sábanas microfibra 200 hilos color gris.', 18.00, 35.00, 12, 4, 4, 10),
('7701234567067', 'Crema Hidratante Facial 100ml', 'Crema facial con ácido hialurónico para todo tipo de piel.', 8.00, 16.00, 25, 5, 5, 7),
('7701234567074', 'Balón de Fútbol #5 Profesional', 'Balón cosido a mano para grama sintética y natural.', 12.00, 24.90, 20, 5, 6, 11),
('7701234567081', 'Taladro Inalámbrico 20V', 'Taladro percutor con 2 baterías de litio y maletín.', 45.00, 85.00, 3, 5, 7, 4),
('7701234567098', 'Resma de Papel Carta 75g', 'Paquete de 500 hojas blancas para impresión.', 3.20, 5.50, 100, 20, 8, 6),
('7701234567104', 'Batería de Auto 12V 60Ah', 'Batería libre de mantenimiento para vehículos medianos.', 60.00, 98.00, 6, 2, 10, 8),
('7701234567111', 'Alimento Cachorro Raza Mediana 3kg', 'Croquetas enriquecidas con vitaminas y calcio.', 11.00, 18.50, 18, 5, 11, 12),
('7701234567128', 'Paracetamol 500mg (Caja x 20)', 'Analgésico y antipirético en comprimidos.', 1.20, 3.00, 4, 10, 12, 7);


INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo_movimiento, cantidad, notas) VALUES
(1, 1, 'ENTRADA', 15, 'Carga inicial de stock al recibir lote de fábrica por Admin.'),
(2, 3, 'ENTRADA', 10, 'Recepción de pedido por orden de compra #104.'),
(2, 4, 'SALIDA', 2, 'Venta realizada desde la app móvil por Carlos.'),
(8, 5, 'SALIDA', 2, 'Venta en mostrador registrada por Ana.'),
(3, 6, 'ENTRADA', 50, 'Ingreso de mercancía por proveedor Alimentos del Pacífico.'),
(3, 4, 'SALIDA', 5, 'Despacho de pedido a cliente corporativo.'),
(9, 2, 'ENTRADA', 100, 'Compra masiva de papelería para reabastecimiento.'),
(12, 7, 'SALIDA', 6, 'Venta directa en mostrador por Juan.'),
(7, 5, 'ENTRADA', 20, 'Recepción de cajas en almacén central.'),
(8, 1, 'AJUSTE', -1, 'Ajuste por unidad defectuosa en exhibición.'),
(5, 8, 'ENTRADA', 12, 'Ingreso de mercancía según factura F-502.'),
(10, 6, 'SALIDA', 4, 'Despacho para instalación en taller.');