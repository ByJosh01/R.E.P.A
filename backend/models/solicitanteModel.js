// backend/models/solicitanteModel.js
const pool = require('../db');

/**
 * Actualiza los datos del Anexo 1 para un usuario específico.
 * Marca anexo1_completo como true.
 */
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
        anexo1_completo: true, // Marca como completo al guardar
        fecha_actualizacion: anexoData.fecha ? new Date(anexoData.fecha) : new Date()
    };

    // 3. Ejecutamos la consulta UPDATE
    const [result] = await pool.query('UPDATE solicitantes SET ? WHERE solicitante_id = ?', [dataToUpdate, solicitanteId]);
    return result;
};

/**
 * Obtiene los datos del perfil del solicitante, incluyendo los estados de completado de todos los anexos.
 */
exports.getProfileDataByUserId = async (userId) => {
    // Seleccionamos TODAS las columnas, incluyendo los nuevos booleanos
    const [rows] = await pool.query(`
        SELECT
            s.* FROM solicitantes s
        WHERE s.usuario_id = ?
    `, [userId]);

    const perfil = rows[0];

    if (!perfil) {
        return null;
    }

    // Formatear fecha para el input date
    if (perfil.fecha_actualizacion) {
        const fecha = new Date(perfil.fecha_actualizacion);
        perfil.fecha_actualizacion_formateada = fecha.toISOString().split('T')[0];
    }

    // Convertir valores numéricos (0/1) de la BD a booleanos (true/false) para JS
    perfil.anexo1_completo = !!perfil.anexo1_completo;
    perfil.anexo2_completo = !!perfil.anexo2_completo;
    perfil.anexo3_completo = !!perfil.anexo3_completo;
    perfil.anexo4_completo = !!perfil.anexo4_completo;
    perfil.anexo5_completo = !!perfil.anexo5_completo;

    return perfil;
};

/**
 * Actualiza el estado de completado de un anexo específico para un solicitante.
 * @param {number} solicitanteId - El ID del solicitante.
 * @param {string} anexoField - El nombre de la columna (ej. 'anexo2_completo').
 * @param {boolean} status - El nuevo estado (normalmente true).
 * @param {object} [connection] - Una conexión de pool opcional si se usa dentro de una transacción.
 */
exports.updateAnexoStatus = async (solicitanteId, anexoField, status, connection = pool) => {
    // Validamos que el campo sea uno de los permitidos para evitar inyección SQL
    const validFields = ['anexo1_completo', 'anexo2_completo', 'anexo3_completo', 'anexo4_completo', 'anexo5_completo'];
    if (!validFields.includes(anexoField)) {
        throw new Error(`Campo de estado de anexo inválido: ${anexoField}`);
    }

    const [result] = await connection.query(
        `UPDATE solicitantes SET ${anexoField} = ? WHERE solicitante_id = ?`,
        [status, solicitanteId]
    );
    return result;
};