const Sale = require('../../../domain/entities/Sale');
const AppError = require('../../../domain/errors/AppError');
const { requireBody, parseId, requireInteger } = require('../../validation/validators');

class UpdateSale {
    constructor(saleRepository) {
        this.saleRepository = saleRepository;
    }

    // Campos editables: cantidad, id_producto, id_usuario (este último solo administrador).
    // `total_venta` enviado por el cliente se ignora: siempre se recalcula.
    async execute(id, input, actor) {
        const saleId = parseId(id, 'id de venta');
        const body = requireBody(input);

        const changes = {};
        if (body.cantidad !== undefined) {
            changes.cantidad = requireInteger(body.cantidad, 'cantidad', { min: 1 });
        }
        if (body.id_producto !== undefined) {
            changes.id_producto = requireInteger(body.id_producto, 'id_producto', { min: 1 });
        }
        if (body.id_usuario !== undefined) {
            changes.id_usuario = requireInteger(body.id_usuario, 'id_usuario', { min: 1 });
        }
        if (Object.keys(changes).length === 0) {
            throw AppError.badRequest('No se enviaron campos para actualizar');
        }

        await this.saleRepository.transaction(async (tx) => {
            const sale = await tx.lockSale(saleId);
            if (!sale) {
                throw AppError.notFound('Venta no encontrada');
            }
            if (actor.rol !== 'admin' && sale.id_usuario !== actor.id_usuario) {
                throw AppError.forbidden('Solo puedes modificar tus propias ventas');
            }

            const nuevaCantidad = changes.cantidad ?? sale.cantidad;
            const nuevoProducto = changes.id_producto ?? sale.id_producto;
            const nuevoUsuario = changes.id_usuario ?? sale.id_usuario;

            if (nuevoUsuario !== sale.id_usuario) {
                if (actor.rol !== 'admin') {
                    throw AppError.forbidden('Solo un administrador puede cambiar el usuario de una venta');
                }
                if (!(await tx.userExists(nuevoUsuario))) {
                    throw AppError.notFound('Usuario no encontrado');
                }
            }

            // Se bloquean los productos involucrados siempre en orden ascendente de ID
            // para evitar interbloqueos (deadlocks) entre transacciones concurrentes.
            const ids = [...new Set([sale.id_producto, nuevoProducto])].sort((a, b) => a - b);
            const products = new Map();
            for (const productId of ids) {
                const product = await tx.lockProduct(productId);
                if (!product) {
                    throw AppError.notFound('Producto no encontrado');
                }
                products.set(productId, product);
            }

            const movement = (id_producto, tipo_movimiento, cantidad, detalle) => tx.insertMovement({
                id_producto,
                id_usuario: actor.id_usuario,
                tipo_movimiento,
                cantidad,
                notas: `Venta #${saleId} modificada: ${detalle}`
            });

            let total_venta;

            if (nuevoProducto === sale.id_producto) {
                const product = products.get(nuevoProducto);
                const delta = nuevaCantidad - sale.cantidad;

                if (delta > 0) {
                    // Aumenta la cantidad: se descuentan solo las unidades adicionales
                    if (product.stock_actual < delta) {
                        throw AppError.conflict('No hay inventario suficiente para esta venta');
                    }
                    await tx.changeStock(nuevoProducto, -delta);
                    await movement(nuevoProducto, 'SALIDA', delta, 'unidades adicionales vendidas');
                } else if (delta < 0) {
                    // Disminuye la cantidad: se devuelven las unidades sobrantes
                    await tx.changeStock(nuevoProducto, -delta);
                    await movement(nuevoProducto, 'ENTRADA', -delta, 'unidades devueltas al inventario');
                }

                total_venta = delta === 0
                    ? sale.total_venta
                    : Sale.calculateTotal(product.precio_venta, nuevaCantidad);
            } else {
                // Cambia el producto: se restaura el anterior y se descuenta el nuevo
                const nuevo = products.get(nuevoProducto);

                await tx.changeStock(sale.id_producto, sale.cantidad);
                await movement(sale.id_producto, 'ENTRADA', sale.cantidad, 'cambio de producto, unidades restauradas');

                if (nuevo.stock_actual < nuevaCantidad) {
                    throw AppError.conflict('No hay inventario suficiente para esta venta');
                }
                await tx.changeStock(nuevoProducto, -nuevaCantidad);
                await movement(nuevoProducto, 'SALIDA', nuevaCantidad, 'cambio de producto, unidades vendidas');

                total_venta = Sale.calculateTotal(nuevo.precio_venta, nuevaCantidad);
            }

            await tx.updateSale(saleId, {
                cantidad: nuevaCantidad,
                total_venta,
                id_usuario: nuevoUsuario,
                id_producto: nuevoProducto
            });
        });

        return this.saleRepository.findById(saleId);
    }
}

module.exports = UpdateSale;
