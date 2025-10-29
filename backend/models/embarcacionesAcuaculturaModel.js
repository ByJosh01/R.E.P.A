// backend/models/embarcacionesAcuaculturaModel.js
// OJO: El nombre original era embarcacionesModel.js, verifica si es este o el otro
const pool = require('../db');
const Embarcaciones = {};

/**
 * Busca los datos de embarcaciones (de acuacultura) para un solicitante específico.
 * @param {number} solicitanteId - El ID del solicitante.
 * @returns {object|null} Los datos encontrados o null si no existen.
 */
Embarcaciones.getBySolicitanteId = async (solicitanteId) => {
    // Asegúrate que el nombre de la tabla sea correcto ('embarcaciones' o similar)
    const query = 'SELECT * FROM embarcaciones WHERE solicitante_id = ?';
    const [rows] = await pool.execute(query, [solicitanteId]);
    return rows.length > 0 ? rows[0] : null;
};

/**
 * Crea o actualiza los datos de embarcaciones (de acuacultura).
 * @param {number} solicitanteId - El ID del solicitante.
 * @param {object} datos - Los datos del formulario.
 * @param {object} [connection] - Conexión opcional para transacciones.
 */
Embarcaciones.upsert = async (solicitanteId, datos, connection) => {
    const db = connection || pool;
    const query = `
        INSERT INTO embarcaciones (
            solicitante_id, embarcacion_madera, embarcacion_madera_cantidad,
            embarcacion_fibra_vidrio, embarcacion_fibra_vidrio_cantidad,
            embarcacion_metal, embarcacion_metal_cantidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            embarcacion_madera = VALUES(embarcacion_madera),
            embarcacion_madera_cantidad = VALUES(embarcacion_madera_cantidad),
            embarcacion_fibra_vidrio = VALUES(embarcacion_fibra_vidrio),
            embarcacion_fibra_vidrio_cantidad = VALUES(embarcacion_fibra_vidrio_cantidad),
            embarcacion_metal = VALUES(embarcacion_metal),
            embarcacion_metal_cantidad = VALUES(embarcacion_metal_cantidad);
    `;

    const values = [
        solicitanteId,
        datos.embarcacion_madera_opcion === 'si' ? 1 : 0,
        datos.embarcacion_madera_cantidad || null,
        datos.embarcacion_fibra_vidrio_opcion === 'si' ? 1 : 0, // Ojo: _fibra_vidrio_ en el form?
        datos.embarcacion_fibra_vidrio_cantidad || null,
        datos.embarcacion_metal_opcion === 'si' ? 1 : 0,
        datos.embarcacion_metal_cantidad || null
    ];

    await db.execute(query, values);
};

module.exports = Embarcaciones;