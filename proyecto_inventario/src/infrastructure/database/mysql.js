const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones configurado únicamente con variables de entorno
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4', // tildes, ñ y emojis se guardan y leen correctamente
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true // DECIMAL llega como número (Gson/Retrofit lo lee como Double)
});

// Verifica la conexión y que exista la tabla `ventas` (script database/migracion_ventas.sql)
const checkDatabase = async () => {
    const connection = await pool.getConnection();
    try {
        const [tables] = await connection.query("SHOW TABLES LIKE 'ventas'");
        return { ventasTable: tables.length > 0 };
    } finally {
        connection.release();
    }
};

module.exports = pool;
module.exports.checkDatabase = checkDatabase;
