// backend/controllers/integranteController.js

const integranteModel = require('../models/integranteModel');
// ▼▼▼ PASO 1: Importar solicitanteModel ▼▼▼
const solicitanteModel = require('../models/solicitanteModel');
// ▲▲▲ FIN PASO 1 ▲▲▲

// Obtener la lista de integrantes
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
            // Logear el error pero no detener la respuesta principal
            console.error("Error al actualizar estado anexo2_completo al añadir:", statusError);
        }
        // ▲▲▲ FIN PASO 2 ▲▲▲

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
        // Obtenemos el solicitanteId asociado a este integrante ANTES de actualizar
        const integrante = await integranteModel.getById(id); // Necesitarás crear esta función en tu modelo
        if (!integrante) {
            return res.status(404).json({ message: 'Integrante no encontrado.' });
        }
        const solicitanteId = integrante.solicitante_id; // Asumiendo que tu tabla integrantes tiene solicitante_id

        await integranteModel.updateById(id, req.body);

        // ▼▼▼ PASO 3: Asegurar que Anexo 2 esté completo ▼▼▼
        if (solicitanteId) { // Solo si encontramos el solicitante ID
            try {
                await solicitanteModel.updateAnexoStatus(solicitanteId, 'anexo2_completo', true);
            } catch (statusError) {
                console.error("Error al actualizar estado anexo2_completo al editar:", statusError);
            }
        }
        // ▲▲▲ FIN PASO 3 ▲▲▲

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
        // NOTA: Podrías querer verificar si este era el último integrante
        // y si es así, marcar anexo2_completo como false. Pero por ahora,
        // asumimos que eliminar no lo marca como incompleto.
        res.status(200).json({ message: 'Integrante eliminado con éxito.' });
    } catch (error) {
        console.error("Error en deleteIntegrante:", error);
        res.status(500).json({ message: 'Error en el servidor al eliminar integrante.' });
    }
};

// --- Necesitarás añadir esta función a tu integranteModel.js ---
// Ejemplo:
// exports.getById = async (id) => {
//   const [rows] = await pool.query('SELECT * FROM integrantes WHERE id = ?', [id]);
//   return rows[0];
// };