class ISaleRepository {
    async findAll() { throw new Error('Method not implemented'); }
    async findById(id) { throw new Error('Method not implemented'); }

    // Ejecuta `work(tx)` dentro de una transacción: COMMIT si termina bien,
    // ROLLBACK si lanza cualquier error. `tx` expone las operaciones transaccionales
    // (userExists, lockProduct, lockSale, insertSale, updateSale, deleteSale,
    // changeStock, insertMovement).
    async transaction(work) { throw new Error('Method not implemented'); }
}

module.exports = ISaleRepository;
