// backend/controllers/embarcacionMenorController.js
const embarcacionMenorModel = require('../models/embarcacionMenorModel');
const solicitanteModel = require('../models/solicitanteModel');
const pdfService = require('../services/pdfGenerator'); // Importar servicio PDF
const { validationResult } = require('express-validator');

// Obtener lista de embarcaciones (Usuario o SuperAdmin)
exports.getEmbarcaciones = async (req, res) => {
    try {
        let embarcaciones = [];
        // Capturamos los filtros que vienen del Frontend
        const { search, startDate, endDate } = req.query;

        // MODIFICACIÓN: Permitir que 'admin' también vea todas las embarcaciones
        if (req.user.rol === 'superadmin' || req.user.rol === 'admin') { 
            // Pasamos los filtros de fecha y búsqueda al modelo
            embarcaciones = await embarcacionMenorModel.getAll(search, startDate, endDate);
        } else {
            // Lógica para usuario 'solicitante' normal
            const solicitanteId = req.user.solicitante_id;
            if (!solicitanteId) {
                // Si es un usuario nuevo sin perfil de solicitante aún
                return res.status(200).json([]); 
            }
            // Los usuarios normales ven solo sus registros
            embarcaciones = await embarcacionMenorModel.getBySolicitanteId(solicitanteId);
        }
        res.status(200).json(embarcaciones);
    } catch (error) {
        console.error("Error en getEmbarcaciones:", error);
        res.status(500).json({ message: 'Error en el servidor al obtener embarcaciones.' });
    }
};

// ▼▼▼ FUNCIÓN QUE FALTABA (Para editar) ▼▼▼
exports.getEmbarcacionById = async (req, res) => {
    try {
        const { id } = req.params;
        const embarcacion = await embarcacionMenorModel.getById(id);

        if (!embarcacion) {
            return res.status(404).json({ message: 'Embarcación no encontrada.' });
        }

        // Seguridad: Verificar que pertenezca al usuario (si no es admin)
        if (req.user.rol !== 'superadmin' && req.user.rol !== 'admin') {
            if (embarcacion.solicitante_id !== req.user.solicitante_id) {
                return res.status(403).json({ message: 'No tienes permiso para ver esta embarcación.' });
            }
        }

        res.status(200).json(embarcacion);
    } catch (error) {
        console.error("Error en getEmbarcacionById:", error);
        res.status(500).json({ message: 'Error al obtener la embarcación.' });
    }
};
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// Añadir nueva embarcación
exports.addEmbarcacion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const solicitanteId = req.user.solicitante_id;
        if (!solicitanteId) {
            return res.status(400).json({ message: 'ID de solicitante no encontrado.' });
        }
        const nueva = await embarcacionMenorModel.add(req.body, solicitanteId);
        res.status(201).json(nueva);
    } catch (error) {
        console.error("Error en addEmbarcacion:", error);
        res.status(500).json({ message: 'Error al registrar la embarcación.' });
    }
};

// Actualizar embarcación
exports.updateEmbarcacion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    try {
        const { id } = req.params;
        
        // Verificar existencia y propiedad
        const embarcacion = await embarcacionMenorModel.getById(id);
        if (!embarcacion) return res.status(404).json({ message: 'Embarcación no encontrada.' });

        if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && embarcacion.solicitante_id !== req.user.solicitante_id) {
            return res.status(403).json({ message: 'Acceso denegado.' });
        }

        await embarcacionMenorModel.updateById(id, req.body);
        res.status(200).json({ message: 'Embarcación actualizada con éxito.' });
    } catch (error) {
        console.error("Error en updateEmbarcacion:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// Eliminar embarcación
exports.deleteEmbarcacion = async (req, res) => {
    try {
        const { id } = req.params;
        const embarcacion = await embarcacionMenorModel.getById(id);
        if (!embarcacion) return res.status(404).json({ message: 'Embarcación no encontrada.' });

        if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && embarcacion.solicitante_id !== req.user.solicitante_id) {
            return res.status(403).json({ message: 'Acceso denegado.' });
        }

        await embarcacionMenorModel.deleteById(id);
        res.status(200).json({ message: 'Embarcación eliminada.' });
    } catch (error) {
        console.error("Error en deleteEmbarcacion:", error);
        res.status(500).json({ message: 'Error al eliminar.' });
    }
};

// Exportar PDF
exports.exportarPdf = async (req, res) => {
    try {
        let embarcaciones = [];
        // Capturar filtros también para el PDF
        const { search, startDate, endDate } = req.query;

        if (req.user.rol === 'superadmin' || req.user.rol === 'admin') {
            // Generar PDF con los filtros aplicados
            embarcaciones = await embarcacionMenorModel.getAll(search, startDate, endDate);
        } else {
            const solicitanteId = req.user.solicitante_id;
            if (!solicitanteId) return res.status(404).json({ message: 'Solicitante no encontrado.' });
            embarcaciones = await embarcacionMenorModel.getBySolicitanteId(solicitanteId);
        }

        if (!embarcaciones || embarcaciones.length === 0) {
            return res.status(404).json({ message: 'No hay embarcaciones para exportar con los filtros seleccionados.' });
        }
        await pdfService.generateEmbarcacionesListPDF(embarcaciones, res);
    } catch (error) {
        console.error("Error exportando PDF embarcaciones:", error);
        res.status(500).json({ message: 'Error al generar el PDF.' });
    }
};