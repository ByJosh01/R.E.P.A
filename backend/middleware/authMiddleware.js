// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../db');
const JWT_SECRET = process.env.JWT_SECRET;

exports.protect = async (req, res, next) => {
    let token;

    // Verificar si existe el header Authorization con Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extraer el token
            token = req.headers.authorization.split(' ')[1];
            
            // Verificar firma del token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Buscar usuario en DB y verificar que siga existiendo
            const [rows] = await pool.query(
                `SELECT u.id, u.curp, u.email, u.rol, s.solicitante_id 
                 FROM usuarios u 
                 LEFT JOIN solicitantes s ON u.id = s.usuario_id 
                 WHERE u.id = ?`,
                [decoded.id]
            );
            
            if (!rows[0]) {
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado.' });
            }

            // Adjuntar usuario a la request
            req.user = rows[0];
            return next(); // IMPORTANTE: Return para salir de la función

        } catch (error) {
            console.error("Error en auth middleware:", error.message);
            return res.status(401).json({ message: 'No autorizado, token inválido o expirado.' });
        }
    }

    // Si no había token en el header
    if (!token) {
        return res.status(401).json({ message: 'No autorizado, se requiere token.' });
    }
};

// Middleware para Admin Y Superadmin (Acciones compartidas)
exports.isAdminOrSuperAdmin = (req, res, next) => {
    const rol = req.user && req.user.rol;
    if (rol === 'superadmin' || rol === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol administrativo.' });
};

// Middleware SOLO para Superadmin (Acciones críticas)
exports.isSuperAdmin = (req, res, next) => {
    const rol = req.user && req.user.rol;
    if (rol === 'superadmin') {
        return next();
    }
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Superadministrador.' });
};