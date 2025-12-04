// backend/middleware/validateHelper.js
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};

// OJO AQUÍ: Debe ser module.exports directo
module.exports = validateRequest;