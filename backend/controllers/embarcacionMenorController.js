// backend/controllers/embarcacionMenorController.js

const embarcacionMenorModel = require('../models/embarcacionMenorModel');
// ▼▼▼ PASO 1: Importar solicitanteModel ▼▼▼
const solicitanteModel = require('../models/solicitanteModel');
// ▲▲▲ FIN PASO 1 ▲▲▲


// Obtener la lista de embarcaciones
exports.getEmbarcaciones = async (req, res) => {
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(400).json({ message: 'ID de solicitante no encontrado.' });
        }
        const embarcaciones = await embarcacionMenorModel.getBySolicitanteId(solicitanteId);
        res.status(200).json(embarcaciones);
    } catch (error) {
        console.error("Error en getEmbarcaciones:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener embarcaciones.' });
    }
};

// Añadir una nueva embarcación
exports.addEmbarcacion = async (req, res) => {
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(400).json({ message: 'ID de solicitante no encontrado.' });
        }
        const nuevaEmbarcacion = await embarcacionMenorModel.add(req.body, solicitanteId);

        // ▼▼▼ PASO 4: Marcar Anexo 5 como completo ▼▼▼
        try {
            await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo5_completo', true);
        } catch (statusError) {
            console.error("Error al actualizar estado anexo5_completo al añadir:", statusError);
        }
        // ▲▲▲ FIN PASO 4 ▲▲▲

        res.status(201).json({ message: 'Embarcación añadida con éxito.', embarcacion: nuevaEmbarcacion });
    } catch (error) {
        console.error("Error en addEmbarcacion:", error);
        res.status(500).json({ message: 'Error en el servidor al añadir la embarcación.' });
    }
};

// Actualizar una embarcación existente
exports.updateEmbarcacion = async (req, res) => {
    try {
        const { id } = req.params;
        // Obtenemos el solicitanteId asociado a esta embarcación ANTES de actualizar
        const embarcacion = await embarcacionMenorModel.getById(id); // Necesitarás crear esta función en tu modelo
         if (!embarcacion) {
            return res.status(404).json({ message: 'Embarcación no encontrada.' });
        }
        const solicitanteId = embarcacion.solicitante_id; // Asumiendo que tu tabla embarcaciones_menores tiene solicitante_id

        await embarcacionMenorModel.updateById(id, req.body);

        // ▼▼▼ PASO 5: Asegurar que Anexo 5 esté completo ▼▼▼
        if (solicitanteId) { // Solo si encontramos el solicitante ID
            try {
                await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo5_completo', true);
            } catch (statusError) {
                console.error("Error al actualizar estado anexo5_completo al editar:", statusError);
            }
        }
        // ▲▲▲ FIN PASO 5 ▲▲▲

        res.status(200).json({ message: 'Embarcación actualizada con éxito.' });
    } catch (error) {
        console.error("Error en updateEmbarcacion:", error);
        res.status(500).json({ message: 'Error en el servidor al actualizar la embarcación.' });
    }
};

// Eliminar una embarcación
exports.deleteEmbarcacion = async (req, res) => {
    try {
        const { id } = req.params;
        await embarcacionMenorModel.deleteById(id);
        // NOTA: Similar a integrantes, podrías querer marcar anexo5_completo como false
        // si se elimina la última embarcación.
        res.status(200).json({ message: 'Embarcación eliminada con éxito.' });
    } catch (error) {
        console.error("Error en deleteEmbarcacion:", error);
        res.status(500).json({ message: 'Error en el servidor al eliminar la embarcación.' });
    }
};

// --- Necesitarás añadir esta función a tu embarcacionMenorModel.js ---
// Ejemplo:
// exports.getById = async (id) => {
//   const [rows] = await pool.query('SELECT * FROM embarcaciones_menores WHERE id = ?', [id]);
//   return rows[0];
// };