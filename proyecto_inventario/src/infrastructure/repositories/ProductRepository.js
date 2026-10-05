const pool = require('../database/mysql');
const IProductRepository = require('../../domain/repositories/IProductRepository');
const Product = require('../../domain/entities/Product');
const AppError = require('../../domain/errors/AppError');

const UPDATABLE_COLUMNS = [
    'codigo_barras', 'nombre', 'descripcion', 'precio_compra', 'precio_venta',
    'stock_actual', 'stock_minimo', 'id_categoria', 'id_proveedor'
];

const SELECT_PRODUCT = `
    SELECT p.id_producto, p.codigo_barras, p.nombre, p.descripcion,
           p.precio_compra, p.precio_venta, p.stock_actual, p.stock_minimo,
           p.id_categoria, c.nombre AS categoria,
           p.id_proveedor, pr.nombre_empresa AS proveedor,
           p.creado_en
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    LEFT JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor`;

// Escapa los comodines de LIKE para que el texto del usuario se busque literalmente
const likePattern = (text) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;

const translateError = (error) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return AppError.conflict('Ya existe un producto con ese código de barras');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = String(error.sqlMessage || '').includes('id_categoria')
            ? 'La categoría indicada no existe'
            : 'El proveedor indicado no existe';
        return AppError.badRequest(message);
    }
    return error;
};

class ProductRepository extends IProductRepository {
    // filters: { nombre, categoria } (ambos opcionales y combinables, coincidencia parcial)
    async findAll({ nombre, categoria } = {}) {
        const conditions = [];
        const params = [];

        if (nombre) {
            conditions.push('p.nombre LIKE ?');
            params.push(likePattern(nombre));
        }
        if (categoria) {
            conditions.push('c.nombre LIKE ?');
            params.push(likePattern(categoria));
        }

        const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await pool.query(`${SELECT_PRODUCT}${where} ORDER BY p.id_producto`, params);
        return rows.map((row) => new Product(row));
    }

    async findById(id) {
        const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.id_producto = ?`, [id]);
        return rows.length === 0 ? null : new Product(rows[0]);
    }

    async create(data) {
        try {
            const [result] = await pool.query(
                `INSERT INTO productos
                    (codigo_barras, nombre, descripcion, precio_compra, precio_venta,
                     stock_actual, stock_minimo, id_categoria, id_proveedor)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.codigo_barras, data.nombre, data.descripcion, data.precio_compra, data.precio_venta,
                    data.stock_actual, data.stock_minimo, data.id_categoria, data.id_proveedor
                ]
            );
            return this.findById(result.insertId);
        } catch (error) {
            throw translateError(error);
        }
    }

    async update(id, data) {
        const columns = Object.keys(data).filter((column) => UPDATABLE_COLUMNS.includes(column));
        if (columns.length === 0) {
            return this.findById(id);
        }

        const assignments = columns.map((column) => `${column} = ?`).join(', ');
        const values = columns.map((column) => data[column]);

        try {
            await pool.query(`UPDATE productos SET ${assignments} WHERE id_producto = ?`, [...values, id]);
            return this.findById(id);
        } catch (error) {
            throw translateError(error);
        }
    }

    async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM productos WHERE id_producto = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw translateError(error);
        }
    }

    async hasSales(id) {
        const [rows] = await pool.query('SELECT 1 FROM ventas WHERE id_producto = ? LIMIT 1', [id]);
        return rows.length > 0;
    }

    async hasMovements(id) {
        const [rows] = await pool.query('SELECT 1 FROM movimientos_inventario WHERE id_producto = ? LIMIT 1', [id]);
        return rows.length > 0;
    }
}

module.exports = ProductRepository;
