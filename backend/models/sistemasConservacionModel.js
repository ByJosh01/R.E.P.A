// backend/models/sistemasConservacionModel.js
const pool = require('../db');
const Conservacion = {};

Conservacion.upsert = async (solicitanteId, datos, connection) => {
    const db = connection || pool;
    const query = `
        INSERT INTO sistema_conservacion (
            solicitante_id, conservacion_hielera, conservacion_hielera_cantidad, 
            conservacion_refrigerado, conservacion_refrigerado_cantidad, 
            conservacion_cuartofrio, conservacion_cuartofrio_cantidad,
            conservacion_otros, conservacion_otros_cantidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            conservacion_hielera = VALUES(conservacion_hielera),
            conservacion_hielera_cantidad = VALUES(conservacion_hielera_cantidad),
            conservacion_refrigerado = VALUES(conservacion_refrigerado),
            conservacion_refrigerado_cantidad = VALUES(conservacion_refrigerado_cantidad),
            conservacion_cuartofrio = VALUES(conservacion_cuartofrio),
            conservacion_cuartofrio_cantidad = VALUES(conservacion_cuartofrio_cantidad),
            conservacion_otros = VALUES(conservacion_otros),
            conservacion_otros_cantidad = VALUES(conservacion_otros_cantidad);
    `;
    const values = [
        solicitanteId,
        datos.conservacion_hielera_opcion === 'si' ? 1 : 0, datos.conservacion_hielera_cantidad || null,
        datos.conservacion_refrigerador_opcion === 'si' ? 1 : 0, datos.conservacion_refrigerador_cantidad || null,
        datos.conservacion_cuartofrio_opcion === 'si' ? 1 : 0, datos.conservacion_cuartofrio_cantidad || null,
        datos.conservacion_otros || null, null // Asumo que "otros" no tiene cantidad en el form
    ];
    await db.execute(query, values);
};
module.exports = Conservacion;