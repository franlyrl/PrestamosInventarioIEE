const ListaEspera = require('../models/ListaEspera');

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

        const lista = await ListaEspera.find()
            .populate('usuario', 'nombre_completo correo_electronico')
            .populate('insumo', 'NombProducto cantidad')
            // ORDENAMIENTO: 
            // 1. prioridad: -1 (Alta a Baja)
            // 2. createdAt: 1 (El que llegó primero va arriba)
            .sort({ prioridad: -1, createdAt: 1 });

        console.log(`✅ [ListaEspera] Se encontraron ${lista.length} registros`);

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