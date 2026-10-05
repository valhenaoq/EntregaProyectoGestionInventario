require('dotenv').config(); // debe cargarse antes que cualquier módulo que lea process.env

const app = require('./app');
const { checkDatabase } = require('./infrastructure/database/mysql');

const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

if (missing.length > 0) {
    console.error(`Faltan variables de entorno: ${missing.join(', ')}. Revisa tu archivo .env (ver .env.example).`);
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);

    checkDatabase()
        .then(({ ventasTable }) => {
            console.log(`Conexión exitosa a la base de datos MySQL: ${process.env.DB_NAME}`);
            if (!ventasTable) {
                console.warn('ADVERTENCIA: no existe la tabla `ventas`. Ejecuta database/migracion_ventas.sql');
            }
        })
        .catch((error) => {
            console.error(`No se pudo conectar a MySQL [${error.code || 'ERROR'}]: ${error.message}`);
        });
});
