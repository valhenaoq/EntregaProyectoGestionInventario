-- Migración: agrega la tabla `ventas` a la base gestion_inventario.
-- No modifica ninguna tabla existente. Ejecutar UNA sola vez.

USE gestion_inventario;

CREATE TABLE IF NOT EXISTS ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha_venta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cantidad INT NOT NULL,
    total_venta DECIMAL(12,2) NOT NULL,
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    CONSTRAINT chk_ventas_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_ventas_total CHECK (total_venta >= 0),
    -- RESTRICT (no CASCADE): la base de datos también impide borrar usuarios o
    -- productos que tengan ventas, alineada con las reglas de negocio de la API.
    CONSTRAINT fk_ventas_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto) ON DELETE RESTRICT,
    INDEX idx_ventas_fecha (fecha_venta)
) ENGINE=InnoDB;
