// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator'); // <-- 1. IMPORTAR EL VALIDADOR

// =================================================================
// ==== INICIO: AÑADIR BLOQUES DE VALIDACIÓN ====
// =================================================================

// 2. AÑADIR VALIDACIÓN a la ruta '/registro'
router.post('/registro', [
    body('curp', 'El CURP es obligatorio y debe tener 18 caracteres.')
        .isLength({ min: 18, max: 18 })
        .trim() // Quita espacios en blanco
        .escape(), // Previene ataques XSS
    body('email', 'Por favor, introduce un correo válido.')
        .isEmail()
        .normalizeEmail(), // Limpia el email (ej. quita puntos en gmail)
    body('password', 'La contraseña debe tener al menos 8 caracteres.')
        .isLength({ min: 8 })
], authController.registerUser); // El controlador se ejecuta después de la validación

// 3. AÑADIR VALIDACIÓN a la ruta '/login'
router.post('/login', [
    body('curp', 'El CURP es obligatorio.').not().isEmpty().trim().escape(),
    body('password', 'La contraseña es obligatoria.').not().isEmpty()
], authController.loginUser);

// 4. AÑADIR VALIDACIÓN a la ruta '/forgot-password'
router.post('/forgot-password', [
    body('email', 'Por favor, introduce un correo válido.')
        .isEmail()
        .normalizeEmail()
], authController.forgotPassword);

// 5. AÑADIR VALIDACIÓN a la ruta '/reset-password'
router.post('/reset-password', [
    body('token', 'El token es obligatorio.').not().isEmpty().trim().escape(),
    body('newPassword', 'La nueva contraseña debe tener al menos 8 caracteres.')
        .isLength({ min: 8 })
], authController.resetPassword);

// =================================================================
// ==== FIN: BLOQUES DE VALIDACIÓN ====
// =================================================================

module.exports = router;