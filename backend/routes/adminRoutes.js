// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdminOrSuperAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// --- Rutas compartidas (Admin y Superadmin) ---
router.get('/solicitantes', protect, isAdminOrSuperAdmin, adminController.getAllSolicitantes);
router.delete('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.deleteSolicitante); // Usa solicitante_id
router.get('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.getSolicitanteById); // Usa solicitante_id
router.put('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.updateSolicitante); // Usa solicitante_id
router.get('/integrantes', protect, isAdminOrSuperAdmin, adminController.getAllIntegrantes);
router.get('/embarcaciones', protect, isAdminOrSuperAdmin, adminController.getAllEmbarcaciones);
router.get('/solicitante-detalles/:id', protect, isAdminOrSuperAdmin, adminController.getSolicitanteDetails); // Usa solicitante_id

// ▼▼▼ NUEVA RUTA PARA PDF ▼▼▼
// Usaremos solicitante_id directamente desde la URL
router.get('/download-pdf/:solicitanteId', protect, isAdminOrSuperAdmin, adminController.downloadRegistroPdf);
// ▲▲▲ FIN NUEVA RUTA ▲▲▲


// --- Rutas Exclusivas de SUPERADMIN ---
router.get('/usuarios', protect, isSuperAdmin, adminController.getAllUsuarios);
router.post('/reset-database', protect, isSuperAdmin, adminController.resetDatabase);
router.get('/backup-database', protect, isSuperAdmin, adminController.backupDatabase);


module.exports = router;