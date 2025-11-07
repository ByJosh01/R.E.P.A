// backend/routes/integranteRoutes.js
const express = require('express');
const router = express.Router();
const integranteController = require('../controllers/IntegranteController');
const { protect } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// GET /api/integrantes -> Obtiene todos los integrantes (del solicitante logueado)
router.get('/integrantes', protect, integranteController.getIntegrantes);

// POST /api/integrantes -> Añade un nuevo integrante
router.post('/integrantes', 
    protect, 
    [
        // Reglas de validación basadas en integranteModel.js
        body('nombre_completo', 'El nombre completo es obligatorio').not().isEmpty().trim().escape(),
        body('rfc', 'El RFC no es válido (12-13 caracteres)')
            .optional({ checkFalsy: true }) // Permite que sea opcional (null o string vacío)
            .isLength({ min: 12, max: 13 })
            .trim()
            .escape(),
        body('curp', 'El CURP debe tener 18 caracteres')
            .not().isEmpty() // CURP es obligatorio
            .isLength({ min: 18, max: 18 })
            .trim()
            .escape(),
        body('telefono', 'El teléfono no es válido (10-15 dígitos)')
            .optional({ checkFalsy: true })
            .isLength({ min: 10, max: 15 })
            .isNumeric() // Asegura que solo sean números
            .trim(),
        body('sexo', 'El sexo no es válido').optional({ checkFalsy: true }).trim().escape(),
        body('ultimo_grado_estudio', 'Grado de estudio no válido').optional({ checkFalsy: true }).trim().escape(),
        body('actividad_desempena', 'La actividad no es válida').optional({ checkFalsy: true }).trim().escape(), // Tu modelo espera 'actividad_desempena'
        body('localidad', 'La localidad no es válida').optional({ checkFalsy: true }).trim().escape(),
        body('municipio', 'El municipio no es válido').optional({ checkFalsy: true }).trim().escape(),
    ], 
    integranteController.addIntegrante
);

// GET /api/integrantes/:id -> Obtiene un integrante por su ID (para editar)
router.get('/integrantes/:id', 
    protect, 
    [
        param('id', 'El ID del integrante no es válido').isInt({ min: 1 }) // Valida que el ID sea un entero positivo
    ],
    integranteController.getIntegranteById
);

// PUT /api/integrantes/:id -> Actualiza un integrante por su ID
router.put('/integrantes/:id', 
    protect, 
    [ 
        param('id', 'El ID del integrante no es válido').isInt({ min: 1 }),
        
        // Mismas reglas que el POST
        body('nombre_completo', 'El nombre completo es obligatorio').not().isEmpty().trim().escape(),
        body('rfc', 'El RFC no es válido (12-13 caracteres)')
            .optional({ checkFalsy: true })
            .isLength({ min: 12, max: 13 })
            .trim()
            .escape(),
        body('curp', 'El CURP debe tener 18 caracteres')
            .not().isEmpty()
            .isLength({ min: 18, max: 18 })
            .trim()
            .escape(),
        body('telefono', 'El teléfono no es válido (10-15 dígitos)')
            .optional({ checkFalsy: true })
            .isLength({ min: 10, max: 15 })
            .isNumeric()
            .trim(),
        body('sexo', 'El sexo no es válido').optional({ checkFalsy: true }).trim().escape(),
        body('ultimo_grado_estudio', 'Grado de estudio no válido').optional({ checkFalsy: true }).trim().escape(),
        body('actividad_desempena', 'La actividad no es válida').optional({ checkFalsy: true }).trim().escape(),
        body('localidad', 'La localidad no es válida').optional({ checkFalsy: true }).trim().escape(),
        body('municipio', 'El municipio no es válido').optional({ checkFalsy: true }).trim().escape(),
    ], 
    integranteController.updateIntegrante
);

// DELETE /api/integrantes/:id -> Elimina un integrante por su ID
router.delete('/integrantes/:id', 
    protect, 
    [ 
        param('id', 'El ID del integrante no es válido').isInt({ min: 1 })
    ],
    integranteController.deleteIntegrante
);

module.exports = router;