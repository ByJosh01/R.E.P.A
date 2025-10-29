// backend/models/anexo4AcuaculturaModel.js
const pool = require('../db');

const Anexo4 = {};

/**
 * Busca los datos generales del Anexo 4 para un solicitante específico.
 * @param {number} solicitanteId - El ID del solicitante.
 * @returns {object|null} Los datos encontrados o null si no existen.
 */
Anexo4.getBySolicitanteId = async (solicitanteId) => {
    const query = 'SELECT * FROM datos_tecnicos_acuacultura WHERE solicitante_id = ?';
    const [rows] = await pool.execute(query, [solicitanteId]);
    return rows.length > 0 ? rows[0] : null;
};

/**
 * Crea o actualiza los datos generales del Anexo 4.
 * @param {object} datosAnexo - Los datos del formulario.
 * @param {number} solicitanteId - El ID del solicitante.
 * @param {object} [connection] - Conexión opcional para transacciones.
 */
Anexo4.create = async (datosAnexo, solicitanteId, connection) => {
    const db = connection || pool;

    const especiesData = {
        seleccionadas: datosAnexo.especies || [],
        otras: datosAnexo.especiesOtras || ''
    };
    const certificadosData = {
        sanidad: datosAnexo.certificadoSanidadCual || '',
        inocuidad: datosAnexo.certificadoInocuidadCual || '',
        buenas_practicas: datosAnexo.certificadoBuenasPracticasCual || '',
        otros: datosAnexo.certificadoOtrosCual || '',
        seleccionados: Array.isArray(datosAnexo.certificados) ? datosAnexo.certificados : (datosAnexo.certificados ? [datosAnexo.certificados] : [])
    };

    const query = `
        INSERT INTO datos_tecnicos_acuacultura (
            solicitante_id, instalacion_propia, contrato_arrendamiento_anios,
            dimensiones_unidad_produccion, tipo, especies, tipo_instalacion,
            sistema_produccion, produccion_anual_valor, produccion_anual_unidad, certificados
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            instalacion_propia = VALUES(instalacion_propia),
            contrato_arrendamiento_anios = VALUES(contrato_arrendamiento_anios),
            dimensiones_unidad_produccion = VALUES(dimensiones_unidad_produccion),
            tipo = VALUES(tipo),
            especies = VALUES(especies),
            tipo_instalacion = VALUES(tipo_instalacion),
            sistema_produccion = VALUES(sistema_produccion),
            produccion_anual_valor = VALUES(produccion_anual_valor),
            produccion_anual_unidad = VALUES(produccion_anual_unidad),
            certificados = VALUES(certificados);
    `;

    // ▼▼▼ LÓGICA CORREGIDA PARA ENUM('si','no') ▼▼▼
    console.log('Valor de instalacionPropia recibido:', datosAnexo.instalacionPropia);
    let instalacionPropiaValue = null; // Por defecto NULL
    if (datosAnexo.instalacionPropia === 'si') {
        instalacionPropiaValue = 'si'; // Insertar la cadena 'si'
    } else if (datosAnexo.instalacionPropia === 'no') {
        instalacionPropiaValue = 'no'; // Insertar la cadena 'no'
    }
    console.log('Valor a insertar para instalacion_propia:', instalacionPropiaValue);
    // ▲▲▲ FIN LÓGICA CORREGIDA ▲▲▲


    const values = [
        solicitanteId,
        instalacionPropiaValue, // Usar 'si', 'no', o null
        datosAnexo.contratoArrendamientoAnos || null,
        datosAnexo.dimensionesUnidad || null,
        datosAnexo.tipo || null,
        JSON.stringify(especiesData),
        datosAnexo.tipoInstalacion || null,
        datosAnexo.sistemaProduccion || null,
        datosAnexo.produccionAnualValor || null,
        datosAnexo.produccionAnualUnidad || null,
        JSON.stringify(certificadosData)
    ];

    try {
        const [result] = await db.execute(query, values);
        return { affectedRows: result.affectedRows };
    } catch (error) {
         console.error("Error al ejecutar query en anexo4AcuaculturaModel:", error);
         console.error("Valores que se intentaron insertar:", values); // Loguear valores
         throw error; // Re-lanzar el error para que el controlador lo maneje
    }
};

module.exports = Anexo4;