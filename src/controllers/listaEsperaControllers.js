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
        const lista = await ListaEspera.find()
            .populate('usuario', 'nombre_completo correo_electronico')
            .populate('insumo', 'NombProducto')
            // ORDENAMIENTO: 
            // 1. prioridad: -1 (Alta a Baja)
            // 2. createdAt: 1 (El que llegó primero va arriba)
            .sort({ prioridad: -1, createdAt: 1 }); 
            
        res.json(lista);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la lista', error });
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
        const nuevoTurno = new ListaEspera(req.body);
        const guardado = await nuevoTurno.save();

        // RESPUESTA EXITOSA: 201 Created con el nuevo turno
        res.status(201).json(guardado);
    } catch (error) {
        res.status(400).json({ 
            message: 'Error: El usuario ya está en espera para este insumo', 
            error 
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