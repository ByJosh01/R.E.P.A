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

// 0. DETECCIÓN DE ENTORNO (Para ajustar seguridad)
const isProduction = process.env.NODE_ENV === 'production';

// 1. OCULTAR TECNOLOGÍA
app.disable('x-powered-by');

// 2. TRUST PROXY (CRÍTICO PARA RENDER)
// Permite que Express confíe en el balanceador de carga de Render para leer la IP real del usuario
app.set('trust proxy', 1); 

// 3. RATE LIMIT (PROTECCIÓN DDOS DIFERENCIADA)

// A) Limitador General (Para navegación normal de la API)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // 1000 peticiones
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { message: 'Demasiadas peticiones generales. Calma un poco.' }
});

// B) Limitador Estricto (Para Login/Registro - Anti Fuerza Bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    // LÓGICA DINÁMICA:
    // En Producción (Render): 10 intentos (Seguridad Máxima)
    // En Local (PC): 100 intentos (Comodidad para Desarrollo)
    max: isProduction ? 10 : 100, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de acceso. Intenta más tarde.' }
});

// 4. CORS SEGURO
const whiteList = [
    'https://proyecto-repa.onrender.com', // Producción (Render)
    'http://localhost:5500',              // Desarrollo Local (Live Server)
    'http://127.0.0.1:5500',              // Desarrollo Local IP
    'http://localhost:3000',              // Backend directo
    'http://localhost:8080',              // Frontend Docker
    'http://127.0.0.1:8080'               // Frontend Docker IP
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitimos peticiones sin origen (como Postman) SOLO si no estamos en producción
        // O si el origen está en la lista blanca
        if (whiteList.includes(origin) || (!origin && !isProduction)) {
            callback(null, true);
        } else {
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

// Limitar tamaño del body JSON a 10kb para prevenir ataques DoS de memoria
app.use(express.json({ limit: '10kb' })); 
app.use(hpp()); // Protección contra contaminación de parámetros HTTP

// Middleware Anti-Caché para páginas protegidas
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

// Aplicamos el limitador ESTRICTO solo a autenticación
app.use('/api', authLimiter, authRoutes); 

// Aplicamos el limitador GENERAL al resto de rutas
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