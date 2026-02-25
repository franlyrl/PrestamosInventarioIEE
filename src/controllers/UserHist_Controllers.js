const Usuarios = require('../models/Usuario');
const UsuariosHistorial = require('../models/UsuariosHistorial');
const { generarToken } = require('../utils/generarToken'); // Si necesitas autenticación para ciertas acciones
const { consultarNombrePorCedula } = require('../utils/registroCivil'); // Para validar cédula si es necesario
const Solicitudes = require('../models/Solicitudes'); // Para verificar préstamos activos si es necesario
const { validationResult } = require('express-validator'); // Para validación de datos entrantes
const mongoose = require('mongoose'); // Para validaciones de ID y operaciones avanzadas con MongoDB


/**
 * @desc Controlador para manejar el historial de usuarios inactivos.
 * Este controlador se encarga de mover a los usuarios que han estado inactivos por más de 1 año
 * desde la colección principal "Usuarios" a la colección "UsuariosHistorial".
 */

const UserHist_Controller = {
    /**
     * @desc Mueve usuarios inactivos por más de 1 año al historial.
     */
    ejecutarLimpiezaHistorial: async (req, res) => {
        try {
            // 1. Calculamos la fecha límite (Hoy menos 12 meses)
            const fechaLimite = new Date();
            fechaLimite.setFullYear(fechaLimite.getFullYear() - 1);

            // 2. Buscamos a los que cumplen el tiempo
            const candidatos = await Usuarios.find({
                tipo_rol: 'estudiante',
                estado: 'inactivo',
                inactivo_desde: { $lt: fechaLimite }
            });

            if (candidatos.length === 0) {
                return res.status(200).json({ message: 'No hay registros antiguos para mover al historial.' });
            }

            // 3. Preparar los datos para el historial
            const datosParaMover = candidatos.map(u => {
                const doc = u.toObject();
                doc.fecha_archivado = new Date(); // Sello de cuándo se guardó
                doc.estado = 'archivado';
                return doc;
            });

            // 4. Mover físicamente los datos entre colecciones
            await UsuariosHistorial.insertMany(datosParaMover);

            // 5. Eliminar de la tabla principal
            const idsParaBorrar = candidatos.map(u => u._id);
            const resultado = await Usuarios.deleteMany({ _id: { $in: idsParaBorrar } });

            res.status(200).json({ 
                message: 'Proceso de archivado completado.',
                total_movidos: resultado.deletedCount,
                nota: 'Los datos están seguros en la colección de historial.'
            });

        } catch (error) {
            res.status(500).json({ 
                error: 'Error al procesar el historial académico.', 
                details: error.message 
            });
        }
    }
};

module.exports = UserHist_Controllers;