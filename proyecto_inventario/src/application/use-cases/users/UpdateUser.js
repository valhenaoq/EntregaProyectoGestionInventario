const User = require('../../../domain/entities/User');
const AppError = require('../../../domain/errors/AppError');
const PasswordService = require('../../../infrastructure/services/PasswordService');
const {
    requireBody, parseId, requireText, requireEmail, requirePassword
} = require('../../validation/validators');

class UpdateUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    // actor: usuario autenticado (req.user)
    async execute(id, input, actor) {
        const userId = parseId(id, 'id de usuario');
        const body = requireBody(input);
        const isAdmin = actor.rol === 'admin';

        // Un empleado solo puede editar su propio perfil
        if (!isAdmin && actor.id_usuario !== userId) {
            throw AppError.forbidden('Solo puedes modificar tu propio usuario');
        }
        // Solo un administrador puede cambiar rol o estado
        if (!isAdmin && (body.rol !== undefined || body.activo !== undefined)) {
            throw AppError.forbidden('Solo un administrador puede modificar el rol o el estado de un usuario');
        }

        const data = {};

        if (body.nombre !== undefined) {
            data.nombre = requireText(body.nombre, 'nombre', 100);
        }
        if (body.email !== undefined) {
            data.email = requireEmail(body.email);
        }
        if (body.password !== undefined) {
            data.password_hash = await PasswordService.hash(requirePassword(body.password));
        }
        if (body.rol !== undefined) {
            if (!User.ROLES.includes(body.rol)) {
                throw AppError.badRequest(`El rol debe ser uno de: ${User.ROLES.join(', ')}`);
            }
            data.rol = body.rol;
        }
        if (body.activo !== undefined) {
            if (typeof body.activo !== 'boolean') {
                throw AppError.badRequest('El campo activo debe ser true o false');
            }
            data.activo = body.activo;
        }

        if (Object.keys(data).length === 0) {
            throw AppError.badRequest('No se enviaron campos para actualizar');
        }

        const existing = await this.userRepository.findById(userId);
        if (!existing) {
            throw AppError.notFound('Usuario no encontrado');
        }

        if (data.email) {
            const owner = await this.userRepository.findByEmail(data.email);
            if (owner && owner.id_usuario !== userId) {
                throw AppError.conflict('El correo ya está registrado');
            }
        }

        const updated = await this.userRepository.update(userId, data);
        return updated.toPublic();
    }
}

module.exports = UpdateUser;
