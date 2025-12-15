// backend/models/embarcacionMenorModel.js

const pool = require('../db');

const embarcacionMenorModel = {};

// Obtiene todas las embarcaciones de un solicitante (Usuario normal)
embarcacionMenorModel.getBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.query('SELECT * FROM embarcaciones_menores WHERE solicitante_id = ?', [solicitanteId]);
    return rows;
};

// ▼▼▼ FUNCIÓN MODIFICADA PARA FILTROS ▼▼▼
// Obtiene TODAS las embarcaciones registradas (para Admin/SuperAdmin)
// Soporta búsqueda y rangos de fecha sobre 'fecha_actualizacion'
embarcacionMenorModel.getAll = async (search, startDate, endDate) => {
    let query = 'SELECT * FROM embarcaciones_menores WHERE 1=1';
    const params = [];

    // 1. Filtro por Texto (Nombre o Matrícula)
    if (search) {
        query += ' AND (nombre_embarcacion LIKE ? OR matricula LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    // 2. Filtro por Fecha Inicio
    if (startDate) {
        query += ' AND DATE(fecha_actualizacion) >= ?';
        params.push(startDate);
    }

    // 3. Filtro por Fecha Fin
    if (endDate) {
        query += ' AND DATE(fecha_actualizacion) <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY fecha_actualizacion DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// Añade una nueva embarcación
embarcacionMenorModel.add = async (data, solicitanteId) => {
    const dataToInsert = {
        solicitante_id: solicitanteId,
        nombre_embarcacion: data.nombre_embarcacion,
        matricula: data.matricula,
        tonelaje_neto: data.tonelaje_neto,
        marca: data.marca,
        numero_serie: data.numero_serie,
        potencia_hp: data.potencia_hp,
        puerto_base: data.puerto_base
    };
    const [result] = await pool.query('INSERT INTO embarcaciones_menores SET ?', [dataToInsert]);
    return { id: result.insertId, ...dataToInsert };
};

// Actualiza una embarcación por su ID
embarcacionMenorModel.updateById = async (id, data) => {
    
    // Objeto dinámico solo con los campos que SÍ vienen en 'data'
    const dataToUpdate = {};
    const allowedFields = [
        'nombre_embarcacion', 'matricula', 'tonelaje_neto', 'marca', 
        'numero_serie', 'potencia_hp', 'puerto_base'
    ];

    allowedFields.forEach(field => {
        // Si el campo existe en 'data' (incluso si es null o string vacío), lo añadimos
        if (data[field] !== undefined) {
            dataToUpdate[field] = data[field];
        }
    });

    // Si no se pasó ningún campo válido, no hacemos nada
    if (Object.keys(dataToUpdate).length === 0) {
        return { affectedRows: 0 };
    }

    // Actualizamos también la fecha de actualización
    dataToUpdate.fecha_actualizacion = new Date();

    const [result] = await pool.query('UPDATE embarcaciones_menores SET ? WHERE id = ?', [dataToUpdate, id]);
    return result;
};

// Elimina una embarcación por su ID
embarcacionMenorModel.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM embarcaciones_menores WHERE id = ?', [id]);
    return result;
};

// Obtiene una embarcación específica por su ID
embarcacionMenorModel.getById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM embarcaciones_menores WHERE id = ?', [id]);
    return rows[0] || null; // Devuelve el primer resultado o null
};

module.exports = embarcacionMenorModel;