const validateProduct = require('../../validation/productValidator');

class CreateProduct {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async execute(input) {
        const data = validateProduct(input);
        return this.productRepository.create(data);
    }
}

module.exports = CreateProduct;
