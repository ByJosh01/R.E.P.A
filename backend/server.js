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

app.use(express.static(path.join(__dirname, '../public')));

// RUTAS
app.use('/api', authRoutes);
app.use('/api', integranteRoutes);
app.use('/api/embarcaciones', embarcacionMenorRoutes);
app.use('/api/admin', adminRoutes);

// --- CAMBIO AQUÍ ---
// Dejamos la ruta original para que funcionen /perfil, /anexo1, /anexo3, etc.
app.use('/api', anexoRoutes); 
// Y añadimos la nueva para que funcione específicamente /api/anexos/acuacultura
app.use('/api/anexos', anexoRoutes); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`¡Servidor MVC encendido en http://localhost:${PORT}`);
});