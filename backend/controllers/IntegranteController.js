// backend/controllers/integranteController.js

const integranteModel = require('../models/integranteModel');

// Ya no necesitamos solicitanteModel aquí, porque el middleware ya nos da el ID.



// Obtener la lista de integrantes

exports.getIntegrantes = async (req, res) => {

    try {

        // Usamos directamente el solicitante_id que ya viene en req.user gracias al middleware

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

        // Hacemos lo mismo aquí: usamos el ID directamente

        const solicitanteId = req.user.solicitante_id;

        if (!solicitanteId) {

            return res.status(404).json({ message: 'Perfil de solicitante no encontrado para este usuario.' });

        }

        const nuevoIntegrante = await integranteModel.add(req.body, solicitanteId);

        res.status(201).json({ message: 'Integrante añadido con éxito.', integrante: nuevoIntegrante });

    } catch (error) {

        console.error("Error en addIntegrante:", error);

        res.status(500).json({ message: 'Error en el servidor al añadir integrante.' });

    }

};



// Actualizar un integrante existente

exports.updateIntegrante = async (req, res) => {

    try {

        const { id } = req.params;

        await integranteModel.updateById(id, req.body);

        res.status(200).json({ message: 'Integrante actualizado con éxito.' });

    } catch (error) {

        console.error("Error en updateIntegrante:", error);

        res.status(500).json({ message: 'Error en el servidor al actualizar integrante.' });

    }

};



// Eliminar un integrante

exports.deleteIntegrante = async (req, res) => {

    try {

        const { id } = req.params;

        await integranteModel.deleteById(id);

        res.status(200).json({ message: 'Integrante eliminado con éxito.' });

    } catch (error) {

        console.error("Error en deleteIntegrante:", error);

        res.status(500).json({ message: 'Error en el servidor al eliminar integrante.' });

    }

};