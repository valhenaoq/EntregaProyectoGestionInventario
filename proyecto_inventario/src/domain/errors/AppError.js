class AppError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = 'AppError';
        this.status = status;
    }

    static badRequest(message) {
        return new AppError(message, 400);
    }

    static unauthorized(message = 'No autorizado') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'No tienes permisos para realizar esta acción') {
        return new AppError(message, 403);
    }

    static notFound(message) {
        return new AppError(message, 404);
    }

    static conflict(message) {
        return new AppError(message, 409);
    }
}

module.exports = AppError;
