// backend/server.js
require('dotenv').config({ path: ['.env.local', '.env'] });
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit');
const hpp = require('hpp'); 
const jwt = require('jsonwebtoken'); 

// Importación de Rutas
const authRoutes = require('./routes/authRoutes');
const anexoRoutes = require('./routes/anexoRoutes');
const integranteRoutes = require('./routes/integranteRoutes');
const embarcacionMenorRoutes = require('./routes/embarcacionMenorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 0. DETECCIÓN DE ENTORNO
const isProduction = process.env.NODE_ENV === 'production';

// 1. HARDENING BÁSICO
app.disable('x-powered-by');
app.set('trust proxy', 1); 

// 2. LIMITADORES

// A) Limitador Global con "Pase SEGURO" (Para navegación diaria)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5000, 
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { message: 'Sistema saturado. Espere unos minutos.' },
    skip: (req, res) => {
        if (req.method === 'OPTIONS') return true; // Ignorar preflight CORS
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Si es admin, pase SEGURO
                if (decoded.rol === 'admin' || decoded.rol === 'superadmin') return true; 
            } catch (e) { return false; }
        }
        return false;
    }
});

// B) Limitador Estricto (SOLO para Login/Registro)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: isProduction ? 30 : 100, // Estricto
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de acceso/login.' }
});

// 3. CORS
const whiteList = [
    'https://proyecto-repa.onrender.com', 
    'http://localhost:5500',              
    'http://127.0.0.1:5500',              
    'http://localhost:3000',              
    'http://localhost:8080',              
    'http://127.0.0.1:8080'               
];
app.use(cors({
    origin: function (origin, callback) {
        if (whiteList.includes(origin) || !origin) callback(null, true);
        else callback(new Error('Acceso denegado por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. MIDDLEWARES GLOBALES
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.google.com", "https://www.gstatic.com", "https://cdnjs.cloudflare.com"],
            "frame-src": ["'self'", "https://www.google.com"],
            "img-src": ["'self'", "data:", "https:"],
            "connect-src": ["'self'", "https://www.google.com"] 
        },
    })
);
app.use(express.json({ limit: '10kb' })); 
app.use(hpp()); 
app.use((req, res, next) => {
    const protectedPages = [
        '/dashboard.html', '/admin.html', '/panel-admin.html', '/anexos.html',
        '/datos-personales.html', '/detalle-solicitante.html', '/admin-usuarios.html',
        '/admin-integrantes.html', '/admin-embarcaciones.html'
    ];
    if (protectedPages.includes(req.path) || req.path.startsWith('/api/admin')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
});
app.use(express.static(path.join(__dirname, '../public')));

// =================================================================
// ==== RUTAS API (CORREGIDO - EL SECRETO ESTÁ AQUÍ) ====
// =================================================================

// 1. APLICAMOS EL CANDADO ESTRICTO **SOLO** A LAS RUTAS DE LOGIN/REGISTRO
// (Asumiendo que tus rutas son /api/login, /api/register, etc.)
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api/reset-password', authLimiter);

// 2. CARGAMOS TODAS LAS RUTAS DE AUTH
// (Ya protegimos las sensibles arriba, el resto pasan normal)
app.use('/api', authRoutes); 

// 3. RUTAS PROTEGIDAS CON "PASE SEGURO"
// (Aquí aplica el globalLimiter que sí respeta tu rol de Admin)
app.use('/api', globalLimiter, integranteRoutes);
app.use('/api/embarcaciones', globalLimiter, embarcacionMenorRoutes);
app.use('/api/admin', globalLimiter, adminRoutes);
app.use('/api', globalLimiter, anexoRoutes); 
app.use('/api/anexos', globalLimiter, anexoRoutes); 

// FRONTEND
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public', 'home.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor REPA escuchando en puerto ${PORT}`);
    console.log(`🛡️  Rate Limits Configurados Correctamente (Pase SEGURO Activo)`);
});