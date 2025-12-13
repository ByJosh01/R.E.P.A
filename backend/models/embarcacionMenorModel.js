// backend/models/embarcacionMenorModel.js

const pool = require('../db');

const embarcacionMenorModel = {};

// Obtiene todas las embarcaciones de un solicitante (Usuario normal)
embarcacionMenorModel.getBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.query('SELECT * FROM embarcaciones_menores WHERE solicitante_id = ?', [solicitanteId]);
    return rows;
};

// ▼▼▼ FUNCIÓN FALTANTE (AGREGADA) ▼▼▼
// Obtiene TODAS las embarcaciones registradas (para SuperAdmin)
embarcacionMenorModel.getAll = async () => {
    const [rows] = await pool.query('SELECT * FROM embarcaciones_menores');
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