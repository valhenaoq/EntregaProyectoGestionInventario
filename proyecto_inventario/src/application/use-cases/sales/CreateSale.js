const Sale = require('../../../domain/entities/Sale');
const AppError = require('../../../domain/errors/AppError');
const { requireBody, requireInteger } = require('../../validation/validators');

class CreateSale {
    constructor(saleRepository) {
        this.saleRepository = saleRepository;
    }

    // actor: usuario autenticado (req.user). Si el cliente envía `total_venta` se ignora.
    async execute(input, actor) {
        const body = requireBody(input);
        const cantidad = requireInteger(body.cantidad, 'cantidad', { min: 1 });
        const id_producto = requireInteger(body.id_producto, 'id_producto', { min: 1 });
        const id_usuario = body.id_usuario === undefined
            ? actor.id_usuario
            : requireInteger(body.id_usuario, 'id_usuario', { min: 1 });

        if (id_usuario !== actor.id_usuario && actor.rol !== 'admin') {
            throw AppError.forbidden('Solo un administrador puede registrar ventas a nombre de otro usuario');
        }

        const saleId = await this.saleRepository.transaction(async (tx) => {
            const seller = await tx.userExists(id_usuario);
            if (!seller) {
                throw AppError.notFound('Usuario no encontrado');
            }
            if (!seller.activo) {
                throw AppError.conflict('El usuario se encuentra inactivo');
            }

            // Bloqueo de la fila: nadie más puede modificar este stock hasta el COMMIT
            const product = await tx.lockProduct(id_producto);
            if (!product) {
                throw AppError.notFound('Producto no encontrado');
            }
            if (product.stock_actual < cantidad) {
                throw AppError.conflict('No hay inventario suficiente para esta venta');
            }

            const total_venta = Sale.calculateTotal(product.precio_venta, cantidad);
            const id = await tx.insertSale({ cantidad, total_venta, id_usuario, id_producto });

            await tx.changeStock(id_producto, -cantidad);
            await tx.insertMovement({
                id_producto,
                id_usuario: actor.id_usuario,
                tipo_movimiento: 'SALIDA',
                cantidad,
                notas: `Venta #${id}`
            });

            return id;
        });

        return this.saleRepository.findById(saleId);
    }
}

module.exports = CreateSale;
