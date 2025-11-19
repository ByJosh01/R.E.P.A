// backend/models/userModel.js
const pool = require('../db');
const bcrypt = require('bcryptjs');

const findUserByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0] || null;
};

const findUserByCurp = async (curp) => {
    // Aseguramos mayúsculas consistentes
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE curp = ?', [curp.toUpperCase()]);
    return rows[0] || null;
};

const createUser = async (userData) => {
    const { curp, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Obtenemos una conexión dedicada del pool para la transacción
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. Insertar en tabla usuarios
        const [userResult] = await connection.query(
            'INSERT INTO usuarios (curp, email, password) VALUES (?, ?, ?)',
            [curp.toUpperCase(), email, hashedPassword]
        );
        const newUserId = userResult.insertId;

        // 2. Insertar perfil en tabla solicitantes
        // Importante: Usamos la misma conexión 'connection' para mantener la transacción
        await connection.query(
            'INSERT INTO solicitantes (usuario_id, curp, correo_electronico) VALUES (?, ?, ?)',
            [newUserId, curp.toUpperCase(), email]
        );
        
        // Si todo salió bien, guardamos los cambios
        await connection.commit();
        
        return { id: newUserId, curp, email };

    } catch (error) {
        // Si algo falla, revertimos todo
        await connection.rollback();
        console.error("❌ Error en transacción createUser:", error);
        throw error; // Re-lanzamos el error para que el controlador lo vea
    } finally {
        // SIEMPRE liberamos la conexión, pase lo que pase
        connection.release();
    }
};

const updateUserPassword = async (email, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = ? WHERE email = ?', [hashedPassword, email]);
};

const saveResetToken = async (email, token, expires) => {
    // Eliminamos tokens viejos del mismo usuario para mantener limpieza
    await pool.query('DELETE FROM password_reset_tokens WHERE email = ?', [email]);
    await pool.query(
        'INSERT INTO password_reset_tokens (email, token, expires) VALUES (?, ?, ?)',
        [email, token, new Date(expires)]
    );
};

const findTokenData = async (token) => {
    const [rows] = await pool.query('SELECT * FROM password_reset_tokens WHERE token = ?', [token]);
    return rows[0] || null;
};

const deleteResetToken = async (token) => {
    await pool.query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
};

module.exports = {
    findUserByEmail,
    findUserByCurp,
    createUser,
    updateUserPassword,
    saveResetToken,
    findTokenData,
    deleteResetToken
};