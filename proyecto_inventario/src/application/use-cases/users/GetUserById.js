const AppError = require('../../../domain/errors/AppError');
const { parseId } = require('../../validation/validators');

class GetUserById {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(id) {
        const user = await this.userRepository.findById(parseId(id, 'id de usuario'));
        if (!user) {
            throw AppError.notFound('Usuario no encontrado');
        }
        return user.toPublic();
    }
}

module.exports = GetUserById;
