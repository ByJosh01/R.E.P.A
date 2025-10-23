// backend/models/unidadPesqueraModel.js
const pool = require('../db');

exports.getBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.query('SELECT * FROM unidad_pesquera WHERE solicitante_id = ?', [solicitanteId]);
    return rows[0] || null; // Ya no necesita procesar JSON, solo devuelve los datos
};

exports.upsert = async (solicitanteId, data, connection) => {
    const db = connection || pool;

    // Mapea los datos del formulario directamente a las columnas correctas de la BD
    // y convierte las opciones 'si'/'no' a 1/0 para la base de datos.
    const dataToSave = {
        solicitante_id: solicitanteId,
        emb_madera: data.embarcaciones.madera.opcion === 'si' ? 1 : 0,
        emb_madera_cantidad: data.embarcaciones.madera.cantidad || 0,
        emb_fibra: data.embarcaciones.fibra.opcion === 'si' ? 1 : 0,
        emb_fibra_cantidad: data.embarcaciones.fibra.cantidad || 0,
        emb_metal: data.embarcaciones.metal.opcion === 'si' ? 1 : 0,
        emb_metal_cantidad: data.embarcaciones.metal.cantidad || 0,
        motores: data.motores.opcion === 'si' ? 1 : 0,
        motores_cantidad: data.motores.cantidad || 0,
        cons_hielera: data.sistema_conservacion.hielera.opcion === 'si' ? 1 : 0,
        cons_hielera_cantidad: data.sistema_conservacion.hielera.cantidad || 0,
        cons_refrigerador: data.sistema_conservacion.refrigerador.opcion === 'si' ? 1 : 0,
        cons_refrigerador_cantidad: data.sistema_conservacion.refrigerador.cantidad || 0,
        cons_cuartofrio: data.sistema_conservacion.cuarto.opcion === 'si' ? 1 : 0,
        cons_cuartofrio_cantidad: data.sistema_conservacion.cuarto.cantidad || 0,
        trans_camioneta: data.equipo_transporte.camioneta.opcion === 'si' ? 1 : 0,
        trans_camioneta_cantidad: data.equipo_transporte.camioneta.cantidad || 0,
        trans_cajafria: data.equipo_transporte.caja.opcion === 'si' ? 1 : 0,
        trans_cajafria_cantidad: data.equipo_transporte.caja.cantidad || 0,
        trans_camion: data.equipo_transporte.camion.opcion === 'si' ? 1 : 0,
        trans_camion_cantidad: data.equipo_transporte.camion.cantidad || 0
    };

    const [existing] = await db.query('SELECT id FROM unidad_pesquera WHERE solicitante_id = ?', [solicitanteId]);

    if (existing.length > 0) {
        await db.query('UPDATE unidad_pesquera SET ? WHERE id = ?', [dataToSave, existing[0].id]);
    } else {
        await db.query('INSERT INTO unidad_pesquera SET ?', dataToSave);
    }
};