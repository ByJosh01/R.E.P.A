// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdminOrSuperAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// --- Rutas compartidas (Admin y Superadmin) ---
router.get('/solicitantes', protect, isAdminOrSuperAdmin, adminController.getAllSolicitantes);
router.delete('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.deleteSolicitante);
router.get('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.getSolicitanteById);
router.put('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.updateSolicitante);

router.get('/integrantes', protect, isAdminOrSuperAdmin, adminController.getAllIntegrantes);
// (Aquí también faltarían las rutas de editar integrantes, pero las podemos añadir después)

router.get('/embarcaciones', protect, isAdminOrSuperAdmin, adminController.getAllEmbarcaciones);
// ▼▼▼ NUEVAS RUTAS AÑADIDAS ▼▼▼
router.get('/embarcaciones/:id', protect, isAdminOrSuperAdmin, adminController.getEmbarcacionById);
router.put('/embarcaciones/:id', protect, isAdminOrSuperAdmin, adminController.updateEmbarcacionById);
// ▲▲▲ FIN NUEVAS RUTAS ▲▲▲

router.get('/solicitante-detalles/:id', protect, isAdminOrSuperAdmin, adminController.getSolicitanteDetails);
router.get('/download-pdf/:solicitanteId', protect, isAdminOrSuperAdmin, adminController.downloadRegistroPdf);
router.get('/download-reporte-general', protect, isAdminOrSuperAdmin, adminController.downloadGeneralReportPdf);


// --- Rutas Exclusivas de SUPERADMIN ---
router.get('/usuarios', protect, isSuperAdmin, adminController.getAllUsuarios);
router.get('/usuarios/:id', protect, isSuperAdmin, adminController.getUsuarioById); // Obtener un usuario
router.put('/usuarios/:id', protect, isSuperAdmin, adminController.updateUsuario); // Actualizar un usuario
router.post('/reset-database', protect, isSuperAdmin, adminController.resetDatabase);
router.get('/backup-database', protect, isSuperAdmin, adminController.backupDatabase);


module.exports = router;