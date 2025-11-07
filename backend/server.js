// backend/server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // <-- NUEVO: Para cabeceras de seguridad
const rateLimit = require('express-rate-limit'); // <-- NUEVO: Para limitar peticiones

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const anexoRoutes = require('./routes/anexoRoutes');
const integranteRoutes = require('./routes/integranteRoutes');
const embarcacionMenorRoutes = require('./routes/embarcacionMenorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// =================================================================
// ==== INICIO: CONFIGURACIÓN DE SEGURIDAD ====
// =================================================================

// 1. Configurar CORS de forma segura
// Reemplaza esto con la URL de tu frontend en Render
const whiteList = [
    'https://proyecto-repa.onrender.com', 
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'http://localhost:3000'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (whiteList.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Acceso denegado por CORS'));
        }
    }
};

app.use(cors(corsOptions)); 

// 2. Añadir Helmet para las cabeceras de seguridad
app.use(helmet()); // <-- NUEVO

// 3. Añadir Rate Limiter para prevenir ataques de fuerza bruta
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 100, // Limita cada IP a 100 peticiones por ventana (windowMs)
	standardHeaders: true, 
	legacyHeaders: false, 
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.'
});



app.use(express.json());

// Tu middleware anti-caché (Está bien aquí)
app.use((req, res, next) => {
    const protectedPages = [
        '/dashboard.html',
        '/admin.html',
        // ...etc
    ];
    if (protectedPages.includes(req.path)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Ruta para la raíz '/'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

// RUTAS API
// Aplicamos el limitador de peticiones solo a las rutas del API
app.use('/api', apiLimiter, authRoutes); 
app.use('/api', apiLimiter, integranteRoutes); 
app.use('/api/embarcaciones', apiLimiter, embarcacionMenorRoutes); 
app.use('/api/admin', apiLimiter, adminRoutes); 
app.use('/api', apiLimiter, anexoRoutes); 
app.use('/api/anexos', apiLimiter, anexoRoutes); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});