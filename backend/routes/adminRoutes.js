// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdminOrSuperAdmin, isSuperAdmin } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// ==========================================
// RUTAS COMPARTIDAS (Admin y Superadmin)
// ==========================================

// --- 1. GESTIÓN DE SOLICITANTES ---
router.get('/solicitantes', protect, isAdminOrSuperAdmin, adminController.getAllSolicitantes);

router.delete('/solicitantes/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID del solicitante no es válido').isInt({ min: 1 })
    ], 
    adminController.deleteSolicitante
);

router.get('/solicitantes/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID del solicitante no es válido').isInt({ min: 1 })
    ], 
    adminController.getSolicitanteById
);

router.put('/solicitantes/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID del solicitante no es válido').isInt({ min: 1 }),
        // Validaciones opcionales
        body('nombre').optional({ checkFalsy: true }).trim().escape(),
        body('apellidoPaterno').optional({ checkFalsy: true }).trim().escape(),
        body('apellidoMaterno').optional({ checkFalsy: true }).trim().escape(),
        body('rfc').optional({ checkFalsy: true }).isLength({ min: 12, max: 13 }).trim().escape(),
        body('curp').optional({ checkFalsy: true }).isLength({ min: 18, max: 18 }).trim().escape(),
        body('telefono').optional({ checkFalsy: true }).isLength({ min: 10, max: 15 }).isNumeric().trim(),
        body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
        body('representanteLegal').optional({ checkFalsy: true }).trim().escape(),
        body('actividad').optional({ checkFalsy: true }).trim().escape(),
        body('entidad').optional({ checkFalsy: true }).trim().escape(),
        body('municipio').optional({ checkFalsy: true }).trim().escape(),
        body('localidad').optional({ checkFalsy: true }).trim().escape(),
        body('colonia').optional({ checkFalsy: true }).trim().escape(),
        body('cp').optional({ checkFalsy: true }).isLength({ min: 5, max: 5 }).isNumeric().trim(),
        body('calle').optional({ checkFalsy: true }).trim().escape(),
        body('numExterior').optional({ checkFalsy: true }).trim().escape(),
        body('numInterior').optional({ checkFalsy: true }).trim().escape(),
        body('numIntegrantes').optional({ checkFalsy: true }).isInt({ min: 0 }).toInt(),
    ], 
    adminController.updateSolicitante
);

router.get('/solicitante-detalles/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID del solicitante no es válido').isInt({ min: 1 })
    ], 
    adminController.getSolicitanteDetails
);

// --- 2. GESTIÓN DE INTEGRANTES ---
router.get('/integrantes', protect, isAdminOrSuperAdmin, adminController.getAllIntegrantes);

router.get('/integrante-pdf/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID del integrante no es válido').isInt({ min: 1 })
    ],
    adminController.downloadIntegranteIndividualPdf
);

// --- 3. GESTIÓN DE EMBARCACIONES ---
router.get('/embarcaciones', protect, isAdminOrSuperAdmin, adminController.getAllEmbarcaciones);

router.get('/embarcaciones/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID de la embarcación no es válido').isInt({ min: 1 })
    ], 
    adminController.getEmbarcacionById
);

router.put('/embarcaciones/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID de la embarcación no es válido').isInt({ min: 1 }),
        body('nombre_embarcacion', 'El nombre de la embarcación es obligatorio').not().isEmpty().trim().escape(),
        body('matricula', 'La matrícula es obligatoria').not().isEmpty().trim().escape(),
        body('tonelaje_neto', 'El tonelaje debe ser un número positivo').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
        body('marca', 'La marca no es válida').optional({ checkFalsy: true }).trim().escape(),
        body('numero_serie', 'El número de serie no es válido').optional({ checkFalsy: true }).trim().escape(),
        body('potencia_hp', 'La potencia (HP) debe ser un número positivo').optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
        body('puerto_base', 'El puerto base no es válido').optional({ checkFalsy: true }).trim().escape(),
    ], 
    adminController.updateEmbarcacionById
);

// --- NUEVA RUTA: Descargar PDF Individual de Embarcación ---
router.get('/embarcacion-pdf/:id', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('id', 'El ID de la embarcación no es válido').isInt({ min: 1 })
    ],
    adminController.downloadEmbarcacionIndividualPdf
);

// --- 4. REPORTES PDF GENERALES ---
router.get('/download-pdf/:solicitanteId', 
    protect, 
    isAdminOrSuperAdmin, 
    [
        param('solicitanteId', 'El ID del solicitante no es válido').isInt({ min: 1 })
    ], 
    adminController.downloadRegistroPdf
);

router.get('/download-reporte-general', protect, isAdminOrSuperAdmin, adminController.downloadGeneralReportPdf);


// ==========================================
// RUTAS EXCLUSIVAS DE SUPERADMIN
// ==========================================

// --- GESTIÓN DE USUARIOS (CUENTAS) ---
router.get('/usuarios', protect, isSuperAdmin, adminController.getAllUsuarios);

router.get('/usuarios/:id', 
    protect, 
    isSuperAdmin, 
    [
        param('id', 'El ID de usuario no es válido').isInt({ min: 1 })
    ], 
    adminController.getUsuarioById
);

router.put('/usuarios/:id', 
    protect, 
    isSuperAdmin, 
    [
        param('id', 'El ID de usuario no es válido').isInt({ min: 1 }),
        body('email', 'El email no es válido').not().isEmpty().isEmail().normalizeEmail(),
        body('curp', 'El CURP debe tener 18 caracteres').not().isEmpty().isLength({ min: 18, max: 18 }).trim().escape(),
        body('rol', 'El rol no es válido').not().isEmpty().isIn(['solicitante', 'admin', 'superadmin']).trim().escape(),
    ], 
    adminController.updateUsuario
);

router.get('/download-reporte-usuarios', protect, isSuperAdmin, adminController.downloadUsuariosReportPdf);

router.get('/usuario-pdf/:id', 
    protect, 
    isSuperAdmin, 
    [
        param('id', 'El ID de usuario no es válido').isInt({ min: 1 })
    ],
    adminController.downloadUsuarioIndividualPdf
);

// --- GESTIÓN DE BASE DE DATOS ---
router.post('/reset-database', protect, isSuperAdmin, adminController.resetDatabase);
router.get('/backup-database', protect, isSuperAdmin, adminController.backupDatabase);

module.exports = router;