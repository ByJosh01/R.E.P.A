// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
// 1. IMPORTAR EL MIDDLEWARE DE VALIDACIÓN
const validateRequest = require('../middleware/validateHelper'); 

// =================================================================
// ==== RUTAS CON VALIDACIÓN CENTRALIZADA ====
// =================================================================

// 1. Registro de Usuario
router.post('/registro', [
    body('curp', 'El CURP es obligatorio y debe tener 18 caracteres.')
        .isLength({ min: 18, max: 18 })
        .trim()
        .escape(),
    body('email', 'Por favor, introduce un correo válido.')
        .isEmail()
        .normalizeEmail(),
    body('password', 'La contraseña debe tener al menos 8 caracteres.')
        .isLength({ min: 8 })
], validateRequest, authController.registerUser); // <--- Middleware inyectado

// 2. Inicio de Sesión
router.post('/login', [
    body('curp', 'El CURP es obligatorio.').not().isEmpty().trim().escape(),
    body('password', 'La contraseña es obligatoria.').not().isEmpty()
], validateRequest, authController.loginUser);

// 3. Solicitar recuperación de contraseña
router.post('/forgot-password', [
    body('email', 'Por favor, introduce un correo válido.')
        .isEmail()
        .normalizeEmail()
], validateRequest, authController.forgotPassword);

// 4. Ejecutar cambio de contraseña
router.post('/reset-password', [
    body('token', 'El token es obligatorio.').not().isEmpty().trim().escape(),
    body('newPassword', 'La nueva contraseña debe tener al menos 8 caracteres.')
        .isLength({ min: 8 })
], validateRequest, authController.resetPassword);

module.exports = router;