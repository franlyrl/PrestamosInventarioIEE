/**
 * @file insumoControllers.js
 * @description Gestión de materiales consumibles (resistencias, estaño, componentes, etc.)
 */
const Insumos = require('../models/insumos');
const { generarToken } = require('../utils/generarToken'); // Si necesitas autenticación para ciertas acciones
const { consultarNombrePorCedula } = require('../utils/registroCivil'); // Para validar cédula si es necesario
const Usuarios = require('../models/usuarios'); // Para verificar roles de usuario si es necesario
const Solicitudes = require('../models/Solicitudes'); // Para verificar préstamos activos si es necesario
const { validationResult } = require('express-validator'); // Para validación de datos entrantes
const mongoose = require('mongoose'); // Para validaciones de ID y operaciones avanzadas con MongoDB

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
 * @desc Registra un nuevo insumo.
 * Valida: Rol administrativo, Campos obligatorios (Nombre, Características, Categoría).
 */
exports.createInsumo = async (req, res) => {
    try {
        // 1. FILTRO DE SEGURIDAD (Solo administrativos)
        const rolesAutorizados = ['admin', 'administrador'];
        
        if (!req.user || !rolesAutorizados.includes(req.user.tipo_rol)) {
            return res.status(403).json({ 
                message: 'Acceso denegado: No tienes permisos para añadir insumos.',
                debug: `rol actual: ${req.user?.tipo_rol}`
            });
        }

        // detect whether we received an array (bulk) or single object
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
            // single insert (caída original)
            const { NombProducto, caracteristicas, categoria } = datos;
            if (!validarObjeto(datos)) {
                return res.status(400).json({ 
                    message: 'Error: El nombre, las características y la categoría son campos técnicos obligatorios ó categoría inválida.' 
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
 * @route GET /api/insumos/:id
 * @desc Devuelve un insumo por su ID.
 * @access Privado (cualquier usuario autenticado)
 */
exports.getInsumoById = async (req, res) => {
    try {
        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }
        res.json(insumo);
    } catch (error) {
        // si el id no es un ObjectId válido, mongoose lanza CastError
        res.status(400).json({ message: 'Error al obtener el insumo', error: error.message });
    }
};

/**
 * @route DELETE /api/insumos/:id
 * @desc Da de baja un insumo (Borrado lógico con justificación).
 * @access Privado (Solo Administrador/Admin)
 * @body {String} motivo_eliminacion - Justificación obligatoria para la baja del insumo (mínimo 10 caracteres).
 *
 * Proceso:
 * 1. Verificar que el usuario tenga rol administrativo.
 * 2. Validar que se haya proporcionado una justificación válida.
 * 3. Realizar un borrado lógico actualizando el campo 'estado' a 'eliminado' y guardando la justificación.
 * 4. Retornar un mensaje de éxito o error según corresponda.
 * Requisitos:
 * Nota: Asegúrate de que el Schema de Insumos tenga los campos necesarios para el borrado lógico
 *  (estado, justificacion_baja, fecha_baja, eliminado_por).
 *
 * Ejemplo de respuesta exitosa:
 * {
 *   "message": "Insumo dado de baja correctamente.",
 *   "detalles": {
 *     "id": "60f5a3c2b4d1c72f9c8e4b5a",
 *     "nombre": "Resistencia 10kΩ",
 *     "motivo": "Obsoleto y sin demanda."
 *   }
 * }
 *
 * Ejemplo de respuesta por falta de autorización:
 * {
 *   "message": "No autorizado. Solo administradores pueden dar de baja insumos."
 * }
 *
 * Ejemplo de respuesta por falta de justificación:
 * {
 *   "message": "Se requiere una justificación (mín. 10 caracteres) para la baja del insumo."
 * }
 * Ejemplo de respuesta por insumo no encontrado:
 * {
 *   "message": "El insumo no existe."
 * }
 * Ejemplo de respuesta por error interno:
 * {
 *   "message": "Error al procesar la baja del insumo.",
 *   "error": "Detalles del error..."
 * }
 */
exports.deleteInsumo = async (req, res) => {
    try {
        const { motivo_eliminacion } = req.body;

        // 1. Verificación de Rol
        // note: middleware auth coloca el usuario en req.user, no req.usuario
        if (!req.user || (req.user.tipo_rol !== 'admin' && req.user.tipo_rol !== 'Administrador')) {
            return res.status(403).json({ 
                message: 'No autorizado. Solo administradores pueden dar de baja insumos.' 
            });
        }

        // 2. Verificación de Justificación (Obligatoria)
        if (!motivo_eliminacion || motivo_eliminacion.trim().length < 10) {
            return res.status(400).json({ 
                message: 'Se requiere una justificación (mín. 10 caracteres) para la baja del insumo.'
            });
        }

        // 3. Borrado Lógico
        const insumoActualizado = await Insumos.findByIdAndUpdate(
            req.params.id,
            { 
                estado: 'eliminado', // Asegúrate de tener el campo 'estado' en el Schema también
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

        // Validation: If 'q' is missing or just whitespace, return an empty array
        // This prevents passing null/undefined to the $text operator
        if (!q || q.trim() === "") {
            return res.json([]);
        }

        // Perform the text search
        // Using 'score' allows us to sort by the most relevant match
        const insumos = await Insumos.find(
            { $text: { $search: q } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });

        res.json(insumos);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ 
            message: 'Error al buscar insumos', 
            error: error.message || error 
        });
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

/**
 * @route PATCH /api/insumos/:id/stock
 * @desc Actualiza solo la cantidad de un insumo (incrementar o decrementar).
 * @access Privado (Admin/Administrador)
 * @body {Number} cantidad - cantidad a sumar o restar
 * @body {String} operacion - 'incrementar' o 'decrementar'
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
 * @access Privado (Solo Admin)
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
 * @desc Retorna estadísticas del inventario (total, cantidad total, categorías).
 * @access Privado (cualquier usuario autenticado)
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
 * @desc Retorna insumos con stock por debajo del límite especificado.
 * @access Privado (cualquier usuario autenticado)
 * @query {Number} limite - cantidad mínima (default: 5)
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
 * @desc Genera un reporte de insumos con stock crítico (menos de 5 unidades).
 * @access Privado (Admin/Administrador)
 */
exports.getAlertasStock = async (req, res) => {
    try {
        // Permitimos que el umbral sea dinámico vía query params o usamos 5 por defecto
        const UMBRAL_CRITICO = parseInt(req.query.umbral) || 5;

        // Buscamos insumos cuya cantidad sea menor o igual al umbral
        // Solo incluimos productos que no estén marcados como eliminados/inactivos si aplica
        const insumosBajos = await Insumos.find({
            cantidad: { $lte: UMBRAL_CRITICO }
        })
        .select('id_insumo NombProducto cantidad categoria')
        .sort({ cantidad: 1 }); // Prioridad: los que tienen menos stock primero

        return res.status(200).json({
            ok: true,
            total_alertas: insumosBajos.length,
            fecha_reporte: new Date().toLocaleString(),
            criterio: `Insumos con ${UMBRAL_CRITICO} unidades o menos.`,
            data: insumosBajos
        });

    } catch (error) {
        console.error("Error en reporte de alertas:", error);
        return res.status(500).json({ 
            ok: false,
            message: 'Error al generar el reporte de stock.', 
            error: error.message 
        });
    }
};