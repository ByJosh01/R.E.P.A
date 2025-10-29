// backend/services/pdfGenerator.js
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

/**
 * Genera el PDF del registro completo para un solicitante y lo envía en la respuesta HTTP.
 * @param {object} req - Objeto de solicitud de Express (para obtener solicitanteId).
 * @param {object} res - Objeto de respuesta de Express (para enviar el PDF).
 */
const generateRegistroPdf = async (req, res) => {
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

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
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
            if (doc.y > 680) { // O un valor adecuado para tu margen inferior
                 doc.addPage();
            } else if (doc.y > 100) {
                 doc.moveDown(1.5);
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

        // --- CONTENIDO DEL PDF ---
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
                 addJsonField('Pesquería(s)', datosPesca.pesqueria, data => data?.join(', '));
                 addJsonField('Artes de Pesca', datosPesca.artes_pesca_json, data => Object.entries(data || {}).map(([k, v]) => `${k.replace('cantidad_', '')}: ${v || 0}`).join(' | '));
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
        if (doc.y > 650) doc.addPage(); // Aproximado, ajusta si es necesario
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
        // Enviar un error JSON para que el frontend pueda mostrar un mensaje
        if (!res.headersSent) {
            res.status(500).json({ message: `Error interno del servidor al generar el PDF: ${error.message}` });
        } else {
             res.end(); // Si ya se envió algo, solo cerramos
        }
    }
};

// Exportamos la función para que el controlador pueda usarla
module.exports = {
    generateRegistroPdf
};