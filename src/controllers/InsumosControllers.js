/**
 * @file insumoController.js
 * @description Gestión de materiales consumibles (resistencias, estaño, componentes, etc.)
 */
const Insumos = require('../models/Insumos');

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
        
        if (!req.user || !rolesAutorizados.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Acceso denegado: No tienes permisos para añadir insumos.' 
            });
        }

        // 2. EXTRACCIÓN DE DATOS 
        const { NombProducto, caracteristicas, categoria, stock } = req.body;

        // 3. VALIDACIÓN DE PRESENCIA (Campos técnicos obligatorios)
        if (!NombProducto || !caracteristicas || !categoria) {
            return res.status(400).json({ 
                message: 'Error: El nombre, las características y la categoría son campos técnicos obligatorios.' 
            });
        }

        // 4. VALIDACIÓN DE CATEGORÍA (Enum Check)
        const categoriasValidas = Insumos.schema.path('categoria').enumValues;
        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({ 
                message: 'Categoría no válida.', 
                categoriasPermitidas: categoriasValidas 
            });
        }

        // 5. GUARDADO
        const nuevoInsumo = new Insumos(req.body);
        const insumoGuardado = await nuevoInsumo.save();

        res.status(201).json({
            message: "Insumo registrado con éxito",
            data: insumoGuardado
        });

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
        if (req.usuario.tipo_rol !== 'admin' && req.usuario.tipo_rol !== 'Administrador') {
            return res.status(403).json({ 
                message: 'No autorizado. Solo administradores pueden dar de baja insumos.' 
            });
        }

        // 2. Verificación de Justificación (Obligatoria)
        if (!justificacion_dbaja || justificacion_dbaja.trim().length < 10) {
            return res.status(400).json({ 
                message: 'Se requiere una justificación (mín. 10 caracteres) para la baja del insumo.'
            });
        }

        // 3. Borrado Lógico
        const insumoActualizado = await Insumos.findByIdAndUpdate(
            req.params.id,
            { 
                estado: 'eliminado', // Asegúrate de tener el campo 'estado' en el Schema también
                justificacion_baja: justificacion_dbaja,
                fecha_baja: new Date(),
                eliminado_por: req.usuario.id 
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
                nombre: insumoActualizado.nombre,
                motivo: insumoActualizado.justificacion_sbaja
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

/**
 * @route GET /api/reportes/alertas-stock
 * @desc Genera un reporte de insumos con stock crítico (menos de 5 unidades).
 * @access Privado (Admin/Administrador)
 */
exports.getAlertasStock = async (req, res) => {
    try {
        // Definimos un umbral por defecto
        const UMBRAL_CRITICO = 5;

        // Buscamos insumos cuya cantidad sea menor o igual al umbral
        const insumosBajos = await Insumo.find({
            cantidad: { $lte: UMBRAL_CRITICO }
        })
        .select('id_insumo NombProducto cantidad categoria')
        .sort({ cantidad: 1 }); // De menor a mayor para ver lo más urgente primero

        res.json({
            total_alertas: insumosBajos.length,
            fecha_reporte: new Date(),
            criterio: `Insumos con ${UMBRAL_CRITICO} unidades o menos.`,
            data: insumosBajos
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error al generar el reporte de stock.', 
            error: error.message 
        });
    }
};