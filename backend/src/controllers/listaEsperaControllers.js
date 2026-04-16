const ListaEspera = require('../models/listaEspera');

/**
 * Obtiene la lista de espera completa con información detallada de usuarios e insumos.
 * @async
 * @function getListaEspera
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Responde con un array de objetos de lista de espera 'populated'.
 */
exports.getListaEspera = async (req, res) => {
    try {
        console.log("🔍 [ListaEspera] Obteniendo lista de espera...");

        let query = {};
        if (req.query.insumos) {
            const insumos = req.query.insumos.split(',');
            query.insumo = { $in: insumos };
        }
        if (req.query.activos) {
            const activos = req.query.activos.split(',');
            query.activo = { $in: activos };
        }

        const lista = await ListaEspera.find(query)
            .populate('usuario', 'nombre_completo correo_electronico')
            .populate('insumo', 'NombProducto cantidad')
            .populate('activo', 'marca modelo numActivo')
            // ORDENAMIENTO: 
            // 1. prioridad: -1 (Alta a Baja)
            // 2. createdAt: 1 (El que llegó primero va arriba)
            .sort({ prioridad: -1, createdAt: 1 });

        console.log(`✅ [ListaEspera] Se encontraron ${lista.length} registros`);
        
        // Debug: mostrar el primer registro para verificar populate
        if (lista.length > 0) {
            console.log('🔍 [ListaEspera] Primer registro:', {
                id: lista[0]._id,
                insumo: lista[0].insumo,
                insumoId: lista[0].insumo?._id,
                insumoNombProducto: lista[0].insumo?.NombProducto,
                nombreProducto: lista[0].nombreProducto
            });
        }

        res.json({
            total: lista.length,
            data: lista,
            message: lista.length === 0 ? 'No hay usuarios en lista de espera' : 'Lista de espera obtenida correctamente'
        });
    } catch (error) {
        console.error("❌ [ListaEspera] Error al obtener la lista:", error);
        res.status(500).json({
            message: 'Error al obtener la lista',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Obtiene la lista de espera del usuario autenticado.
 * @async
 * @function getMiListaEspera
 * @param {import('express').Request} req - Objeto de petición.
 * @param {import('express').Response} res - Objeto de respuesta.
 */
exports.getMiListaEspera = async (req, res) => {
    try {
        const lista = await ListaEspera.find({ usuario: req.user._id })
            .populate('usuario', 'nombre_completo')
            .populate('insumo', 'NombProducto')
            .sort({ prioridad: -1, createdAt: 1 });

        res.json(lista);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tu lista de espera', error });
    }
};

/**
 * Registra un nuevo turno en la lista de espera.
 * @async
 * @function agregarAListaEspera
 * @param {import('express').Request} req - Objeto de petición. Debe contener usuario, insumo y cantidad en el body.
 * @param {import('express').Response} res - Objeto de respuesta.
 * @description Si el usuario ya está en espera para el mismo insumo, el índice único del Schema lanzará un error 400.
 */
exports.agregarAListaEspera = async (req, res) => {
    try {
        console.log("🔄 [ListaEspera] Agregando usuario a lista de espera...");
        console.log("   - Body recibido:", req.body);

        const nuevoTurno = new ListaEspera(req.body);

        // Validar que los campos requeridos existan
        if (!nuevoTurno.usuario || !nuevoTurno.insumo) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                required: ['usuario', 'insumo'],
                received: req.body
            });
        }

        const guardado = await nuevoTurno.save();

        console.log("✅ [ListaEspera] Usuario agregado exitosamente:", guardado._id);

        // RESPUESTA EXITOSA: 201 Created con el nuevo turno
        res.status(201).json({
            message: 'Usuario agregado a lista de espera exitosamente',
            data: guardado
        });
    } catch (error) {
        console.error("❌ [ListaEspera] Error al agregar a lista de espera:", error);

        // Manejar errores específicos
        if (error.code === 11000) {
            // Error de duplicado (índice único)
            return res.status(400).json({
                message: 'El usuario ya está en lista de espera para este insumo',
                error: error.message
            });
        }

        if (error.name === 'ValidationError') {
            // Error de validación de Mongoose
            const errores = Object.values(error.errors).map(err => ({
                campo: err.path,
                mensaje: err.message
            }));

            return res.status(400).json({
                message: 'Error de validación',
                errores: errores,
                error: error.message
            });
        }

        res.status(400).json({
            message: 'Error al agregar a lista de espera',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Actualiza los datos de un turno existente (estado, prioridad o cantidad).
 * @async
 * @function actualizarTurno
 * @param {import('express').Request} req - Objeto de petición. Contiene el ID en params y los cambios en el body.
 * @param {import('express').Response} res - Objeto de respuesta.
 */
exports.actualizarTurno = async (req, res) => {
    try {
        const actualizado = await ListaEspera.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!actualizado) return res.status(404).json({ message: 'Turno no encontrado' });
        res.json(actualizado);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar', error });
    }
};

/**
 * Elimina un turno de la lista de espera.
 * @async
 * @function eliminarTurno
 * @param {import('express').Request} req - Objeto de petición. Contiene el ID en params.
 * @param {import('express').Response} res - Objeto de respuesta.
 */
exports.eliminarTurno = async (req, res) => {
    try {
        const turno = await ListaEspera.findById(req.params.id);
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

        // Verificar permisos: admin o propietario
        const esAdmin = ['admin', 'administrador', 'administrativo'].some(r => 
            req.user.tipo_rol?.toLowerCase().includes(r)
        );
        const esPropietario = turno.usuario.toString() === req.user._id.toString();

        if (!esAdmin && !esPropietario) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar este turno' });
        }

        await ListaEspera.findByIdAndDelete(req.params.id);
        res.json({ message: 'Turno eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ message: 'Error al eliminar', error });
    }
};