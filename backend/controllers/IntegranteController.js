// backend/controllers/IntegranteController.js
const integranteModel = require('../models/integranteModel');
const solicitanteModel = require('../models/solicitanteModel');
const { validationResult } = require('express-validator');
const pdfService = require('../services/pdfGenerator');

// Obtener la lista de integrantes (del solicitante logueado)
// Obtener la lista de integrantes
exports.getIntegrantes = async (req, res) => {
    try {
        let integrantes = [];

        // LÓGICA CORREGIDA: Validar rol para SuperAdmin
        if (req.user.rol === 'superadmin') {
            // Si es SuperAdmin, traemos TODOS usando la nueva función del modelo
            integrantes = await integranteModel.getAll();
        } else {
            // Si es usuario normal, traemos solo los suyos
            const solicitanteId = req.user.solicitante_id;
            if (!solicitanteId) {
                return res.status(404).json({ message: 'Perfil de solicitante no encontrado para este usuario.' });
            }
            integrantes = await integranteModel.getBySolicitanteId(solicitanteId);
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
        // Si NO es admin Y el integrante NO pertenece al usuario actual -> BLOQUEAR
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
        
        // 1. Primero buscamos el integrante para ver de quién es
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

        // Actualizar estado del anexo (usamos el ID del dueño real del integrante)
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

        // 1. IMPORTANTE: Buscar antes de borrar para verificar propiedad
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


// Exportar lista de integrantes a PDF
exports.exportarIntegrantesPDF = async (req, res) => {
    try {
        // Reusamos la lógica de obtención según rol (ajusta si usas lógica diferente para SuperAdmin)
        let integrantes = [];
        
        // Si tienes lógica de SuperAdmin para ver todo, úsala aquí. 
        // Por defecto usaremos la del solicitante logueado como en 'getIntegrantes'
        const solicitanteId = req.user.solicitante_id;
        
        if (req.user.rol === 'superadmin') {
             // Si el superadmin debe ver TODOS los de la base de datos:
             integrantes = await integranteModel.getAll(); // Asegúrate que este método exista en tu modelo, si no, usa el de abajo
        } else {
             if (!solicitanteId) return res.status(404).json({ message: 'Solicitante no encontrado.' });
             integrantes = await integranteModel.getBySolicitanteId(solicitanteId);
        }

        if (!integrantes || integrantes.length === 0) {
            return res.status(404).json({ message: 'No hay integrantes para exportar.' });
        }

        // Llamar al servicio de PDF
        await pdfService.generateIntegrantesListPDF(integrantes, res);

    } catch (error) {
        console.error("Error exportando integrantes PDF:", error);
        res.status(500).json({ message: 'Error al generar el PDF.' });
    }
};