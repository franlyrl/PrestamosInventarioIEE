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

/**
 * @desc Obtiene insumos filtrados por una categoría del enum.
 */
exports.getInsumosByCategoria = async (req, res) => {
    try {
        const { cat } = req.params;
        const insumos = await Insumos.find({ categoria: cat });
        res.json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar insumos', error });
    }
};

/**
 * @desc Busca insumos por nombre o características usando texto completo.
 */
exports.searchInsumos = async (req, res) => {
    try {
        const { q } = req.query;
        const insumos = await Insumos.find({
            $text: { $search: q }
        });
        res.json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar insumos', error });
    }
};

/**
 * @desc Retorna la lista de todas las categorías definidas en el ENUM del Schema.
 * @route GET /api/insumos/categorias
 */
exports.getEnumCategorias = (req, res) => {
    try {
        // Esta línea "extrae" los valores que escribiste en el enum del Schema
        const categorias = Insumos.schema.path('categoria').enumValues;
        
        res.json({
            total: categorias.length,
            categorias: categorias
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al extraer las categorías del Schema', error });
    }
};

/**
 * @desc Obtiene todos los insumos que pertenecen a una categoría específica.
 * @route GET /api/insumos/filtro/:categoria
 */
exports.getInsumosPorCategoria = async (req, res) => {
    try {
        const { categoria } = req.params;

        // 1. Opcional: Validar si la categoría enviada existe en nuestro ENUM
        const categoriasValidas = Insumos.schema.path('categoria').enumValues;
        
        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({ 
                message: `La categoría '${categoria}' no es válida.`,
                opcionesValidas: categoriasValidas 
            });
        }

        // 2. Buscar los insumos que coincidan
        const insumos = await Insumos.find({ categoria: categoria });

        res.json({
            categoriaSeleccionada: categoria,
            total: insumos.length,
            data: insumos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar los insumos', error });
    }
};

/**
 * @desc Busca insumos por nombre o características usando texto completo.
 * @route GET /api/insumos/search?q=termino
 */
exports.searchInsumos = async (req, res) => {
    try {
        const { q } = req.query;
        const insumos = await Insumos.find({
            $text: { $search: q }
        });
        res.json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar insumos', error });
    }
};

/**
 * @desc Filtra los insumos por su estado (Disponible, Vencido, etc.)
 * @route GET /api/insumos/estado/:estado
 */
exports.getInsumosByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        
        // Buscamos en la base de datos
        const insumos = await Insumos.find({ estadoInsumo: estado });
        
        res.json({
            estadoFiltrado: estado,
            total: insumos.length,
            data: insumos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar insumos por estado', error });
    }
};
