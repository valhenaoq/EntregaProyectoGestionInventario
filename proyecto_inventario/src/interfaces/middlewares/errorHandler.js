const AppError = require('../../domain/errors/AppError');

const CONNECTION_ERROR_CODES = [
    'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST',
    'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_CON_COUNT_ERROR'
];

const notFoundHandler = (req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
};

// Respuestas siempre limpias: nunca se expone SQL, stack traces ni datos sensibles
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.status).json({ message: err.message });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'El cuerpo de la petición es demasiado grande' });
    }

    if (CONNECTION_ERROR_CODES.includes(err.code)) {
        console.error(`Error de conexión con MySQL [${err.code}]: ${err.message}`);
        return res.status(503).json({ message: 'Servicio no disponible: no se pudo conectar con la base de datos' });
    }

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'El registro ya existe' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'Se hace referencia a un registro que no existe' });
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ message: 'No se puede eliminar el registro porque tiene datos asociados' });
    }

    // Errores de MySQL: se registran código y mensaje, no el SQL (podría contener datos sensibles)
    if (err.sqlMessage) {
        console.error(`Error de MySQL [${err.code}]: ${err.sqlMessage}`);
    } else {
        console.error(err);
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
};

module.exports = { errorHandler, notFoundHandler };
