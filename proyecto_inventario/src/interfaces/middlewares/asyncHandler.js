// Express 4 no captura promesas rechazadas: este wrapper las envía al errorHandler
const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
