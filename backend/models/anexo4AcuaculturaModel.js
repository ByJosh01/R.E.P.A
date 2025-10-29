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
    // Devolver null explícitamente si no hay filas
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

    // Convertir arrays y valores específicos a JSON o formato adecuado
    const especiesData = {
        seleccionadas: datosAnexo.especies || [],
        otras: datosAnexo.especiesOtras || ''
    };
    const certificadosData = {
        sanidad: datosAnexo.certificadoSanidadCual || '',
        inocuidad: datosAnexo.certificadoInocuidadCual || '',
        buenas_practicas: datosAnexo.certificadoBuenasPracticasCual || '',
        otros: datosAnexo.certificadoOtrosCual || '',
        seleccionados: datosAnexo.certificados || []
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

    const values = [
        solicitanteId,
        datosAnexo.instalacionPropia === 'si' ? 1 : 0, // Convertir 'si'/'no' a booleano/número
        datosAnexo.contratoArrendamientoAnos || null,
        datosAnexo.dimensionesUnidad || null, // Asumiendo que viene como 'dimensionesUnidad' del form
        datosAnexo.tipo || null,
        JSON.stringify(especiesData), // Guardar como JSON
        datosAnexo.tipoInstalacion || null,
        datosAnexo.sistemaProduccion || null,
        datosAnexo.produccionAnualValor || null,
        datosAnexo.produccionAnualUnidad || null,
        JSON.stringify(certificadosData) // Guardar como JSON
    ];

    const [result] = await db.execute(query, values);
    return { affectedRows: result.affectedRows };
};

module.exports = Anexo4;