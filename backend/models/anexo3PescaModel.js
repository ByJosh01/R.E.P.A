const pool = require('../db');

exports.getBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.query('SELECT * FROM datos_tecnicos_pesca WHERE solicitante_id = ?', [solicitanteId]);
    return rows[0] || null;
};

exports.upsert = async (solicitanteId, data, connection) => {
    const db = connection || pool;

    const dataToSave = {
        solicitante_id: solicitanteId,
        lugar: data.lugar_captura,
        localidad_captura: data.localidad_captura,
        municipio_captura: data.municipio_captura,
        sitio_desembarque: data.sitio_desembarque, // <-- Ahora sí coincide con la nueva columna
        localidad_desembarque: data.localidad_desembarque,
        municipio_desembarque: data.municipio_desembarque,
        pesqueria: Array.isArray(data.pesqueria) ? data.pesqueria.join(',') : '',
        tipo_pesqueria: data.tipo_pesqueria,
        arte_pesca: data.arte_pesca_string,
        especies_objetivo: data.especies_objetivo_string,
        certificados_solicitantes: data.certificados_string,
        nivel_produccion_anual: `${data.nivel_produccion_anual || ''} ${data.produccion_unidad || ''}`.trim()
    };

    const [existing] = await db.query('SELECT id FROM datos_tecnicos_pesca WHERE solicitante_id = ?', [solicitanteId]);

    if (existing.length > 0) {
        await db.query('UPDATE datos_tecnicos_pesca SET ? WHERE id = ?', [dataToSave, existing[0].id]);
    } else {
        await db.query('INSERT INTO datos_tecnicos_pesca SET ?', dataToSave);
    }
};