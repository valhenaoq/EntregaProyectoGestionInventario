const pool = require('../database/mysql');
const ISaleRepository = require('../../domain/repositories/ISaleRepository');
const Sale = require('../../domain/entities/Sale');
const AppError = require('../../domain/errors/AppError');

const SELECT_SALE = `
    SELECT v.id_venta, v.fecha_venta, v.cantidad, v.total_venta,
           v.id_usuario, u.nombre AS nombre_usuario,
           v.id_producto, p.nombre AS nombre_producto
    FROM ventas v
    JOIN usuarios u ON u.id_usuario = v.id_usuario
    JOIN productos p ON p.id_producto = v.id_producto`;

// Operaciones SQL que se ejecutan sobre UNA conexión con transacción abierta.
// No contienen reglas de negocio: las reglas viven en los casos de uso.
class SaleTransaction {
    constructor(connection) {
        this.connection = connection;
    }

    async userExists(id) {
        const [rows] = await this.connection.query(
            'SELECT id_usuario, activo FROM usuarios WHERE id_usuario = ?',
            [id]
        );
        return rows.length === 0 ? null : { id_usuario: rows[0].id_usuario, activo: Boolean(rows[0].activo) };
    }

    // Bloquea la fila del producto hasta el COMMIT/ROLLBACK (SELECT ... FOR UPDATE)
    async lockProduct(id) {
        const [rows] = await this.connection.query(
            'SELECT id_producto, nombre, precio_venta, stock_actual FROM productos WHERE id_producto = ? FOR UPDATE',
            [id]
        );
        return rows.length === 0 ? null : rows[0];
    }

    async lockSale(id) {
        const [rows] = await this.connection.query(
            'SELECT id_venta, cantidad, total_venta, id_usuario, id_producto FROM ventas WHERE id_venta = ? FOR UPDATE',
            [id]
        );
        return rows.length === 0 ? null : rows[0];
    }

    async insertSale({ cantidad, total_venta, id_usuario, id_producto }) {
        const [result] = await this.connection.query(
            'INSERT INTO ventas (cantidad, total_venta, id_usuario, id_producto) VALUES (?, ?, ?, ?)',
            [cantidad, total_venta, id_usuario, id_producto]
        );
        return result.insertId;
    }

    async updateSale(id, { cantidad, total_venta, id_usuario, id_producto }) {
        await this.connection.query(
            'UPDATE ventas SET cantidad = ?, total_venta = ?, id_usuario = ?, id_producto = ? WHERE id_venta = ?',
            [cantidad, total_venta, id_usuario, id_producto, id]
        );
    }

    async deleteSale(id) {
        await this.connection.query('DELETE FROM ventas WHERE id_venta = ?', [id]);
    }

    // Suma (delta > 0) o resta (delta < 0) unidades. La condición del WHERE impide
    // que el stock quede negativo incluso ante un error de lógica.
    async changeStock(id_producto, delta) {
        if (delta === 0) return;

        const [result] = await this.connection.query(
            'UPDATE productos SET stock_actual = stock_actual + ? WHERE id_producto = ? AND stock_actual + ? >= 0',
            [delta, id_producto, delta]
        );
        if (result.affectedRows === 0) {
            throw AppError.conflict('No hay inventario suficiente para esta venta');
        }
    }

    async insertMovement({ id_producto, id_usuario, tipo_movimiento, cantidad, notas }) {
        await this.connection.query(
            `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo_movimiento, cantidad, notas)
             VALUES (?, ?, ?, ?, ?)`,
            [id_producto, id_usuario, tipo_movimiento, cantidad, notas]
        );
    }
}

class SaleRepository extends ISaleRepository {
    async findAll() {
        const [rows] = await pool.query(`${SELECT_SALE} ORDER BY v.fecha_venta DESC, v.id_venta DESC`);
        return rows.map((row) => new Sale(row));
    }

    async findById(id) {
        const [rows] = await pool.query(`${SELECT_SALE} WHERE v.id_venta = ?`, [id]);
        return rows.length === 0 ? null : new Sale(rows[0]);
    }

    async transaction(work) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await work(new SaleTransaction(connection));
            await connection.commit();
            return result;
        } catch (error) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error al hacer ROLLBACK:', rollbackError.message);
            }
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = SaleRepository;
