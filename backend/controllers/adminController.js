// backend/controllers/adminController.js
const pool = require('../db');
const { exec } = require('child_process');
const path = require('path');
const bcrypt = require('bcryptjs'); // <-- AÑADIR BCRYPT
const solicitanteModel = require('../models/solicitanteModel');
const { generateRegistroPdf, generateGeneralReportPdf } = require('../services/pdfGenerator');

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
    try {
        const { id } = req.params;
        // El body ahora también puede incluir 'rol'
        const { nombre, rfc, curp, actividad, rol } = req.body;

        const [solicitantes] = await pool.query('SELECT usuario_id FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (solicitantes.length === 0) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        const usuarioId = solicitantes[0].usuario_id;
        
        // Separar nombre
        const nombreParts = (nombre || '').split(' ');
        const nombre_solo = nombreParts.shift() || '';
        const apellido_paterno = nombreParts.shift() || '';
        const apellido_materno = nombreParts.join(' ') || '';

        // Actualizar solicitantes
        await pool.query(
            'UPDATE solicitantes SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, rfc = ?, curp = ?, actividad = ? WHERE solicitante_id = ?',
            [nombre_solo, apellido_paterno, apellido_materno, rfc, curp, actividad, id]
        );

        // Actualizar rol en usuarios (si se proveyó)
        if (rol) {
            // Prevenir que el admin se quite el rol a sí mismo
            if (req.user.id == usuarioId && rol !== req.user.rol) {
                 return res.status(403).json({ message: 'No puedes cambiar tu propio rol.' });
            }
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
    } catch (error) {
        console.error("Error en getAllUsuarios:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
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

// --- FUNCIÓN PDF GENERAL ---
exports.downloadGeneralReportPdf = async (req, res) => {
    await generateGeneralReportPdf(req, res); 
};

// ▼▼▼ NUEVAS FUNCIONES PARA EDITAR USUARIOS ▼▼▼
exports.getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        // Solo selecciona los campos que el admin puede ver/editar
        const [rows] = await pool.query(
            'SELECT id, email, curp, rol FROM usuarios WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error en getUsuarioById:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.updateUsuario = async (req, res) => {
    const connection = await pool.getConnection(); // Usar transacción
    try {
        const { id } = req.params;
        const { email, curp, rol, password } = req.body; // Incluir password

        // Validaciones básicas
        if (!email || !curp || !rol) {
            return res.status(400).json({ message: 'Faltan campos (email, curp, rol).' });
        }
        if (rol !== 'solicitante' && rol !== 'admin' && rol !== 'superadmin') {
            return res.status(400).json({ message: 'Rol inválido.' });
        }

        // Evitar que un superadmin se quite el rol a sí mismo por accidente
        if (req.user.id == id && rol !== 'superadmin') {
             return res.status(403).json({ message: 'Un superadmin no puede cambiar su propio rol.' });
        }
        
        await connection.beginTransaction(); // Iniciar transacción

        // 1. Actualizar la tabla 'usuarios'
        let queryParams = [email, curp.toUpperCase(), rol];
        let queryUpdateUsuario = 'UPDATE usuarios SET email = ?, curp = ?, rol = ?';

        // Si se proveyó una nueva contraseña, encriptarla y añadirla a la consulta
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            queryUpdateUsuario += ', password = ?';
            queryParams.push(hashedPassword);
        }

        queryUpdateUsuario += ' WHERE id = ?';
        queryParams.push(id);

        await connection.query(queryUpdateUsuario, queryParams);
        
        // 2. También actualizamos el curp/email en la tabla 'solicitantes' vinculada (si existe)
        await connection.query(
            'UPDATE solicitantes SET curp = ?, correo_electronico = ? WHERE usuario_id = ?',
            [curp.toUpperCase(), email, id]
        );
        
        await connection.commit(); // Confirmar cambios

        res.status(200).json({ message: 'Cuenta de usuario actualizada correctamente.' });
    } catch (error) {
        await connection.rollback(); // Revertir en caso de error
        console.error("Error en updateUsuario:", error);
         // Manejar error de CURP/Email duplicado
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Error: El email o CURP ya está en uso por otra cuenta.' });
        }
        res.status(500).json({ message: 'Error en el servidor al actualizar el usuario.' });
    } finally {
         if (connection) connection.release(); // Liberar conexión
    }
};
// ▲▲▲ FIN NUEVAS FUNCIONES ▲▲▲