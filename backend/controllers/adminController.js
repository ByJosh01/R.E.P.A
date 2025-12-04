// backend/controllers/adminController.js
const pool = require('../db');
const { exec } = require('child_process');
const path = require('path');
const bcrypt = require('bcryptjs');
const solicitanteModel = require('../models/solicitanteModel');
const embarcacionMenorModel = require('../models/embarcacionMenorModel');
const { generateRegistroPdf, generateGeneralReportPdf } = require('../services/pdfGenerator');
const { validationResult } = require('express-validator');

// --- 1. GESTIÓN DE SOLICITANTES ---

exports.getAllSolicitantes = async (req, res) => {
    try {
        const userRole = req.user.rol; 
        let baseQuery = 'SELECT s.solicitante_id, s.nombre, s.apellido_paterno, s.apellido_materno, s.rfc, s.curp, s.actividad, u.rol FROM solicitantes s LEFT JOIN usuarios u ON s.usuario_id = u.id';

        if (userRole === 'admin') {
            baseQuery += ' WHERE u.rol = \'solicitante\'';
        }
        
        const [solicitantes] = await pool.query(baseQuery);
        res.status(200).json(solicitantes);
    } catch (error) {
        console.error("Error en getAllSolicitantes:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.getSolicitanteById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT s.solicitante_id, s.nombre, s.apellido_paterno, s.apellido_materno, s.rfc, s.curp, s.actividad, u.rol
             FROM solicitantes s
             JOIN usuarios u ON s.usuario_id = u.id
             WHERE s.solicitante_id = ?`,
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Solicitante no encontrado.' });
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error en getSolicitanteById:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.updateSolicitante = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        const data = req.body;

        const [solicitantes] = await pool.query('SELECT usuario_id FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (solicitantes.length === 0) return res.status(404).json({ message: 'Solicitante no encontrado.' });
        
        const usuarioId = solicitantes[0].usuario_id;
        
        const dataToUpdate = {
            nombre: data.nombre,
            apellido_paterno: data.apellido_paterno, 
            apellido_materno: data.apellido_materno, 
            rfc: data.rfc,
            curp: data.curp,
            telefono: data.telefono,
            correo_electronico: data.email,
            nombre_representante_legal: data.representanteLegal,
            actividad: data.actividad,
            entidad_federativa: data.entidad,
            municipio: data.municipio,
            localidad: data.localidad,
            colonia: data.colonia,
            codigo_postal: data.cp,
            calle: data.calle,
            no_exterior: data.numExterior,
            no_interior: data.numInterior,
            numero_integrantes: data.numIntegrantes
        };

        Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

        if (Object.keys(dataToUpdate).length > 0) {
            await pool.query('UPDATE solicitantes SET ? WHERE solicitante_id = ?', [dataToUpdate, id]);
        }

        if (data.rol) {
            if (req.user.id == usuarioId && data.rol !== req.user.rol) {
                 return res.status(403).json({ message: 'No puedes cambiar tu propio rol.' });
            }
            await pool.query('UPDATE usuarios SET rol = ? WHERE id = ?', [data.rol, usuarioId]);
        }
        res.status(200).json({ message: 'Datos del solicitante actualizados correctamente.' });
    } catch (error) {
        console.error("Error en updateSolicitante:", error);
        res.status(500).json({ message: 'Error en el servidor al actualizar.' });
    }
};

exports.deleteSolicitante = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { id } = req.params;
    const adminMakingRequest = req.user;
    const connection = await pool.getConnection();

    try {
        const [targets] = await connection.query(
            'SELECT s.usuario_id, u.rol FROM solicitantes s JOIN usuarios u ON s.usuario_id = u.id WHERE s.solicitante_id = ?',
            [id]
        );

        if (targets.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        
        const targetUsuarioId = targets[0].usuario_id;
        const targetRol = targets[0].rol;

        if (targetUsuarioId == adminMakingRequest.id) {
            connection.release();
            return res.status(403).json({ message: 'Acción no permitida: no puedes eliminar tu propia cuenta.' });
        }

        if (adminMakingRequest.rol === 'admin' && (targetRol === 'superadmin' || targetRol === 'admin')) {
             connection.release();
             return res.status(403).json({ message: 'Permiso denegado: los administradores solo pueden eliminar cuentas de solicitante.' });
        }
        
        await connection.beginTransaction(); 

        const childTables = [
            'integrantes', 'embarcaciones_menores', 'datos_tecnicos_pesca',
            'datos_tecnicos_acuacultura', 'unidad_pesquera', 'unidad_produccion',
            'tipo_estanques', 'instrumentos_medicion', 'sistema_conservacion',
            'equipo_transporte', 'embarcaciones', 'instalacion_hidraulica_aireacion'
        ];
        for (const table of childTables) {
            await connection.query(`DELETE FROM ${table} WHERE solicitante_id = ?`, [id]);
        }
        await connection.query('DELETE FROM solicitantes WHERE solicitante_id = ?', [id]);
        await connection.query('DELETE FROM usuarios WHERE id = ?', [targetUsuarioId]);

        await connection.commit();
        res.status(200).json({ message: 'Usuario y todos sus datos asociados han sido eliminados.' });

    } catch (error) {
        await connection.rollback();
        console.error("Error en deleteSolicitante:", error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el usuario.' });
    } finally {
        if (connection) connection.release();
    }
};

exports.getSolicitanteDetails = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        const [perfilRows] = await pool.query('SELECT * FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (perfilRows.length === 0) return res.status(404).json({ message: 'Solicitante no encontrado.' });
        
        const perfil = perfilRows[0];
        const [integrantes, embarcaciones, anexo3Data, anexo4Data] = await Promise.all([
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

// --- 2. GESTIÓN DE USUARIOS ---

exports.getAllUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT id, curp, email, rol, creado_en FROM usuarios ORDER BY id DESC');
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error en getAllUsuarios:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.getUsuarioById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id, email, curp, rol FROM usuarios WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error en getUsuarioById:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.updateUsuario = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { email, curp, rol, password } = req.body; 

        if (req.user.id == id && rol !== 'superadmin') {
             return res.status(403).json({ message: 'Un superadmin no puede cambiar su propio rol.' });
        }
        
        await connection.beginTransaction(); 

        let queryParams = [email, curp.toUpperCase(), rol];
        let queryUpdateUsuario = 'UPDATE usuarios SET email = ?, curp = ?, rol = ?';

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            queryUpdateUsuario += ', password = ?';
            queryParams.push(hashedPassword);
        }
        queryUpdateUsuario += ' WHERE id = ?';
        queryParams.push(id);
        await connection.query(queryUpdateUsuario, queryParams);
        
        await connection.query(
            'UPDATE solicitantes SET curp = ?, correo_electronico = ? WHERE usuario_id = ?',
            [curp.toUpperCase(), email, id]
        );
        
        await connection.commit(); 
        res.status(200).json({ message: 'Cuenta de usuario actualizada correctamente.' });
    } catch (error) {
        await connection.rollback(); 
        console.error("Error en updateUsuario:", error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Error: El email o CURP ya está en uso por otra cuenta.' });
        }
        res.status(500).json({ message: 'Error en el servidor al actualizar el usuario.' });
    } finally {
         if (connection) connection.release(); 
    }
};

// --- 3. INTEGRANTES ---

exports.getAllIntegrantes = async (req, res) => {
    try {
        const userRole = req.user.rol;
        let baseQuery = 'SELECT i.*, s.nombre as nombre_solicitante FROM integrantes i JOIN solicitantes s ON i.solicitante_id = s.solicitante_id JOIN usuarios u ON s.usuario_id = u.id';
        if (userRole === 'admin') {
            baseQuery += ' WHERE u.rol = \'solicitante\'';
        }
        baseQuery += ' ORDER BY i.id DESC';
        const [integrantes] = await pool.query(baseQuery);
        res.status(200).json(integrantes);
    } catch (error) {
         console.error("Error en getAllIntegrantes:", error);
         res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// --- 4. EMBARCACIONES MENORES ---

exports.getAllEmbarcaciones = async (req, res) => {
    try {
        const userRole = req.user.rol;
        let baseQuery = 'SELECT e.*, s.nombre as nombre_solicitante FROM embarcaciones_menores e JOIN solicitantes s ON e.solicitante_id = s.solicitante_id JOIN usuarios u ON s.usuario_id = u.id';
        if (userRole === 'admin') {
            baseQuery += ' WHERE u.rol = \'solicitante\'';
        }
        baseQuery += ' ORDER BY e.id DESC';
        const [embarcaciones] = await pool.query(baseQuery);
        res.status(200).json(embarcaciones);
    } catch (error) {
        console.error("Error en getAllEmbarcaciones:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.getEmbarcacionById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        const embarcacion = await embarcacionMenorModel.getById(id);
        
        if (!embarcacion) return res.status(404).json({ message: 'Embarcación no encontrada.' });
        
        res.status(200).json(embarcacion);
    } catch (error) {
        console.error("Error en getEmbarcacionById (Admin):", error);
        res.status(500).json({ message: 'Error en el servidor al obtener la embarcación.' });
    }
};

exports.updateEmbarcacionById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        const data = { ...req.body };
        if (data.tonelaje_neto === '') data.tonelaje_neto = null;
        if (data.potencia_hp === '') data.potencia_hp = null;
        
        const result = await embarcacionMenorModel.updateById(id, data);

        if (result.affectedRows === 0) {
            const exists = await embarcacionMenorModel.getById(id);
            if (!exists) return res.status(404).json({ message: 'Embarcación no encontrada.' });
            return res.status(200).json({ message: 'No hubo cambios en los datos.' });
        }

        res.status(200).json({ message: 'Embarcación actualizada con éxito.' });
    } catch (error) {
        console.error("Error en updateEmbarcacionById (Admin):", error);
        res.status(500).json({ message: 'Error en el servidor al actualizar la embarcación.' });
    }
};

// --- 5. DB MAINTENANCE & PDF ---

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
        res.status(200).json({ message: '¡Reseteo completado! Cuentas eliminadas excepto superadmin.' });
    } catch (error) {
        await connection.rollback();
        console.error("Error crítico al resetear la base de datos:", error);
        res.status(500).json({ message: 'Error en el servidor al intentar resetear la base de datos.' });
    } finally {
        if (connection) connection.release();
    }
};

exports.backupDatabase = async (req, res) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const fileName = `repa_backup_${timestamp}.sql`;
    
    const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT } = process.env;
    const certPath = path.join(__dirname, '../isrgrootx1.pem');

    // COMANDO CORREGIDO
    const command = `mysqldump -h ${MYSQL_HOST} -P ${MYSQL_PORT || 4000} -u ${MYSQL_USER} -p"${MYSQL_PASSWORD}" --ssl-mode=VERIFY_IDENTITY --ssl-ca="${certPath}" --column-statistics=0 --no-tablespaces --set-gtid-purged=OFF ${MYSQL_DATABASE}`;

    try {
        console.log("Iniciando respaldo con comando seguro...");
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        const dumpProcess = exec(command);
        dumpProcess.stdout.pipe(res);

        dumpProcess.stderr.on('data', (data) => {
            console.error(`[mysqldump log]: ${data}`);
        });

        dumpProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Error: mysqldump terminó con código ${code}.`);
            } else {
                console.log('✅ Respaldo generado exitosamente.');
            }
        });

    } catch (error) {
        console.error("Error crítico al iniciar el respaldo:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error interno al generar el respaldo.' });
        }
    }
};

exports.downloadRegistroPdf = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send("Error: ID de solicitante no válido.");
    await generateRegistroPdf(req, res);
};

exports.downloadGeneralReportPdf = async (req, res) => {
    await generateGeneralReportPdf(req, res); 
};

exports.backupDatabase = async (req, res) => {
    // 1. Generar nombre de archivo único
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const fileName = `repa_backup_${timestamp}.sql`;
    
    // 2. Obtener credenciales DIRECTAMENTE de las variables de entorno
    const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT } = process.env;
    
    // 3. Ruta al certificado SSL
    const certPath = path.join(__dirname, '../isrgrootx1.pem');

    // 4. COMANDO CORREGIDO PARA TIDB EN LA NUBE
    const command = `mysqldump -h ${MYSQL_HOST} -P ${MYSQL_PORT || 4000} -u ${MYSQL_USER} -p"${MYSQL_PASSWORD}" --ssl-mode=VERIFY_IDENTITY --ssl-ca="${certPath}" --column-statistics=0 --no-tablespaces --set-gtid-purged=OFF ${MYSQL_DATABASE}`;

    try {
        console.log("Iniciando respaldo con comando seguro...");

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Ejecutar mysqldump
        const dumpProcess = exec(command);

        // Redirigir la salida (stdout) directamente a la respuesta (res)
        dumpProcess.stdout.pipe(res);

        // Capturar errores
        dumpProcess.stderr.on('data', (data) => {
            console.error(`[mysqldump log]: ${data}`);
        });

        dumpProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Error: mysqldump terminó con código ${code}.`);
            } else {
                console.log('✅ Respaldo generado y enviado exitosamente.');
            }
        });

    } catch (error) {
        console.error("Error crítico al iniciar el respaldo:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error interno al generar el respaldo.' });
        }
    }
};