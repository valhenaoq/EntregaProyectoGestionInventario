const AppError = require('../../domain/errors/AppError');
const {
    requireBody, requireInteger, nullableInteger, requireMoney, requireText, nullableText
} = require('./validators');

const RULES = {
    nombre: { required: true, parse: (v) => requireText(v, 'nombre', 100) },
    descripcion: { required: true, parse: (v) => requireText(v, 'descripcion', 65535) },
    precio_venta: { required: true, parse: (v) => requireMoney(v, 'precio_venta') },
    precio_compra: { required: false, default: 0, parse: (v) => requireMoney(v, 'precio_compra', { allowZero: true }) },
    stock_actual: { required: true, parse: (v) => requireInteger(v, 'stock_actual', { min: 0 }) },
    stock_minimo: { required: false, default: 5, parse: (v) => requireInteger(v, 'stock_minimo', { min: 0 }) },
    id_categoria: { required: true, parse: (v) => requireInteger(v, 'id_categoria', { min: 1 }) },
    id_proveedor: { required: false, default: null, parse: (v) => nullableInteger(v, 'id_proveedor') },
    codigo_barras: { required: false, default: null, parse: (v) => nullableText(v, 'codigo_barras', 50) }
};

// partial = false -> creación (valida obligatorios y aplica valores por defecto)
// partial = true  -> actualización (solo valida los campos enviados)
const validateProduct = (input, { partial = false } = {}) => {
    const body = requireBody(input);
    const data = {};

    for (const [field, rule] of Object.entries(RULES)) {
        const value = body[field];

        if (value === undefined) {
            if (partial) continue;
            if (rule.required) {
                throw AppError.badRequest(`El campo ${field} es obligatorio`);
            }
            data[field] = rule.default;
            continue;
        }

        data[field] = rule.parse(value);
    }

    if (partial && Object.keys(data).length === 0) {
        throw AppError.badRequest('No se enviaron campos para actualizar');
    }

    return data;
};

module.exports = validateProduct;
