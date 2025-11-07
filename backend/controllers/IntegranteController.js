// backend/controllers/integranteController.js

const integranteModel = require('../models/integranteModel');
const solicitanteModel = require('../models/solicitanteModel');
const { validationResult } = require('express-validator'); // <-- IMPORTADO

// Obtener la lista de integrantes (del solicitante logueado)
exports.getIntegrantes = async (req, res) => {
    // No necesita validación, solo es un GET
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(404).json({ message: 'Perfil de solicitante no encontrado para este usuario.' });
        }
        const integrantes = await integranteModel.getBySolicitanteId(solicitanteId);
        res.status(200).json(integrantes);
    } catch (error) {
        console.error("Error en getIntegrantes:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener integrantes.' });
    }
};

// Añadir un nuevo integrante
exports.addIntegrante = async (req, res) => {
    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(404).json({ message: 'Perfil de solicitante no encontrado para este usuario.' });
        }
        const nuevoIntegrante = await integranteModel.add(req.body, solicitanteId);

        try {
            await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo2_completo', true);
        } catch (statusError) {
            console.error("Error al actualizar estado anexo2_completo al añadir:", statusError);
        }

        res.status(201).json({ message: 'Integrante añadido con éxito.', integrante: nuevoIntegrante });
    } catch (error) {
        console.error("Error en addIntegrante:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al añadir integrante.' });
        }
    }
};

/**
 * Obtener un integrante específico por su ID.
 */
exports.getIntegranteById = async (req, res) => {
    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const { id } = req.params;
        const integrante = await integranteModel.getById(id);
        
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado.' });
        }
        
        res.status(200).json(integrante);
    } catch (error) {
        console.error("Error en getIntegranteById:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener el integrante.' });
    }
};

// Actualizar un integrante existente
exports.updateIntegrante = async (req, res) => {
    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const { id } = req.params; // ID del integrante a actualizar

        const integrante = await integranteModel.getById(id);
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado.' });
        }
        const solicitanteId = integrante.solicitante_id; 

        await integranteModel.updateById(id, req.body);

        if (solicitanteId) { 
            try {
                await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo2_completo', true);
            } catch (statusError) {
                console.error("Error al actualizar estado anexo2_completo al editar:", statusError);
            }
        } else {
             console.warn(`No se pudo obtener solicitanteId para el integrante ${id} al actualizar. Estado no actualizado.`);
        }

        res.status(200).json({ message: 'Integrante actualizado con éxito.' });
    } catch (error) {
        console.error("Error en updateIntegrante:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al actualizar integrante.' });
        }
    }
};

// Eliminar un integrante
exports.deleteIntegrante = async (req, res) => {
    // --- BLOQUE DE VALIDACIÓN AÑADIDO ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    // --- Fin del bloque ---

    try {
        const { id } = req.params;
        await integranteModel.deleteById(id);
        res.status(200).json({ message: 'Integrante eliminado con éxito.' });
    } catch (error) {
        console.error("Error en deleteIntegrante:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al eliminar integrante.' });
        }
    }
};