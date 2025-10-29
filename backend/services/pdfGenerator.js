// backend/services/pdfGenerator.js
const PDFDocument = require('pdfkit-table'); // Usar pdfkit-table
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
            embarcacionMenorModel.getBySolicitanteId(solicitanteId), // Anexo 5
            anexo3PescaModel.getBySolicitanteId(solicitanteId),      // Anexo 3 - Parte 1
            unidadPesqueraModel.getBySolicitanteId(solicitanteId),   // Anexo 3 - Parte 2
            anexo4AcuaculturaModel.getBySolicitanteId(solicitanteId), // Anexo 4 - Datos Generales
            tipoEstanquesModel.getBySolicitanteId(solicitanteId),     // Anexo 4 - Activos
            instrumentosMedicionModel.getBySolicitanteId(solicitanteId), // Anexo 4 - Activos
            sistemasConservacionModel.getBySolicitanteId(solicitanteId), // Anexo 4 - Activos
            equiposTransporteModel.getBySolicitanteId(solicitanteId),    // Anexo 4 - Activos
            embarcacionesAcuaculturaModel.getBySolicitanteId(solicitanteId), // Anexo 4 - Activos
            instalacionesHidraulicasModel.getBySolicitanteId(solicitanteId), // Anexo 4 - Activos
        ]).catch(err => {
            console.error("Error al obtener datos para PDF:", err);
            // Lanzamos el error para que sea capturado por el catch principal
            throw new Error(`Fallo al obtener datos: ${err.message}`);
        });

        if (!perfil) {
            // Usamos res.status().json() para consistencia con otros errores
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }

        // Crear Documento PDF con pdfkit-table
        const doc = new PDFDocument({ margin: 50, size: 'LETTER', bufferPages: true }); // bufferPages permite añadir números de página

        // Limpieza nombre archivo
        let dynamicPart = (perfil.curp || solicitanteId).toString().trim();
        dynamicPart = dynamicPart.replace(/[^a-zA-Z0-9_-]/g, '_');
        dynamicPart = dynamicPart.replace(/_+$/, '');
        const filename = `Registro_REPA_${dynamicPart}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`); // Sin comillas
        doc.pipe(res); // Enviar PDF directamente a la respuesta

        // --- Helpers --- (Ajustados ligeramente)
        const FONT_SIZE_NORMAL = 9;
        const FONT_SIZE_TITLE = 12;
        const FONT_SIZE_MAIN_TITLE = 16;
        const FONT_NORMAL = 'Helvetica';
        const FONT_BOLD = 'Helvetica-Bold';

        // Helper simple para añadir texto normal
        const addText = (text, options = {}) => {
            doc.font(FONT_NORMAL).fontSize(FONT_SIZE_NORMAL).text(text, options);
        };
        // Helper para campos clave-valor
        const addField = (label, value) => {
            const textValue = (value !== null && value !== undefined && value !== '') ? String(value).trim() : 'No registrado';
             try {
                 const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - doc.x;
                if (doc.widthOfString(`${label}: ${textValue}`) > availableWidth + 5 || doc.heightOfString(textValue, {width: availableWidth}) > doc.currentLineHeight() * 1.5) {
                    doc.font(FONT_BOLD).fontSize(FONT_SIZE_NORMAL).text(label + ':').font(FONT_NORMAL).text(textValue, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
                } else {
                    doc.font(FONT_BOLD).fontSize(FONT_SIZE_NORMAL).text(label + ': ', { continued: true }).font(FONT_NORMAL).text(textValue);
                }
             } catch (e) {
                 doc.font(FONT_BOLD).fontSize(FONT_SIZE_NORMAL).text(label + ': ', { continued: true }).font(FONT_NORMAL).text(textValue);
             }
        };
        // Helper robusto para JSON
        const addJsonField = (label, jsonString, formatFn) => {
             let formatted = 'No registrado';
             if (jsonString && typeof jsonString === 'string') {
                 try { const data = JSON.parse(jsonString); formatted = formatFn(data) || 'No registrado'; }
                 catch(e) { console.warn(`JSON Parse Error PDF field '${label}'`); formatted = '(Dato corrupto)'; }
             }
             addField(label, formatted);
        };
        const addCommaSeparatedField = (label, stringValue) => {
            const valueToShow = stringValue ? stringValue.replace(/,/g, ', ') : 'No registrado';
             addField(label, valueToShow);
        };
         const addYesNoField = (label, dbValue) => {
             addField(label, dbValue === 1 ? 'Sí' : (dbValue === 0 ? 'No' : 'No registrado'));
         };
         const addQuantityField = (label, optionValue, quantityValue) => {
             addField(label, optionValue === 1 ? (quantityValue || '0') : '0');
         };
         const addDimensionField = (label, optionValue, dimensionValue) => {
              addField(label, optionValue === 1 ? (dimensionValue || 'N/A') : 'N/A');
         };
        // Helper para Títulos (CORREGIDO)
        const addTitle = (text) => {
            const neededHeight = 50;
            if (doc.y + neededHeight > doc.page.height - doc.page.margins.bottom) {
                 doc.addPage();
            } else if (doc.y > doc.page.margins.top + 10) {
                 doc.moveDown(2);
            }
            doc.fontSize(FONT_SIZE_TITLE).font(FONT_BOLD).text(text, { underline: true })
               .moveDown(0.7);
            doc.fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL);
        };
         const addMainTitle = (text) => {
             doc.fontSize(FONT_SIZE_MAIN_TITLE).font(FONT_BOLD).text(text, { align: 'center' });
             doc.fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL).text(`Fecha de Generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center'});
             doc.moveDown(2);
         };
        const addSubTitle = (text) => {
            if (doc.y > doc.page.height - doc.page.margins.bottom - 40) doc.addPage();
            else doc.moveDown(0.7);
            doc.fontSize(FONT_SIZE_NORMAL + 1).font(FONT_BOLD).text(text).moveDown(0.3).fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL);
        };

        // --- CONTENIDO DEL PDF ---
        addMainTitle('Registro Estatal de Pesca y Acuacultura (REPA)');

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

        // --- ANEXO 2: USANDO TABLA (CON RESET DE POSICIÓN) ---
        // Mover la comprobación ANTES del título
        if (integrantes && integrantes.length > 0) {
            addTitle('Anexo 2: Integrantes'); // Añadir título solo si hay datos

            // ▼▼▼ NUEVA VERIFICACIÓN Y RESET ▼▼▼
            if (isNaN(doc.y)) { // Si la posición actual NO es un número válido...
                console.warn('doc.y era NaN antes de tabla Integrantes. Reseteando a 100.');
                doc.y = 100; // ...mueve el cursor a una posición segura (ej. 100)
            } else {
                 doc.moveDown(0.5); // Espacio normal si doc.y es válido
            }
            console.log('Posición Y antes de tabla Integrantes:', doc.y); // Log para verificar
            // ▲▲▲ FIN VERIFICACIÓN Y RESET ▲▲▲

            const tableIntegrantes = {
                title: "",
                headers: ["Nombre", "CURP", "RFC", "Sexo", "Actividad"],
                rows: integrantes.map(p => [
                    p.nombre_completo || 'N/A',
                    p.curp || 'N/A',
                    p.rfc || 'N/A',
                    p.sexo === 1 ? 'M' : p.sexo === 0 ? 'F' : 'N/A',
                    p.actividad_desempeña || 'N/A'
                ])
            };
            try {
                 // Simplificamos las opciones al MÁXIMO
                 await doc.table(tableIntegrantes, {
                      widths: [150, 110, 90, 40, '*'], // Mantener por ahora
                     // Quitamos prepareHeader y prepareRow temporalmente para aislar el error
                 });
            } catch (tableError) {
                 console.error("Error al dibujar tabla Integrantes:", tableError);
                 addText("Error al generar la tabla de integrantes."); // Mensaje en PDF
            }
        } else {
            addTitle('Anexo 2: Integrantes'); // Añadir título aunque no haya datos
            addText('No hay integrantes registrados.');
        }

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
                 addCommaSeparatedField('Pesquería(s)', datosPesca.pesqueria);
                 addField('Artes de Pesca', datosPesca.arte_pesca);
                 addField('Especie(s) Objetivo', datosPesca.especies_objetivo);
                 addField('Certificados', datosPesca.certificados_solicitantes);
                 addField('Nivel Producción Anual', datosPesca.nivel_produccion_anual);
            } else { addText('No hay datos técnicos de pesca registrados.'); }

            if (unidadPesquera) {
                addSubTitle('Activos Unidad Pesquera:');
                addYesNoField('Embarcaciones Madera', unidadPesquera.emb_madera);
                addQuantityField('   Cantidad Madera', unidadPesquera.emb_madera, unidadPesquera.emb_madera_cantidad);
                addYesNoField('Embarcaciones Fibra Vidrio', unidadPesquera.emb_fibra);
                addQuantityField('   Cantidad Fibra', unidadPesquera.emb_fibra, unidadPesquera.emb_fibra_cantidad);
                addYesNoField('Embarcaciones Metal', unidadPesquera.emb_metal);
                addQuantityField('   Cantidad Metal', unidadPesquera.emb_metal, unidadPesquera.emb_metal_cantidad);
                addYesNoField('Motores', unidadPesquera.motores);
                addQuantityField('   Cantidad Motores', unidadPesquera.motores, unidadPesquera.motores_cantidad);
                addYesNoField('Conservación Hielera', unidadPesquera.cons_hielera);
                addQuantityField('   Cantidad Hieleras', unidadPesquera.cons_hielera, unidadPesquera.cons_hielera_cantidad);
                addYesNoField('Conservación Refrigerador', unidadPesquera.cons_refrigerador);
                addQuantityField('   Cantidad Refrigeradores', unidadPesquera.cons_refrigerador, unidadPesquera.cons_refrigerador_cantidad);
                addYesNoField('Conservación Cuarto Frío', unidadPesquera.cons_cuartofrio);
                addQuantityField('   Cantidad Cuartos Fríos', unidadPesquera.cons_cuartofrio, unidadPesquera.cons_cuartofrio_cantidad);
                addYesNoField('Transporte Camioneta', unidadPesquera.trans_camioneta);
                addQuantityField('   Cantidad Camionetas', unidadPesquera.trans_camioneta, unidadPesquera.trans_camioneta_cantidad);
                addYesNoField('Transporte Caja Fría', unidadPesquera.trans_cajafria);
                addQuantityField('   Cantidad Cajas Frías', unidadPesquera.trans_cajafria, unidadPesquera.trans_cajafria_cantidad);
                addYesNoField('Transporte Camión', unidadPesquera.trans_camion);
                addQuantityField('   Cantidad Camiones', unidadPesquera.trans_camion, unidadPesquera.trans_camion_cantidad);
            } else { addText('No hay datos de activos de unidad pesquera.'); }
        }

        // --- ANEXO 4 ---
        if (perfil.actividad === 'acuacultura' || perfil.actividad === 'ambas') {
            addTitle('Anexo 4: Datos Técnicos Acuacultura');
            if (datosAcuacultura) {
                 addYesNoField('Instalación Propia', datosAcuacultura.instalacion_propia);
                 addField('Años Contrato Arrendamiento', datosAcuacultura.contrato_arrendamiento_anios);
                 addField('Dimensiones Unidad', datosAcuacultura.dimensiones_unidad_produccion);
                 addField('Tipo', datosAcuacultura.tipo);
                 addJsonField('Especie(s)', datosAcuacultura.especies, data => [...(data?.seleccionadas || []), data?.otras || ''].filter(Boolean).join(', '));
                 addField('Tipo Instalación', datosAcuacultura.tipo_instalacion);
                 addField('Sistema Producción', datosAcuacultura.sistema_produccion);
                 addField('Nivel Producción Anual', `${datosAcuacultura.produccion_anual_valor || 'No reg.'} ${datosAcuacultura.produccion_anual_unidad || ''}`.trim());
                 addJsonField('Certificados', datosAcuacultura.certificados, data => {
                    let certs = data?.seleccionados?.filter(c => c !== 'ninguno') || [];
                    if (data?.sanidad) certs.push(`Sanidad(${data.sanidad})`);
                    if (data?.inocuidad) certs.push(`Inocuidad(${data.inocuidad})`);
                    if (data?.buenas_practicas) certs.push(`B. Prácticas(${data.buenas_practicas})`);
                    if (data?.otros) certs.push(`Otros(${data.otros})`);
                    return certs.length > 0 ? certs.join('; ') : 'Ninguno';
                 });
            } else { addText('No hay datos generales registrados para el Anexo 4.'); }

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
            } else { addText('   Estanques: No registrados.');}
             if(instrumentos) {
                 doc.moveDown(0.5).text('Instrumentos Medición:');
                 addYesNoField('   Temperatura', instrumentos.instrumento_temperatura);
                 addQuantityField('      Cantidad', instrumentos.instrumento_temperatura, instrumentos.instrumento_temperatura_cantidad);
                 addYesNoField('   Oxígeno', instrumentos.instrumento_oxigeno);
                 addQuantityField('      Cantidad', instrumentos.instrumento_oxigeno, instrumentos.instrumento_oxigeno_cantidad);
                 addYesNoField('   pH', instrumentos.instrumento_ph);
                 addQuantityField('      Cantidad', instrumentos.instrumento_ph, instrumentos.instrumento_ph_cantidad);
             } else { addText('   Instrumentos: No registrados.');}
             if(conservacion) {
                 doc.moveDown(0.5).text('Sistema Conservación:');
                 addYesNoField('   Hielera', conservacion.conservacion_hielera);
                 addQuantityField('      Cantidad', conservacion.conservacion_hielera, conservacion.conservacion_hielera_cantidad);
                 addYesNoField('   Refrigerador', conservacion.conservacion_refrigerado);
                 addQuantityField('      Cantidad', conservacion.conservacion_refrigerado, conservacion.conservacion_refrigerado_cantidad);
                 addYesNoField('   Cuarto Frío', conservacion.conservacion_cuartofrio);
                 addQuantityField('      Cantidad', conservacion.conservacion_cuartofrio, conservacion.conservacion_cuartofrio_cantidad);
             } else { addText('   Conservación: No registrados.');}
             if(transporte) {
                 doc.moveDown(0.5).text('Equipo Transporte:');
                 addYesNoField('   Lancha', transporte.transporte_lancha);
                 addQuantityField('      Cantidad', transporte.transporte_lancha, transporte.transporte_lancha_cantidad);
                 addYesNoField('   Camioneta', transporte.transporte_camioneta);
                 addQuantityField('      Cantidad', transporte.transporte_camioneta, transporte.transporte_camioneta_cantidad);
                 addYesNoField('   Camioneta Caja Fría', transporte.transporte_cajafria);
                 addQuantityField('      Cantidad', transporte.transporte_cajafria, transporte.transporte_cajafria_cantidad);
            } else { addText('   Transporte: No registrados.');}
             if(embarcacionesAcu) {
                 doc.moveDown(0.5).text('Embarcaciones (Acuacultura):');
                 addYesNoField('   Madera', embarcacionesAcu.embarcacion_madera);
                 addQuantityField('      Cantidad', embarcacionesAcu.embarcacion_madera, embarcacionesAcu.embarcacion_madera_cantidad);
                 addYesNoField('   Fibra Vidrio', embarcacionesAcu.embarcacion_fibra_vidrio);
                 addQuantityField('      Cantidad', embarcacionesAcu.embarcacion_fibra_vidrio, embarcacionesAcu.embarcacion_fibra_vidrio_cantidad);
                 addYesNoField('   Metal', embarcacionesAcu.embarcacion_metal);
                 addQuantityField('      Cantidad', embarcacionesAcu.embarcacion_metal, embarcacionesAcu.embarcacion_metal_cantidad);
             } else { addText('   Embarcaciones (Acuacultura): No registradas.');}
            if(hidraulica) {
                 doc.moveDown(0.5).text('Instalación Hidráulica y Aireación:');
                 addYesNoField('   Bomba Agua', hidraulica.hidraulica_bomba_agua);
                 addQuantityField('      Cantidad', hidraulica.hidraulica_bomba_agua, hidraulica.hidraulica_bomba_agua_cantidad);
                 addYesNoField('   Aireador', hidraulica.hidraulica_aireador);
                 addQuantityField('      Cantidad', hidraulica.hidraulica_aireador, hidraulica.hidraulica_aireador_cantidad);
             } else { addText('   Inst. Hidráulica: No registrada.');}
        }

        // --- ANEXO 5: USANDO TABLA (CON RESET DE POSICIÓN) ---
        // Mover la comprobación ANTES del título
        if (embarcacionesMenores && embarcacionesMenores.length > 0) {
             addTitle('Anexo 5: Embarcaciones Menores (Pesca)'); // Añadir título solo si hay datos

             // ▼▼▼ NUEVA VERIFICACIÓN Y RESET ▼▼▼
             if (isNaN(doc.y)) {
                 console.warn('doc.y era NaN antes de tabla Embarcaciones. Reseteando a 100.');
                 doc.y = 100;
             } else {
                 doc.moveDown(0.5); // Espacio normal si doc.y es válido
             }
             console.log('Posición Y antes de tabla Embarcaciones:', doc.y); // Log para verificar
             // ▲▲▲ FIN VERIFICACIÓN Y RESET ▲▲▲

             const tableEmbarcaciones = {
                title: "",
                 headers: ["Nombre", "Matrícula", "Ton.", "Marca Motor", "Serie", "HP", "Puerto Base"],
                 rows: embarcacionesMenores.map(e => [
                     e.nombre_embarcacion || 'N/A',
                     e.matricula || 'N/A',
                     e.tonelaje_neto || 'N/A',
                     e.marca || 'N/A',
                     e.numero_serie || 'N/A',
                     e.potencia_hp || 'N/A',
                     e.puerto_base || 'N/A'
                 ])
             };
             try {
                 // Simplificamos las opciones al MÁXIMO
                 await doc.table(tableEmbarcaciones, {
                      widths: [100, 90, 40, 70, 70, 40, '*'], // Mantener por ahora
                     // Quitamos prepareHeader y prepareRow temporalmente para aislar el error
                 });
             } catch (tableError) {
                  console.error("Error al dibujar tabla Embarcaciones:", tableError);
                 addText("Error al generar la tabla de embarcaciones.");
             }
        } else {
            addTitle('Anexo 5: Embarcaciones Menores (Pesca)'); // Añadir título aunque no haya datos
            addText('No hay embarcaciones menores (Anexo 5) registradas.');
        }


        // --- Finalizar PDF ---
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.count; i++) {
             doc.switchToPage(i);
             doc.fontSize(8).text(`Página ${i + 1} de ${range.count}`, 50, doc.page.height - 30, { align: 'center' });
        }
        doc.end();

    } catch (error) {
        console.error("Error generando PDF:", error);
        // Enviar un error JSON para que el frontend pueda mostrar un mensaje
        if (!res.headersSent) {
            res.status(500).json({ message: `Error interno del servidor al generar el PDF: ${error.message}` });
        } else {
             // Si ya se empezó a enviar el PDF pero falló a la mitad,
             // solo podemos intentar cerrar la conexión. El PDF quedará incompleto/corrupto.
             console.error("Error ocurrió después de enviar cabeceras PDF. Stream terminado.");
             res.end();
        }
    }
};

module.exports = {
    generateRegistroPdf
};