const { optionalQueryText } = require('../../validation/validators');

class GetProducts {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    // query: { nombre?, categoria? } — filtros opcionales, combinables, con coincidencia parcial
    async execute(query = {}) {
        const filters = {
            nombre: optionalQueryText(query.nombre, 'nombre'),
            categoria: optionalQueryText(query.categoria, 'categoria')
        };
        return this.productRepository.findAll(filters);
    }
}

module.exports = GetProducts;
