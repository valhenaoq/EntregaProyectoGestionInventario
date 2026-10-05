const AppError = require('../../../domain/errors/AppError');
const { parseId } = require('../../validation/validators');

class DeleteSale {
    constructor(saleRepository) {
        this.saleRepository = saleRepository;
    }

    async execute(id, actor) {
        const saleId = parseId(id, 'id de venta');

        await this.saleRepository.transaction(async (tx) => {
            const sale = await tx.lockSale(saleId);
            if (!sale) {
                throw AppError.notFound('Venta no encontrada');
            }
            if (actor.rol !== 'admin' && sale.id_usuario !== actor.id_usuario) {
                throw AppError.forbidden('Solo puedes eliminar tus propias ventas');
            }

            const product = await tx.lockProduct(sale.id_producto);
            if (!product) {
                throw AppError.notFound('Producto no encontrado');
            }

            // Se devuelven al inventario las unidades que se habían vendido
            await tx.changeStock(sale.id_producto, sale.cantidad);
            await tx.insertMovement({
                id_producto: sale.id_producto,
                id_usuario: actor.id_usuario,
                tipo_movimiento: 'ENTRADA',
                cantidad: sale.cantidad,
                notas: `Venta #${saleId} eliminada: unidades devueltas al inventario`
            });
            await tx.deleteSale(saleId);
        });

        return { message: 'Venta eliminada y inventario restaurado correctamente' };
    }
}

module.exports = DeleteSale;
