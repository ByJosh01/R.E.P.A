const pool = require('../db'); 

const Anexo4 = {};

// Busca los datos del Anexo 4 para un solicitante específico.
Anexo4.getBySolicitanteId = async (solicitanteId) => {
    const query = 'SELECT * FROM datos_tecnicos_acuacultura WHERE solicitante_id = ?';
    const [rows] = await pool.execute(query, [solicitanteId]);
    return rows[0]; // Devuelve el primer resultado o undefined si no hay nada
};

// --- CAMBIO AQUÍ: Se añade "connection" como parámetro ---
// Esto permite que la función se use dentro de una transacción desde el controlador.
Anexo4.create = async (datosAnexo, solicitanteId, connection) => {
    // Si no se pasa una conexión, se usa el pool principal.
    const db = connection || pool;
    
    // Preparamos los objetos para convertirlos a formato JSON
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
        datosAnexo.instalacionPropia || null,
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

    // Se usa 'db' que puede ser la conexión de la transacción o el pool general
    const [result] = await db.execute(query, values);
    return { affectedRows: result.affectedRows };
};

module.exports = Anexo4;