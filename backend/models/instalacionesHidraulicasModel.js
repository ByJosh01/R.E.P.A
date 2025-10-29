// backend/models/instalacionesHidraulicasModel.js
const pool = require('../db');
const Hidraulica = {};

/**
 * Busca los datos de instalaciones hidráulicas para un solicitante específico.
 * @param {number} solicitanteId - El ID del solicitante.
 * @returns {object|null} Los datos encontrados o null si no existen.
 */
Hidraulica.getBySolicitanteId = async (solicitanteId) => {
    const query = 'SELECT * FROM instalacion_hidraulica_aireacion WHERE solicitante_id = ?';
    const [rows] = await pool.execute(query, [solicitanteId]);
    return rows.length > 0 ? rows[0] : null;
};

/**
 * Crea o actualiza los datos de instalaciones hidráulicas.
 * @param {number} solicitanteId - El ID del solicitante.
 * @param {object} datos - Los datos del formulario.
 * @param {object} [connection] - Conexión opcional para transacciones.
 */
Hidraulica.upsert = async (solicitanteId, datos, connection) => {
    const db = connection || pool;
    const query = `
        INSERT INTO instalacion_hidraulica_aireacion (
            solicitante_id, hidraulica_bomba_agua, hidraulica_bomba_agua_cantidad,
            hidraulica_aireador, hidraulica_aireador_cantidad
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            hidraulica_bomba_agua = VALUES(hidraulica_bomba_agua),
            hidraulica_bomba_agua_cantidad = VALUES(hidraulica_bomba_agua_cantidad),
            hidraulica_aireador = VALUES(hidraulica_aireador),
            hidraulica_aireador_cantidad = VALUES(hidraulica_aireador_cantidad);
    `;
    const values = [
        solicitanteId,
        datos.hidraulica_bomba_opcion === 'si' ? 1 : 0, datos.hidraulica_bomba_cantidad || null,
        datos.hidraulica_aireador_opcion === 'si' ? 1 : 0, datos.hidraulica_aireador_cantidad || null
    ];
    await db.execute(query, values);
};

module.exports = Hidraulica;