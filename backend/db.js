// backend/db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Ruta al certificado SSL
const certPath = path.join(__dirname, 'isrgrootx1.pem');

// Detectamos si estamos en un entorno local de Docker
// Si el host es 'db' (como pusimos en el .env), asumimos que es local y no requiere SSL.
const isLocalDocker = process.env.MYSQL_HOST === 'db';

let sslConfig = null;

// Solo configuramos SSL si NO estamos en Docker local Y el certificado existe
if (!isLocalDocker && fs.existsSync(certPath)) {
    console.log("🔒 Modo Nube/Render detectado: Usando conexión SSL.");
    sslConfig = {
        ca: fs.readFileSync(certPath),
        rejectUnauthorized: false
    };
} else {
    console.log("⚠️ Modo Local detectado: SSL desactivado (Conexión estándar).");
}

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306, // Puerto por defecto si falta en .env
    
    // --- CONFIGURACIÓN DE POOL ---
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // --- OPTIMIZACIONES ---
    enableKeepAlive: true, 
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4', 

    // --- SSL CONDICIONAL ---
    // Si sslConfig es null, no se envía nada de SSL
    ...(sslConfig && { ssl: sslConfig }) 
});

// Prueba de conexión inicial
pool.getConnection()
    .then(connection => {
        console.log(`✅ Base de Datos conectada a: ${process.env.MYSQL_HOST}`);
        connection.release(); 
    })
    .catch(err => {
        console.error('❌ ERROR CRÍTICO DE DB:', err.message);
        console.error('   Verifica host, usuario, contraseña y si la DB "repa" existe.');
    });

module.exports = pool;