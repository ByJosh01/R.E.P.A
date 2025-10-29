// backend/controllers/adminController.js
const pool = require('../db');
const { exec } = require('child_process');
const path = require('path');
// ▼▼▼ NUEVOS REQUIRES PARA PDF ▼▼▼
const PDFDocument = require('pdfkit');
const solicitanteModel = require('../models/solicitanteModel');
const integranteModel = require('../models/integranteModel');
const embarcacionMenorModel = require('../models/embarcacionMenorModel');
const anexo3PescaModel = require('../models/anexo3PescaModel');
const unidadPesqueraModel = require('../models/unidadPesqueraModel');
const anexo4AcuaculturaModel = require('../models/anexo4AcuaculturaModel');
const tipoEstanquesModel = require('../models/tipoEstanquesModel');
const instrumentosMedicionModel = require('../models/instrumentosMedicionModel');
const sistemasConservacionModel = require('../models/sistemasConservacionModel');
const equiposTransporteModel = require('../models/equiposTransporteModel');
const embarcacionesAcuaculturaModel = require('../models/embarcacionesAcuaculturaModel');
const instalacionesHidraulicasModel = require('../models/instalacionesHidraulicasModel');
// ▲▲▲ FIN NUEVOS REQUIRES ▲▲▲

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
        const { nombre, rfc, curp, actividad, rol } = req.body;
        
        const [solicitantes] = await pool.query('SELECT usuario_id FROM solicitantes WHERE solicitante_id = ?', [id]);
        if (solicitantes.length === 0) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }
        const usuarioId = solicitantes[0].usuario_id;

        // Suponiendo que el nombre viene completo, hay que separarlo.
        // Esto es una simplificación, puede que necesites una lógica más robusta.
        const nombreParts = (nombre || '').split(' ');
        const nombre_solo = nombreParts.shift() || '';
        const apellido_paterno = nombreParts.shift() || '';
        const apellido_materno = nombreParts.join(' ') || '';

        await pool.query(
            'UPDATE solicitantes SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, rfc = ?, curp = ?, actividad = ? WHERE solicitante_id = ?',
            [nombre_solo, apellido_paterno, apellido_materno, rfc, curp, actividad, id]
        );

        if (rol) { // Solo actualiza el rol si se proporciona
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

exports.getAllUsuarios = async (req, res) => { /* Tu código existente */ };
exports.getAllIntegrantes = async (req, res) => { /* Tu código existente */ };
exports.getAllEmbarcaciones = async (req, res) => { /* Tu código existente */ };
exports.getSolicitanteDetails = async (req, res) => { /* Tu código existente */ };
exports.backupDatabase = async (req, res) => { /* Tu código existente */ };

// ▼▼▼ NUEVA FUNCIÓN PARA GENERAR PDF ▼▼▼
exports.downloadRegistroPdf = async (req, res) => {
    try {
        const solicitanteId = req.params.solicitanteId;

        // 1. Obtener TODOS los datos para este solicitante
        const [
            perfil,
            integrantes,
            embarcaciones,
            datosPesca,
            unidadPesquera,
            datosAcuacultura,
            estanques,
            instrumentos,
            conservacion,
            transporte,
            embarcacionesAcu,
            hidraulica
        ] = await Promise.all([
            solicitanteModel.getProfileDataBySolicitanteId(solicitanteId),
            integranteModel.getBySolicitanteId(solicitanteId),
            embarcacionMenorModel.getBySolicitanteId(solicitanteId),
            anexo3PescaModel.getBySolicitanteId(solicitanteId),
            unidadPesqueraModel.getBySolicitanteId(solicitanteId),
            anexo4AcuaculturaModel.getBySolicitanteId(solicitanteId),
            tipoEstanquesModel.getBySolicitanteId(solicitanteId),
            instrumentosMedicionModel.getBySolicitanteId(solicitanteId),
            sistemasConservacionModel.getBySolicitanteId(solicitanteId),
            equiposTransporteModel.getBySolicitanteId(solicitanteId),
            embarcacionesAcuaculturaModel.getBySolicitanteId(solicitanteId),
            instalacionesHidraulicasModel.getBySolicitanteId(solicitanteId),
        ]);

        if (!perfil) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }

        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        const filename = `Registro_REPA_${perfil.curp || solicitanteId}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        const addField = (label, value) => {
            doc.text(`${label}: `, { continued: true, underline: false }).font('Helvetica').text(value ? String(value).trim() : 'No registrado');
        };
        const addTitle = (text) => {
            doc.moveDown(1.5).fontSize(12).font('Helvetica-Bold').text(text, { underline: true }).moveDown(0.5).fontSize(9);
        };
        const addSubTitle = (text) => {
            doc.moveDown(0.5).fontSize(10).font('Helvetica-Bold').text(text).fontSize(9);
        };

        // --- ENCABEZADO ---
        doc.fontSize(16).font('Helvetica-Bold').text('Registro Estatal de Pesca y Acuacultura (REPA)', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Fecha de Generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center'});

        // --- ANEXO 1 ---
        addTitle('Anexo 1: Datos del Solicitante');
        addField('Nombre Completo', [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno].filter(Boolean).join(' '));
        addField('RFC', perfil.rfc);
        addField('CURP', perfil.curp);
        addField('Teléfono', perfil.telefono);
        addField('Correo Electrónico', perfil.correo_electronico);
        addField('Núm. de Integrantes Declarado', perfil.numero_integrantes);
        addField('Actividad Principal', perfil.actividad);
        addField('Representante Legal', perfil.nombre_representante_legal);
        addSubTitle('Domicilio Fiscal:');
        addField('Entidad Federativa', perfil.entidad_federativa);
        addField('Municipio', perfil.municipio);
        addField('Localidad', perfil.localidad);
        addField('Colonia', perfil.colonia);
        addField('Código Postal', perfil.codigo_postal);
        addField('Calle', perfil.calle);
        addField('No. Exterior', perfil.no_exterior);
        addField('No. Interior', perfil.no_interior);

        // --- ANEXO 2 ---
        addTitle('Anexo 2: Integrantes');
        if (integrantes && integrantes.length > 0) {
            integrantes.forEach((p, i) => {
                doc.font('Helvetica-Bold').text(`${i + 1}. ${p.nombre_completo || 'N/A'}`);
                doc.font('Helvetica');
                addField('   CURP', p.curp);
                addField('   RFC', p.rfc);
                addField('   Teléfono', p.telefono);
                addField('   Sexo', p.sexo === 1 ? 'Masculino' : p.sexo === 0 ? 'Femenino' : 'N/A');
                addField('   Grado Estudio', p.ultimo_grado_estudio);
                addField('   Actividad que Desempeña', p.actividad_desempeña);
                doc.moveDown(0.5);
            });
        } else { doc.text('No hay integrantes registrados.'); }

        // --- ANEXO 3 ---
        if (perfil.actividad === 'pesca' || perfil.actividad === 'ambas') {
            addTitle('Anexo 3: Datos Técnicos Pesca');
            if (datosPesca) {
                 // ... Llenar con datos de `datosPesca` y `unidadPesquera` ...
                 doc.text('Datos de Pesca registrados (formato simplificado).');
                 // Aquí puedes añadir los campos que necesites de datosPesca y unidadPesquera
            } else { doc.text('No hay datos registrados para el Anexo 3.'); }
        }

        // --- ANEXO 4 ---
        if (perfil.actividad === 'acuacultura' || perfil.actividad === 'ambas') {
            addTitle('Anexo 4: Datos Técnicos Acuacultura');
            if (datosAcuacultura) {
                 // ... Llenar con datos de todos los modelos de anexo 4 ...
                 doc.text('Datos de Acuacultura registrados (formato simplificado).');
            } else { doc.text('No hay datos registrados para el Anexo 4.'); }
        }

        // --- ANEXO 5 ---
        addTitle('Anexo 5: Embarcaciones Menores');
        if (embarcaciones && embarcaciones.length > 0) {
            embarcaciones.forEach((e, i) => {
                doc.font('Helvetica-Bold').text(`${i + 1}. Nombre: ${e.nombre_embarcacion || 'N/A'}`);
                doc.font('Helvetica');
                addField('   Matrícula', e.matricula);
                addField('   Tonelaje Neto', e.tonelaje_neto);
                addField('   Marca Motor', e.marca);
                addField('   Núm. Serie', e.numero_serie);
                addField('   Potencia (HP)', e.potencia_hp);
                addField('   Puerto Base', e.puerto_base);
                doc.moveDown(0.5);
            });
        } else { doc.text('No hay embarcaciones registradas.'); }

        doc.end();
    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ message: 'Error interno del servidor al generar el PDF.' });
    }
};