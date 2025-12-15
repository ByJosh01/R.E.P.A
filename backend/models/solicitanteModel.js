// backend/models/solicitanteModel.js
const pool = require('../db');

const solicitanteModel = {};

// --- NUEVA FUNCIÓN: OBTENER TODOS CON FILTROS ---
solicitanteModel.getAll = async (userRole, search, startDate, endDate) => {
    let query = `
        SELECT s.solicitante_id, s.nombre, s.apellido_paterno, s.apellido_materno, 
               s.rfc, s.curp, s.actividad, u.rol, s.fecha_actualizacion
        FROM solicitantes s 
        LEFT JOIN usuarios u ON s.usuario_id = u.id
        WHERE 1=1
    `;
    const params = [];

    // Filtro por Rol (Si es admin normal, solo ve solicitantes)
    if (userRole === 'admin') {
        query += " AND u.rol = 'solicitante'";
    }

    // Filtro de Búsqueda (Texto)
    if (search) {
        query += ` AND (
            s.nombre LIKE ? OR 
            s.apellido_paterno LIKE ? OR 
            s.apellido_materno LIKE ? OR 
            s.rfc LIKE ? OR 
            s.curp LIKE ?
        )`;
        const term = `%${search}%`;
        params.push(term, term, term, term, term);
    }

    // Filtro de Fecha Inicio (Usando fecha_actualizacion de solicitantes)
    if (startDate) {
        query += ' AND DATE(s.fecha_actualizacion) >= ?';
        params.push(startDate);
    }

    // Filtro de Fecha Fin
    if (endDate) {
        query += ' AND DATE(s.fecha_actualizacion) <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY s.solicitante_id DESC';

    const [rows] = await pool.query(query, params);
    return rows;
};

// ... (Resto de funciones updateAnexo1, getProfileDataByUserId, etc. sin cambios)

/**
 * Actualiza los datos del Anexo 1...
 */
solicitanteModel.updateAnexo1 = async (usuarioId, anexoData) => {
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

solicitanteModel.getProfileDataByUserId = async (userId) => {
    const [rows] = await pool.query(`SELECT s.* FROM solicitantes s WHERE s.usuario_id = ?`, [userId]);
    const perfil = rows[0];
    if (!perfil) return null;
    if (perfil.fecha_actualizacion) {
        const fecha = new Date(perfil.fecha_actualizacion);
        perfil.fecha_actualizacion_formateada = fecha.toISOString().split('T')[0];
    }
    perfil.anexo1_completo = !!perfil.anexo1_completo;
    perfil.anexo2_completo = !!perfil.anexo2_completo;
    perfil.anexo3_completo = !!perfil.anexo3_completo;
    perfil.anexo4_completo = !!perfil.anexo4_completo;
    perfil.anexo5_completo = !!perfil.anexo5_completo;
    return perfil;
};

solicitanteModel.getProfileDataBySolicitanteId = async (solicitanteId) => {
    const [rows] = await pool.query(`SELECT s.* FROM solicitantes s WHERE s.solicitante_id = ?`, [solicitanteId]);
    const perfil = rows[0];
    if (!perfil) return null;
    if (perfil.fecha_actualizacion) {
        const fecha = new Date(perfil.fecha_actualizacion);
        perfil.fecha_actualizacion_formateada = fecha.toISOString().split('T')[0];
    }
    perfil.anexo1_completo = !!perfil.anexo1_completo;
    perfil.anexo2_completo = !!perfil.anexo2_completo;
    perfil.anexo3_completo = !!perfil.anexo3_completo;
    perfil.anexo4_completo = !!perfil.anexo4_completo;
    perfil.anexo5_completo = !!perfil.anexo5_completo;
    return perfil;
};

solicitanteModel.updateAnexoStatus = async (solicitanteId, anexoField, status, connection = pool) => {
    const validFields = ['anexo1_completo', 'anexo2_completo', 'anexo3_completo', 'anexo4_completo', 'anexo5_completo'];
    if (!validFields.includes(anexoField)) throw new Error(`Campo de estado de anexo inválido: ${anexoField}`);
    const [result] = await connection.query(`UPDATE solicitantes SET ${anexoField} = ? WHERE solicitante_id = ?`, [status, solicitanteId]);
    return result;
};

module.exports = solicitanteModel;