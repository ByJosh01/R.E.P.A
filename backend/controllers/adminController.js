// backend/controllers/adminController.js
const pool = require('../db');
const { exec } = require('child_process');
const path = require('path');
// --- REQUIRES PARA PDF ---
const PDFDocument = require('pdfkit');
const solicitanteModel = require('../models/solicitanteModel');
const integranteModel = require('../models/integranteModel');
const embarcacionMenorModel = require('../models/embarcacionMenorModel'); // Anexo 5
const anexo3PescaModel = require('../models/anexo3PescaModel');
const unidadPesqueraModel = require('../models/unidadPesqueraModel');
const anexo4AcuaculturaModel = require('../models/anexo4AcuaculturaModel');
const tipoEstanquesModel = require('../models/tipoEstanquesModel');
const instrumentosMedicionModel = require('../models/instrumentosMedicionModel');
const sistemasConservacionModel = require('../models/sistemasConservacionModel');
const equiposTransporteModel = require('../models/equiposTransporteModel');
const embarcacionesAcuaculturaModel = require('../models/embarcacionesAcuaculturaModel'); // Anexo 4
const instalacionesHidraulicasModel = require('../models/instalacionesHidraulicasModel');
// --- FIN REQUIRES PDF ---

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

// --- FUNCIÓN PARA GENERAR PDF ---
exports.downloadRegistroPdf = async (req, res) => {
    try {
        const solicitanteId = req.params.solicitanteId;

        // 1. Obtener TODOS los datos
        const [
            perfil, integrantes, embarcacionesMenores, datosPesca, unidadPesquera,
            datosAcuacultura, estanques, instrumentos, conservacion,
            transporte, embarcacionesAcu, hidraulica
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
        ]).catch(err => {
            console.error("Error al obtener datos para PDF:", err);
            throw new Error(`Fallo al obtener datos: ${err.message}`);
        });

        if (!perfil) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }

        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

        // Limpieza nombre archivo
        let dynamicPart = (perfil.curp || solicitanteId).toString().trim();
        dynamicPart = dynamicPart.replace(/[^a-zA-Z0-9_-]/g, '_');
        dynamicPart = dynamicPart.replace(/_+$/, '');
        const filename = `Registro_REPA_${dynamicPart}.pdf`;
        console.log('Nombre de archivo generado:', filename); // Log para depurar

        res.setHeader('Content-Type', 'application/pdf');
        // ▼▼▼ CAMBIO: LÍNEA SIN COMILLAS ▼▼▼
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        // ▲▲▲ FIN CAMBIO ▲▲▲
        doc.pipe(res);

        // --- Helpers ---
        const addField = (label, value) => {
            doc.font('Helvetica').text(`${label}: `, { continued: true, underline: false }).font('Helvetica').text(value !== null && value !== undefined && value !== '' ? String(value).trim() : 'No registrado');
        };
        const addJsonField = (label, jsonString, formatFn) => {
             try {
                const data = JSON.parse(jsonString || '{}');
                const formatted = formatFn(data);
                doc.font('Helvetica').text(`${label}: `, { continued: true }).font('Helvetica').text(formatted || 'No registrado');
             } catch(e) {
                 console.warn(`Error parsing JSON for field '${label}': `, jsonString);
                 doc.font('Helvetica').text(`${label}: `, { continued: true }).font('Helvetica-Oblique').text('(Dato no válido)');
             }
        };
         const addYesNoField = (label, dbValue) => {
             addField(label, dbValue === 1 ? 'Sí' : (dbValue === 0 ? 'No' : 'No registrado'));
         };
         const addQuantityField = (label, optionValue, quantityValue) => {
             if (optionValue === 1) {
                addField(label, quantityValue || '0');
             }
         };
         const addDimensionField = (label, optionValue, dimensionValue) => {
              if (optionValue === 1) {
                 addField(label, dimensionValue || 'N/A');
              }
         };
        const addTitle = (text) => {
            if (doc.y > 150) {
                 doc.addPage();
            }
            doc.fontSize(12).font('Helvetica-Bold').text(text, { underline: true }).moveDown(0.5).fontSize(9).font('Helvetica');
        };
         const addMainTitle = (text) => {
             doc.fontSize(16).font('Helvetica-Bold').text(text, { align: 'center' });
             doc.fontSize(10).font('Helvetica').text(`Fecha de Generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center'});
             doc.moveDown(2);
         };
        const addSubTitle = (text) => {
            doc.moveDown(0.5).fontSize(10).font('Helvetica-Bold').text(text).fontSize(9).font('Helvetica');
        };

        // --- PDF CONTENT ---
        addMainTitle('Registro Estatal de Pesca y Acuacultura (REPA)');

        // --- ANEXO 1 ---
        doc.fontSize(12).font('Helvetica-Bold').text('Anexo 1: Datos del Solicitante', { underline: true }).moveDown(0.5).fontSize(9).font('Helvetica');
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
                addField('   Localidad', p.localidad);
                addField('   Municipio', p.municipio);
                doc.moveDown(0.5);
            });
        } else { doc.text('No hay integrantes registrados.'); }

        // --- ANEXO 3 ---
        if (perfil.actividad === 'pesca' || perfil.actividad === 'ambas') {
            addTitle('Anexo 3: Datos Técnicos Pesca');
            if (datosPesca) {
                 addField('Lugar de Captura', datosPesca.lugar);
                 addField('Localidad Captura', datosPesca.localidad_captura);
                 addField('Municipio Captura', datosPesca.municipio_captura);
                 addField('Sitio Desembarque', datosPesca.sitio_desembarque);
                 addField('Localidad Desembarque', datosPesca.localidad_desembarque);
                 addField('Municipio Desembarque', datosPesca.municipio_desembarque);
                 addField('Tipo Pesquería', datosPesca.tipo_pesqueria);
                 addJsonField('Pesquería(s)', datosPesca.pesqueria, data => data?.join(', ')); // Asume array simple
                 addJsonField('Artes de Pesca', datosPesca.artes_pesca_json, data => Object.entries(data || {}).map(([k, v]) => `${k.replace('cantidad_', '')}: ${v || 0}`).join(' | ')); // Formato Clave: Valor
                 addJsonField('Especie(s) Objetivo', datosPesca.especies_objetivo_json, data => [...(data?.seleccionadas || []), data?.otros || ''].filter(Boolean).join(', '));
                 addJsonField('Certificados', datosPesca.certificados_json, data => [...(data?.seleccionados || []), data?.otros || ''].filter(Boolean).join(', '));
                 addField('Nivel Producción Anual', `${datosPesca.nivel_produccion_anual || ''} ${datosPesca.produccion_unidad || ''}`);
                 doc.moveDown(0.5);
            } else { doc.text('No hay datos técnicos de pesca registrados.'); }
            if (unidadPesquera) {
                addSubTitle('Activos Unidad Pesquera:');
                addYesNoField('Embarcaciones Madera', unidadPesquera.embarcacion_madera);
                addQuantityField('   Cantidad', unidadPesquera.embarcacion_madera, unidadPesquera.embarcacion_madera_cantidad);
                addYesNoField('Embarcaciones Fibra Vidrio', unidadPesquera.embarcacion_fibra);
                addQuantityField('   Cantidad', unidadPesquera.embarcacion_fibra, unidadPesquera.embarcacion_fibra_cantidad);
                addYesNoField('Embarcaciones Metal', unidadPesquera.embarcacion_metal);
                addQuantityField('   Cantidad', unidadPesquera.embarcacion_metal, unidadPesquera.embarcacion_metal_cantidad);
                addYesNoField('Motores', unidadPesquera.motores);
                addQuantityField('   Cantidad', unidadPesquera.motores, unidadPesquera.motores_cantidad);
                addYesNoField('Conservación Hielera', unidadPesquera.conservacion_hielera);
                addQuantityField('   Cantidad', unidadPesquera.conservacion_hielera, unidadPesquera.conservacion_hielera_cantidad);
                addYesNoField('Conservación Refrigerador', unidadPesquera.conservacion_refrigerador);
                addQuantityField('   Cantidad', unidadPesquera.conservacion_refrigerador, unidadPesquera.conservacion_refrigerador_cantidad);
                addYesNoField('Conservación Cuarto Frío', unidadPesquera.conservacion_cuartofrio);
                addQuantityField('   Cantidad', unidadPesquera.conservacion_cuartofrio, unidadPesquera.conservacion_cuartofrio_cantidad);
                addYesNoField('Transporte Camioneta', unidadPesquera.transporte_camioneta);
                addQuantityField('   Cantidad', unidadPesquera.transporte_camioneta, unidadPesquera.transporte_camioneta_cantidad);
                addYesNoField('Transporte Caja Fría', unidadPesquera.transporte_cajafria);
                addQuantityField('   Cantidad', unidadPesquera.transporte_cajafria, unidadPesquera.transporte_cajafria_cantidad);
                addYesNoField('Transporte Camión', unidadPesquera.transporte_camion);
                addQuantityField('   Cantidad', unidadPesquera.transporte_camion, unidadPesquera.transporte_camion_cantidad);
            } else { doc.text('No hay datos de activos de unidad pesquera.'); }
        }

        // --- ANEXO 4 ---
        if (perfil.actividad === 'acuacultura' || perfil.actividad === 'ambas') {
            addTitle('Anexo 4: Datos Técnicos Acuacultura');
            if (datosAcuacultura) {
                 addField('Instalación Propia', datosAcuacultura.instalacion_propia ? 'Sí' : 'No');
                 addField('Años Contrato Arrendamiento', datosAcuacultura.contrato_arrendamiento_anios);
                 addField('Dimensiones Unidad', datosAcuacultura.dimensiones_unidad_produccion);
                 addField('Tipo', datosAcuacultura.tipo);
                 addJsonField('Especie(s)', datosAcuacultura.especies, data => [...(data?.seleccionadas || []), data?.otras || ''].filter(Boolean).join(', '));
                 addField('Tipo Instalación', datosAcuacultura.tipo_instalacion);
                 addField('Sistema Producción', datosAcuacultura.sistema_produccion);
                 addField('Nivel Producción Anual', `${datosAcuacultura.produccion_anual_valor || ''} ${datosAcuacultura.produccion_anual_unidad || ''}`);
                 addJsonField('Certificados', datosAcuacultura.certificados, data => {
                    let certs = data?.seleccionados?.filter(c => c !== 'ninguno') || [];
                    if (data?.sanidad) certs.push(`Sanidad(${data.sanidad})`);
                    if (data?.inocuidad) certs.push(`Inocuidad(${data.inocuidad})`);
                    if (data?.buenas_practicas) certs.push(`B. Prácticas(${data.buenas_practicas})`);
                    if (data?.otros) certs.push(`Otros(${data.otros})`);
                    return certs.length > 0 ? certs.join('; ') : 'Ninguno';
                 });
                 doc.moveDown(0.5);
            } else { doc.text('No hay datos generales registrados para el Anexo 4.'); }

             addSubTitle('Activos Unidad Acuícola:');
            if (estanques) {
                doc.text('Tipo Estanques:');
                addYesNoField('   Rústico', estanques.rustico);
                addQuantityField('      Cantidad', estanques.rustico, estanques.rustico_cantidad);
                addDimensionField('      Dimensiones', estanques.rustico, estanques.rustico_dimensiones);
                addYesNoField('   Geomembrana', estanques.geomembrana);
                addQuantityField('      Cantidad', estanques.geomembrana, estanques.geomembrana_cantidad);
                addDimensionField('      Dimensiones', estanques.geomembrana, estanques.geomembrana_dimensiones);
                addYesNoField('   Concreto', estanques.concreto);
                addQuantityField('      Cantidad', estanques.concreto, estanques.concreto_cantidad);
                addDimensionField('      Dimensiones', estanques.concreto, estanques.concreto_dimensiones);
                doc.moveDown(0.2);
            } else { doc.text('   Estanques: No registrados.');}
             if(instrumentos) {
                 doc.text('Instrumentos Medición:');
                 addYesNoField('   Temperatura', instrumentos.instrumento_temperatura);
                 addQuantityField('      Cantidad', instrumentos.instrumento_temperatura, instrumentos.instrumento_temperatura_cantidad);
                 addYesNoField('   Oxígeno', instrumentos.instrumento_oxigeno);
                 addQuantityField('      Cantidad', instrumentos.instrumento_oxigeno, instrumentos.instrumento_oxigeno_cantidad);
                 addYesNoField('   pH', instrumentos.instrumento_ph);
                 addQuantityField('      Cantidad', instrumentos.instrumento_ph, instrumentos.instrumento_ph_cantidad);
                 doc.moveDown(0.2);
             } else { doc.text('   Instrumentos: No registrados.');}
             if(conservacion) {
                 doc.text('Sistema Conservación:');
                 addYesNoField('   Hielera', conservacion.conservacion_hielera);
                 addQuantityField('      Cantidad', conservacion.conservacion_hielera, conservacion.conservacion_hielera_cantidad);
                 addYesNoField('   Refrigerador', conservacion.conservacion_refrigerado);
                 addQuantityField('      Cantidad', conservacion.conservacion_refrigerado, conservacion.conservacion_refrigerado_cantidad);
                 addYesNoField('   Cuarto Frío', conservacion.conservacion_cuartofrio);
                 addQuantityField('      Cantidad', conservacion.conservacion_cuartofrio, conservacion.conservacion_cuartofrio_cantidad);
                 doc.moveDown(0.2);
             } else { doc.text('   Conservación: No registrados.');}
             if(transporte) {
                 doc.text('Equipo Transporte:');
                 addYesNoField('   Lancha', transporte.transporte_lancha);
                 addQuantityField('      Cantidad', transporte.transporte_lancha, transporte.transporte_lancha_cantidad);
                 addYesNoField('   Camioneta', transporte.transporte_camioneta);
                 addQuantityField('      Cantidad', transporte.transporte_camioneta, transporte.transporte_camioneta_cantidad);
                 addYesNoField('   Camioneta Caja Fría', transporte.transporte_cajafria);
                 addQuantityField('      Cantidad', transporte.transporte_cajafria, transporte.transporte_cajafria_cantidad);
                 doc.moveDown(0.2);
            } else { doc.text('   Transporte: No registrados.');}
             if(embarcacionesAcu) {
                 doc.text('Embarcaciones (Acuacultura):');
                 addYesNoField('   Madera', embarcacionesAcu.embarcacion_madera);
                 addQuantityField('      Cantidad', embarcacionesAcu.embarcacion_madera, embarcacionesAcu.embarcacion_madera_cantidad);
                 addYesNoField('   Fibra Vidrio', embarcacionesAcu.embarcacion_fibra_vidrio);
                 addQuantityField('      Cantidad', embarcacionesAcu.embarcacion_fibra_vidrio, embarcacionesAcu.embarcacion_fibra_vidrio_cantidad);
                 addYesNoField('   Metal', embarcacionesAcu.embarcacion_metal);
                 addQuantityField('      Cantidad', embarcacionesAcu.embarcacion_metal, embarcacionesAcu.embarcacion_metal_cantidad);
                 doc.moveDown(0.2);
             } else { doc.text('   Embarcaciones (Acuacultura): No registradas.');}
            if(hidraulica) {
                 doc.text('Instalación Hidráulica y Aireación:');
                 addYesNoField('   Bomba Agua', hidraulica.hidraulica_bomba_agua);
                 addQuantityField('      Cantidad', hidraulica.hidraulica_bomba_agua, hidraulica.hidraulica_bomba_agua_cantidad);
                 addYesNoField('   Aireador', hidraulica.hidraulica_aireador);
                 addQuantityField('      Cantidad', hidraulica.hidraulica_aireador, hidraulica.hidraulica_aireador_cantidad);
                 doc.moveDown(0.2);
             } else { doc.text('   Inst. Hidráulica: No registrada.');}
        }

        // --- ANEXO 5 ---
        if (doc.y > 650) doc.addPage();
        addTitle('Anexo 5: Embarcaciones Menores (Pesca)');
        if (embarcacionesMenores && embarcacionesMenores.length > 0) {
            embarcacionesMenores.forEach((e, i) => {
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
        } else { doc.text('No hay embarcaciones menores (Anexo 5) registradas.'); }

        // --- Finalizar PDF ---
        doc.end();

    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ message: 'Error interno del servidor al generar el PDF.' });
    }
};