// backend/controllers/integranteController.js

const integranteModel = require('../models/integranteModel');
// ▼▼▼ PASO 1: Importar solicitanteModel ▼▼▼
const solicitanteModel = require('../models/solicitanteModel');
// ▲▲▲ FIN PASO 1 ▲▲▲

// Obtener la lista de integrantes (del solicitante logueado)
exports.getIntegrantes = async (req, res) => {
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
    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(404).json({ message: 'Perfil de solicitante no encontrado para este usuario.' });
        }
        const nuevoIntegrante = await integranteModel.add(req.body, solicitanteId);

        // ▼▼▼ PASO 2: Marcar Anexo 2 como completo ▼▼▼
        try {
            await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo2_completo', true);
        } catch (statusError) {
            console.error("Error al actualizar estado anexo2_completo al añadir:", statusError);
             // No detener la respuesta principal, pero loguear el error
        }
        // ▲▲▲ FIN PASO 2 ▲▲▲

        res.status(201).json({ message: 'Integrante añadido con éxito.', integrante: nuevoIntegrante });
    } catch (error) {
        console.error("Error en addIntegrante:", error);
         // Enviar error solo si no se ha enviado ya una respuesta
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al añadir integrante.' });
        }
    }
};

// ▼▼▼ FUNCIÓN AÑADIDA ▼▼▼
/**
 * Obtener un integrante específico por su ID.
 * Usado por el panel de admin para rellenar el formulario de edición.
 */
exports.getIntegranteById = async (req, res) => {
    try {
        const { id } = req.params;
        const integrante = await integranteModel.getById(id);
        
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado.' });
        }
        
        // Opcional: Verificar si el admin tiene permiso para ver esto
        // Por ahora, si está protegido por 'protect', asumimos que es admin y puede verlo.
        
        res.status(200).json(integrante);
    } catch (error) {
        console.error("Error en getIntegranteById:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener el integrante.' });
    }
};
// ▲▲▲ FIN FUNCIÓN AÑADIDA ▲▲▲

// Actualizar un integrante existente
exports.updateIntegrante = async (req, res) => {
    try {
        const { id } = req.params; // ID del integrante a actualizar

        // Obtener el solicitanteId asociado a este integrante ANTES de actualizar
        const integrante = await integranteModel.getById(id);
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado.' });
        }
        const solicitanteId = integrante.solicitante_id; // Asegúrate que tu modelo lo devuelve

        // Actualizar datos del integrante
        await integranteModel.updateById(id, req.body);

        // ▼▼▼ PASO 3: Asegurar que Anexo 2 esté marcado como completo ▼▼▼
        if (solicitanteId) { // Solo si obtuvimos el ID del solicitante
            try {
                await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo2_completo', true);
            } catch (statusError) {
                console.error("Error al actualizar estado anexo2_completo al editar:", statusError);
                // No detener la respuesta principal
            }
        } else {
             console.warn(`No se pudo obtener solicitanteId para el integrante ${id} al actualizar. Estado no actualizado.`);
        }
        // ▲▲▲ FIN PASO 3 ▲▲▲

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
    try {
        const { id } = req.params;
        await integranteModel.deleteById(id);
        // Opcional: Podrías verificar si quedan más integrantes para este solicitante
        // y si no, poner anexo2_completo en false. Por ahora no lo hacemos.
        res.status(200).json({ message: 'Integrante eliminado con éxito.' });
    } catch (error) {
        console.error("Error en deleteIntegrante:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al eliminar integrante.' });
        }
    }
};