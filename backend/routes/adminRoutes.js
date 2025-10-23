// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');

// Esta ruta usa ambos middlewares para máxima seguridad
router.get('/solicitantes', protect, isSuperAdmin, adminController.getAllSolicitantes);

module.exports = router;

// Ruta para resetear la base de datos (acción destructiva, usamos POST)
router.post('/reset-database', protect, isSuperAdmin, adminController.resetDatabase);
// NUEVA RUTA para eliminar un solicitante por su ID
router.delete('/solicitantes/:id', protect, isSuperAdmin, adminController.deleteSolicitante);
router.get('/solicitantes/:id', protect, isSuperAdmin, adminController.getSolicitanteById);
router.put('/solicitantes/:id', protect, isSuperAdmin, adminController.updateSolicitante);
router.get('/usuarios', protect, isSuperAdmin, adminController.getAllUsuarios);
router.get('/integrantes', protect, isSuperAdmin, adminController.getAllIntegrantes);
router.get('/embarcaciones', protect, isSuperAdmin, adminController.getAllEmbarcaciones);
// --- NUEVA RUTA PARA OBTENER LOS DETALLES COMPLETOS DE UN SOLICITANTE ---
router.get('/solicitante-detalles/:id', protect, isSuperAdmin, adminController.getSolicitanteDetails);
// Usamos GET porque estamos "obteniendo" un archivo, no cambiando datos.
router.get('/backup-database', protect, isSuperAdmin, adminController.backupDatabase);

module.exports = router;

