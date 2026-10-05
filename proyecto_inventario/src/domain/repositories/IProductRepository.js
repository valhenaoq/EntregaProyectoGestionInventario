class IProductRepository {
    async findAll(filters) { throw new Error('Method not implemented'); }
    async findById(id) { throw new Error('Method not implemented'); }
    async create(data) { throw new Error('Method not implemented'); }
    async update(id, data) { throw new Error('Method not implemented'); }
    async delete(id) { throw new Error('Method not implemented'); }
    async hasSales(id) { throw new Error('Method not implemented'); }
    async hasMovements(id) { throw new Error('Method not implemented'); }
}

module.exports = IProductRepository;
