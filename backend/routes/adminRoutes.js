// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// MODIFICADO: Importamos ambos middlewares
const { protect, isAdminOrSuperAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// --- Rutas compartidas (Admin y Superadmin) ---
router.get('/solicitantes', protect, isAdminOrSuperAdmin, adminController.getAllSolicitantes);
router.delete('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.deleteSolicitante);
router.get('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.getSolicitanteById);
router.put('/solicitantes/:id', protect, isAdminOrSuperAdmin, adminController.updateSolicitante);
router.get('/integrantes', protect, isAdminOrSuperAdmin, adminController.getAllIntegrantes);
router.get('/embarcaciones', protect, isAdminOrSuperAdmin, adminController.getAllEmbarcaciones);
router.get('/solicitante-detalles/:id', protect, isAdminOrSuperAdmin, adminController.getSolicitanteDetails);


// --- Rutas Exclusivas de SUPERADMIN ---
// (Gestionar cuentas de usuario y acciones peligrosas)
router.get('/usuarios', protect, isSuperAdmin, adminController.getAllUsuarios);
router.post('/reset-database', protect, isSuperAdmin, adminController.resetDatabase);
router.get('/backup-database', protect, isSuperAdmin, adminController.backupDatabase);


module.exports = router;
