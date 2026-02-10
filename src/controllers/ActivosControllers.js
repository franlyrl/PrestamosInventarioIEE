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

/**
 * @desc 1. Obtiene los detalles de un equipo específico por su ID.
 * @route GET /api/activos/:id
 */
exports.getActivoById = async (req, res) => {
    try {
        const activo = await Activos.findById(req.params.id);
        if (!activo) return res.status(404).json({ message: 'Activo no encontrado' });
        res.json(activo);
    } catch (error) {
        res.status(500).json({ message: 'ID no válido o error de servidor', error });
    }
};

/**
 * @desc 2. Filtra los equipos por su estado (Validado con el Enum del Schema).
 * @route GET /api/activos/estado/:estado
 */
exports.getActivosByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        // Validamos contra el enum de 'estadoActivo' si lo tienes definido así
        const activos = await Activos.find({ estadoActivo: estado });
        res.json({
            estadoFiltrado: estado,
            total: activos.length,
            data: activos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar por estado', error });
    }
};

/**
 * @desc 3. Filtra los equipos por su categoría (CON VALIDACIÓN).
 * @route GET /api/activos/categoria/:categoria
 */
exports.getActivosByCategoria = async (req, res) => {
    try {
        const { categoria } = req.params;
        const categoriasValidas = Activos.schema.path('categoria').enumValues;

        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({ 
                message: `La categoría '${categoria}' no existe`,
                opciones: categoriasValidas 
            });
        }

        const activos = await Activos.find({ categoria });
        res.json({
            categoria,
            total: activos.length,
            data: activos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar por categoría', error });
    }
};

/**
 * @desc 4. EXTRA: Retorna las categorías para el Frontend.
 * @route GET /api/activos/categorias/lista
 */
exports.getEnumCategoriasActivos = (req, res) => {
    const categorias = Activos.schema.path('categoria').enumValues;
    res.json(categorias);
};

