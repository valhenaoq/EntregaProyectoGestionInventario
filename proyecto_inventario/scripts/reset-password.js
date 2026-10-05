// Uso: node scripts/reset-password.js correo@ejemplo.com nuevaPassword
// Guarda la contraseña con bcrypt. Útil para los usuarios del SQL de ejemplo
// cuyo hash está truncado e impide iniciar sesión.
require('dotenv').config();

const pool = require('../src/infrastructure/database/mysql');
const PasswordService = require('../src/infrastructure/services/PasswordService');
const { requirePassword } = require('../src/application/validation/validators');

const main = async () => {
    const [email, password] = process.argv.slice(2);

    if (!email || !password) {
        console.error('Uso: node scripts/reset-password.js <correo> <nueva_password>');
        process.exitCode = 1;
        return;
    }

    requirePassword(password);
    const [result] = await pool.query(
        'UPDATE usuarios SET password_hash = ? WHERE email = ?',
        [await PasswordService.hash(password), email.trim().toLowerCase()]
    );

    if (result.affectedRows === 0) {
        console.error('No existe un usuario con ese correo.');
        process.exitCode = 1;
        return;
    }
    console.log('Contraseña actualizada correctamente.');
};

main()
    .catch((error) => {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
