// backend/services/pdfGenerator.js
const PDFDocument = require('pdfkit-table');
const path = require('path');
const pool = require('../db'); // Importar pool
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

// --- CONSTANTES GLOBALES DE FUENTE (para compartir) ---
let FONT_NORMAL = 'Helvetica'; // Fuente por defecto
let FONT_BOLD = 'Helvetica-Bold'; // Fuente por defecto

// --- FUNCIÓN INTERNA PARA OBTENER TODOS LOS DATOS DE 1 SOLICITANTE ---
const _fetchAllDataForSolicitante = async (solicitanteId) => {
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
    ]);
    return {
        perfil, integrantes, embarcacionesMenores, datosPesca, unidadPesquera,
        datosAcuacultura, estanques, instrumentos, conservacion,
        transporte, embarcacionesAcu, hidraulica
    };
};

// --- FUNCIÓN INTERNA PARA DIBUJAR EL CONTENIDO DE 1 SOLICITANTE ---
const _drawPdfForSolicitante = async (doc, data, FONT_STYLES) => {
    // Extraer datos
    const {
        perfil, integrantes, embarcacionesMenores, datosPesca, unidadPesquera,
        datosAcuacultura, estanques, instrumentos, conservacion,
        transporte, embarcacionesAcu, hidraulica
    } = data;
    
    // Extraer estilos
    const {
        PRIMARY_RED, TEXT_COLOR, WHITE,
        FONT_SIZE_NORMAL, FONT_SIZE_SMALL, FONT_SIZE_TITLE, FONT_SIZE_MAIN_TITLE,
        FONT_NORMAL, FONT_BOLD
    } = FONT_STYLES;

    // --- Helpers de Dibujo ---
    const addText = (text, options = {}) => {
        doc.font(FONT_NORMAL).fillColor(TEXT_COLOR).fontSize(FONT_SIZE_NORMAL).text(text, options);
    };
    const addField = (label, value) => {
        const textValue = (value !== null && value !== undefined && value !== '') ? String(value).trim() : 'No registrado';
         try {
             const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - doc.x;
            if (doc.widthOfString(`${label}: ${textValue}`) > availableWidth + 5 || doc.heightOfString(textValue, {width: availableWidth}) > doc.currentLineHeight() * 1.5) {
                doc.font(FONT_BOLD).fillColor(TEXT_COLOR).fontSize(FONT_SIZE_NORMAL).text(label + ':')
                   .font(FONT_NORMAL).text(textValue, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
            } else {
                doc.font(FONT_BOLD).fillColor(TEXT_COLOR).fontSize(FONT_SIZE_NORMAL).text(label + ': ', { continued: true })
                   .font(FONT_NORMAL).text(textValue);
            }
         } catch (e) {
             doc.font(FONT_BOLD).fillColor(TEXT_COLOR).fontSize(FONT_SIZE_NORMAL).text(label + ': ', { continued: true }).font(FONT_NORMAL).text(textValue);
         }
    };
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
    const addTitle = (text) => {
        const neededHeight = 50;
        if (doc.y + neededHeight > doc.page.height - doc.page.margins.bottom) {
             doc.addPage();
        } else if (doc.y > doc.page.margins.top + 10) {
             doc.moveDown(2);
        }
        doc.fontSize(FONT_SIZE_TITLE).font(FONT_BOLD).fillColor(PRIMARY_RED).text(text, { underline: true })
           .moveDown(0.7)
           .fillColor(TEXT_COLOR);
        doc.fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL);
    };
     const addMainTitle = (text) => {
         doc.fontSize(FONT_SIZE_MAIN_TITLE).font(FONT_BOLD).fillColor(PRIMARY_RED).text(text, { align: 'center' });
         doc.fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL).fillColor(TEXT_COLOR).text(`Fecha de Generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center'});
         doc.moveDown(2);
     };
    const addSubTitle = (text) => {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 40) doc.addPage();
        else doc.moveDown(0.7);
        doc.fontSize(FONT_SIZE_NORMAL + 1).font(FONT_BOLD).fillColor(PRIMARY_RED).text(text)
           .moveDown(0.3)
           .fillColor(TEXT_COLOR)
           .fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL);
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
    // ▼▼▼ CORRECCIÓN ▼▼▼
    addField('Municipio', perfil.municipio); // Corregido de 'perfilfil' a 'perfil'
    // ▲▲▲ FIN CORRECCIÓN ▲▲▲
    addField('Localidad', perfil.localidad);
    addField('Colonia', perfil.colonia);
    addField('Código Postal', perfil.codigo_postal);
    addField('Calle', perfil.calle);
    addField('No. Exterior', perfil.no_exterior);
    addField('No. Interior', perfil.no_interior);

    // --- ANEXO 2: USANDO TABLA (CORREGIDO) ---
    if (integrantes && integrantes.length > 0) {
        addTitle('Anexo 2: Integrantes');
        if (isNaN(doc.y)) { doc.y = 100; } else { doc.moveDown(0.5); }
        console.log('Posición Y antes de tabla Integrantes:', doc.y);

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
             await doc.table(tableIntegrantes, {
                 prepareHeader: () => doc.font(FONT_BOLD).fontSize(FONT_SIZE_SMALL).fillColor(WHITE),
                 prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                     doc.font(FONT_NORMAL).fontSize(FONT_SIZE_SMALL).fillColor(TEXT_COLOR);
                 },
                 padding: 3,
                 columnSpacing: 5,
                 headerColor: PRIMARY_RED,
                 headerOpacity: 0.9,
             });
        } catch (tableError) {
             console.error("Error al dibujar tabla Integrantes:", tableError);
             addText("Error al generar la tabla de integrantes.");
        }
    } else {
        addTitle('Anexo 2: Integrantes');
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

    // --- ANEXO 5: USANDO TABLA (CORREGIDO) ---
    if (embarcacionesMenores && embarcacionesMenores.length > 0) {
         addTitle('Anexo 5: Embarcaciones Menores (Pesca)');
         if (isNaN(doc.y)) { doc.y = 100; } else { doc.moveDown(0.5); }
         console.log('Posición Y antes de tabla Embarcaciones:', doc.y);

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
             await doc.table(tableEmbarcaciones, {
                 // Dejamos que pdfkit-table calcule los anchos
                 prepareHeader: () => doc.font(FONT_BOLD).fontSize(FONT_SIZE_SMALL).fillColor(WHITE),
                 prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                     doc.font(FONT_NORMAL).fontSize(FONT_SIZE_SMALL).fillColor(TEXT_COLOR);
                 },
                 padding: 3,
                 columnSpacing: 5,
                 headerColor: PRIMARY_RED,
                 headerOpacity: 0.9,
             });
         } catch (tableError) {
              console.error("Error al dibujar tabla Embarcaciones:", tableError);
             addText("Error al generar la tabla de embarcaciones.");
         }
    } else {
        addTitle('Anexo 5: Embarcaciones Menores (Pesca)');
        addText('No hay embarcaciones menores (Anexo 5) registradas.');
    }
};


// --- ================================== ---
// --- FUNCIÓN PÚBLICA: PDF INDIVIDUAL ---
// --- ================================== ---
const generateRegistroPdf = async (req, res) => {
    try {
        const solicitanteId = req.params.solicitanteId;
        const data = await _fetchAllDataForSolicitante(solicitanteId);

        if (!data.perfil) {
            return res.status(404).json({ message: 'Solicitante no encontrado.' });
        }

        const doc = new PDFDocument({ margin: 50, size: 'LETTER', bufferPages: true });

        // --- Registrar Fuentes ---
        try {
            const fontPathRegular = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Regular.ttf');
            const fontPathBold = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Bold.ttf');
            doc.registerFont('Roboto-Regular', fontPathRegular);
            doc.registerFont('Roboto-Bold', fontPathBold);
            FONT_NORMAL = 'Roboto-Regular'; FONT_BOLD = 'Roboto-Bold';
        } catch (fontError) {
             console.error("Error al registrar fuentes:", fontError.message);
             FONT_NORMAL = 'Helvetica'; FONT_BOLD = 'Helvetica-Bold';
        }
        
        // --- Constantes de Estilo ---
        const PRIMARY_RED = '#800020';
        const TEXT_COLOR = '#333333';
        const WHITE = '#FFFFFF';
        const FONT_SIZE_NORMAL = 9;
        const FONT_SIZE_SMALL = 8;
        const FONT_SIZE_TITLE = 12;
        const FONT_SIZE_MAIN_TITLE = 16;
        const FONT_STYLES = { PRIMARY_RED, TEXT_COLOR, WHITE, FONT_SIZE_NORMAL, FONT_SIZE_SMALL, FONT_SIZE_TITLE, FONT_SIZE_MAIN_TITLE, FONT_NORMAL, FONT_BOLD };

        // Limpieza nombre archivo
        let dynamicPart = (data.perfil.curp || solicitanteId).toString().trim().replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+$/, '');
        const filename = `Registro_REPA_${dynamicPart}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // --- Logo ---
        const logoPath = path.join(__dirname, '..', 'SEDARPA.png');
        try {
            doc.image(logoPath, doc.page.margins.left, doc.page.margins.top, { width: 100 });
            doc.moveDown(1.5);
        } catch (imgError) { console.error("Error al añadir logo:", imgError.message); }

        // --- Dibujar Contenido ---
        await _drawPdfForSolicitante(doc, data, FONT_STYLES); 

        // --- Finalizar PDF (Paginación) ---
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.count; i++) {
             doc.switchToPage(i);
             doc.fontSize(8).fillColor(TEXT_COLOR).text(`Página ${i + 1} de ${range.count}`, 50, doc.page.height - 30, { align: 'center' });
        }
        doc.end();

    } catch (error) {
        console.error("Error generando PDF individual:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: `Error interno del servidor: ${error.message}` });
        } else {
             res.end();
        }
    }
};

// --- ================================== ---
// --- FUNCIÓN PÚBLICA: PDF GENERAL ---
// --- ================================== ---
const generateGeneralReportPdf = async (req, res) => {
    try {
        // 1. Obtener TODOS los solicitantes
        // ▼▼▼ CORRECCIÓN SQL (añadir s. a columnas ambiguas) ▼▼▼
        const [solicitantes] = await pool.query(
            `SELECT 
                s.solicitante_id, s.curp, s.nombre, s.apellido_paterno, s.apellido_materno, s.rfc, s.actividad, u.rol 
             FROM solicitantes s
             LEFT JOIN usuarios u ON s.usuario_id = u.id
             ORDER BY s.nombre, s.apellido_paterno`
        );
        // ▲▲▲ FIN CORRECCIÓN SQL ▲▲▲

        if (!solicitantes || solicitantes.length === 0) {
            return res.status(404).json({ message: 'No se encontraron solicitantes para el reporte.' });
        }

        const doc = new PDFDocument({ margin: 50, size: 'LETTER', bufferPages: true });

        // --- Registrar Fuentes ---
        try {
            const fontPathRegular = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Regular.ttf');
            const fontPathBold = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Bold.ttf');
            doc.registerFont('Roboto-Regular', fontPathRegular);
            doc.registerFont('Roboto-Bold', fontPathBold);
            FONT_NORMAL = 'Roboto-Regular';
            FONT_BOLD = 'Roboto-Bold';
        } catch (fontError) {
             console.error("Error al registrar fuentes. Usando Helvetica.", fontError.message);
             FONT_NORMAL = 'Helvetica';
             FONT_BOLD = 'Helvetica-Bold';
        }
        
        // --- Definir Estilos ---
        const PRIMARY_RED = '#800020';
        const TEXT_COLOR = '#333333';
        const WHITE = '#FFFFFF';
        const FONT_SIZE_NORMAL = 9;
        const FONT_SIZE_SMALL = 8;
        const FONT_SIZE_TITLE = 12;
        const FONT_SIZE_MAIN_TITLE = 16;
        const FONT_STYLES = { PRIMARY_RED, TEXT_COLOR, WHITE, FONT_SIZE_NORMAL, FONT_SIZE_SMALL, FONT_SIZE_TITLE, FONT_SIZE_MAIN_TITLE, FONT_NORMAL, FONT_BOLD };
        // --- Fin Estilos ---

        // Nombre y cabeceras del archivo
        const filename = `Reporte_General_Solicitantes_${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // --- Título del Reporte General ---
        doc.fontSize(FONT_SIZE_MAIN_TITLE).font(FONT_BOLD).fillColor(PRIMARY_RED).text('Reporte General de Solicitantes - REPA', { align: 'center' });
        doc.fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL).fillColor(TEXT_COLOR).text(`Fecha de Generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center'});
        doc.fontSize(FONT_SIZE_NORMAL).font(FONT_NORMAL).fillColor(TEXT_COLOR).text(`Total de Solicitantes: ${solicitantes.length}`);
        doc.moveDown(2);

        // 2. Preparar datos para la tabla resumen
        const tableData = {
            headers: ["Nombre", "RFC", "CURP", "Actividad", "Rol"], // Simplificado
            rows: solicitantes.map(s => [
                [s.nombre, s.apellido_paterno, s.apellido_materno].filter(Boolean).join(' ') || 'N/A',
                s.rfc || 'N/A',
                s.curp || 'N/A',
                s.actividad || 'N/A',
                s.rol || 'N/A'
            ])
        };

        // 3. Dibujar la tabla resumen
        try {
            await doc.table(tableData, {
                 // Dejamos que pdfkit-table calcule los anchos
                 prepareHeader: () => doc.font(FONT_BOLD).fontSize(FONT_SIZE_SMALL).fillColor(WHITE),
                 prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                     doc.font(FONT_NORMAL).fontSize(FONT_SIZE_SMALL).fillColor(TEXT_COLOR);
                 },
                 padding: 3,
                 columnSpacing: 5,
                 headerColor: PRIMARY_RED,
                 headerOpacity: 0.9,
             });
        } catch (tableError) {
             console.error("Error al dibujar tabla General:", tableError);
             doc.font(FONT_NORMAL).fontSize(FONT_SIZE_NORMAL).text("Error al generar la tabla de solicitantes.");
        }


        // 4. Bucle para dibujar los detalles de CADA solicitante
        for (const solicitante of solicitantes) {
            doc.addPage(); // Añade una página nueva para cada solicitante
            const data = await _fetchAllDataForSolicitante(solicitante.solicitante_id);
            if(data.perfil) {
                // Dibujar el logo en cada página nueva
                const logoPath = path.join(__dirname, '..', 'SEDARPA.png');
                try {
                    doc.image(logoPath, doc.page.margins.left, doc.page.margins.top, { width: 100 });
                    doc.moveDown(1.5);
                } catch (imgError) { console.error("Error al añadir logo:", imgError.message); }

                // Llamar a la función de dibujo, pasando los estilos
                await _drawPdfForSolicitante(doc, data, FONT_STYLES);
            }
        }

        // 5. Finalizar (Paginación)
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.count; i++) {
             doc.switchToPage(i);
             doc.fontSize(8).fillColor(TEXT_COLOR).text(`Página ${i + 1} de ${range.count}`, 50, doc.page.height - 30, { align: 'center' });
        }
        doc.end();

    } catch (error) {
        console.error("Error generando PDF general:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: `Error interno del servidor: ${error.message}` });
        } else {
             res.end();
        }
    }
};


// Exportar ambas funciones
module.exports = {
    generateRegistroPdf,
    generateGeneralReportPdf 
};