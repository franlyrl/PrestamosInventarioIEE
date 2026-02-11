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
 * @desc Registra un nuevo activo. 
 * Valida: Rol de usuario, Campos técnicos y Duplicidad de IDs.
 */
exports.createActivo = async (req, res) => {
    try {
        // 1. ESCUDO DE SEGURIDAD (Autorización)
        // Solo permitimos el paso a roles 'admin' o 'administrador'
        const rolesAutorizados = ['admin', 'administrador'];
        
        if (!req.user || !rolesAutorizados.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Acceso denegado: Solo el personal administrativo puede registrar activos.' 
            });
        }

        // 2. EXTRACCIÓN Y VALIDACIÓN DE CAMPOS TÉCNICOS
        const { numActivo, numSerie, marca, modelo, categoria } = req.body;

        if (!numActivo || !numSerie || !marca || !modelo || !categoria) {
            return res.status(400).json({ 
                message: 'Error: Faltan campos obligatorios (Números de identificación, marca, modelo o categoría).' 
            });
        }

        // 3. VALIDACIÓN DEL ENUM (Integridad de Categoría)
        const categoriasValidas = Activos.schema.path('categoria').enumValues;
        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({ 
                message: 'La categoría seleccionada no es válida.', 
                opciones: categoriasValidas 
            });
        }

        // 4. PROCESO DE GUARDADO
        const nuevoActivo = new Activos(req.body);
        const activoGuardado = await nuevoActivo.save();

        res.status(201).json({
            message: "Equipo registrado con éxito en el sistema de activos",
            data: activoGuardado
        });

    } catch (error) {
        // 5. MANEJO DE DUPLICADOS (Seguridad de Identidad Única)
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
        // Extraemos 'observaciones' del body, que será nuestro motivo de baja
        const { observaciones } = req.body;

        // 1. Verificación de Rol
        if (req.usuario.tipo_rol !== 'admin' && req.usuario.tipo_rol !== 'Administrador') {
            return res.status(403).json({ 
                message: 'No tiene permisos suficientes para eliminar activos del sistema.' 
            });
        }

        // 2. Verificación de Justificación (Reutilizando el campo observaciones)
        if (!observaciones || observaciones.trim().length < 10) {
            return res.status(400).json({ 
                message: 'Debe proporcionar una justificación en el campo de observaciones (mín. 10 caracteres) para la baja.' 
            });
        }

        // 3. Borrado Lógico: Actualizamos estado y observaciones
        const activoActualizado = await Activos.findByIdAndUpdate(
            req.params.id,
            { 
                estado: 'eliminado',
                observaciones: `BAJA: ${observaciones}`, // Marcamos que esto fue por una baja
                fecha_baja: new Date(),
                eliminado_por: req.usuario.id 
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

