// backend/models/userModel.js
const pool = require('../db');
const bcrypt = require('bcryptjs');

const findUserByEmail = async (email) => {
    // Busca en la tabla 'usuarios'
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0] || null;
};

const findUserByCurp = async (curp) => {
    // Busca en la tabla 'usuarios'
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE curp = ?', [curp.toUpperCase()]);
    return rows[0] || null;
};

// --- FUNCIÓN CORREGIDA Y SIMPLIFICADA ---
const createUser = async (userData) => {
    const { curp, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        // 1. Insertamos el registro de autenticación en la tabla `usuarios`
        const [userResult] = await connection.query(
            'INSERT INTO usuarios (curp, email, password) VALUES (?, ?, ?)',
            [curp.toUpperCase(), email, hashedPassword]
        );
        const newUserId = userResult.insertId;

        // 2. Insertamos el perfil en la tabla `solicitantes`, vinculándolo con el ID del usuario.
        //    ¡Aquí ya NO intentamos insertar la contraseña!
        await connection.query(
            'INSERT INTO solicitantes (usuario_id, curp, correo_electronico) VALUES (?, ?, ?)',
            [newUserId, curp.toUpperCase(), email]
        );
        
        // Si ambas inserciones fueron exitosas, guardamos los cambios.
        await connection.commit();
        
        return { id: newUserId, curp, email };

    } catch (error) {
        // Si algo falla, deshacemos todo.
        await connection.rollback();
        console.error("Error en la transacción de createUser:", error);
        throw error;
    } finally {
        // Liberamos la conexión.
        connection.release();
    }
};

const updateUserPassword = async (email, newPassword) => {
    // La contraseña SÓLO se actualiza en la tabla `usuarios`
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = ? WHERE email = ?', [hashedPassword, email]);
};

// --- El resto de las funciones (tokens, etc.) se mantienen sin cambios ---
const saveResetToken = async (email, token, expires) => {
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