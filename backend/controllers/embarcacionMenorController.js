// backend/controllers/embarcacionMenorController.js

const embarcacionMenorModel = require('../models/embarcacionMenorModel');

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
        await embarcacionMenorModel.updateById(id, req.body);
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
        res.status(200).json({ message: 'Embarcación eliminada con éxito.' });
    } catch (error) {
        console.error("Error en deleteEmbarcacion:", error);
        res.status(500).json({ message: 'Error en el servidor al eliminar la embarcación.' });
    }
};