/**
 * @file solicitudController.js
 * @description Controlador para gestionar el ciclo de vida de los préstamos (Solicitudes).
 * Vincula Usuarios, Activos e Insumos mediante referencias (Populate).
 */

const Solicitudes = require('../models/solicitudes');

/**
 * @route GET /api/solicitudes
 * @desc Obtiene todas las solicitudes con los datos de usuario, activos e insumos expandidos.
 */
exports.getSolicitudes = async (req, res) => { 
        try {
    const solicitudes = await Solicitudes.find()
        // Usuario: nombres reales del schema
        .populate('usuario', 'nombre_completo correo_electronico tipo_rol') 
        
        // Activos: marca y modelo (como están en activos.js)
        .populate('activos', 'marca modelo numActivo')
        
        // Insumos: NombProducto y características
        .populate('insumos.id_insumo', 'NombProducto caracteristicas');
        
    res.json(solicitudes);
} catch (error) {
    res.status(500).json({ message: 'Error al obtener las solicitudes', error });
}
    };

/**
 * @route POST /api/solicitudes
 * @desc Crea una nueva solicitud de préstamo.
 * @param {Object} req.body - Datos de la solicitud (usuario, activos, insumos, etc.)
 */
exports.createSolicitud = async (req, res) => {
    try {
        const datosSolicitud = req.body;

        // Opcional: Nos aseguramos de que el historial tenga el registro inicial
        if (!datosSolicitud.historico_estados || datosSolicitud.historico_estados.length === 0) {
            datosSolicitud.historico_estados = [{
                estado: 'pendiente',
                observaciones: 'Solicitud creada por el usuario'
            }];
        }

        const nuevaSolicitud = new Solicitudes(datosSolicitud);
        const solicitudGuardada = await nuevaSolicitud.save();
        
        res.status(201).json(solicitudGuardada);
    } catch (error) {
        // Si el validador de 'observaciones' del Schema falla, saltará aquí
        res.status(400).json({ 
            message: 'Error de validación en la solicitud', 
            detalles: error.message 
        });
    }
};

/**
 * @route GET /api/solicitudes/:id
 * @desc Obtiene el detalle completo de una sola solicitud por su ID.
 */
eexports.getSolicitudById = async (req, res) => {
    try {
        const solicitud = await Solicitudes.findById(req.params.id)
            // 1. Usuarios: campos reales nombre_completo y correo_electronico
            .populate('usuario', 'nombre_completo correo_electronico tipo_rol')
            
            // 2. Activos: campos reales marca y modelo
            .populate('activos', 'marca modelo numActivo')
            
            // 3. Insumos: campos reales NombProducto y caracteristicas
            .populate('insumos.id_insumo', 'NombProducto caracteristicas');

        if (!solicitud) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        res.json(solicitud);
    } catch (error) {
        // Usamos status 500 para errores de servidor (ej. ID de MongoDB mal formado)
        res.status(500).json({ message: 'Error al obtener la solicitud', error });
    }
};
/**
 * @route PUT /api/solicitudes/:id
 * @desc Actualiza el estado o datos de una solicitud existente.
 * Útil para cambiar estados (Pendiente -> Entregado).
 */
exports.updateSolicitud = async (req, res) => {
    try {
        // { new: true } devuelve el objeto modificado, no el viejo
        const solicitudActualizada = await Solicitudes.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!solicitudActualizada) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        res.json(solicitudActualizada);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar la solicitud', error });
    }
};

/**
 * @route DELETE /api/solicitudes/:id
 * @desc Elimina una solicitud del sistema.
 */
exports.deleteSolicitud = async (req, res) => {
    try {
        const solicitudEliminada = await Solicitudes.findByIdAndDelete(req.params.id);
        
        if (!solicitudEliminada) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        res.json({ message: 'Solicitud eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la solicitud', error });
    }
};