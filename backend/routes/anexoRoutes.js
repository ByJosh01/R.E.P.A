// backend/routes/anexoRoutes.js
const express = require('express');
const router = express.Router();
const anexoController = require('../controllers/anexoController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Rutas para Anexo 1 (Basado en solicitanteModel.js -> updateAnexo1)
router.post('/anexo1', 
    protect, 
    [
        // Reglas de validación basadas en solicitanteModel.js
        body('nombre', 'El nombre es obligatorio').not().isEmpty().trim().escape(),
        body('apellidoPaterno', 'El apellido paterno es obligatorio').not().isEmpty().trim().escape(),
        body('apellidoMaterno', 'El apellido materno es obligatorio').not().isEmpty().trim().escape(),
        body('rfc', 'El RFC es obligatorio y debe tener 12-13 caracteres')
            .not().isEmpty()
            .isLength({ min: 12, max: 13 })
            .trim().escape(),
        body('curp', 'El CURP es obligatorio y debe tener 18 caracteres')
            .not().isEmpty()
            .isLength({ min: 18, max: 18 })
            .trim().escape(),
        body('telefono', 'El teléfono es obligatorio (10-15 dígitos)')
            .not().isEmpty()
            .isLength({ min: 10, max: 15 })
            .isNumeric()
            .trim(),
        body('email', 'El correo electrónico es obligatorio').not().isEmpty().isEmail().normalizeEmail(),
        body('representanteLegal').optional({ checkFalsy: true }).trim().escape(),
        body('actividad', 'El campo de actividad es obligatoria').not().isEmpty().trim().escape(),
        body('entidad', 'La entidad es obligatoria').not().isEmpty().trim().escape(),
        body('municipio', 'El municipio es obligatorio').not().isEmpty().trim().escape(),
        body('localidad', 'La localidad es obligatoria').not().isEmpty().trim().escape(),
        body('colonia', 'La colonia es obligatoria').not().isEmpty().trim().escape(),
        body('cp', 'El Código Postal es obligatorio (5 dígitos)')
            .not().isEmpty()
            .isLength({ min: 5, max: 5 })
            .isNumeric()
            .trim(),
        body('calle', 'La calle es obligatoria').not().isEmpty().trim().escape(),
        body('numExterior', 'El No. Exterior es obligatorio').not().isEmpty().trim().escape(),
        body('numInterior').optional({ checkFalsy: true }).trim().escape(),
        body('numIntegrantes', 'El No. de integrantes debe ser un número')
            .not().isEmpty()
            .isInt({ min: 0 })
            .toInt(),
        body('fecha', 'La fecha no es válida').not().isEmpty().isISO8601().toDate(),
    ], 
    anexoController.saveAnexo1
);

router.get('/perfil', protect, anexoController.getPerfil);

// Rutas para Anexo 3 (Basado en anexo3PescaModel.js)
router.get('/anexo3', protect, anexoController.getAnexo3);

router.post('/anexo3', 
    protect, 
    [
        // Reglas basadas en anexo3PescaModel.js
        body('lugar_captura').optional({ checkFalsy: true }).trim().escape(),
        body('localidad_captura').optional({ checkFalsy: true }).trim().escape(),
        body('municipio_captura').optional({ checkFalsy: true }).trim().escape(),
        body('sitio_desembarque').optional({ checkFalsy: true }).trim().escape(),
        body('localidad_desembarque').optional({ checkFalsy: true }).trim().escape(),
        body('municipio_desembarque').optional({ checkFalsy: true }).trim().escape(),
        
        // [SEGURIDAD XSS] Validación profunda de arrays
        body('pesqueria').optional().isArray().withMessage('Pesquería debe ser un arreglo'),
        body('pesqueria.*').trim().escape(), // Limpia cada elemento del array

        body('tipo_pesqueria').optional({ checkFalsy: true }).trim().escape(),
        body('arte_pesca_string').optional({ checkFalsy: true }).trim().escape(),
        body('especies_objetivo_string').optional({ checkFalsy: true }).trim().escape(),
        body('certificados_string').optional({ checkFalsy: true }).trim().escape(),
        body('nivel_produccion_anual').optional({ checkFalsy: true }).trim().escape(), // El modelo lo trata como string
        body('produccion_unidad').optional({ checkFalsy: true }).trim().escape(),
    ], 
    anexoController.saveAnexo3
);

// Rutas para Anexo 4 (Acuacultura) (Basado en anexo4AcuaculturaModel.js)
router.post('/acuacultura', 
    protect, 
    [
        // Reglas basadas en anexo4AcuaculturaModel.js
        body('instalacionPropia', 'El valor de instalación debe ser "si", "no" o nulo')
            .optional({ checkFalsy: true }) // Permite que sea null
            .isIn(['si', 'no']),
        body('contratoArrendamientoAnos', 'Años de arrendamiento debe ser un número entero')
            .optional({ checkFalsy: true })
            .isInt({ min: 0 })
            .toInt(),
        body('dimensionesUnidad').optional({ checkFalsy: true }).trim().escape(),
        body('tipo').optional({ checkFalsy: true }).trim().escape(),
        
        // [SEGURIDAD XSS] Validación profunda de arrays
        body('especies').optional().isArray().withMessage('Especies debe ser un arreglo'),
        body('especies.*').trim().escape(), // Limpia cada elemento del array

        body('especiesOtras').optional({ checkFalsy: true }).trim().escape(),
        body('tipoInstalacion').optional({ checkFalsy: true }).trim().escape(),
        body('sistemaProduccion').optional({ checkFalsy: true }).trim().escape(),
        body('produccionAnualValor', 'Producción (valor) debe ser un número')
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 })
            .toFloat(),
        body('produccionAnualUnidad').optional({ checkFalsy: true }).trim().escape(),
        
        // [SEGURIDAD XSS] Validación profunda de arrays
        body('certificados').optional().isArray().withMessage('Certificados debe ser un arreglo'),
        body('certificados.*').trim().escape(), // Limpia cada elemento del array

        body('certificadoSanidadCual').optional({ checkFalsy: true }).trim().escape(),
        body('certificadoInocuidadCual').optional({ checkFalsy: true }).trim().escape(),
        body('certificadoBuenasPracticasCual').optional({ checkFalsy: true }).trim().escape(),
        body('certificadoOtrosCual').optional({ checkFalsy: true }).trim().escape(),
    ], 
    anexoController.createAnexo4Acuacultura
);

router.get('/acuacultura', protect, anexoController.getAnexo4Acuacultura);

module.exports = router;