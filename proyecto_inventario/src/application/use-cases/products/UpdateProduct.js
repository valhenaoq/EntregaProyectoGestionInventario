const AppError = require('../../../domain/errors/AppError');
const validateProduct = require('../../validation/productValidator');
const { parseId } = require('../../validation/validators');

class UpdateProduct {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async execute(id, input) {
        const productId = parseId(id, 'id de producto');
        const data = validateProduct(input, { partial: true });

        if (!(await this.productRepository.findById(productId))) {
            throw AppError.notFound('Producto no encontrado');
        }

        return this.productRepository.update(productId, data);
    }
}

module.exports = UpdateProduct;
