const AppError = require('../../../domain/errors/AppError');
const PasswordService = require('../../../infrastructure/services/PasswordService');
const TokenService = require('../../../infrastructure/services/TokenService');
const { requireBody, requireEmail } = require('../../validation/validators');

class LoginUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(input) {
        const body = requireBody(input);
        const email = requireEmail(body.email);

        if (typeof body.password !== 'string' || body.password === '') {
            throw AppError.badRequest('El campo password es obligatorio');
        }

        // Mensaje único para correo inexistente o contraseña incorrecta (evita enumerar usuarios)
        const invalidCredentials = AppError.unauthorized('Credenciales inválidas');

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw invalidCredentials;
        }

        const { valid, needsRehash } = await PasswordService.verify(body.password, user.password_hash);
        if (!valid) {
            throw invalidCredentials;
        }

        if (!user.activo) {
            throw AppError.forbidden('El usuario se encuentra inactivo');
        }

        // Migración transparente: contraseña en texto plano heredada -> bcrypt
        if (needsRehash) {
            await this.userRepository.updatePasswordHash(user.id_usuario, await PasswordService.hash(body.password));
        }

        return {
            token: TokenService.generate(user),
            user: user.toPublic()
        };
    }
}

module.exports = LoginUser;
