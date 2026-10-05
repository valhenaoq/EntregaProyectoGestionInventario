const AppError = require('../../../domain/errors/AppError');
const { parseId } = require('../../validation/validators');

class DeleteProduct {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async execute(id) {
        const productId = parseId(id, 'id de producto');

        if (!(await this.productRepository.findById(productId))) {
            throw AppError.notFound('Producto no encontrado');
        }

        // Regla de negocio: la BD tiene ON DELETE CASCADE en movimientos_inventario,
        // pero aquí se bloquea para no perder el historial en silencio.
        if (await this.productRepository.hasSales(productId)) {
            throw AppError.conflict('No se puede eliminar el producto porque tiene ventas asociadas');
        }
        if (await this.productRepository.hasMovements(productId)) {
            throw AppError.conflict('No se puede eliminar el producto porque tiene movimientos de inventario asociados');
        }

        await this.productRepository.delete(productId);
        return { message: 'Producto eliminado correctamente' };
    }
}

module.exports = DeleteProduct;
