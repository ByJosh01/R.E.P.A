// backend/models/equiposTransporteModel.js
const pool = require('../db');
const Transporte = {};

/**
 * Busca los datos de equipos de transporte para un solicitante específico.
 * @param {number} solicitanteId - El ID del solicitante.
 * @returns {object|null} Los datos encontrados o null si no existen.
 */
Transporte.getBySolicitanteId = async (solicitanteId) => {
    const query = 'SELECT * FROM equipo_transporte WHERE solicitante_id = ?';
    const [rows] = await pool.execute(query, [solicitanteId]);
    return rows.length > 0 ? rows[0] : null;
};

/**
 * Crea o actualiza los datos de equipos de transporte.
 * @param {number} solicitanteId - El ID del solicitante.
 * @param {object} datos - Los datos del formulario.
 * @param {object} [connection] - Conexión opcional para transacciones.
 */
Transporte.upsert = async (solicitanteId, datos, connection) => {
    const db = connection || pool;
    const query = `
        INSERT INTO equipo_transporte (
            solicitante_id, transporte_lancha, transporte_lancha_cantidad,
            transporte_camioneta, transporte_camioneta_cantidad,
            transporte_cajafria, transporte_cajafria_cantidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            transporte_lancha = VALUES(transporte_lancha),
            transporte_lancha_cantidad = VALUES(transporte_lancha_cantidad),
            transporte_camioneta = VALUES(transporte_camioneta),
            transporte_camioneta_cantidad = VALUES(transporte_camioneta_cantidad),
            transporte_cajafria = VALUES(transporte_cajafria),
            transporte_cajafria_cantidad = VALUES(transporte_cajafria_cantidad);
    `;
    const values = [
        solicitanteId,
        datos.transporte_lancha_opcion === 'si' ? 1 : 0, datos.transporte_lancha_cantidad || null,
        datos.transporte_camioneta_opcion === 'si' ? 1 : 0, datos.transporte_camioneta_cantidad || null,
        datos.transporte_cajafria_opcion === 'si' ? 1 : 0, datos.transporte_cajafria_cantidad || null
    ];
    await db.execute(query, values);
};

module.exports = Transporte;