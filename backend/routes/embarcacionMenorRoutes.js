// backend/routes/embarcacionMenorRoutes.js
const express = require('express');
const router = express.Router();
const embarcacionMenorController = require('../controllers/embarcacionMenorController');
const { protect } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// GET /api/embarcaciones -> Obtiene todas las embarcaciones del usuario
router.get('/', protect, embarcacionMenorController.getEmbarcaciones);

// POST /api/embarcaciones -> Añade una nueva embarcación
router.post('/', 
    protect, 
    [
        // Reglas de validación basadas en embarcacionMenorModel.js
        body('nombre_embarcacion', 'El nombre de la embarcación es obligatorio').not().isEmpty().trim().escape(),
        body('matricula', 'La matrícula es obligatoria').not().isEmpty().trim().escape(),
        body('tonelaje_neto', 'El tonelaje debe ser un número positivo')
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 }) // Acepta decimales
            .toFloat(), // Convierte a número
        body('marca', 'La marca no es válida').optional({ checkFalsy: true }).trim().escape(),
        body('numero_serie', 'El número de serie no es válido').optional({ checkFalsy: true }).trim().escape(),
        body('potencia_hp', 'La potencia (HP) debe ser un número positivo')
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 })
            .toFloat(),
        body('puerto_base', 'El puerto base no es válido').optional({ checkFalsy: true }).trim().escape(),
    ], 
    embarcacionMenorController.addEmbarcacion
);

// PUT /api/embarcaciones/:id -> Actualiza una embarcación por su ID
router.put('/:id', 
    protect, 
    [
        param('id', 'El ID de la embarcación no es válido').isInt({ min: 1 }),
        
        // Mismas reglas que el POST
        body('nombre_embarcacion', 'El nombre de la embarcación es obligatorio').not().isEmpty().trim().escape(),
        body('matricula', 'La matrícula es obligatoria').not().isEmpty().trim().escape(),
        body('tonelaje_neto', 'El tonelaje debe ser un número positivo')
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 })
            .toFloat(),
        body('marca', 'La marca no es válida').optional({ checkFalsy: true }).trim().escape(),
        body('numero_serie', 'El número de serie no es válido').optional({ checkFalsy: true }).trim().escape(),
        body('potencia_hp', 'La potencia (HP) debe ser un número positivo')
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 })
            .toFloat(),
        body('puerto_base', 'El puerto base no es válido').optional({ checkFalsy: true }).trim().escape(),
    ], 
    embarcacionMenorController.updateEmbarcacion
);

// DELETE /api/embarcaciones/:id -> Elimina una embarcación por su ID
router.delete('/:id', 
    protect, 
    [
        param('id', 'El ID de la embarcación no es válido').isInt({ min: 1 })
    ], 
    embarcacionMenorController.deleteEmbarcacion
);

module.exports = router;