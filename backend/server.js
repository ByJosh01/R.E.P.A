// backend/server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const anexoRoutes = require('./routes/anexoRoutes');
const integranteRoutes = require('./routes/integranteRoutes');
const embarcacionMenorRoutes = require('./routes/embarcacionMenorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// =================================================================
// ==== INICIO: MIDDLEWARE ANTI-CACHÉ (¡AÑADIDO AQUÍ!) ====
// =================================================================
// Esto le ordena al navegador "No guardes la 'foto' de estas páginas".
app.use((req, res, next) => {
    // Lista de tus páginas HTML protegidas
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
        // ...agrega aquí cualquier otra página que requiera login
    ];

    if (protectedPages.includes(req.path)) {
        // Estas cabeceras fuerzan al navegador a no usar la caché
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});
// =================================================================
// ==== FIN: MIDDLEWARE ANTI-CACHÉ ====
// =================================================================

// Tu línea de archivos estáticos AHORA VA DESPUÉS del middleware
app.use(express.static(path.join(__dirname, '../public')));

// Ruta para la raíz '/'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

// RUTAS API
app.use('/api', authRoutes);
app.use('/api', integranteRoutes);
app.use('/api/embarcaciones', embarcacionMenorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', anexoRoutes); 
app.use('/api/anexos', anexoRoutes); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});