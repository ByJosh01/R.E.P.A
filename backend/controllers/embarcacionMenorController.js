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
             // No detener la respuesta principal
        }
        // ▲▲▲ FIN PASO 4 ▲▲▲

        res.status(201).json({ message: 'Embarcación añadida con éxito.', embarcacion: nuevaEmbarcacion });
    } catch (error) {
        console.error("Error en addEmbarcacion:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al añadir la embarcación.' });
        }
    }
};

// Actualizar una embarcación existente
exports.updateEmbarcacion = async (req, res) => {
    try {
        const { id } = req.params; // ID de la embarcación a actualizar

        // Obtener el solicitanteId asociado a esta embarcación ANTES de actualizar
        const embarcacion = await embarcacionMenorModel.getById(id);
         if (!embarcacion) {
            return res.status(404).json({ message: 'Embarcación no encontrada.' });
        }
        const solicitanteId = embarcacion.solicitante_id; // Asegúrate que tu modelo lo devuelve

        // Actualizar datos de la embarcación
        await embarcacionMenorModel.updateById(id, req.body);

        // ▼▼▼ PASO 5: Asegurar que Anexo 5 esté marcado como completo ▼▼▼
        if (solicitanteId) { // Solo si obtuvimos el ID del solicitante
            try {
                await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo5_completo', true);
            } catch (statusError) {
                console.error("Error al actualizar estado anexo5_completo al editar:", statusError);
                 // No detener la respuesta principal
            }
        } else {
             console.warn(`No se pudo obtener solicitanteId para la embarcación ${id} al actualizar. Estado no actualizado.`);
        }
        // ▲▲▲ FIN PASO 5 ▲▲▲

        res.status(200).json({ message: 'Embarcación actualizada con éxito.' });
    } catch (error) {
        console.error("Error en updateEmbarcacion:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al actualizar la embarcación.' });
        }
    }
};

// Eliminar una embarcación
exports.deleteEmbarcacion = async (req, res) => {
    try {
        const { id } = req.params;
        await embarcacionMenorModel.deleteById(id);
        // Opcional: Podrías verificar si quedan más embarcaciones para este solicitante
        // y si no, poner anexo5_completo en false.
        res.status(200).json({ message: 'Embarcación eliminada con éxito.' });
    } catch (error) {
        console.error("Error en deleteEmbarcacion:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al eliminar la embarcación.' });
        }
    }
};