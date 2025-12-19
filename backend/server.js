// backend/server.js
require('dotenv').config({ path: ['.env.local', '.env'] });
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit');
const hpp = require('hpp'); 

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
app.disable('x-powered-by');

// 1. TRUST PROXY (ESENCIAL PARA RENDER)
app.set('trust proxy', 1); 

// 2. CORS SEGURO (MODIFICADO PARA DOCKER)
const whiteList = [
    'https://proyecto-repa.onrender.com', // Producción (Render) - SE QUEDA IGUAL
    'http://localhost:5500',              // Desarrollo Local (Live Server)
    'http://127.0.0.1:5500',              // Desarrollo Local IP
    'http://localhost:3000',              // Backend directo
    // --- AGREGADOS PARA DOCKER ---
    'http://localhost:8080',              // Tu Frontend en Docker
    'http://127.0.0.1:8080'               // Tu Frontend en Docker (IP)
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
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/", "https://cdnjs.cloudflare.com"],
            "frame-src": ["'self'", "https://www.google.com/recaptcha/"],
            "style-src": [
                "'self'", 
                "'unsafe-inline'", 
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
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { message: 'Demasiadas peticiones desde esta IP, intenta más tarde.' }
});

// =================================================================
// ==== MIDDLEWARES GLOBALES ====
// =================================================================

app.use(express.json()); 
app.use(hpp()); 

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

// Archivos Estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Ruta Raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

// =================================================================
// ==== RUTAS API ====
// =================================================================

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