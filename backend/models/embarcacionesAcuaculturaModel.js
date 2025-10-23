const pool = require('../db');
const Embarcaciones = {};

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
    
    // El cambio principal está en estas líneas para que coincida con el HTML
    const values = [
        solicitanteId,
        datos.embarcacion_madera_opcion === 'si' ? 1 : 0,
        datos.embarcacion_madera_cantidad || null,
        datos.embarcacion_fibra_vidrio_opcion === 'si' ? 1 : 0, 
        datos.embarcacion_fibra_vidrio_cantidad || null,      
        datos.embarcacion_metal_opcion === 'si' ? 1 : 0,
        datos.embarcacion_metal_cantidad || null
    ];

    await db.execute(query, values);
};

module.exports = Embarcaciones;