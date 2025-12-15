// backend/models/integranteModel.js
const pool = require('../db');

const integranteModel = {};

// 1. Obtiene integrantes de un usuario específico (CON FILTROS)
integranteModel.getBySolicitanteId = async (solicitanteId, search, startDate, endDate) => {
    // Iniciamos la query base
    let query = 'SELECT * FROM integrantes WHERE solicitante_id = ?';
    const params = [solicitanteId];

    // Aplicar Filtro de Texto (si existe)
    if (search) {
        query += ' AND (nombre_completo LIKE ? OR rfc LIKE ? OR curp LIKE ? OR municipio LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
    }

    // Aplicar Filtro de Fecha Inicio (si existe)
    if (startDate) {
        query += ' AND DATE(fecha_actualizacion) >= ?';
        params.push(startDate);
    }

    // Aplicar Filtro de Fecha Fin (si existe)
    if (endDate) {
        query += ' AND DATE(fecha_actualizacion) <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY fecha_actualizacion DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};

// 2. Obtiene TODOS los integrantes (Admin) (CON FILTROS)
integranteModel.getAll = async (search, startDate, endDate) => {
    let query = 'SELECT * FROM integrantes WHERE 1=1'; // Truco para concatenar ANDs fácilmente
    const params = [];

    if (search) {
        query += ' AND (nombre_completo LIKE ? OR rfc LIKE ? OR curp LIKE ? OR municipio LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
    }

    if (startDate) {
        query += ' AND DATE(fecha_actualizacion) >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND DATE(fecha_actualizacion) <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY fecha_actualizacion DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};

// Añadir
integranteModel.add = async (data, solicitanteId) => {
    const dataToInsert = {
        solicitante_id: solicitanteId,
        nombre_completo: data.nombre_completo,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        sexo: data.sexo,
        ultimo_grado_estudio: data.ultimo_grado_estudio,
        actividad_desempeña: data.actividad_desempena, 
        localidad: data.localidad,
        municipio: data.municipio,
        // MySQL pondrá fecha_actualizacion automático si está configurado como DEFAULT CURRENT_TIMESTAMP
    };
    const [result] = await pool.query('INSERT INTO integrantes SET ?', [dataToInsert]);
    return { id: result.insertId, ...dataToInsert };
};

// Actualizar
integranteModel.updateById = async (id, data) => {
    const dataToUpdate = {
        nombre_completo: data.nombre_completo,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        sexo: data.sexo,
        ultimo_grado_estudio: data.ultimo_grado_estudio,
        actividad_desempeña: data.actividad_desempena,
        localidad: data.localidad,
        municipio: data.municipio,
        fecha_actualizacion: new Date() // ¡IMPORTANTE! Actualizamos la fecha para que el filtro "Hoy" funcione al editar
    };
    const [result] = await pool.query('UPDATE integrantes SET ? WHERE id = ?', [dataToUpdate, id]);
    return result;
};

// Eliminar
integranteModel.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM integrantes WHERE id = ?', [id]);
    return result;
};

// Get By ID
integranteModel.getById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM integrantes WHERE id = ?', [id]);
    return rows[0] || null; 
};

module.exports = integranteModel;