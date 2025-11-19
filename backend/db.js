// backend/db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Ruta al certificado SSL
const certPath = path.join(__dirname, 'isrgrootx1.pem');

// Verificamos que el certificado exista antes de intentar leerlo (Evita crash silencioso)
if (!fs.existsSync(certPath)) {
    console.warn("⚠️ ADVERTENCIA: No se encontró el certificado SSL en:", certPath);
    console.warn("La conexión a la base de datos podría fallar si requiere SSL.");
}

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    
    // --- CONFIGURACIÓN DE POOL ---
    waitForConnections: true,
    connectionLimit: 10, // Mantenlo bajo en planes gratuitos para no saturar la BD
    queueLimit: 0,

    // --- OPTIMIZACIONES PARA RENDER / NUBE ---
    // 1. Keep Alive: Evita que la nube cierre la conexión por inactividad
    enableKeepAlive: true, 
    keepAliveInitialDelay: 0,

    // 2. Charset: Soporte total para Emojis y caracteres especiales
    charset: 'utf8mb4', 

    // 3. SSL: Configuración segura
    ssl: {
        ca: fs.readFileSync(certPath), 
        rejectUnauthorized: false // Necesario para algunos proveedores de nube
    }
});

// Prueba de conexión inicial (Solo para log)
pool.getConnection()
    .then(connection => {
        console.log('✅ Base de Datos: Conexión establecida correctamente (Pool listo).');
        connection.release(); // Importante: Devolver la conexión al pool
    })
    .catch(err => {
        console.error('❌ ERROR CRÍTICO DE DB:', err.message);
        // Opcional: Si la DB es vital, podrías hacer process.exit(1) aquí
    });

module.exports = pool;