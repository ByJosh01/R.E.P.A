const pool = require('../db');
const Hidraulica = {};
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