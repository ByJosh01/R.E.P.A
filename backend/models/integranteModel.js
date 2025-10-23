const pool = require('../db');

const integranteModel = {};

// Obtiene todos los integrantes de un solicitante
integranteModel.getBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.query('SELECT * FROM integrantes WHERE solicitante_id = ?', [solicitanteId]);
    return rows;
};

// Añade un nuevo integrante
integranteModel.add = async (data, solicitanteId) => {
    const dataToInsert = {
        solicitante_id: solicitanteId,
        nombre_completo: data.nombre_completo,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        sexo: data.sexo,
        ultimo_grado_estudio: data.ultimo_grado_estudio,
        actividad_desempeña: data.actividad_desempena, // <-- CORREGIDO CON 'ñ'
        localidad: data.localidad,
        municipio: data.municipio
    };
    const [result] = await pool.query('INSERT INTO integrantes SET ?', [dataToInsert]);
    return { id: result.insertId, ...dataToInsert };
};

// Actualiza un integrante existente por su ID
integranteModel.updateById = async (id, data) => {
    const dataToUpdate = {
        nombre_completo: data.nombre_completo,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        sexo: data.sexo,
        ultimo_grado_estudio: data.ultimo_grado_estudio,
        actividad_desempeña: data.actividad_desempena, // <-- CORREGIDO CON 'ñ'
        localidad: data.localidad,
        municipio: data.municipio
    };
    const [result] = await pool.query('UPDATE integrantes SET ? WHERE id = ?', [dataToUpdate, id]);
    return result;
};

// Elimina un integrante por su ID
integranteModel.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM integrantes WHERE id = ?', [id]);
    return result;
};

module.exports = integranteModel;