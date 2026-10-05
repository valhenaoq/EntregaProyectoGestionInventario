const jwt = require('jsonwebtoken');
const AppError = require('../../domain/errors/AppError');

class TokenService {
    static generate(user) {
        const payload = {
            id_usuario: user.id_usuario,
            email: user.email,
            rol: user.rol
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '8h'
        });
    }

    // Lanza AppError 401 si el token es inválido o expiró
    static verify(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return { id_usuario: decoded.id_usuario, email: decoded.email, rol: decoded.rol };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw AppError.unauthorized('El token ha expirado');
            }
            throw AppError.unauthorized('Token inválido');
        }
    }
}

module.exports = TokenService;
