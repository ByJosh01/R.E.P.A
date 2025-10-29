// backend/controllers/adminController.js
const pool = require('../db');
const { exec } = require('child_process');
const path = require('path');
const solicitanteModel = require('../models/solicitanteModel'); // Modelo principal

// ▼▼▼ IMPORTACIÓN ACTUALIZADA ▼▼▼
// Importar AMBAS funciones del servicio de PDF
const { generateRegistroPdf, generateGeneralReportPdf } = require('../services/pdfGenerator');
// ▲▲▲ FIN IMPORTACIÓN ▲▲▲

exports.getAllSolicitantes = async (req, res) => {
    try {
        const [solicitantes] = await pool.query(
            `SELECT s.solicitante_id, s.nombre, s.apellido_paterno, s.apellido_materno, s.rfc, s.curp, s.actividad, u.rol
             FROM solicitantes s
             LEFT JOIN usuarios u ON s.usuario_id = u.id`
        );
        res.status(200).json(solicitantes);
    } catch (error) {
        console.error("Error en getAllSolicitantes:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.resetDatabase = async (req, res) => {
    // ... (Tu código de resetDatabase se queda igual) ...
    const { masterPassword } = req.body;
    const superAdminUserId = req.user.id; 

    if (masterPassword !== process.env.MASTER_RESET_PASSWORD) {
        return res.status(403).json({ message: 'Contraseña maestra incorrecta. Acceso denegado.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        await connection.query('DELETE FROM usuarios WHERE id != ?', [superAdminUserId]);
        await connection.query('DELETE FROM solicitantes WHERE usuario_id != ?', [superAdminUserId]);
        const tablesToTruncate = [
            'integrantes', 'embarcaciones_menores', 'datos_tecnicos_pesca', 'datos_tecnicos_acuacultura',
            'unidad_pesquera', 'unidad_produccion', 'tipo_estanques', 'instrumentos_medicion',
            'sistema_conservacion', 'equipo_transporte', 'embarcaciones', 'instalacion_hidraulica_aireacion',
            'password_reset_tokens'
        ];
        for (const table of tablesToTruncate) {
            await connection.query(`TRUNCATE TABLE ${table};`);
        }
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

exports.deleteSolicitante = async (req, res) => {
    // ... (Tu código de deleteSolicitante se queda igual) ...
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [solicitantes] = await connection.query('SELECT usuario_id FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (solicitantes.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        const usuarioId = solicitantes[0].usuario_id;
        await connection.query('UPDATE usuarios SET solicitante_id = NULL WHERE id = ?', [usuarioId]);
        await connection.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
        await connection.commit();
        res.status(200).json({ message: 'Usuario y solicitante eliminados exitosamente.' });
    } catch (error) {
        await connection.rollback();
        console.error("Error en deleteSolicitante:", error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el usuario.' });
    } finally {
        if (connection) connection.release();
    }
};

exports.getSolicitanteById = async (req, res) => {
    // ... (Tu código de getSolicitanteById se queda igual) ...
     try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT s.solicitante_id, s.nombre, s.apellido_paterno, s.apellido_materno, s.rfc, s.curp, s.actividad, u.rol
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

exports.updateSolicitante = async (req, res) => {
    // ... (Tu código de updateSolicitante se queda igual) ...
    try {
        const { id } = req.params;
        const { nombre, rfc, curp, actividad, rol } = req.body;

        const [solicitantes] = await pool.query('SELECT usuario_id FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (solicitantes.length === 0) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        const usuarioId = solicitantes[0].usuario_id;

        const nombreParts = (nombre || '').split(' ');
        const nombre_solo = nombreParts.shift() || '';
        const apellido_paterno = nombreParts.shift() || '';
        const apellido_materno = nombreParts.join(' ') || '';

        await pool.query(
            'UPDATE solicitantes SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, rfc = ?, curp = ?, actividad = ? WHERE solicitante_id = ?',
            [nombre_solo, apellido_paterno, apellido_materno, rfc, curp, actividad, id]
        );

        if (rol) {
            await pool.query(
                'UPDATE usuarios SET rol = ? WHERE id = ?',
                [rol, usuarioId]
            );
        }
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
        const [integrantes] = await pool.query('SELECT i.*, s.nombre as nombre_solicitante FROM integrantes i JOIN solicitantes s ON i.solicitante_id = s.solicitante_id ORDER BY i.id DESC');
        res.status(200).json(integrantes);
    } catch (error) {
         console.error("Error en getAllIntegrantes:", error);
         res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.getAllEmbarcaciones = async (req, res) => {
    try {
        const [embarcaciones] = await pool.query('SELECT e.*, s.nombre as nombre_solicitante FROM embarcaciones_menores e JOIN solicitantes s ON e.solicitante_id = s.solicitante_id ORDER BY e.id DESC');
        res.status(200).json(embarcaciones);
    } catch (error) {
        console.error("Error en getAllEmbarcaciones:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.getSolicitanteDetails = async (req, res) => {
    // ... (Tu código de getSolicitanteDetails se queda igual) ...
    try {
        const { id } = req.params;
        const [perfilRows] = await pool.query('SELECT * FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (perfilRows.length === 0) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        const perfil = perfilRows[0];
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
        const fullDetails = {
            perfil: perfil,
            integrantes: integrantes[0],
            embarcaciones: embarcaciones[0],
            anexo3: anexo3Data[0][0] || null,
            anexo4: anexo4Data[0][0] || null
        };
        res.status(200).json(fullDetails);
    } catch (error) {
        console.error("Error en getSolicitanteDetails:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener los detalles.' });
    }
};

exports.backupDatabase = async (req, res) => {
    // ... (Tu código de backupDatabase se queda igual) ...
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const fileName = `repa_backup_${timestamp}.sql`;
    const { MYSQL_DATABASE } = process.env;
    const configFile = path.join(__dirname, '..', '.my.cnf');
    const command = `mysqldump --defaults-extra-file="${configFile}" ${MYSQL_DATABASE}`;
    try {
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        const dumpProcess = exec(command);
        dumpProcess.stdout.pipe(res);
        dumpProcess.stderr.on('data', (data) => console.error(`Error en mysqldump: ${data}`));
        dumpProcess.on('close', (code) => {
            if (code !== 0) console.log(`mysqldump terminó con código de error ${code}`);
            else console.log('Respaldo generado y enviado exitosamente (modo seguro).');
        });
    } catch (error) {
        console.error("Error al intentar crear el respaldo:", error);
        res.status(500).json({ message: 'Error en el servidor al generar el respaldo.' });
    }
};

// --- FUNCIÓN PDF INDIVIDUAL ---
exports.downloadRegistroPdf = async (req, res) => {
    await generateRegistroPdf(req, res);
};

// ▼▼▼ NUEVA FUNCIÓN AÑADIDA ▼▼▼
exports.downloadGeneralReportPdf = async (req, res) => {
    // Delega la nueva lógica al servicio
    await generateGeneralReportPdf(req, res); 
};
// ▲▲▲ FIN NUEVA FUNCIÓN ▲▲▲