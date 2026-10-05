const User = require('../../../domain/entities/User');
const AppError = require('../../../domain/errors/AppError');
const PasswordService = require('../../../infrastructure/services/PasswordService');
const { requireBody, requireText, requireEmail, requirePassword } = require('../../validation/validators');

class RegisterUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(input) {
        const body = requireBody(input);
        const nombre = requireText(body.nombre, 'nombre', 100);
        const email = requireEmail(body.email);
        const password = requirePassword(body.password);

        if (await this.userRepository.findByEmail(email)) {
            throw AppError.conflict('El correo ya está registrado');
        }

        // El rol NUNCA se toma del cliente: el registro público siempre crea un 'empleado'
        const user = await this.userRepository.create({
            nombre,
            email,
            password_hash: await PasswordService.hash(password),
            rol: User.DEFAULT_ROLE
        });

        return user.toPublic();
    }
}

module.exports = RegisterUser;
