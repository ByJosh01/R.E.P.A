// backend/controllers/embarcacionMenorController.js
const embarcacionMenorModel = require('../models/embarcacionMenorModel');
const solicitanteModel = require('../models/solicitanteModel');
const { validationResult } = require('express-validator');

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

exports.addEmbarcacion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(400).json({ message: 'ID de solicitante no encontrado.' });
        }
        const nuevaEmbarcacion = await embarcacionMenorModel.add(req.body, solicitanteId);
        try {
            await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo5_completo', true);
        } catch (statusError) {
            console.error("Error al actualizar estado anexo5_completo:", statusError);
        }
        res.status(201).json({ message: 'Embarcación añadida con éxito.', embarcacion: nuevaEmbarcacion });
    } catch (error) {
        console.error("Error en addEmbarcacion:", error);
        if (!res.headersSent) res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// [SEGURIDAD IDOR] Actualizar embarcación
exports.updateEmbarcacion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;

        // 1. Buscar para verificar propiedad
        const embarcacion = await embarcacionMenorModel.getById(id);
        if (!embarcacion) {
            return res.status(404).json({ message: 'Embarcación no encontrada.' });
        }

        // --- CANDADO DE SEGURIDAD ---
        if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && embarcacion.solicitante_id !== req.user.solicitante_id) {
            return res.status(403).json({ message: 'Acceso denegado. No puedes editar esta embarcación.' });
        }
        // ----------------------------

        await embarcacionMenorModel.updateById(id, req.body);

        try {
            await solicitanteModel.updateAnexoStatus(embarcacion.solicitante_id, 'anexo5_completo', true);
        } catch (e) { console.error(e); }

        res.status(200).json({ message: 'Embarcación actualizada con éxito.' });
    } catch (error) {
        console.error("Error en updateEmbarcacion:", error);
        if (!res.headersSent) res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// [SEGURIDAD IDOR] Eliminar embarcación
exports.deleteEmbarcacion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;

        // 1. Buscar antes de borrar
        const embarcacion = await embarcacionMenorModel.getById(id);
        if (!embarcacion) {
            return res.status(404).json({ message: 'Embarcación no encontrada.' });
        }

        // --- CANDADO DE SEGURIDAD ---
        if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && embarcacion.solicitante_id !== req.user.solicitante_id) {
            return res.status(403).json({ message: 'Acceso denegado. No puedes eliminar esta embarcación.' });
        }
        // ----------------------------

        await embarcacionMenorModel.deleteById(id);
        res.status(200).json({ message: 'Embarcación eliminada con éxito.' });
    } catch (error) {
        console.error("Error en deleteEmbarcacion:", error);
        if (!res.headersSent) res.status(500).json({ message: 'Error en el servidor.' });
    }
};