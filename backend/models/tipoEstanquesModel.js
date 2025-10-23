// Pega este nuevo código en backend/models/tipoEstanquesModel.js

const pool = require('../db');
const TipoEstanques = {};

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

    // Valores extraídos del formulario (ahora sí coinciden con el HTML)
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