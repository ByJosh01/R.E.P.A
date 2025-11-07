// backend/controllers/anexoController.js
const solicitanteModel = require('../models/solicitanteModel');
const anexo3PescaModel = require('../models/anexo3PescaModel');
const unidadPesqueraModel = require('../models/unidadPesqueraModel');
const anexo4AcuaculturaModel = require('../models/anexo4AcuaculturaModel');
const unidadProduccionModel = require('../models/unidadProduccionModel');
const tipoEstanquesModel = require('../models/tipoEstanquesModel');
const instrumentosMedicionModel = require('../models/instrumentosMedicionModel');
const sistemasConservacionModel = require('../models/sistemasConservacionModel');
const equiposTransporteModel = require('../models/equiposTransporteModel');
const embarcacionesAcuaculturaModel = require('../models/embarcacionesAcuaculturaModel');
const instalacionesHidraulicasModel = require('../models/instalacionesHidraulicasModel');
const pool = require('../db'); 
const { validationResult } = require('express-validator'); // <-- IMPORTADO

// --- Anexo 1 ---
exports.saveAnexo1 = async (req, res) => {
    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const usuarioId = req.user.id; 
        const data = req.body;
        
        // La validación manual de longitud se eliminó
        // porque express-validator ya la hizo en el archivo de rutas.

        await solicitanteModel.updateAnexo1(usuarioId, data);

        res.status(200).json({ message: 'Datos del Anexo 1 guardados exitosamente.' });

    } catch (error) {
        console.error("Error en saveAnexo1:", error);
        
        if (error.code === 'ER_DATA_TOO_LONG') {
            const match = error.message.match(/for column '([^']*)'/);
            const dbColumn = match ? match[1] : null;
            const columnToFieldMap = {
                 'nombre': 'nombre', 'apellido_paterno': 'apellidoPaterno', 'apellido_materno': 'apellidoMaterno',
                 'rfc': 'rfc', 'curp': 'curp', 'telefono': 'telefono', 'correo_electronico': 'email',
                 'nombre_representante_legal': 'representanteLegal', 'entidad_federativa': 'entidad',
                 'municipio': 'municipio', 'localidad': 'localidad', 'colonia': 'colonia', 'codigo_postal': 'cp',
                 'calle': 'calle', 'no_exterior': 'numExterior', 'no_interior': 'numInterior'
            };
            const fieldName = dbColumn ? columnToFieldMap[dbColumn] : null;
            let userMessage = 'Error al guardar: Uno de los campos excede la longitud máxima.';
            if (fieldName) {
                userMessage = `Error al guardar: El dato en el campo "${fieldName}" es demasiado largo. Por favor, corríjalo.`;
            }
            return res.status(400).json({ message: userMessage, field: fieldName });
        }
        res.status(500).json({ message: `Error en el servidor al guardar los datos: ${error.message}` });
    }
};

exports.getPerfil = async (req, res) => {
    // No necesita validación
    try {
        const usuarioId = req.user.id;
        const perfilData = await solicitanteModel.getProfileDataByUserId(usuarioId);
        if (!perfilData) {
            return res.status(404).json({ message: 'No se encontraron datos del perfil para este usuario.' });
        }
        res.status(200).json(perfilData);
    } catch (error) {
        console.error("Error en getPerfil:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener los datos del perfil.' });
    }
};

// --- ANEXO 3 ---
exports.getAnexo3 = async (req, res) => {
    // No necesita validación
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(400).json({ message: 'ID de solicitante no encontrado en la sesión.' });
        }
        const [datosPesca, datosUnidad] = await Promise.all([
            anexo3PescaModel.getBySolicitanteId(solicitanteId),
            unidadPesqueraModel.getBySolicitanteId(solicitanteId)
        ]);
        res.status(200).json({
            datos_tecnicos: datosPesca || null, 
            unidad_pesquera: datosUnidad || null 
        });
    } catch (error) {
        console.error("Error en getAnexo3:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener datos del Anexo 3.' });
    }
};

exports.saveAnexo3 = async (req, res) => {
    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    let connection; 
    try {
        connection = await pool.getConnection(); 
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(400).json({ message: 'ID de solicitante no encontrado en la sesión.' });
        }
        const { datos_tecnicos, unidad_pesquera } = req.body;

        await connection.beginTransaction();

        if (datos_tecnicos && Object.keys(datos_tecnicos).length > 0) {
            await anexo3PescaModel.upsert(solicitanteId, datos_tecnicos, connection);
        }
        if (unidad_pesquera && Object.keys(unidad_pesquera).length > 0) {
            await unidadPesqueraModel.upsert(solicitanteId, unidad_pesquera, connection);
        }

        await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo3_completo', true, connection);

        await connection.commit(); 
        res.status(200).json({ message: 'Anexo 3 guardado exitosamente.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en saveAnexo3:", error);

        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(400).json({ message: "Error: Uno o más campos del Anexo 3 exceden la longitud máxima." });
        }
        if (!res.headersSent) {
            res.status(500).json({ message: `Error en el servidor al guardar el Anexo 3: ${error.message}` });
        }
    } finally {
        if (connection) connection.release();
    }
};

// --- ANEXO 4 ---
exports.getAnexo4Acuacultura = async (req, res) => {
    // No necesita validación
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(401).json({ message: 'Usuario no autenticado o ID de solicitante no encontrado.' });
        }

        const query = `
            SELECT
                dta.*, te.*, im.*, sc.*, et.*, emb.*, iha.*
            FROM datos_tecnicos_acuacultura dta
            LEFT JOIN tipo_estanques te ON dta.solicitante_id = te.solicitante_id
            LEFT JOIN instrumentos_medicion im ON dta.solicitante_id = im.solicitante_id
            LEFT JOIN sistema_conservacion sc ON dta.solicitante_id = sc.solicitante_id
            LEFT JOIN equipo_transporte et ON dta.solicitante_id = et.solicitante_id
            LEFT JOIN embarcaciones emb ON dta.solicitante_id = emb.solicitante_id
            LEFT JOIN instalacion_hidraulica_aireacion iha ON dta.solicitante_id = iha.solicitante_id
            WHERE dta.solicitante_id = ?
        `;
        const [rows] = await pool.query(query, [solicitanteId]);

        if (rows.length === 0) {
            return res.status(200).json(null); // OK, pero sin datos
        }
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error al obtener datos de acuacultura:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener datos del Anexo 4.' });
    }
};

exports.createAnexo4Acuacultura = async (req, res) => { 
    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    let connection;
    try {
        connection = await pool.getConnection();
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
             return res.status(401).json({ message: 'Usuario no autenticado o ID de solicitante no encontrado.' });
        }

        await connection.beginTransaction();
        try {
            console.log('Datos validados recibidos en el controlador (req.body):', req.body);

            await anexo4AcuaculturaModel.create(req.body, solicitanteId, connection); 
            await tipoEstanquesModel.upsert(solicitanteId, req.body, connection);
            await instrumentosMedicionModel.upsert(solicitanteId, req.body, connection);
            await sistemasConservacionModel.upsert(solicitanteId, req.body, connection);
            await equiposTransporteModel.upsert(solicitanteId, req.body, connection);
            await embarcacionesAcuaculturaModel.upsert(solicitanteId, req.body, connection);
            await instalacionesHidraulicasModel.upsert(solicitanteId, req.body, connection);
            await unidadProduccionModel.upsert(solicitanteId, {}, connection);

            await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo4_completo', true, connection);

            await connection.commit(); 
            res.status(200).json({ message: 'Datos del Anexo 4 guardados correctamente.' });
        } catch (err) {
            await connection.rollback();
            console.error('Error durante transacción Anexo 4:', err); 
            throw err; 
        }
    } catch (error) {
        console.error('Error general al guardar datos de acuacultura:', error);
        if (!res.headersSent) {
             res.status(500).json({ message: `Error en el servidor al guardar el Anexo 4: ${error.message}` });
        }
    } finally {
        if (connection) connection.release(); 
    }
};