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

// 0. DETECCIÓN DE ENTORNO
const isProduction = process.env.NODE_ENV === 'production';

// 1. OCULTAR TECNOLOGÍA
app.disable('x-powered-by');

// 2. TRUST PROXY (CRÍTICO PARA RENDER)
app.set('trust proxy', 1); 

// 3. RATE LIMIT
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { message: 'Demasiadas peticiones generales. Calma un poco.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: isProduction ? 10 : 100, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de acceso. Intenta más tarde.' }
});

// 4. CORS SEGURO (CORREGIDO)
const whiteList = [
    'https://proyecto-repa.onrender.com', 
    'http://localhost:5500',              
    'http://127.0.0.1:5500',              
    'http://localhost:3000',              
    'http://localhost:8080',              
    'http://127.0.0.1:8080'               
];

const corsOptions = {
    origin: function (origin, callback) {
        // CORRECCIÓN IMPORTANTE:
        // Permitimos peticiones sin origen (!origin) en CUALQUIER entorno.
        // Esto es vital para que el Frontend (que vive en el mismo servidor) pueda hablar con el Backend.
        if (whiteList.includes(origin) || !origin) {
            callback(null, true);
        } else {
            console.error(`Bloqueado por CORS: ${origin}`); // Log para depurar si vuelve a pasar
            callback(new Error('Acceso denegado por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 5. HELMET (HEADERS HTTP & CSP)
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

// =================================================================
// ==== MIDDLEWARES GLOBALES ====
// =================================================================

app.use(express.json({ limit: '10kb' })); 
app.use(hpp()); 

// Middleware Anti-Caché
app.use((req, res, next) => {
    const protectedPages = [
        '/dashboard.html', '/admin.html', '/panel-admin.html', '/anexos.html',
        '/datos-personales.html', '/detalle-solicitante.html', '/admin-usuarios.html',
        '/admin-integrantes.html', '/admin-embarcaciones.html'
    ];

    if (protectedPages.includes(req.path) || req.path.startsWith('/api/admin')) {
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

app.use('/api', authLimiter, authRoutes); 
app.use('/api', globalLimiter, integranteRoutes);
app.use('/api/embarcaciones', globalLimiter, embarcacionMenorRoutes);
app.use('/api/admin', globalLimiter, adminRoutes);
app.use('/api', globalLimiter, anexoRoutes); 
app.use('/api/anexos', globalLimiter, anexoRoutes); 

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor seguro escuchando en el puerto ${PORT}`);
    console.log(`🛡️  Modo Rate Limit: ${isProduction ? 'ESTRICTO (Prod)' : 'RELAJADO (Dev)'}`);
});