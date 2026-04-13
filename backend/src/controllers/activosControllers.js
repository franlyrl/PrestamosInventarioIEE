/**
 * @file activoController.js
 * @description Gestión de activos fijos del laboratorio (multímetros, osciloscopios, etc.) con soporte de imagen.
 */
const Activos = require('../models/activos');
const Usuarios = require('../models/usuarios');
const { generarToken } = require('../utils/generarToken');
const { consultarNombrePorCedula } = require('../utils/registroCivil');
const Solicitudes = require('../models/solicitudes');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const google = require('googlethis');

/**
 * @route GET /api/activos
 * @desc Obtiene la lista completa de equipos registrados en el laboratorio.
 */
exports.getActivos = async (req, res) => {
    try {
        const todosLosActivos = await Activos.find();
        res.json(todosLosActivos);
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
                estadoActivo: 'eliminado',
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
        const activos = await Activos.find({ estadoActivo: String(estado).toLowerCase() });
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

/**
 * @route PATCH /api/activos/:id/mal-estado
 * @desc Marca un activo como 'mal_estado' con una observación descriptiva del daño.
 * @access Privado (Solo Admin / Administrativo)
 */
exports.marcarMalEstado = async (req, res) => {
    try {
        const { observacion } = req.body;

        if (!observacion || observacion.trim().length < 5) {
            return res.status(400).json({
                message: 'Se requiere una observación (mín. 5 caracteres) describiendo el problema.'
            });
        }

        const activo = await Activos.findByIdAndUpdate(
            req.params.id,
            {
                estadoActivo: 'mal_estado',
                observacion_estado: observacion.trim(),
                observaciones: `MAL ESTADO: ${observacion.trim()}`
            },
            { new: true, runValidators: true }
        );

        if (!activo) {
            return res.status(404).json({ message: 'Activo no encontrado.' });
        }

        res.json({
            message: `Activo ${activo.numActivo} marcado como en mal estado.`,
            data: activo
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado del activo.', error: error.message });
    }
};

exports.autoAsignarImagenes = async (req, res) => {
    try {
        if (!req.user || !['admin', 'administrador', 'administrativo'].includes(req.user.tipo_rol.toLowerCase())) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const activosSnImagen = await Activos.find({ 
            $or: [ { imagenUrl: { $exists: false } }, { imagenUrl: "" }, { imagenUrl: { $regex: /placeholder/i } } ],
            estadoActivo: { $ne: 'eliminado' }
        });

        if (activosSnImagen.length === 0) {
            return res.json({ message: "Todo el catálogo ya cuenta con imágenes.", procesados: 0, actualizados: 0 });
        }

        let actualizados = 0;
        
        for (const activo of activosSnImagen) {
            // Busqueda más precisa usando Google Images con googlethis
            const query = `${activo.marca} ${activo.modelo}`;
            
            try {
                // Pequeño delay de 500-1500ms para evitar limitación
                await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
                
                const images = await google.image(query, { safe: false });
                if (images && images.length > 0) {
                    activo.imagenUrl = images[0].url;
                    await activo.save();
                    actualizados++;
                }
            } catch(e) {
                console.warn(`Error buscando imagen en Google para activo ${query}:`, e.message);
            }
        }

        res.json({
            message: "Auto-asignación inteligente completada con Google Images.",
            procesados: activosSnImagen.length,
            actualizados: actualizados
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno en auto-asignación', error: error.message });
    }
};
