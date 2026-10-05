const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 10;
// Un hash bcrypt válido mide exactamente 60 caracteres
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const safeEqual = (a, b) => {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
};

class PasswordService {
    static hash(plainPassword) {
        return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    }

    // Compatible con los datos existentes:
    //  - hash bcrypt válido        -> compara con bcrypt
    //  - texto que empieza por $2  -> hash corrupto/truncado: nunca autentica
    //  - cualquier otro texto      -> contraseña en texto plano heredada;
    //                                 si coincide se pide migrarla a bcrypt (needsRehash)
    static async verify(plainPassword, storedValue) {
        if (typeof storedValue !== 'string' || storedValue === '') {
            return { valid: false, needsRehash: false };
        }

        if (BCRYPT_REGEX.test(storedValue)) {
            return { valid: await bcrypt.compare(plainPassword, storedValue), needsRehash: false };
        }

        if (storedValue.startsWith('$2')) {
            return { valid: false, needsRehash: false };
        }

        const valid = safeEqual(plainPassword, storedValue);
        return { valid, needsRehash: valid };
    }
}

module.exports = PasswordService;
