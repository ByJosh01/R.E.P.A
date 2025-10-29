// backend/controllers/anexoController.js
const solicitanteModel = require('../models/solicitanteModel');
const anexo3PescaModel = require('../models/anexo3PescaModel');
const unidadPesqueraModel = require('../models/unidadPesqueraModel');
const anexo4AcuaculturaModel = require('../models/anexo4AcuaculturaModel');
const unidadProduccionModel = require('../models/unidadProduccionModel'); // Necesario para Anexo 4
const tipoEstanquesModel = require('../models/tipoEstanquesModel'); // Necesario para Anexo 4
const instrumentosMedicionModel = require('../models/instrumentosMedicionModel'); // Necesario para Anexo 4
const sistemasConservacionModel = require('../models/sistemasConservacionModel'); // Necesario para Anexo 4
const equiposTransporteModel = require('../models/equiposTransporteModel'); // Necesario para Anexo 4
const embarcacionesAcuaculturaModel = require('../models/embarcacionesAcuaculturaModel'); // Necesario para Anexo 4
const instalacionesHidraulicasModel = require('../models/instalacionesHidraulicasModel'); // Necesario para Anexo 4
const pool = require('../db'); // Necesario para las transacciones

// --- Anexo 1 ---
exports.saveAnexo1 = async (req, res) => {
    try {
        const usuarioId = req.user.id; // Asume que el middleware pone el id del usuario aquí
        const data = req.body;

        // Validación simple de longitud (puedes mejorarla)
        const checks = {
            nombre: 50, apellidoPaterno: 50, apellidoMaterno: 50,
            rfc: 13, curp: 18, telefono: 10, email: 60,
            representanteLegal: 150, entidad: 50, municipio: 50,
            localidad: 50, colonia: 50, cp: 5, calle: 100,
            numExterior: 10, numInterior: 10
        };
        for (const field in checks) {
            // Convertir a string antes de verificar longitud por si llega un número
            if (data[field] && String(data[field]).length > checks[field]) {
                return res.status(400).json({
                    message: `El campo "${field}" es demasiado largo (máx. ${checks[field]} caracteres).`,
                    field: field
                });
            }
        }

        // updateAnexo1 en el modelo ya marca anexo1_completo = true
        await solicitanteModel.updateAnexo1(usuarioId, data);

        res.status(200).json({ message: 'Datos del Anexo 1 guardados exitosamente.' });

    } catch (error) {
        console.error("Error en saveAnexo1:", error);
        // Manejo específico para errores de longitud de datos
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
        // Error genérico del servidor
        res.status(500).json({ message: `Error en el servidor al guardar los datos: ${error.message}` });
    }
};

exports.getPerfil = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        // getProfileDataByUserId en el modelo ya trae todos los estados _completo
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
    try {
        // Asume que el middleware authMiddleware añade solicitante_id a req.user
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            // 401 Unauthorized o 403 Forbidden podría ser más apropiado si el problema es de autenticación/autorización
            return res.status(400).json({ message: 'ID de solicitante no encontrado en la sesión.' });
        }
        // Usar Promise.all para cargar ambos en paralelo
        const [datosPesca, datosUnidad] = await Promise.all([
            anexo3PescaModel.getBySolicitanteId(solicitanteId),
            unidadPesqueraModel.getBySolicitanteId(solicitanteId)
        ]);
        // Devuelve 200 OK incluso si no hay datos, pero con objetos vacíos o null
        res.status(200).json({
            datos_tecnicos: datosPesca || null, // Devolver null si no existe
            unidad_pesquera: datosUnidad || null // Devolver null si no existe
        });
    } catch (error) {
        console.error("Error en getAnexo3:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener datos del Anexo 3.' });
    }
};

exports.saveAnexo3 = async (req, res) => {
    let connection; // Declarar fuera para usar en finally
    try {
        connection = await pool.getConnection(); // Obtener conexión para la transacción
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            // No necesita liberar conexión aquí porque aún no se obtuvo
            return res.status(400).json({ message: 'ID de solicitante no encontrado en la sesión.' });
        }
        const { datos_tecnicos, unidad_pesquera } = req.body;

        await connection.beginTransaction();

        // Solo intentar guardar si los datos correspondientes existen y no están vacíos
        if (datos_tecnicos && Object.keys(datos_tecnicos).length > 0) {
            await anexo3PescaModel.upsert(solicitanteId, datos_tecnicos, connection);
        }
        if (unidad_pesquera && Object.keys(unidad_pesquera).length > 0) {
            await unidadPesqueraModel.upsert(solicitanteId, unidad_pesquera, connection);
        }

        // Marcar Anexo 3 como completo DESPUÉS de guardar los datos exitosamente
        await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo3_completo', true, connection);

        await connection.commit(); // Confirmar transacción
        res.status(200).json({ message: 'Anexo 3 guardado exitosamente.' });

    } catch (error) {
        // Si hay una conexión y ocurrió un error, hacer rollback
        if (connection) await connection.rollback();
        console.error("Error en saveAnexo3:", error);

        if (error.code === 'ER_DATA_TOO_LONG') {
            const match = error.message.match(/for column '([^']*)'/);
            const dbColumn = match ? match[1] : null;
            const columnToFieldMap = { /* tu mapeo */ };
            const fieldName = dbColumn ? columnToFieldMap[dbColumn] : null;
            let userMessage = 'Error: Uno o más campos del Anexo 3 exceden la longitud máxima.';
            if (fieldName) { userMessage = `Error: El campo "${fieldName}" es demasiado largo.`; }
            return res.status(400).json({ message: userMessage, field: fieldName });
        }
        // Enviar error genérico solo si no se ha enviado ya una respuesta
        if (!res.headersSent) {
            res.status(500).json({ message: `Error en el servidor al guardar el Anexo 3: ${error.message}` });
        }
    } finally {
        // Asegurarse de liberar la conexión en cualquier caso
        if (connection) connection.release();
    }
};

// --- ANEXO 4 ---
exports.getAnexo4Acuacultura = async (req, res) => {
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(401).json({ message: 'Usuario no autenticado o ID de solicitante no encontrado.' });
        }

        // Consulta JOIN para obtener todos los datos relacionados del Anexo 4
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

exports.createAnexo4Acuacultura = async (req, res) => { // Guarda o actualiza
    let connection;
    try {
        connection = await pool.getConnection();
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
             return res.status(401).json({ message: 'Usuario no autenticado o ID de solicitante no encontrado.' });
        }

        await connection.beginTransaction();
        try {
            // ▼▼▼ CONSOLE.LOG PARA DEPURAR ▼▼▼
            console.log('Datos recibidos en el controlador (req.body):', req.body);
            // ▲▲▲ FIN CONSOLE.LOG ▲▲▲

            // Guardar/Actualizar todos los datos del anexo 4 usando upsert o create/update
            await anexo4AcuaculturaModel.create(req.body, solicitanteId, connection); // Asume que maneja duplicados
            await tipoEstanquesModel.upsert(solicitanteId, req.body, connection);
            await instrumentosMedicionModel.upsert(solicitanteId, req.body, connection);
            await sistemasConservacionModel.upsert(solicitanteId, req.body, connection);
            await equiposTransporteModel.upsert(solicitanteId, req.body, connection);
            await embarcacionesAcuaculturaModel.upsert(solicitanteId, req.body, connection);
            await instalacionesHidraulicasModel.upsert(solicitanteId, req.body, connection);
            // Asegura que exista una fila en unidad_produccion si es necesario
            await unidadProduccionModel.upsert(solicitanteId, {}, connection);

            // Marcar Anexo 4 como completo DESPUÉS de guardar todo exitosamente
            await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo4_completo', true, connection);

            await connection.commit(); // Confirmar transacción
            res.status(200).json({ message: 'Datos del Anexo 4 guardados correctamente.' });
        } catch (err) {
            // Si cualquier operación dentro de la transacción falla, hacer rollback
            await connection.rollback();
            console.error('Error durante transacción Anexo 4:', err); // Loguear error específico
            throw err; // Re-lanza el error para que lo capture el catch exterior
        }
    } catch (error) {
        console.error('Error general al guardar datos de acuacultura:', error);
        // Enviar error genérico solo si no se ha enviado ya una respuesta
        // Incluir el mensaje de error original para más detalles
        if (!res.headersSent) {
             res.status(500).json({ message: `Error en el servidor al guardar el Anexo 4: ${error.message}` });
        }
    } finally {
        if (connection) connection.release(); // Siempre liberar la conexión
    }
};