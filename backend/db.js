// backend/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión a la base de datos MySQL establecida.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar con la base de datos:', err);
    });

module.exports = pool;