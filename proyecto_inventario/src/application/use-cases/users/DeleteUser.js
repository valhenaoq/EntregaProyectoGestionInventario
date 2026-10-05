const AppError = require('../../../domain/errors/AppError');
const { parseId } = require('../../validation/validators');

class DeleteUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(id, actor) {
        const userId = parseId(id, 'id de usuario');

        if (actor.rol !== 'admin') {
            throw AppError.forbidden('Solo un administrador puede eliminar usuarios');
        }

        if (!(await this.userRepository.findById(userId))) {
            throw AppError.notFound('Usuario no encontrado');
        }

        // Regla de negocio: no se elimina un usuario con historial, aunque la BD tenga cascadas
        if (await this.userRepository.hasSales(userId)) {
            throw AppError.conflict('No se puede eliminar el usuario porque tiene ventas asociadas');
        }
        if (await this.userRepository.hasMovements(userId)) {
            throw AppError.conflict('No se puede eliminar el usuario porque tiene movimientos de inventario asociados');
        }

        await this.userRepository.delete(userId);
        return { message: 'Usuario eliminado correctamente' };
    }
}

module.exports = DeleteUser;
