const AppError = require('../../../domain/errors/AppError');
const { parseId } = require('../../validation/validators');

class GetProductById {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async execute(id) {
        const product = await this.productRepository.findById(parseId(id, 'id de producto'));
        if (!product) {
            throw AppError.notFound('Producto no encontrado');
        }
        return product;
    }
}

module.exports = GetProductById;
