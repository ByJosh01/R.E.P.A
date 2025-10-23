// backend/models/unidadProduccionModel.js
const pool = require('../db');

const UnidadProduccion = {};

UnidadProduccion.upsert = async (solicitanteId, datosDeIds, connection) => {
    const db = connection || pool;
    
    // La consulta ahora inserta/actualiza las columnas de IDs foráneos
    const query = `
        INSERT INTO unidad_produccion (
            solicitante_id, tipo_estanque_id, instrumento_id, sistema_conservacion_id, 
            equipo_transporte_id, embarcacion_id, instalacion_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            tipo_estanque_id = VALUES(tipo_estanque_id),
            instrumento_id = VALUES(instrumento_id),
            sistema_conservacion_id = VALUES(sistema_conservacion_id),
            equipo_transporte_id = VALUES(equipo_transporte_id),
            embarcacion_id = VALUES(embarcacion_id),
            instalacion_id = VALUES(instalacion_id);
    `;

    const values = [
        solicitanteId,
        datosDeIds.tipo_estanque_id || null,
        datosDeIds.instrumento_id || null,
        datosDeIds.sistema_conservacion_id || null,
        datosDeIds.equipo_transporte_id || null,
        datosDeIds.embarcacion_id || null,
        datosDeIds.instalacion_id || null
    ];

    await db.execute(query, values);
};

UnidadProduccion.getBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.execute('SELECT * FROM unidad_produccion WHERE solicitante_id = ?', [solicitanteId]);
    return rows[0];
};

module.exports = UnidadProduccion;