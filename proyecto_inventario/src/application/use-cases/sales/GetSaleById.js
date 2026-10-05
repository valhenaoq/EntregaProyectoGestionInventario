const AppError = require('../../../domain/errors/AppError');
const { parseId } = require('../../validation/validators');

class GetSaleById {
    constructor(saleRepository) {
        this.saleRepository = saleRepository;
    }

    async execute(id) {
        const sale = await this.saleRepository.findById(parseId(id, 'id de venta'));
        if (!sale) {
            throw AppError.notFound('Venta no encontrada');
        }
        return sale;
    }
}

module.exports = GetSaleById;
