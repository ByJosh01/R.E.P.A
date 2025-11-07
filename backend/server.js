// backend/server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');

// --- 1. DEPENDENCIAS DE SEGURIDAD AÑADIDAS ---
// Estas librerías las instalaste con: npm install helmet express-rate-limit
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit');
// --- FIN DE DEPENDENCIAS AÑADIDAS ---

// Tus rutas (esto está igual)
const authRoutes = require('./routes/authRoutes');
const anexoRoutes = require('./routes/anexoRoutes');
const integranteRoutes = require('./routes/integranteRoutes');
const embarcacionMenorRoutes = require('./routes/embarcacionMenorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// =================================================================
// ==== INICIO: BLOQUE DE CONFIGURACIÓN DE SEGURIDAD ====
// =================================================================

// --- 2. CONFIGURACIÓN DE CORS SEGURO ---
// (Esto reemplaza tu app.use(cors()) simple)
// ¡¡RECUERDA CAMBIAR ESTO POR TU URL REAL DE RENDER!!
const whiteList = [
    'https://tu-proyecto.onrender.com', // <-- CAMBIA ESTO
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:3000' // Para tu desarrollo local
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin 'origin' (como las de Postman o apps móviles)
        // o si el origen está en nuestra lista blanca (whiteList)
        if (whiteList.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Acceso denegado por CORS'));
        }
    }
};

app.use(cors(corsOptions)); // Aplicamos la configuración segura de CORS

// --- 3. CONFIGURACIÓN DE HELMET (PARA PERMITIR RECAPTCHA) ---
// (Esto es nuevo)
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            // Permitir scripts de 'self' (tu dominio), google.com y gstatic.com
            "script-src": ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/"],
            // Permitir iframes (donde vive el widget) de google.com
            "frame-src": ["'self'", "https://www.google.com/recaptcha/"]
        },
    })
);

// --- 4. CONFIGURACIÓN DE RATE LIMIT ---
// (Esto es nuevo)
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 1000, // <-- AUMENTA ESTE NÚMERO (antes era 100)
	standardHeaders: true, 
	legacyHeaders: false, 
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.'
});

// =================================================================
// ==== FIN: BLOQUE DE CONFIGURACIÓN DE SEGURIDAD ====
// =================================================================

// (Esto es de tu código original)
app.use(express.json());

// (Tu middleware anti-caché. Esto está perfecto y se queda igual)
app.use((req, res, next) => {
    const protectedPages = [
        '/dashboard.html',
        '/admin.html',
        '/panel-admin.html',
        '/anexos.html',
        '/datos-personales.html',
        '/detalle-solicitante.html',
        '/admin-usuarios.html',
        '/admin-integrantes.html',
        '/admin-embarcaciones.html'
    ];

    if (protectedPages.includes(req.path)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// (Tu línea de estáticos. Esto está perfecto y se queda igual)
app.use(express.static(path.join(__dirname, '../public')));

// (Tu ruta raíz. Esto está perfecto y se queda igual)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

// --- 5. RUTAS API (MODIFICADAS PARA USAR EL LIMITADOR) ---
app.use('/api', apiLimiter, authRoutes); 
app.use('/api', apiLimiter, integranteRoutes);
app.use('/api/embarcaciones', apiLimiter, embarcacionMenorRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api', apiLimiter, anexoRoutes); 
app.use('/api/anexos', apiLimiter, anexoRoutes); 
// --- FIN DE RUTAS API ---

// (Tu puerto. Esto está perfecto y se queda igual)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});