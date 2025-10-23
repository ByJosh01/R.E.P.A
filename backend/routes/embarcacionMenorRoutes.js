// backend/routes/embarcacionMenorRoutes.js

const express = require('express');
const router = express.Router();
const embarcacionMenorController = require('../controllers/embarcacionMenorController');
const { protect } = require('../middleware/authMiddleware');

// Usamos protect en todas las rutas para asegurar que el usuario esté autenticado

// GET /api/embarcaciones -> Obtiene todas las embarcaciones del usuario
router.get('/', protect, embarcacionMenorController.getEmbarcaciones);

// POST /api/embarcaciones -> Añade una nueva embarcación
router.post('/', protect, embarcacionMenorController.addEmbarcacion);

// PUT /api/embarcaciones/:id -> Actualiza una embarcación por su ID
router.put('/:id', protect, embarcacionMenorController.updateEmbarcacion);

// DELETE /api/embarcaciones/:id -> Elimina una embarcación por su ID
router.delete('/:id', protect, embarcacionMenorController.deleteEmbarcacion);

module.exports = router;