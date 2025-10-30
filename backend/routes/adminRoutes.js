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
router.get('/embarcaciones', protect, isAdminOrSuperAdmin, adminController.getAllEmbarcaciones);
router.get('/solicitante-detalles/:id', protect, isAdminOrSuperAdmin, adminController.getSolicitanteDetails);
router.get('/download-pdf/:solicitanteId', protect, isAdminOrSuperAdmin, adminController.downloadRegistroPdf);
router.get('/download-reporte-general', protect, isAdminOrSuperAdmin, adminController.downloadGeneralReportPdf);


// --- Rutas Exclusivas de SUPERADMIN ---
router.get('/usuarios', protect, isSuperAdmin, adminController.getAllUsuarios);
// ▼▼▼ NUEVAS RUTAS ▼▼▼
router.get('/usuarios/:id', protect, isSuperAdmin, adminController.getUsuarioById); // Obtener un usuario
router.put('/usuarios/:id', protect, isSuperAdmin, adminController.updateUsuario); // Actualizar un usuario
// ▲▲▲ FIN NUEVAS RUTAS ▲▲▲
router.post('/reset-database', protect, isSuperAdmin, adminController.resetDatabase);
router.get('/backup-database', protect, isSuperAdmin, adminController.backupDatabase);


module.exports = router;