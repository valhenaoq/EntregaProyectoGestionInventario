const AppError = require('../../domain/errors/AppError');

const INT_MAX = 2147483647;
const MAX_MONEY = 99999999.99; // DECIMAL(10,2)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requireBody = (body) => {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        throw AppError.badRequest('El cuerpo de la petición debe ser un objeto JSON');
    }
    return body;
};

// ID que llega por la URL (string) -> entero positivo
const parseId = (value, field = 'id') => {
    const text = typeof value === 'number' ? String(value) : value;
    if (typeof text !== 'string' || !/^[1-9]\d{0,9}$/.test(text) || Number(text) > INT_MAX) {
        throw AppError.badRequest(`El ${field} es inválido`);
    }
    return Number(text);
};

// Entero que llega en el cuerpo JSON (debe ser de tipo number, no string)
const requireInteger = (value, field, { min = 0 } = {}) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > INT_MAX) {
        const rule = min >= 1 ? 'mayor que cero' : 'mayor o igual a cero';
        throw AppError.badRequest(`El campo ${field} debe ser un número entero ${rule}`);
    }
    return value;
};

const nullableInteger = (value, field) => {
    if (value === null) return null;
    return requireInteger(value, field, { min: 1 });
};

const requireMoney = (value, field, { allowZero = false } = {}) => {
    const invalid = typeof value !== 'number'
        || !Number.isFinite(value)
        || value < 0
        || (!allowZero && value === 0)
        || value > MAX_MONEY;

    if (invalid) {
        const rule = allowZero ? 'mayor o igual a cero' : 'mayor que cero';
        throw AppError.badRequest(`El campo ${field} debe ser un número ${rule}`);
    }
    if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
        throw AppError.badRequest(`El campo ${field} admite máximo dos decimales`);
    }
    return Math.round(value * 100) / 100;
};

const requireText = (value, field, max) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw AppError.badRequest(`El campo ${field} es obligatorio`);
    }
    const text = value.trim();
    if (text.length > max) {
        throw AppError.badRequest(`El campo ${field} no puede superar ${max} caracteres`);
    }
    return text;
};

const nullableText = (value, field, max) => {
    if (value === null || (typeof value === 'string' && value.trim() === '')) return null;
    return requireText(value, field, max);
};

const requireEmail = (value, field = 'email') => {
    const email = requireText(value, field, 100).toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
        throw AppError.badRequest('El formato del correo electrónico no es válido');
    }
    return email;
};

// bcrypt solo procesa los primeros 72 bytes
const requirePassword = (value, field = 'password') => {
    if (typeof value !== 'string' || value === '') {
        throw AppError.badRequest(`El campo ${field} es obligatorio`);
    }
    if (value.length < 6) {
        throw AppError.badRequest('La contraseña debe tener al menos 6 caracteres');
    }
    if (Buffer.byteLength(value, 'utf8') > 72) {
        throw AppError.badRequest('La contraseña no puede superar 72 bytes');
    }
    return value;
};

// Parámetro de query opcional: devuelve string recortado o undefined
const optionalQueryText = (value, field) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string') {
        throw AppError.badRequest(`El parámetro ${field} es inválido`);
    }
    const text = value.trim();
    return text === '' ? undefined : text;
};

module.exports = {
    requireBody,
    parseId,
    requireInteger,
    nullableInteger,
    requireMoney,
    requireText,
    nullableText,
    requireEmail,
    requirePassword,
    optionalQueryText
};
