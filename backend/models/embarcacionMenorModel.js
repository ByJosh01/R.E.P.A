// backend/models/embarcacionMenorModel.js

const pool = require('../db');

const embarcacionMenorModel = {};

// Obtiene todas las embarcaciones de un solicitante
embarcacionMenorModel.getBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.query('SELECT * FROM embarcaciones_menores WHERE solicitante_id = ?', [solicitanteId]);
    return rows;
};

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
    const dataToUpdate = {
        nombre_embarcacion: data.nombre_embarcacion,
        matricula: data.matricula,
        tonelaje_neto: data.tonelaje_neto,
        marca: data.marca,
        numero_serie: data.numero_serie,
        potencia_hp: data.potencia_hp,
        puerto_base: data.puerto_base
    };
    const [result] = await pool.query('UPDATE embarcaciones_menores SET ? WHERE id = ?', [dataToUpdate, id]);
    return result;
};

// Elimina una embarcación por su ID
embarcacionMenorModel.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM embarcaciones_menores WHERE id = ?', [id]);
    return result;
};

module.exports = embarcacionMenorModel;