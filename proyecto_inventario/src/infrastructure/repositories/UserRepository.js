const pool = require('../database/mysql');
const IUserRepository = require('../../domain/repositories/IUserRepository');
const User = require('../../domain/entities/User');
const AppError = require('../../domain/errors/AppError');

const UPDATABLE_COLUMNS = ['nombre', 'email', 'password_hash', 'rol', 'activo'];

const translateError = (error) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return AppError.conflict('El correo ya está registrado');
    }
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return AppError.conflict('No se puede eliminar el usuario porque tiene registros asociados');
    }
    return error;
};

class UserRepository extends IUserRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY id_usuario');
        return rows.map((row) => new User(row));
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        return rows.length === 0 ? null : new User(rows[0]);
    }

    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows.length === 0 ? null : new User(rows[0]);
    }

    async create({ nombre, email, password_hash, rol }) {
        try {
            const [result] = await pool.query(
                'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
                [nombre, email, password_hash, rol]
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
            await pool.query(`UPDATE usuarios SET ${assignments} WHERE id_usuario = ?`, [...values, id]);
            return this.findById(id);
        } catch (error) {
            throw translateError(error);
        }
    }

    async updatePasswordHash(id, passwordHash) {
        await pool.query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [passwordHash, id]);
    }

    async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw translateError(error);
        }
    }

    async hasSales(id) {
        const [rows] = await pool.query('SELECT 1 FROM ventas WHERE id_usuario = ? LIMIT 1', [id]);
        return rows.length > 0;
    }

    async hasMovements(id) {
        const [rows] = await pool.query('SELECT 1 FROM movimientos_inventario WHERE id_usuario = ? LIMIT 1', [id]);
        return rows.length > 0;
    }
}

module.exports = UserRepository;
