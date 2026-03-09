/**
 * @file activoController.js
 * @description Gestión de activos fijos del laboratorio (multímetros, osciloscopios, etc.)
 */
const Activos = require('../models/activos');
const Usuarios = require('../models/usuarios'); // Para verificar roles de usuario si es necesario
const { generarToken } = require('../utils/generarToken'); // Si necesitas autenticación para ciertas acciones
const { consultarNombrePorCedula } = require('../utils/registroCivil'); // Para validar cédula si es necesario
const Solicitudes = require('../models/Solicitudes'); // Para verificar préstamos activos si es necesario
const { validationResult } = require('express-validator'); // Para validación de datos entrantes
const mongoose = require('mongoose'); // Para validaciones de ID y operaciones avanzadas con MongoDB

/**
 * @route GET /api/activos
 * @desc Obtiene la lista completa de equipos registrados en el laboratorio.
 */
exports.getActivos = async (req, res) => {
    try {
        // 1. Primero buscamos los datos (Sin enviar respuesta aún)
        const activosDisponibles = await Activos.find({ estado: 'disponible' });
        const todosLosActivos = await Activos.find(); // El Admin ve todo

        // 2. AHORA enviamos una SOLA respuesta con ambos
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
 * @desc Registra un nuevo activo. 
 * Valida: Rol de usuario, Campos técnicos y Duplicidad de IDs.
 */
exports.createActivo = async (req, res) => {
    try {
            // 1. El middleware de rutas ya limita el acceso a usuarios con tipo_rol
        //    'admin', 'Administrador' o 'administrativo'. Si por alguna razón se llama al
        //    controlador directamente, hacemos una verificación ligera usando el campo
        //    correcto del modelo ('tipo_rol').
        const allowed = ['admin', 'administrativo', 'Administrador'];
        if (!req.user || !allowed.includes(req.user.tipo_rol)) {
            return res.status(403).json({ 
                message: 'Acceso denegado: Solo el personal administrativo puede registrar activos.' 
            });
        }

        // support bulk array or single
        const datos = req.body;
        const categoriasValidas = Activos.schema.path('categoria').enumValues;

        const validar = obj => {
            const { numActivo, numSerie, marca, modelo, categoria } = obj;
            if (!numActivo || !numSerie || !marca || !modelo || !categoria) return false;
            if (!categoriasValidas.includes(categoria)) return false;
            return true;
        };

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

        // single
        if (!validar(datos)) {
            return res.status(400).json({ 
                message: 'Error: faltan campos obligatorios o categoría inválida.' 
            });
        }
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
 * @desc Da de baja un equipo del inventario (Borrado lógico con justificación).
 * @access Privado (Solo Administrador/Admin)
 * @param {String} req.params.id - ID del activo a eliminar.
 * @param {String} req.body.observaciones - Justificación para la baja (mínimo 10 caracteres).
 * @return {Object} Mensaje de confirmación o error.
 * @access Privado (Solo Administrador/Admin)
 * NOTA: En lugar de eliminar físicamente el registro, se actualiza su estado a 'eliminado' y 
 * se guarda la justificación en el campo de observaciones para mantener un historial de bajas. 
 * Esto permite auditorías futuras y evita la pérdida de datos críticos.
 * 
 * Ejemplo de uso:
 * DELETE /api/activos/60f5a3c2b4d1c81234567890
 * Body: {
 *   "observaciones": "Equipo obsoleto y sin repuestos disponibles."
 * }    
 * Respuesta exitosa:
 * {
 *   "message": "El activo ha sido dado de baja correctamente.",
 *   "detalles": {
 *     "id": "60f5a3c2b4d1c81234567890",
 *     "nombre": "Osciloscopio XYZ",
 *     "razon": "BAJA: Equipo obsoleto y sin repuestos disponibles."
 *   }
 * }
 * Respuesta por falta de permisos:
 * {
 *   "message": "No tiene permisos suficientes para eliminar activos del sistema."
 * }
 * Respuesta por falta de justificación:
 * {
 *   "message": "Debe proporcionar una justificación en el campo de observaciones (mín. 10 caracteres) para la baja."
 * }
 * Respuesta por activo no encontrado:
 * {
 *   "message": "El activo solicitado no existe."
 * }
 * Respuesta por error interno:
 * {
 *   "message": "Error interno al procesar la baja del activo.",
 *   "error": "Descripción detallada del error"
 * }
 */
exports.deleteActivo = async (req, res) => {
    try {
        const { observaciones } = req.body;

        // 1. Verificación de Rol
        if (!req.user || (req.user.tipo_rol !== 'admin' && req.user.tipo_rol !== 'Administrador')) {
            return res.status(403).json({ 
                message: 'No tiene permisos suficientes para eliminar activos del sistema.' 
            });
        }

        // 2. Verificación de Justificación
        if (!observaciones || observaciones.trim().length < 10) {
            return res.status(400).json({ 
                message: 'Debe proporcionar una justificación en el campo de observaciones (mín. 10 caracteres) para la baja.' 
            });
        }

        // 3. Borrado lógico
        const activoActualizado = await Activos.findByIdAndUpdate(
            req.params.id,
            { 
                estado: 'eliminado',
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
                nombre: activoActualizado.nombre,
                razon: activoActualizado.observaciones
            }
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error interno al procesar la baja del activo.', 
            error: error.message 
        });
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

/**
 * @route PATCH /api/activos/:id/reactivar
 * @desc Reactiva un activo dado de baja (estado -> 'activo').
 * @access Privado (Solo admin)
 */
exports.reactivarActivo = async (req, res) => {
    try {
        const activo = await Activos.findById(req.params.id);
        if (!activo) {
            return res.status(404).json({ message: 'Activo no encontrado' });
        }
        activo.estado = 'activo';
        activo.observaciones = null;
        activo.fecha_baja = null;
        activo.eliminado_por = null;
        const reactivado = await activo.save();
        res.json({ message: 'Activo reactivado con éxito', data: reactivado });
    } catch (error) {
        res.status(500).json({ message: 'Error al reactivar el activo', error: error.message });
    }
};

/**
 * @route GET /api/activos/estadisticas
 * @desc Devuelve estadísticas básicas del inventario de activos.
 * @access Privado (cualquier usuario autenticado)
 */
exports.getEstadisticas = async (req, res) => {
    try {
        const total = await Activos.countDocuments();
        const porCategoria = await Activos.aggregate([
            { $group: { _id: '$categoria', count: { $sum: 1 } } }
        ]);
        res.json({ total, porCategoria });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

/**
 * @route GET /api/activos/search?q=xxx
 * @desc Busca activos por nombre, marca o modelo usando texto completo.
 * @access Privado (cualquier usuario autenticado)
 */
exports.searchActivos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') return res.json([]);
        
        // Búsqueda con regex en marca, modelo y características (no requiere índice de texto)
        const regex = new RegExp(q, 'i'); // 'i' = case-insensitive
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

