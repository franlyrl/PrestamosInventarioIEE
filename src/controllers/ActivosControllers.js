/**
 * @file activoController.js
 * @description Gestión de activos fijos del laboratorio (multímetros, osciloscopios, etc.)
 */
const Activos = require('../models/activos');

/**
 * @route GET /api/activos
 * @desc Obtiene la lista completa de equipos registrados en el laboratorio.
 */
exports.getActivos = async (req, res) => {
    try {
        const activos = await Activos.find();
        res.json(activos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los activos', error });
    }
};

/**
 * @route POST /api/activos
 * @desc Registra un nuevo equipo (activo) en la base de datos.
 * @param {Object} req.body - Datos del equipo (nombre, modelo, id_placa, etc.)
 */
exports.createActivo = async (req, res) => {
    try {
        const nuevoActivo = new Activos(req.body);
        const activoGuardado = await nuevoActivo.save();
        res.status(201).json(activoGuardado);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear el activo', error });
    }
};

/**
 * @route PUT /api/activos/:id
 * @desc Actualiza la información de un equipo específico por su ID.
 * @param {String} req.params.id - ID del activo a modificar.
 */
exports.updateActivo = async (req, res) => {
    try {
        const activoActualizado = await Activos.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            // { new: true } devuelve el objeto actualizado. 
            // { runValidators: true } asegura que se respeten las reglas del Schema.
            { new: true, runValidators: true } 
        );

        if (!activoActualizado) {
            return res.status(404).json({ message: 'Activo no encontrado' });
        }
        res.json(activoActualizado);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el activo', error });
    }
};

/**
 * @route DELETE /api/activos/:id
 * @desc Elimina un equipo del inventario de activos.
 */
exports.deleteActivo = async (req, res) => {
    try {
        const activoEliminado = await Activos.findByIdAndDelete(req.params.id);
        if (!activoEliminado) {
            return res.status(404).json({ message: 'Activo no encontrado' });
        }
        res.json({ message: 'Activo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el activo', error });
    }                                   
};