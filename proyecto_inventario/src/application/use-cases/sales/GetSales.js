class GetSales {
    constructor(saleRepository) {
        this.saleRepository = saleRepository;
    }

    async execute() {
        return this.saleRepository.findAll();
    }
}

module.exports = GetSales;
