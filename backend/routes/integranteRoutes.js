// backend/routes/integranteRoutes.js
const express = require('express');
const router = express.Router();
const integranteController = require('../controllers/IntegranteController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/integrantes -> Obtiene todos los integrantes (del solicitante logueado)
router.get('/integrantes', protect, integranteController.getIntegrantes);

// POST /api/integrantes -> Añade un nuevo integrante
router.post('/integrantes', protect, integranteController.addIntegrante);

// ▼▼▼ RUTA AÑADIDA ▼▼▼
// GET /api/integrantes/:id -> Obtiene un integrante por su ID (para editar)
router.get('/integrantes/:id', protect, integranteController.getIntegranteById);
// ▲▲▲ FIN RUTA AÑADIDA ▲▲▲

// PUT /api/integrantes/:id -> Actualiza un integrante por su ID
router.put('/integrantes/:id', protect, integranteController.updateIntegrante);

// DELETE /api/integrantes/:id -> Elimina un integrante por su ID
router.delete('/integrantes/:id', protect, integranteController.deleteIntegrante);

module.exports = router;