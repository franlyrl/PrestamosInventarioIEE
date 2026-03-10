/**
 * @file insumoControllers.js
 * @description Gestión de materiales consumibles (resistencias, estaño, componentes, etc.) con soporte de imágenes.
 */
const Insumos = require('../models/insumos');
const Usuarios = require('../models/usuarios');
const mongoose = require('mongoose');

/**
 * @route GET /api/insumos
 * @desc Obtiene la lista completa de insumos disponibles en el inventario.
 */
exports.getInsumos = async (req, res) => {
    try {
        const insumos = await Insumos.find();
        res.json(insumos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos', error: error.message });
    }
};

/**
 * @desc Registra un nuevo insumo.
 * Valida: Rol administrativo, Campos obligatorios (Nombre, Características, Categoría).
 * Soporta creación individual o masiva (bulk).
 */
exports.createInsumo = async (req, res) => {
    try {
        // 1. FILTRO DE SEGURIDAD (Solo administrativos)
        const rolesAutorizados = ['admin', 'administrador', 'Administrador'];

        if (!req.user || !rolesAutorizados.includes(req.user.tipo_rol)) {
            return res.status(403).json({
                message: 'Acceso denegado: No tienes permisos para añadir insumos.',
                debug: `rol actual: ${req.user?.tipo_rol}`
            });
        }

        const datos = req.body;
        const categoriasValidas = Insumos.schema.path('categoria').enumValues;

        const validarObjeto = obj => {
            const { NombProducto, caracteristicas, categoria } = obj;
            if (!NombProducto || !caracteristicas || !categoria) {
                return false;
            }
            if (!categoriasValidas.includes(categoria)) {
                return false;
            }
            return true;
        };

        if (Array.isArray(datos)) {
            // bulk insert
            if (datos.length === 0) {
                return res.status(400).json({ message: 'Array vacío enviado para creación masiva.' });
            }
            for (const item of datos) {
                if (!validarObjeto(item)) {
                    return res.status(400).json({ message: 'Uno o más objetos del array no son válidos.' });
                }
            }
            const insertados = await Insumos.insertMany(datos);
            return res.status(201).json({
                message: 'Insumos registrados con éxito (bulk)',
                count: insertados.length,
                data: insertados
            });
        } else {
            // single insert
            if (!validarObjeto(datos)) {
                return res.status(400).json({
                    message: 'Error: El nombre, las características y la categoría son campos obligatorios ó categoría inválida.'
                });
            }
            const nuevoInsumo = new Insumos(datos);
            const insumoGuardado = await nuevoInsumo.save();

            return res.status(201).json({
                message: "Insumo registrado con éxito",
                data: insumoGuardado
            });
        }

    } catch (error) {
        res.status(500).json({
            message: 'Error interno al registrar el insumo',
            error: error.message
        });
    }
};

/**
 * @route PUT /api/insumos/:id
 * @desc Actualiza los detalles o el stock de un insumo existente.
 */
exports.updateInsumo = async (req, res) => {
    try {
        const insumoActualizado = await Insumos.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!insumoActualizado) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }
        res.json(insumoActualizado);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el insumo', error: error.message });
    }
};

/**
 * @route GET /api/insumos/:id
 * @desc Devuelve un insumo por su ID.
 */
exports.getInsumoById = async (req, res) => {
    try {
        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }
        res.json(insumo);
    } catch (error) {
        res.status(400).json({ message: 'Error al obtener el insumo', error: error.message });
    }
};

/**
 * @route DELETE /api/insumos/:id
 * @desc Da de baja un insumo (Borrado lógico con justificación).
 */
exports.deleteInsumo = async (req, res) => {
    try {
        const { motivo_eliminacion } = req.body;

        if (!req.user || (req.user.tipo_rol !== 'admin' && req.user.tipo_rol !== 'Administrador')) {
            return res.status(403).json({
                message: 'No autorizado. Solo administradores pueden dar de baja insumos.'
            });
        }

        if (!motivo_eliminacion || motivo_eliminacion.trim().length < 10) {
            return res.status(400).json({
                message: 'Se requiere una justificación (mín. 10 caracteres) para la baja del insumo.'
            });
        }

        const insumoActualizado = await Insumos.findByIdAndUpdate(
            req.params.id,
            {
                estado: 'eliminado',
                justificacion_baja: motivo_eliminacion,
                fecha_baja: new Date(),
                eliminado_por: req.user._id
            },
            { new: true }
        );

        if (!insumoActualizado) {
            return res.status(404).json({ message: 'El insumo no existe.' });
        }

        res.json({
            message: 'Insumo dado de baja correctamente.',
            detalles: {
                id: insumoActualizado._id,
                nombre: insumoActualizado.NombProducto,
                motivo: insumoActualizado.justificacion_baja
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error al procesar la baja del insumo.',
            error: error.message
        });
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
        res.status(500).json({ message: 'Error al filtrar insumos', error: error.message });
    }
};

/**
 * @desc Retorna la lista de todas las categorías definidas en el ENUM del Schema.
 */
exports.getEnumCategorias = (req, res) => {
    try {
        const categorias = Insumos.schema.path('categoria').enumValues;
        res.json({
            total: categorias.length,
            categorias: categorias
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al extraer las categorías', error: error.message });
    }
};

/**
 * @desc Obtiene todos los insumos que pertenecen a una categoría específica con validación.
 */
exports.getInsumosPorCategoria = async (req, res) => {
    try {
        const { categoria } = req.params;
        const categoriasValidas = Insumos.schema.path('categoria').enumValues;

        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({
                message: `La categoría '${categoria}' no es válida.`,
                opcionesValidas: categoriasValidas
            });
        }

        const insumos = await Insumos.find({ categoria: categoria });
        res.json({
            categoriaSeleccionada: categoria,
            total: insumos.length,
            data: insumos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar los insumos', error: error.message });
    }
};

/**
 * @desc Busca insumos por nombre o características usando regex.
 */
exports.searchInsumos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === "") {
            return res.json([]);
        }

        const regex = new RegExp(q, 'i');
        const insumos = await Insumos.find({
            $or: [
                { NombProducto: regex },
                { caracteristicas: regex }
            ]
        });

        res.json(insumos);
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar insumos',
            error: error.message
        });
    }
};

/**
 * @desc Filtra los insumos por su estado (Disponible, Vencido, etc.)
 */
exports.getInsumosByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        const insumos = await Insumos.find({ estado: estado });
        res.json({
            estadoFiltrado: estado,
            total: insumos.length,
            data: insumos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar insumos por estado', error: error.message });
    }
};

/**
 * @route PATCH /api/insumos/:id/stock
 * @desc Actualiza solo la cantidad de un insumo.
 */
exports.updateStock = async (req, res) => {
    try {
        const { cantidad, operacion } = req.body;

        if (!cantidad || !operacion) {
            return res.status(400).json({
                message: 'Se requieren los campos "cantidad" y "operacion"'
            });
        }

        if (!['incrementar', 'decrementar'].includes(operacion)) {
            return res.status(400).json({
                message: 'La operación debe ser "incrementar" o "decrementar"'
            });
        }

        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const nuevaCantidad = operacion === 'incrementar'
            ? insumo.cantidad + cantidad
            : insumo.cantidad - cantidad;

        if (nuevaCantidad < 0) {
            return res.status(400).json({
                message: 'La cantidad resultante no puede ser negativa'
            });
        }

        insumo.cantidad = nuevaCantidad;
        const actualizado = await insumo.save();

        res.json({
            message: `Stock ${operacion}do correctamente`,
            data: actualizado
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar el stock',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/insumos/:id/reactivar
 * @desc Reactiva un insumo que fue eliminado.
 */
exports.reactivarInsumo = async (req, res) => {
    try {
        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        insumo.estado = 'activo';
        insumo.justificacion_baja = null;
        insumo.fecha_baja = null;
        insumo.eliminado_por = null;
        const reactivado = await insumo.save();

        res.json({
            message: 'Insumo reactivado correctamente',
            data: reactivado
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al reactivar el insumo',
            error: error.message
        });
    }
};

/**
 * @route GET /api/insumos/estadisticas
 * @desc Retorna estadísticas del inventario.
 */
exports.getEstadisticas = async (req, res) => {
    try {
        const totalInsumos = await Insumos.countDocuments();
        const cantidadTotal = await Insumos.aggregate([
            { $group: { _id: null, total: { $sum: '$cantidad' } } }
        ]);

        const porCategoria = await Insumos.aggregate([
            { $group: { _id: '$categoria', cantidad: { $sum: '$cantidad' }, count: { $sum: 1 } } }
        ]);

        res.json({
            totalInsumos: totalInsumos,
            cantidadTotal: cantidadTotal[0]?.total || 0,
            porCategoria: porCategoria
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

/**
 * @route GET /api/insumos/bajo-stock
 * @desc Retorna insumos con stock por debajo del límite.
 */
exports.getBajoStock = async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 5;
        const insumosBajos = await Insumos.find({ cantidad: { $lte: limite } })
            .sort({ cantidad: 1 });

        res.json({
            limite: limite,
            total: insumosBajos.length,
            data: insumosBajos
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener insumos de bajo stock',
            error: error.message
        });
    }
};

/**
 * @route GET /api/reportes/alertas-stock
 * @desc Genera un reporte de insumos con stock crítico.
 */
exports.getAlertasStock = async (req, res) => {
    try {
        const UMBRAL_CRITICO = parseInt(req.query.umbral) || 5;

        const insumosBajos = await Insumos.find({
            cantidad: { $lte: UMBRAL_CRITICO }
        })
            .select('id_insumo NombProducto cantidad categoria imagenUrl')
            .sort({ cantidad: 1 });

        return res.status(200).json({
            ok: true,
            total_alertas: insumosBajos.length,
            fecha_reporte: new Date().toLocaleString(),
            criterio: `Insumos con ${UMBRAL_CRITICO} unidades o menos.`,
            data: insumosBajos
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Error al generar el reporte de stock.',
            error: error.message
        });
    }
};