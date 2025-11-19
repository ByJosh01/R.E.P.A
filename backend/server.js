// backend/server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit');
const hpp = require('hpp'); // <--- NUEVA PROTECCIÓN (Evita ataques de duplicación de parámetros)

// Importación de Rutas
const authRoutes = require('./routes/authRoutes');
const anexoRoutes = require('./routes/anexoRoutes');
const integranteRoutes = require('./routes/integranteRoutes');
const embarcacionMenorRoutes = require('./routes/embarcacionMenorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// =================================================================
// ==== CONFIGURACIÓN DE SEGURIDAD (HARDENING) ====
// =================================================================

// 0. OCULTAR TECNOLOGÍA
// Evita que hackers sepan fácilmente que usas Express
app.disable('x-powered-by');

// 1. TRUST PROXY (ESENCIAL PARA RENDER)
// Permite leer la IP real del usuario a través del balanceador de Render
app.set('trust proxy', 1); 

// 2. CORS SEGURO
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

// 3. HELMET (HEADERS HTTP & CSP)
// Configurado para permitir: FontAwesome, Google Fonts, Estilos Inline y ReCAPTCHA
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/", "https://cdnjs.cloudflare.com"],
            "frame-src": ["'self'", "https://www.google.com/recaptcha/"],
            "style-src": [
                "'self'", 
                "'unsafe-inline'", // Necesario para tus estilos personalizados en HTML
                "https://fonts.googleapis.com/", 
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net"
            ],
            "font-src": [
                "'self'", 
                "https://fonts.gstatic.com/", 
                "https://cdnjs.cloudflare.com", 
                "data:"
            ],
            "img-src": ["'self'", "data:", "https:"],
            "connect-src": ["'self'", "https://www.google.com/recaptcha/"] 
        },
    })
);

// 4. RATE LIMIT (PROTECCIÓN DDOS)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Máximo de peticiones por IP
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { message: 'Demasiadas peticiones desde esta IP, intenta más tarde.' }
});

// =================================================================
// ==== MIDDLEWARES GLOBALES ====
// =================================================================

app.use(express.json()); // Parser JSON
app.use(hpp()); // <--- ACTIVA LA PROTECCIÓN HPP AQUÍ

// Middleware Anti-Caché para páginas protegidas
app.use((req, res, next) => {
    const protectedPages = [
        '/dashboard.html', '/admin.html', '/panel-admin.html', '/anexos.html',
        '/datos-personales.html', '/detalle-solicitante.html', '/admin-usuarios.html',
        '/admin-integrantes.html', '/admin-embarcaciones.html'
    ];

    if (protectedPages.includes(req.path)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Archivos Estáticos (Tu Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Ruta Raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

// =================================================================
// ==== RUTAS API ====
// =================================================================

// Aplicamos el limitador a todas las rutas API
app.use('/api', apiLimiter, authRoutes); 
app.use('/api', apiLimiter, integranteRoutes);
app.use('/api/embarcaciones', apiLimiter, embarcacionMenorRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api', apiLimiter, anexoRoutes); 
app.use('/api/anexos', apiLimiter, anexoRoutes); 

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor seguro escuchando en el puerto ${PORT}`);
});