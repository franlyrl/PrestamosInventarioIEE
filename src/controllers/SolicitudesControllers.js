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
        let filtro = {};

        // 1. EL ESCUDO DE PRIVACIDAD (Criterio: Solo veo lo mío si no soy admin)
        // Nota: Asegúrate de si en tu Schema el campo es 'usuario' o 'estudiante'
        if (!['admin', 'administrador'].includes(req.user.role)) {
            filtro = { usuario: req.user.id }; 
        }

        // 2. LA RIQUEZA DE DATOS (El populate detallado del GET viejo)
        const solicitudes = await Solicitudes.find(filtro)
            .populate('usuario', 'nombre_completo correo_electronico tipo_rol') 
            .populate('activos', 'marca modelo numActivo')
            .populate('insumos.id_insumo', 'NombProducto caracteristicas')
            .sort({ fecha_prestamo: -1 }); // Picky tip: las más recientes primero

        res.status(200).json(solicitudes);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener solicitudes', 
            detalles: error.message 
        });
    }
};

/**
 * @desc Registra una nueva solicitud de préstamo/consumo.
 * @rules 
 * 1. El estudiante/docente no puede modificar solicitudes de otros.
 * 2. El solicitante se extrae automáticamente del token (seguridad).
 * 3. Se puede pedir una lista de activos y una lista de insumos.
 */
exports.createSolicitud = async (req, res) => {
    try {
        // 1. IDENTIFICACIÓN AUTOMÁTICA
        // No dejamos que el usuario mande su ID por el body, lo tomamos del token.
        const idUsuarioSolicitante = req.user.id;

        const { 
            activos, 
            insumos, 
            fecha_entrega_esperada, 
            comentario_admin 
        } = req.body;

        // 2. VALIDACIÓN DE CONTENIDO (Criterio: No puede ser una solicitud vacía)
        if ((!activos || activos.length === 0) && (!insumos || insumos.length === 0)) {
            return res.status(400).json({ 
                message: 'Error: La solicitud debe contener al menos un activo o un insumo.' 
            });
        }

        // 3. VALIDACIÓN DE FECHAS
        if (fecha_entrega_esperada && new Date(fecha_entrega_esperada) <= new Date()) {
            return res.status(400).json({ 
                message: 'Error: La fecha de entrega esperada debe ser posterior a la fecha actual.' 
            });
        }

        // 4. CREACIÓN DE LA INSTANCIA
        const nuevaSolicitud = new Solicitudes({
            estudiante: idUsuarioSolicitante, // Referencia al Schema Usuario
            activos, // Array de IDs
            insumos, // Array de Objetos {id_insumo, cantidad...}
            fecha_entrega_esperada,
            estado: 'Pendiente' // Siempre inicia en espera de revisión administrativa
        });

        // 5. GUARDADO
        const solicitudGuardada = await nuevaSolicitud.save();

        res.status(201).json({
            message: "Solicitud registrada con éxito. Pendiente de aprobación.",
            data: solicitudGuardada
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error interno al procesar la solicitud', 
            error: error.message 
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
 * @desc Elimina una solicitud del sistema, Pero solo el Usaurio Dueño de la solicitud puede hacerlo, 
 * antes que el admin haya rechazado o aceptado la solicitud. Si ya fue procesada por el admin, 
 * no se puede eliminar, solo cancelar (cambiar estado a cancelada).
 * REGLA DE ORO: No se puede eliminar una solicitud que ya fue aceptada o rechazada por el admin,
 *  para mantener la integridad de los registros
 *.
 */
exports.deleteSolicitud = async (req, res) => {
    try {
        // 1. Primero BUSCAMOS, no borramos de un solo.
        const solicitud = await Solicitudes.findById(req.params.id);
        
        if (!solicitud) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        // 2. REGLA DE ORO 1: ¿Es el dueño? 
        // Comparamos el ID del usuario de la solicitud con el ID del usuario en el token (req.usuario.id)
        if (solicitud.usuario.toString() !== req.usuario.id) {
            return res.status(403).json({ 
                message: 'No tienes permiso. Solo el dueño puede cancelar esta solicitud.' 
            });
        }

        // 3. REGLA DE ORO 2: ¿Sigue pendiente?
        // Si ya fue aceptada o rechazada, el Admin ya trabajó en ella. No se toca.
        if (solicitud.estado !== 'pendiente') {
            return res.status(400).json({ 
                message: `No se puede eliminar. La solicitud ya se encuentra en estado: ${solicitud.estado}.` 
            });
        }

        // 4. Si pasó los filtros, procedemos a la eliminación física.
        await Solicitudes.findByIdAndDelete(req.params.id);

        res.json({ message: 'Solicitud cancelada y eliminada correctamente.' });

    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la solicitud', error: error.message });
    }
};