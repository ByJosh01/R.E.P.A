// backend/routes/anexoRoutes.js
const express = require('express');
const router = express.Router();
const anexoController = require('../controllers/anexoController');
const { protect } = require('../middleware/authMiddleware');



// Rutas para Anexo 1
router.post('/anexo1', protect, anexoController.saveAnexo1);
router.get('/perfil', protect, anexoController.getPerfil);

// Rutas para Anexo 3
router.get('/anexo3', protect, anexoController.getAnexo3);
router.post('/anexo3', protect, anexoController.saveAnexo3);

// Rutas para Anexo 4 (Acuacultura)
router.post('/acuacultura', protect, anexoController.createAnexo4Acuacultura);
// --- LÍNEA AÑADIDA ---
router.get('/acuacultura', protect, anexoController.getAnexo4Acuacultura);

module.exports = router;