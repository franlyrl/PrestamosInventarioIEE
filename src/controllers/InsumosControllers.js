/**
 * @file insumoController.js
 * @description Gestión de materiales consumibles (resistencias, estaño, componentes, etc.)
 */
const Insumos = require('../models/insumos');

/**
 * @route GET /api/insumos
 * @desc Obtiene la lista completa de insumos disponibles en el inventario.
 */
exports.getInsumos = async (req, res) => {
    try {
        const insumos = await Insumos.find();
        res.json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos', error });
    }
};

/**
 * @route POST /api/insumos
 * @desc Registra un nuevo tipo de insumo en la base de datos.
 * @param {Object} req.body - Datos del insumo (nombre, stock, categoría, etc.)
 */
exports.createInsumo = async (req, res) => {
    try {
        const nuevoInsumo = new Insumos(req.body);
        const insumoGuardado = await nuevoInsumo.save();
        res.status(201).json(insumoGuardado);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear el insumo', error });
    }
};

/**
 * @route PUT /api/insumos/:id
 * @desc Actualiza los detalles o el stock de un insumo existente.
 * @param {String} req.params.id - ID único del insumo.
 */
exports.updateInsumo = async (req, res) => {
    try {
        const insumoActualizado = await Insumos.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            // { new: true } devuelve el registro post-cambio.
            // { runValidators: true } aplica las reglas del Schema al editar.
            { new: true, runValidators: true } 
        );

        if (!insumoActualizado) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }
        res.json(insumoActualizado);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el insumo', error });
    }
};

/**
 * @route DELETE /api/insumos/:id
 * @desc Elimina permanentemente un insumo del inventario.
 */
exports.deleteInsumo = async (req, res) => {
    try {
        const insumoEliminado = await Insumos.findByIdAndDelete(req.params.id);
        if (!insumoEliminado) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }
        res.json({ message: 'Insumo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el insumo', error });
    }                                   
};