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

// --- Anexo 1 ---
exports.saveAnexo1 = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const data = req.body;

        // Validación simple de longitud (puedes mejorarla si quieres)
        const checks = {
            nombre: 50, apellidoPaterno: 50, apellidoMaterno: 50,
            rfc: 13, curp: 18, telefono: 10, email: 60,
            representanteLegal: 150, entidad: 50, municipio: 50,
            localidad: 50, colonia: 50, cp: 5, calle: 100,
            numExterior: 10, numInterior: 10
        };
        for (const field in checks) {
            if (data[field] && data[field].length > checks[field]) {
                return res.status(400).json({
                    message: `El campo "${field}" es demasiado largo (máx. ${checks[field]} caracteres).`,
                    field: field
                });
            }
        }

        // updateAnexo1 ya incluye anexo1_completo = true
        await solicitanteModel.updateAnexo1(usuarioId, data);

        res.status(200).json({ message: 'Datos del Anexo 1 guardados exitosamente.' });

    } catch (error) {
        console.error("Error en saveAnexo1:", error);
        if (error.code === 'ER_DATA_TOO_LONG') {
            const match = error.message.match(/for column '([^']*)'/);
            const dbColumn = match ? match[1] : null;
            const columnToFieldMap = { /* Tu mapeo existente */ };
            const fieldName = dbColumn ? columnToFieldMap[dbColumn] : null;
            let userMessage = 'Error al guardar: Uno de los campos excede la longitud máxima.';
            if (fieldName) {
                userMessage = `Error al guardar: El dato en el campo "${fieldName}" es demasiado largo. Por favor, corríjalo.`;
            }
            return res.status(400).json({ message: userMessage, field: fieldName });
        }
        res.status(500).json({ message: 'Error en el servidor al guardar los datos.' });
    }
};

exports.getPerfil = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        // getProfileDataByUserId ya trae todos los estados _completo
        const perfilData = await solicitanteModel.getProfileDataByUserId(usuarioId);
        if (!perfilData) {
            return res.status(404).json({ message: 'No se encontraron datos del perfil.' });
        }
        res.status(200).json(perfilData);
    } catch (error) {
        console.error("Error en getPerfil:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener los datos.' });
    }
};

// --- ANEXO 3 ---
exports.getAnexo3 = async (req, res) => {
    try {
        // Asegúrate de que el middleware authMiddleware añada solicitante_id a req.user
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(400).json({ message: 'ID de solicitante no encontrado.' });
        }
        const datosPesca = await anexo3PescaModel.getBySolicitanteId(solicitanteId);
        const datosUnidad = await unidadPesqueraModel.getBySolicitanteId(solicitanteId);
        res.status(200).json({
            datos_tecnicos: datosPesca || {},
            unidad_pesquera: datosUnidad || {}
        });
    } catch (error) {
        console.error("Error en getAnexo3:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener datos del Anexo 3.' });
    }
};

exports.saveAnexo3 = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            connection.release(); // Liberar conexión si falla pronto
            return res.status(400).json({ message: 'ID de solicitante no encontrado.' });
        }
        const { datos_tecnicos, unidad_pesquera } = req.body;

        await connection.beginTransaction();

        if (datos_tecnicos) {
            await anexo3PescaModel.upsert(solicitanteId, datos_tecnicos, connection);
        }
        if (unidad_pesquera) {
            await unidadPesqueraModel.upsert(solicitanteId, unidad_pesquera, connection);
        }

        // ====> MARCAR COMO COMPLETO <====
        await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo3_completo', true, connection);

        await connection.commit();
        res.status(200).json({ message: 'Anexo 3 guardado exitosamente.' });

    } catch (error) {
        await connection.rollback();
        console.error("Error en saveAnexo3:", error);
        // ... (Tu manejo de errores ER_DATA_TOO_LONG) ...
        res.status(500).json({ message: 'Error en el servidor al guardar el Anexo 3.' });
    } finally {
        connection.release();
    }
};

// --- ANEXO 4 ---
exports.getAnexo4Acuacultura = async (req, res) => {
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
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
            return res.status(200).json(null); // Devuelve null si no hay datos, no un error
        }
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error al obtener datos de acuacultura:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.createAnexo4Acuacultura = async (req, res) => { // Asumo que esto guarda/actualiza
    const connection = await pool.getConnection();
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            connection.release();
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }

        await connection.beginTransaction();
        try {
            // Guardar/Actualizar todos los datos del anexo 4
            await anexo4AcuaculturaModel.create(req.body, solicitanteId, connection); // O tu lógica de upsert
            await tipoEstanquesModel.upsert(solicitanteId, req.body, connection);
            await instrumentosMedicionModel.upsert(solicitanteId, req.body, connection);
            await sistemasConservacionModel.upsert(solicitanteId, req.body, connection);
            await equiposTransporteModel.upsert(solicitanteId, req.body, connection);
            await embarcacionesAcuaculturaModel.upsert(solicitanteId, req.body, connection);
            await instalacionesHidraulicasModel.upsert(solicitanteId, req.body, connection);
            await unidadProduccionModel.upsert(solicitanteId, {}, connection); // Asegura la relación

            // ====> MARCAR COMO COMPLETO <====
            await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo4_completo', true, connection);

            await connection.commit();
            res.status(200).json({ message: 'Datos del Anexo 4 guardados correctamente.' });
        } catch (err) {
            await connection.rollback();
            throw err; // Re-lanza para el catch exterior
        }
    } catch (error) {
        console.error('Error al guardar datos de acuacultura:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

