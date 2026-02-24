/**
 * @file solicitudController.js
 * @description Controlador para gestionar el ciclo de vida de los préstamos (Solicitudes).
 * Vincula Usuarios, Activos e Insumos mediante referencias (Populate).
 */

const Solicitudes = require('../models/solicitudes');
const Usuarios = require('../models/usuarios'); // Para verificar roles de usuario si es necesario
const Activos = require('../models/activos'); // Para verificar disponibilidad de activos
const Insumos = require('../models/insumos'); // Para verificar stock de insumos
const { generarToken } = require('../utils/generarToken'); // Si necesitas autenticación para ciertas acciones
const { consultarNombrePorCedula } = require('../utils/registroCivil'); // Para validar cédula si es necesario
const { validationResult } = require('express-validator'); // Para validación de datos entrantes
const mongoose = require('mongoose'); // Para validaciones de ID y operaciones avanzadas con MongoDB

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
            filtro = { estudiante: req.user.id }; 
        }

        // 2. LA RIQUEZA DE DATOS (El populate detallado del GET viejo)
        const solicitudes = await Solicitudes.find(filtro)
            .populate('estudiante', 'nombre_completo correo_electronico tipo_rol') 
            .populate('activos', 'marca modelo numActivo')
            .populate('insumos.id_insumo', 'NombProducto caracteristicas')
            .sort({ fecha_prestamo: -1 }) // Picky tip: las más recientes primero
                .lean() // .lean() hace que sea más rápido y fácil de leer
                .select('-__v') // Limpiamos el ruido de Mongoose
                .exec();
    // 3. MEJORA DE VISUALIZACIÓN: Ordenar historiales en la lista
        // Como es un array de solicitudes, usamos map para ordenar cada una
        const solicitudesOrdenadas = solicitudes.map(sol => {
            if (sol.historico_estados) {
                sol.historico_estados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            }
            return sol;
        });

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
        const idUsuarioSolicitante = req.user.id;
        const { activos, insumos, fecha_entrega_esperada } = req.body;

        if ((!activos || activos.length === 0) && (!insumos || insumos.length === 0)) {
            return res.status(400).json({ 
                message: 'Error: La solicitud debe contener al menos un activo o un insumo.' 
            });
        }

        // --- LA PIEZA CLAVE QUE FALTABA ---
        // Creamos la solicitud con el historial ya iniciado
        const nuevaSolicitud = new Solicitudes({
            estudiante: idUsuarioSolicitante,
            activos,
            insumos,
            fecha_entrega_esperada,
            estado: 'pendiente', 
            // Esto asegura que el usuario vea algo en su pantalla de "Seguimiento"
            historico_estados: [{
                estado: 'pendiente',
                fecha: new Date(),
                observaciones: 'Solicitud creada por el usuario. En espera de revisión técnica.'
            }]
        });

        const solicitudGuardada = await nuevaSolicitud.save();

        res.status(201).json({
            message: "Solicitud registrada con éxito. Ya puedes ver el estado en tu perfil.",
            data: solicitudGuardada
        });

    } catch (error) {
        res.status(500).json({ message: 'Error interno', error: error.message });
    }
};

/**
 * @route GET /api/solicitudes/:id
 * @desc Obtiene el detalle completo de una sola solicitud por su ID.
 */

exports.getSolicitudById = async (req, res) => {
    try {
       const solicitud = await Solicitudes.findById(req.params.id)
    .populate('estudiante', 'nombre_completo correo_electronico') 
    .populate('activos', 'marca modelo numActivo')
    .populate('insumos.id_insumo', 'NombProducto')
    .lean()
    .select('-__v')
    .exec(); // .lean() es excelente para que sea más rápido y fácil de leer

if (solicitud && solicitud.historico_estados) {
    // Ordenamos el historial manualmente para que el comentario más reciente aparezca arriba
    solicitud.historico_estados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}



        if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });

        // SECURITY CHECK
        const isAdmin = ['admin', 'administrador'].includes(req.user.role);
        const isOwner = solicitud.estudiante._id.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'No tienes permiso para ver esta solicitud.' });
        }

        // If it's the Admin or the Student who owns it, they see EVERYTHING
        // Including the historico_estados with the Admin's comments.
        res.json(solicitud);

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la solicitud', error: error.message });
    }
};
/**
 * @route PUT /api/solicitudes/:id
  * @desc Actualiza el estado de una solicitud y registra el movimiento en el histórico.
    * REGLA DE ORO: Solo el Admin puede cambiar el estado de una solicitud, no el estudiante.
    * Criterio: El Admin debe proporcionar una observación para cambios críticos (rechazo, penalización).
    * Criterio: El histórico de estados es un registro inmutable que muestra la evolución de la solicitud.
    *
 * Útil para cambiar estados (Pendiente -> Entregado).
 */

exports.actualizarEstadoSolicitud = async (req, res) => {
    try {
        const { nuevoEstado, observaciones } = req.body;
        const solicitud = await Solicitudes.findById(req.params.id);
        
        if (!solicitud) return res.status(404).json({ message: 'No encontrada' });

        // Actualizamos el array histórico
        solicitud.historico_estados.push({
            estado: nuevoEstado,
            fecha: new Date(),
            observaciones: observaciones || 'Cambio procesado'
        });

        // CORREGIDO: Usamos 'estado' para que coincida con el Schema
        solicitud.estado = nuevoEstado; 

        await solicitud.save();
        res.json({ message: 'Actualizado', historico: solicitud.historico_estados });
    } catch (error) {
        res.status(400).json({ message: 'Error', error: error.message });
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
        if (solicitud.estudiante.toString() !== req.usuario.id) {
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

/**
    * @route PUT /api/solicitudes/admin/:id
    * @desc Permite al Admin aprobar o rechazar una solicitud, con validaciones estrictas.
    * REGLA DE ORO: Solo el Admin puede aprobar o rechazar solicitudes, no el estudiante.
    * Criterio: Si el Admin rechaza, DEBE proporcionar una justificación (observaciones).
    * Criterio: No se pueden modificar solicitudes ya rechazadas o devueltas para mantener la integridad.
    * Criterio: Al aprobar, se deben descontar los insumos y marcar los activos como prestados.
    * Criterio: El comentario del Admin se guarda en el histórico para transparencia.
    * Criterio: El estado de la solicitud se actualiza en un solo paso para evitar inconsistencias.
    * Criterio: El Admin no puede cambiar el estado a 'aprobada' si no hay activos o insumos en la solicitud, para evitar aprobaciones vacías.
    * Criterio: El Admin no puede rechazar una solicitud sin proporcionar una razón válida, para fomentar la comunicación y el aprendizaje.
    * Criterio: El Admin no puede modificar una solicitud que ya fue procesada (rechazada o devuelta), para mantener la integridad de los registros y evitar confusiones.
    * Criterio: El Admin no puede aprobar una solicitud que no contiene activos ni insumos, para evitar aprobaciones sin sentido.
*/
exports.gestionarEstadoAdmin = async (req, res) => {
    try {
        const { nuevoEstado, observaciones } = req.body;
        const { id } = req.params;

        const solicitud = await Solicitudes.findById(id);
        if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });

        // --- 1. VALIDACIÓN DE RECHAZO ---
        // Forzamos la justificación para que el alumno sepa por qué se le rechazó.
        if (nuevoEstado === 'rechazada' && (!observaciones || observaciones.trim().length < 5)) {
            return res.status(400).json({ 
                message: 'Error: Debes proporcionar una justificación detallada para rechazar la solicitud.' 
            });
        }

        // Bloqueo de integridad: no se toca lo que ya está cerrado
        if (['rechazada', 'devuelto'].includes(solicitud.estado)) {
            return res.status(400).json({ 
                message: `Integridad de datos: No se puede modificar una solicitud que ya está ${solicitud.estado}.` 
            });
        }

        // --- 2. MOTOR DE INVENTARIO (Lógica delegada al Helper) ---
        // Aquí es donde ocurre la magia del Ticket #26 y #15
        try {
            if (nuevoEstado === 'aprobada') {
                await stockManager.processApproval(solicitud);
            } else if (nuevoEstado === 'devuelto') {
                await stockManager.processReturn(solicitud);
            }
        } catch (errorStock) {
            // Si el motor detecta que NO HAY STOCK, detiene el proceso aquí
            return res.status(400).json({ 
                message: 'Error de Inventario', 
                detalles: errorStock.message 
            });
        }

        // --- 3. ACTUALIZACIÓN FINAL E HISTORIAL ---
        solicitud.estado = nuevoEstado;
        
        // Esta observación es la que el usuario verá en su interfaz
        solicitud.historico_estados.push({
            estado: nuevoEstado,
            fecha: new Date(),
            observaciones: observaciones || `El Administrador cambió el estado a ${nuevoEstado}.`
        });

        await solicitud.save();
        
        res.json({ 
            message: `Solicitud marcada como ${nuevoEstado} con éxito.`,
            visualizacion_usuario: {
                estado_actual: solicitud.estado,
                ultimo_comentario: observaciones || "Sin observaciones adicionales."
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en la gestión administrativa', error: error.message });
    }
};