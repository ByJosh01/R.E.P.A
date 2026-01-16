// backend/middleware/validateHelper.js
const { validationResult } = require('express-validator');

/**
 * Middleware para procesar los resultados de express-validator.
 * Si hay errores, devuelve 400 y detiene la ejecución.
 * Si no, pasa al siguiente controlador.
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Devolvemos solo el primer error para no saturar al cliente
        return res.status(400).json({ 
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array() // Opcional: enviar todos para depuración
        });
    }
    next();
};

module.exports = validateRequest;