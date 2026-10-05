const AppError = require('../errors/AppError');

const MAX_TOTAL = 9999999999.99; // límite de DECIMAL(12,2)

class Sale {
    constructor({ id_venta, fecha_venta, cantidad, total_venta, id_usuario, nombre_usuario, id_producto, nombre_producto }) {
        this.id_venta = id_venta;
        this.fecha_venta = fecha_venta;
        this.cantidad = cantidad;
        this.total_venta = total_venta;
        this.id_usuario = id_usuario;
        this.nombre_usuario = nombre_usuario;
        this.id_producto = id_producto;
        this.nombre_producto = nombre_producto;
    }

    // El total SIEMPRE se calcula en el backend con el precio real de MySQL.
    // Se opera en centavos enteros para evitar errores de punto flotante.
    static calculateTotal(precioUnitario, cantidad) {
        const total = (Math.round(precioUnitario * 100) * cantidad) / 100;
        if (total > MAX_TOTAL) {
            throw AppError.badRequest('El total de la venta excede el máximo permitido');
        }
        return total;
    }
}

module.exports = Sale;
