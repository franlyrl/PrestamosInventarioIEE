/**
 * @file activoController.js
 * @description Gestión de activos fijos del laboratorio (multímetros, osciloscopios, etc.) con soporte de imagen.
 */
const Activos = require('../models/activos');
const Usuarios = require('../models/usuarios');
const { generarToken } = require('../utils/generarToken');
const { consultarNombrePorCedula } = require('../utils/registroCivil');
const Solicitudes = require('../models/Solicitudes');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * @route GET /api/activos
 * @desc Obtiene la lista completa de equipos registrados en el laboratorio.
 */
exports.getActivos = async (req, res) => {
    try {
        const activosDisponibles = await Activos.find({ estadoActivo: 'disponible' });
        const todosLosActivos = await Activos.find();

        res.json({
            total: todosLosActivos.length,
            disponibles_count: activosDisponibles.length,
            activosDisponibles,
            todosLosActivos
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los activos', error: error.message });
    }
};

/**
 * @desc Registra un nuevo activo o varios. 
 * Ahora incluye soporte para el campo 'imagenUrl'.
 */
exports.createActivo = async (req, res) => {
    try {
        const allowed = ['admin', 'administrativo', 'Administrador'];
        if (!req.user || !allowed.includes(req.user.tipo_rol)) {
            return res.status(403).json({
                message: 'Acceso denegado: Solo el personal administrativo puede registrar activos.'
            });
        }

        const datos = req.body;
        const categoriasValidas = Activos.schema.path('categoria').enumValues;

        // Validación extendida para incluir imagenUrl opcional
        const validar = obj => {
            const { numActivo, numSerie, marca, modelo, categoria } = obj;
            if (!numActivo || !numSerie || !marca || !modelo || !categoria) return false;
            if (!categoriasValidas.includes(categoria)) return false;
            return true;
        };

        // Manejo de inserción masiva (Bulk)
        if (Array.isArray(datos)) {
            if (datos.length === 0) {
                return res.status(400).json({ message: 'Array vacío enviado para creación masiva.' });
            }
            for (const it of datos) {
                if (!validar(it)) {
                    return res.status(400).json({ message: 'Uno o más activos del array no son válidos.' });
                }
            }
            const insertados = await Activos.insertMany(datos);
            return res.status(201).json({
                message: 'Activos registrados con éxito (bulk)',
                count: insertados.length,
                data: insertados
            });
        }

        // Manejo de inserción individual
        if (!validar(datos)) {
            return res.status(400).json({
                message: 'Error: faltan campos obligatorios o categoría inválida.'
            });
        }

        // El campo imagenUrl se asigna automáticamente si viene en el body
        const nuevoActivo = new Activos(datos);
        const activoGuardado = await nuevoActivo.save();

        return res.status(201).json({
            message: "Equipo registrado con éxito en el sistema de activos",
            data: activoGuardado
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Error: El Número de Activo o de Serie ya está asignado a otro equipo.'
            });
        }
        res.status(500).json({
            message: 'Error interno al procesar el registro',
            error: error.message
        });
    }
};

/**
 * @route PUT /api/activos/:id
 * @desc Actualiza la información de un equipo, incluyendo su imagen.
 */
exports.updateActivo = async (req, res) => {
    try {
        const activoActualizado = await Activos.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!activoActualizado) {
            return res.status(404).json({ message: 'Activo no encontrado' });
        }
        res.json(activoActualizado);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el activo', error: error.message });
    }
};

/**
 * @route DELETE /api/activos/:id
 * @desc Baja lógica del activo conservando su registro e imagen para auditoría.
 */
exports.deleteActivo = async (req, res) => {
    try {
        const { observaciones } = req.body;

        if (!req.user || (req.user.tipo_rol !== 'admin' && req.user.tipo_rol !== 'Administrador')) {
            return res.status(403).json({
                message: 'No tiene permisos suficientes para eliminar activos del sistema.'
            });
        }

        if (!observaciones || observaciones.trim().length < 10) {
            return res.status(400).json({
                message: 'Debe proporcionar una justificación (mín. 10 caracteres) para la baja.'
            });
        }

        const activoActualizado = await Activos.findByIdAndUpdate(
            req.params.id,
            {
                estadoActivo: 'dañado', // O el estado que prefieras para bajas
                observaciones: `BAJA: ${observaciones}`,
                fecha_baja: new Date(),
                eliminado_por: req.user._id
            },
            { new: true }
        );

        if (!activoActualizado) {
            return res.status(404).json({ message: 'El activo solicitado no existe.' });
        }

        res.json({
            message: 'El activo ha sido dado de baja correctamente.',
            detalles: {
                id: activoActualizado._id,
                modelo: activoActualizado.modelo,
                razon: activoActualizado.observaciones
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error interno al procesar la baja', error: error.message });
    }
};

/**
 * @desc Obtiene los detalles de un equipo específico incluyendo su imagen.
 */
exports.getActivoById = async (req, res) => {
    try {
        const activo = await Activos.findById(req.params.id);
        if (!activo) return res.status(404).json({ message: 'Activo no encontrado' });
        res.json(activo);
    } catch (error) {
        res.status(500).json({ message: 'ID no válido o error de servidor', error: error.message });
    }
};

/**
 * @desc Filtra los equipos por su estado.
 */
exports.getActivosByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        const activos = await Activos.find({ estadoActivo: estado });
        res.json({
            estadoFiltrado: estado,
            total: activos.length,
            data: activos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar por estado', error: error.message });
    }
};

/**
 * @desc Filtra los equipos por su categoría.
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
        res.status(500).json({ message: 'Error al filtrar por categoría', error: error.message });
    }
};

/**
 * @desc Busca activos por texto e incluye la imagen en los resultados.
 */
exports.searchActivos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') return res.json([]);

        const regex = new RegExp(q, 'i');
        const activos = await Activos.find({
            $or: [
                { marca: regex },
                { modelo: regex },
                { caracteristicas: regex }
            ]
        });
        res.json(activos);
    } catch (error) {
        res.status(500).json({ message: 'Error en búsqueda de activos', error: error.message });
    }
};

/**
 * @desc Retorna las categorías disponibles.
 */
exports.getEnumCategoriasActivos = (req, res) => {
    const categorias = Activos.schema.path('categoria').enumValues;
    res.json(categorias);
};