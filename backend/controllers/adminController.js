// backend/controllers/adminController.js
const pool = require('../db');
const { exec } = require('child_process');
const path = require('path');

exports.getAllSolicitantes = async (req, res) => {
    try {
        // --- INICIO DE LA CORRECCIÓN ---
        // Ahora hacemos JOIN con usuarios para obtener el ROL
        const [solicitantes] = await pool.query(
            `SELECT s.solicitante_id, s.nombre, s.rfc, s.curp, s.actividad, u.rol 
             FROM solicitantes s
             LEFT JOIN usuarios u ON s.usuario_id = u.id` // Unimos las tablas por el ID de usuario
        );
        // --- FIN DE LA CORRECCIÓN ---

        res.status(200).json(solicitantes);
    } catch (error) {
        console.error("Error en getAllSolicitantes:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// --- VERSIÓN DEFINITIVA Y COMPLETA DE LA FUNCIÓN DE RESETEO ---
exports.resetDatabase = async (req, res) => {
    const { masterPassword } = req.body;
    // Obtenemos el ID del superadmin que está ejecutando la acción
    const superAdminUserId = req.user.id; 

    // 1. Verificamos la contraseña maestra
    if (masterPassword !== process.env.MASTER_RESET_PASSWORD) {
        return res.status(403).json({ message: 'Contraseña maestra incorrecta. Acceso denegado.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 2. Desactivamos la revisión de llaves foráneas
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        // 3. Borramos a TODOS los usuarios EXCEPTO al superadmin actual
        await connection.query('DELETE FROM usuarios WHERE id != ?', [superAdminUserId]);
        
        // 4. Borramos a TODOS los solicitantes EXCEPTO el perfil del superadmin
        await connection.query('DELETE FROM solicitantes WHERE usuario_id != ?', [superAdminUserId]);

        // 5. Vaciamos el resto de las tablas de datos
        const tablesToTruncate = [
            'integrantes', 
            'embarcaciones_menores',
            'datos_tecnicos_pesca',
            'datos_tecnicos_acuacultura',
            'unidad_pesquera',
            'unidad_produccion',
            'tipo_estanques',
            'instrumentos_medicion',
            'sistema_conservacion',
            'equipo_transporte',
            'embarcaciones',
            'instalacion_hidraulica_aireacion',
            'password_reset_tokens'
        ];

        for (const table of tablesToTruncate) {
            await connection.query(`TRUNCATE TABLE ${table};`);
        }

        // 6. Reactivamos la revisión de llaves foráneas
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

        await connection.commit();
        res.status(200).json({ message: '¡Reseteo completado! Todas las cuentas de usuario y sus datos han sido eliminados, excepto la cuenta del superadministrador.' });

    } catch (error) {
        await connection.rollback();
        console.error("Error crítico al resetear la base de datos:", error);
        res.status(500).json({ message: 'Error en el servidor al intentar resetear la base de datos.' });
    } finally {
        if (connection) connection.release();
    }
};

// --- VERSIÓN CORREGIDA DE deleteSolicitante (CON TRANSACCIÓN) ---
exports.deleteSolicitante = async (req, res) => {
    // Obtenemos el ID del solicitante desde la URL (ej: /api/admin/solicitantes/12)
    const { id } = req.params; // Este es el solicitante_id

    const connection = await pool.getConnection();
    try {
        // 1. Iniciamos una transacción
        await connection.beginTransaction();

        // 2. Buscamos el usuario_id asociado a este solicitante_id
        const [solicitantes] = await connection.query('SELECT usuario_id FROM solicitantes WHERE solicitante_id = ?', [id]);

        if (solicitantes.length === 0) {
            await connection.rollback(); // Revertimos la transacción
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }

        const usuarioId = solicitantes[0].usuario_id;

        // 3. ¡AQUÍ ESTÁ LA MAGIA!
        // Rompemos la referencia circular ANTES de borrar.
        // Quitamos la FK que va de 'usuarios' -> 'solicitantes'.
        await connection.query('UPDATE usuarios SET solicitante_id = NULL WHERE id = ?', [usuarioId]);

        // 4. AHORA SÍ BORRAMOS EL USUARIO
        // La tabla 'solicitantes' tiene "ON DELETE CASCADE" en la FK 'usuario_id',
        // así que al borrar el usuario, el solicitante se borrará automáticamente.
        await connection.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

        // 5. Confirmamos la transacción (todo salió bien)
        await connection.commit();

        res.status(200).json({ message: 'Usuario y solicitante eliminados exitosamente.' });

    } catch (error) {
        // Si algo falla en cualquier punto, revertimos todos los cambios
        await connection.rollback();
        console.error("Error en deleteSolicitante:", error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el usuario.' });
    } finally {
        if (connection) connection.release();
    }
};


// --- NUEVA FUNCIÓN PARA OBTENER UN SOLICITANTE POR SU ID ---
exports.getSolicitanteById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT s.solicitante_id, s.nombre, s.apellido_paterno, s.rfc, s.curp, s.actividad, u.rol 
             FROM solicitantes s
             JOIN usuarios u ON s.usuario_id = u.id
             WHERE s.solicitante_id = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error en getSolicitanteById:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// --- NUEVA FUNCIÓN PARA ACTUALIZAR UN SOLICITANTE ---
exports.updateSolicitante = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, rfc, curp, actividad, rol } = req.body;

        // Primero, obtenemos el usuario_id a partir del solicitante_id
        const [solicitantes] = await pool.query('SELECT usuario_id FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (solicitantes.length === 0) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        const usuarioId = solicitantes[0].usuario_id;

        // Actualizamos la tabla 'solicitantes'
        await pool.query(
            'UPDATE solicitantes SET nombre = ?, rfc = ?, curp = ?, actividad = ? WHERE solicitante_id = ?',
            [nombre, rfc, curp, actividad, id]
        );

        // Actualizamos la tabla 'usuarios' con el nuevo rol
        await pool.query(
            'UPDATE usuarios SET rol = ? WHERE id = ?',
            [rol, usuarioId]
        );

        res.status(200).json({ message: 'Datos del solicitante actualizados correctamente.' });
    } catch (error) {
        console.error("Error en updateSolicitante:", error);
        res.status(500).json({ message: 'Error en el servidor al actualizar.' });
    }
};

exports.getAllUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT id, curp, email, rol, creado_en FROM usuarios ORDER BY id DESC');
        res.status(200).json(usuarios);
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.' }); }
};

exports.getAllIntegrantes = async (req, res) => {
    try {
        const [integrantes] = await pool.query('SELECT * FROM integrantes ORDER BY id DESC');
        res.status(200).json(integrantes);
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.' }); }
};

exports.getAllEmbarcaciones = async (req, res) => {
    try {
        const [embarcaciones] = await pool.query('SELECT * FROM embarcaciones_menores ORDER BY id DESC');
        res.status(200).json(embarcaciones);
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.' }); }
};

// --- VERSIÓN ACTUALIZADA DE getSolicitanteDetails ---
exports.getSolicitanteDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [perfilRows] = await pool.query('SELECT * FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (perfilRows.length === 0) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        const perfil = perfilRows[0];

        // ACTUALIZACIÓN: Añadimos las consultas para Anexo 3 y Anexo 4
        const [
            integrantes, 
            embarcaciones,
            anexo3Data,
            anexo4Data
        ] = await Promise.all([
            pool.query('SELECT * FROM integrantes WHERE solicitante_id = ?', [id]),
            pool.query('SELECT * FROM embarcaciones_menores WHERE solicitante_id = ?', [id]),
            pool.query('SELECT * FROM datos_tecnicos_pesca WHERE solicitante_id = ?', [id]),
            pool.query('SELECT * FROM datos_tecnicos_acuacultura WHERE solicitante_id = ?', [id])
        ]);

        // Juntamos todo en un solo objeto de respuesta
        const fullDetails = {
            perfil: perfil,
            integrantes: integrantes[0],
            embarcaciones: embarcaciones[0],
            // Añadimos los nuevos datos. Usamos [0] porque la consulta devuelve un array de filas.
            anexo3: anexo3Data[0][0] || null, 
            anexo4: anexo4Data[0][0] || null
        };

        res.status(200).json(fullDetails);

    } catch (error) {
        console.error("Error en getSolicitanteDetails:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener los detalles.' });
    }
};


// --- NUEVA FUNCIÓN PARA CREAR Y DESCARGAR UN RESPALDO DE LA BD ---
exports.backupDatabase = async (req, res) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const fileName = `repa_backup_${timestamp}.sql`;

    // CAMBIO 1: Obtenemos solo el nombre de la base de datos desde .env
    const { MYSQL_DATABASE } = process.env;

    // CAMBIO 2: Construimos la ruta al archivo de configuración .my.cnf
    // path.join se asegura de que la ruta funcione en cualquier sistema operativo
    const configFile = path.join(__dirname, '..', '.my.cnf');

    // CAMBIO 3: El comando ahora es mucho más simple y seguro
    // --defaults-extra-file le dice a mysqldump que lea las credenciales desde nuestro archivo
    const command = `mysqldump --defaults-extra-file="${configFile}" ${MYSQL_DATABASE}`;

    try {
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        const dumpProcess = exec(command);

        dumpProcess.stdout.pipe(res);

        dumpProcess.stderr.on('data', (data) => {
            // AHORA, la advertencia de la contraseña ya no debería aparecer aquí
            console.error(`Error en mysqldump: ${data}`);
        });

        dumpProcess.on('close', (code) => {
            if (code !== 0) {
                console.log(`mysqldump terminó con código de error ${code}`);
            } else {
                console.log('Respaldo generado y enviado exitosamente (modo seguro).');
            }
        });

    } catch (error) {
        console.error("Error al intentar crear el respaldo:", error);
        res.status(500).json({ message: 'Error en el servidor al generar el respaldo.' });
    }
};