// backend/models/instrumentosMedicionModel.js
const pool = require('../db');
const Instrumentos = {};

Instrumentos.upsert = async (solicitanteId, datos, connection) => {
    const db = connection || pool;
    const query = `
        INSERT INTO instrumentos_medicion (
            solicitante_id, instrumento_temperatura, instrumento_temperatura_cantidad,
            instrumento_oxigeno, instrumento_oxigeno_cantidad,
            instrumento_ph, instrumento_ph_cantidad,
            instrumento_otros
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            instrumento_temperatura = VALUES(instrumento_temperatura),
            instrumento_temperatura_cantidad = VALUES(instrumento_temperatura_cantidad),
            instrumento_oxigeno = VALUES(instrumento_oxigeno),
            instrumento_oxigeno_cantidad = VALUES(instrumento_oxigeno_cantidad),
            instrumento_ph = VALUES(instrumento_ph),
            instrumento_ph_cantidad = VALUES(instrumento_ph_cantidad),
            instrumento_otros = VALUES(instrumento_otros);
    `;
    const values = [
        solicitanteId,
        datos.instrumento_temperatura_opcion === 'si' ? 1 : 0,
        datos.instrumento_temperatura_cantidad || null,
        datos.instrumento_oxigeno_opcion === 'si' ? 1 : 0,
        datos.instrumento_oxigeno_cantidad || null,
        datos.instrumento_ph_opcion === 'si' ? 1 : 0,
        datos.instrumento_ph_cantidad || null,
        datos.instrumento_otros || null
    ];
    await db.execute(query, values);
};
module.exports = Instrumentos;