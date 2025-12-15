// backend/controllers/IntegranteController.js
const integranteModel = require('../models/integranteModel');
const solicitanteModel = require('../models/solicitanteModel');
const { validationResult } = require('express-validator');
const pdfService = require('../services/pdfGenerator');

// Obtener la lista de integrantes (con filtros)
exports.getIntegrantes = async (req, res) => {
    try {
        let integrantes = [];
        // Capturamos filtros del Frontend
        const { search, startDate, endDate } = req.query;

        // Validar rol: SuperAdmin y Admin ven todo
        if (req.user.rol === 'superadmin' || req.user.rol === 'admin') {
            // Usamos la función getAll con filtros
            integrantes = await integranteModel.getAll(search, startDate, endDate);
        } else {
            // Usuario normal ve solo los suyos (también con filtros)
            const solicitanteId = req.user.solicitante_id;
            if (!solicitanteId) {
                return res.status(404).json({ message: 'Perfil de solicitante no encontrado para este usuario.' });
            }
            integrantes = await integranteModel.getBySolicitanteId(solicitanteId, search, startDate, endDate);
        }

        res.status(200).json(integrantes);

    } catch (error) {
        console.error("Error en getIntegrantes:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener integrantes.' });
    }
};

// Añadir un nuevo integrante
exports.addIntegrante = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

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

// [SEGURIDAD IDOR] Obtener un integrante específico por su ID
exports.getIntegranteById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        const integrante = await integranteModel.getById(id);
        
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado.' });
        }

        // --- CANDADO DE SEGURIDAD ---
        if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && integrante.solicitante_id !== req.user.solicitante_id) {
            console.warn(`ALERTA DE SEGURIDAD: Usuario ${req.user.id} intentó ver integrante ajeno ${id}`);
            return res.status(403).json({ message: 'Acceso denegado. No tienes permiso para ver este registro.' });
        }
        // ----------------------------
        
        res.status(200).json(integrante);
    } catch (error) {
        console.error("Error en getIntegranteById:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener el integrante.' });
    }
};

// [SEGURIDAD IDOR] Actualizar un integrante
exports.updateIntegrante = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        
        // 1. Verificar existencia y propiedad
        const integrante = await integranteModel.getById(id);
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado.' });
        }

        // --- CANDADO DE SEGURIDAD ---
        if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && integrante.solicitante_id !== req.user.solicitante_id) {
            console.warn(`ALERTA DE SEGURIDAD: Usuario ${req.user.id} intentó editar integrante ajeno ${id}`);
            return res.status(403).json({ message: 'Acceso denegado. No puedes editar este registro.' });
        }
        // ----------------------------

        await integranteModel.updateById(id, req.body);

        // Actualizar estado del anexo
        try {
            await solicitanteModel.updateAnexoStatus(integrante.solicitante_id, 'anexo2_completo', true);
        } catch (statusError) {
            console.error("Error actualizando estado:", statusError);
        }

        res.status(200).json({ message: 'Integrante actualizado con éxito.' });
    } catch (error) {
        console.error("Error en updateIntegrante:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al actualizar integrante.' });
        }
    }
};

// [SEGURIDAD IDOR] Eliminar un integrante
exports.deleteIntegrante = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;

        // 1. Verificar antes de borrar
        const integrante = await integranteModel.getById(id);
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado o ya eliminado.' });
        }

        // --- CANDADO DE SEGURIDAD ---
        if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && integrante.solicitante_id !== req.user.solicitante_id) {
            console.warn(`ALERTA DE SEGURIDAD: Usuario ${req.user.id} intentó eliminar integrante ajeno ${id}`);
            return res.status(403).json({ message: 'Acceso denegado. No puedes eliminar este registro.' });
        }
        // ----------------------------

        await integranteModel.deleteById(id);
        res.status(200).json({ message: 'Integrante eliminado con éxito.' });
    } catch (error) {
        console.error("Error en deleteIntegrante:", error);
         if (!res.headersSent) {
            res.status(500).json({ message: 'Error en el servidor al eliminar integrante.' });
        }
    }
};


// Exportar lista de integrantes a PDF (con filtros)
exports.exportarIntegrantesPDF = async (req, res) => {
    try {
        let integrantes = [];
        const { search, startDate, endDate } = req.query;
        
        if (req.user.rol === 'superadmin' || req.user.rol === 'admin') {
             // Admin exporta todo (filtrado)
             integrantes = await integranteModel.getAll(search, startDate, endDate); 
        } else {
             const solicitanteId = req.user.solicitante_id;
             if (!solicitanteId) return res.status(404).json({ message: 'Solicitante no encontrado.' });
             // Usuario exporta solo lo suyo (filtrado)
             integrantes = await integranteModel.getBySolicitanteId(solicitanteId, search, startDate, endDate);
        }

        if (!integrantes || integrantes.length === 0) {
            return res.status(404).json({ message: 'No hay integrantes para exportar con los filtros seleccionados.' });
        }

        await pdfService.generateIntegrantesListPDF(integrantes, res);

    } catch (error) {
        console.error("Error exportando integrantes PDF:", error);
        res.status(500).json({ message: 'Error al generar el PDF.' });
    }
};