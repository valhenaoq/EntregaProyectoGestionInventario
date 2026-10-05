const TokenService = require('../../infrastructure/services/TokenService');
const AppError = require('../../domain/errors/AppError');

// Exige: Authorization: Bearer <token>. Deja el usuario en req.user.
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        return next(AppError.unauthorized('Acceso denegado: no se proporcionó un token de autenticación'));
    }

    const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
    if (!match) {
        return next(AppError.unauthorized('Formato de autorización inválido. Use: Bearer <token>'));
    }

    try {
        req.user = TokenService.verify(match[1]); // lanza 401 si es inválido o expirado
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = authMiddleware;
