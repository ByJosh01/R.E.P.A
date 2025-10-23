// backend/models/solicitanteModel.js
const pool = require('../db');

exports.updateAnexo1 = async (usuarioId, anexoData) => {
    // 1. Obtenemos el solicitante_id a partir del usuario_id
    const [solicitanteRows] = await pool.query('SELECT solicitante_id FROM solicitantes WHERE usuario_id = ?', [usuarioId]);
    if (solicitanteRows.length === 0) {
        throw new Error('No se encontró un perfil de solicitante para este usuario.');
    }
    const solicitanteId = solicitanteRows[0].solicitante_id;

    // 2. Mapeamos los datos del formulario a las columnas de la BD
    const dataToUpdate = {
        nombre: anexoData.nombre ?? null,
        apellido_paterno: anexoData.apellidoPaterno ?? null,
        apellido_materno: anexoData.apellidoMaterno ?? null,
        rfc: anexoData.rfc ?? null,
        curp: anexoData.curp ?? null,
        telefono: anexoData.telefono ?? null,
        correo_electronico: anexoData.email ?? null,
        nombre_representante_legal: anexoData.representanteLegal ?? null,
        actividad: anexoData.actividad ?? null,
        entidad_federativa: anexoData.entidad ?? null,
        municipio: anexoData.municipio ?? null,
        localidad: anexoData.localidad ?? null,
        colonia: anexoData.colonia ?? null,
        codigo_postal: anexoData.cp ?? null,
        calle: anexoData.calle ?? null,
        no_exterior: anexoData.numExterior ?? null,
        no_interior: anexoData.numInterior ?? null,
        numero_integrantes: anexoData.numIntegrantes ? parseInt(anexoData.numIntegrantes, 10) : null,
        anexo1_completo: true,
        // ==========================================================
        // == INICIO DEL CAMBIO: AQUÍ ESTÁ LA LÍNEA QUE LO ARREGLA ==
        // ==========================================================
        fecha_actualizacion: anexoData.fecha ? new Date(anexoData.fecha) : new Date()
        // ==========================================================
        // == FIN DEL CAMBIO
        // ==========================================================
    };

    // 3. Ejecutamos la consulta UPDATE
    const [result] = await pool.query('UPDATE solicitantes SET ? WHERE solicitante_id = ?', [dataToUpdate, solicitanteId]);
    return result;
};

exports.getProfileDataByUserId = async (userId) => {
    const [rows] = await pool.query(`
        SELECT 
            s.*, 
            COUNT(i.id) AS numero_de_integrantes 
        FROM solicitantes s
        LEFT JOIN integrantes i ON s.solicitante_id = i.solicitante_id
        WHERE s.usuario_id = ?
        GROUP BY s.solicitante_id
    `, [userId]);

    const perfil = rows[0];

    if (!perfil) {
        return null;
    }

    // ===== INICIO DE CAMBIO: FORMATEAR FECHA PARA EL FRONTEND =====
    // Esto asegura que la fecha se muestre correctamente en el input type="date"
    if (perfil.fecha_actualizacion) {
        const fecha = new Date(perfil.fecha_actualizacion);
        // Formato YYYY-MM-DD
        perfil.fecha_actualizacion_formateada = fecha.toISOString().split('T')[0];
    }
    // ===== FIN DE CAMBIO =====

    const anexo1RequiredFields = [
        perfil.nombre,
        perfil.rfc,
        perfil.curp,
        perfil.municipio,
        perfil.calle,
        perfil.entidad_federativa,
        perfil.actividad
    ];

    const isAnexo1Complete = anexo1RequiredFields.every(field => field && String(field).trim() !== '');
    perfil.anexo1_completo = isAnexo1Complete;

    return perfil;
};