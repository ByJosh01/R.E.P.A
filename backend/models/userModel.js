// backend/models/userModel.js
const pool = require('../db');
const bcrypt = require('bcryptjs');

// --- NUEVA FUNCIÓN PARA FILTROS ---
const getAllUsuarios = async (search, startDate, endDate) => {
    let query = 'SELECT * FROM usuarios WHERE 1=1';
    const params = [];

    // 1. Buscador (Email o CURP)
    if (search) {
        query += ' AND (email LIKE ? OR curp LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term);
    }

    // 2. Filtro Fecha Inicio (creado_en)
    if (startDate) {
        query += ' AND DATE(creado_en) >= ?';
        params.push(startDate);
    }

    // 3. Filtro Fecha Fin
    if (endDate) {
        query += ' AND DATE(creado_en) <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY creado_en DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};
// ----------------------------------

const findUserByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0] || null;
};

const findUserByCurp = async (curp) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE curp = ?', [curp.toUpperCase()]);
    return rows[0] || null;
};

const createUser = async (userData) => {
    const { curp, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const [userResult] = await connection.query(
            'INSERT INTO usuarios (curp, email, password) VALUES (?, ?, ?)',
            [curp.toUpperCase(), email, hashedPassword]
        );
        const newUserId = userResult.insertId;
        await connection.query(
            'INSERT INTO solicitantes (usuario_id, curp, correo_electronico) VALUES (?, ?, ?)',
            [newUserId, curp.toUpperCase(), email]
        );
        await connection.commit();
        return { id: newUserId, curp, email };
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error en transacción createUser:", error);
        throw error;
    } finally {
        connection.release();
    }
};

const updateUserPassword = async (email, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = ? WHERE email = ?', [hashedPassword, email]);
};

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
    getAllUsuarios, // <--- No olvides exportar la nueva función
    findUserByEmail,
    findUserByCurp,
    createUser,
    updateUserPassword,
    saveResetToken,
    findTokenData,
    deleteResetToken
};