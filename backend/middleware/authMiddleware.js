// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../db');
const JWT_SECRET = process.env.JWT_SECRET;

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            // ACTUALIZADO: Ahora también selecciona "u.rol"
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

            req.user = rows[0];
            next();
        } catch (error) {
            console.error("Error en middleware:", error);
            res.status(401).json({ message: 'No autorizado, el token falló o ha expirado.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no se encontró token en la petición.' });
    }
};

// NUEVO: Middleware para verificar si el usuario es Superadmin
exports.isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.rol === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de superadministrador.' });
    }
};