// backend/models/tipoEstanquesModel.js
const pool = require('../db');
const TipoEstanques = {};

// ▼▼▼ FUNCIÓN AÑADIDA ▼▼▼
/**
 * Busca los datos de tipo de estanques para un solicitante específico.
 * @param {number} solicitanteId - El ID del solicitante.
 * @returns {object|null} Los datos encontrados o null si no existen.
 */
TipoEstanques.getBySolicitanteId = async (solicitanteId) => {
    const query = 'SELECT * FROM tipo_estanques WHERE solicitante_id = ?';
    const [rows] = await pool.execute(query, [solicitanteId]);
    return rows.length > 0 ? rows[0] : null;
};
// ▲▲▲ FIN FUNCIÓN AÑADIDA ▲▲▲

/**
 * Crea o actualiza los datos de tipo de estanques.
 * @param {number} solicitanteId - El ID del solicitante.
 * @param {object} datos - Los datos del formulario.
 * @param {object} [connection] - Conexión opcional para transacciones.
 */
TipoEstanques.upsert = async (solicitanteId, datos, connection) => {
    const db = connection || pool;

    const query = `
        INSERT INTO tipo_estanques (
            solicitante_id,
            rustico, rustico_cantidad, rustico_dimensiones,
            geomembrana, geomembrana_cantidad, geomembrana_dimensiones,
            concreto, concreto_cantidad, concreto_dimensiones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            rustico = VALUES(rustico),
            rustico_cantidad = VALUES(rustico_cantidad),
            rustico_dimensiones = VALUES(rustico_dimensiones),
            geomembrana = VALUES(geomembrana),
            geomembrana_cantidad = VALUES(geomembrana_cantidad),
            geomembrana_dimensiones = VALUES(geomembrana_dimensiones),
            concreto = VALUES(concreto),
            concreto_cantidad = VALUES(concreto_cantidad),
            concreto_dimensiones = VALUES(concreto_dimensiones);
    `;

    // Valores extraídos del formulario
    const values = [
        solicitanteId,
        datos.estanque_rustico_opcion === 'si' ? 1 : 0,
        datos.estanque_rustico_cantidad || null,
        datos.estanque_rustico_dimensiones || null,
        datos.estanque_geomembrana_opcion === 'si' ? 1 : 0,
        datos.estanque_geomembrana_cantidad || null,
        datos.estanque_geomembrana_dimensiones || null,
        datos.estanque_concreto_opcion === 'si' ? 1 : 0,
        datos.estanque_concreto_cantidad || null,
        datos.estanque_concreto_dimensiones || null
    ];

    await db.execute(query, values);
};

module.exports = TipoEstanques;