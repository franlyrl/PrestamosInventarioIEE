/***
 * @file solicitudController.js
 * @description Controlador para gestionar el ciclo de vida de los préstamos (Solicitudes).
 * Vincula Usuarios, Activos e Insumos mediante referencias (Populate).
 **/

const Solicitudes = require('../models/solicitudes'); // El modelo principal para las solicitudes
const stockManager = require('../helpers/stockManager'); // Helper para manejar la lógica de inventario
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
        // Nota: Asegúrate de si en tu Schema el campo es 'usuario'
        console.log('🔍 req.user completo:', JSON.stringify(req.user, null, 2));
        console.log('🔍 req.user.role:', req.user.role);
        console.log('🔍 req.user.tipo_rol:', req.user.tipo_rol);

        // Verificar rol en ambos campos (role y tipo_rol)
        const userRole = req.user.role || req.user.tipo_rol;
        console.log('🔍 userRole final:', userRole);

        if (!['admin', 'administrador', 'administrativo'].includes(userRole)) {
            console.log('❌ Usuario no es admin, aplicando filtro por usuario:', req.user.id);
            filtro = { usuario: req.user.id };
        } else {
            console.log('✅ Usuario es admin, mostrando todas las solicitudes');
        }

        // 2. LA RIQUEZA DE DATOS (El populate detallado del GET viejo)
        console.log('🔍 Iniciando getSolicitudes con filtro:', filtro);

        const ObtenerSolicitudes = await Solicitudes.find(filtro)
            // 1. Traemos todo del usuario (menos la contraseña por seguridad)
            .populate('usuario', 'id_usuario cedula nombre_completo correo_electronico tipo_rol estado')
            // 2. Traemos los detalles de los activos vinculados
            .populate('activos', 'marca modelo numActivo estado serie')
            // 3. Traemos los detalles de los insumos (manejo especial para $oid)
            .populate({
                path: 'insumos.id_insumo',
                model: 'Insumo',
                select: 'NombProducto'
            })
            // 4. Orden cronológico (lo más nuevo arriba)
            .sort({ createdAt: -1 })
            // 5. Rendimiento: Convierte de documento pesado de Mongoose a objeto JS simple
            .lean()
            // 6. Limpieza: Quitamos la versión interna de Mongo (__v)
            .select('-__v')
            .exec();

        console.log('📡 Solicitudes obtenidas de DB (raw):', ObtenerSolicitudes);
        console.log('📦 Insumos en primera solicitud:', ObtenerSolicitudes[0]?.insumos);
        console.log('🔍 Estructura de insumos:', JSON.stringify(ObtenerSolicitudes[0]?.insumos, null, 2));

        // 3. MEJORA DE VISUALIZACIÓN: Ordenar historiales en la lista
        // Como es un array de solicitudes, usamos map para ordenar cada una
        const solicitudesOrdenadas = ObtenerSolicitudes.map(sol => {
            if (sol.historico_estados) {
                sol.historico_estados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            }
            return sol;
        });

        res.status(200).json(solicitudesOrdenadas);


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
        console.log('🚀 Iniciando creación de solicitud...');

        // 1. Obtenemos el ID del usuario del token (es el _id de MongoDB)
        const usuarioId = req.user.id;
        console.log('👤 ID del usuario desde token:', usuarioId);

        // --- DATOS DE LA SOLICITUD (Vienen del Formulario/Body) ---
        const { activos, insumos, fecha_entrega_esperada } = req.body;
        console.log('📋 Datos recibidos en createSolicitud:', {
            activos,
            insumos,
            fecha_entrega_esperada,
            bodyCompleto: req.body
        });

        // Validar que los datos lleguen correctamente
        if (!insumos || !Array.isArray(insumos)) {
            console.log('❌ Insumos no llegaron como array:', insumos);
        } else {
            console.log(`✅ Llegaron ${insumos.length} insumos`);
            insumos.forEach((insumo, index) => {
                console.log(`📦 Insumo ${index + 1}:`, insumo);
            });
        }

        if (!activos || !Array.isArray(activos)) {
            console.log('❌ Activos no llegaron como array:', activos);
        } else {
            console.log(`✅ Llegaron ${activos.length} activos`);
        }

        // 2. REVISIÓN DEL ESTADO USANDO EL _ID DE MONGODB
        const usuarioDB = await Usuarios.findById(usuarioId).select('estado');
        console.log('🔍 Usuario encontrado en DB:', usuarioDB);

        if (!usuarioDB) {
            return res.status(404).json({ message: 'El usuario con ese ID no existe en el sistema.' });
        }

        // b. VALIDACIÓN DEL ENUM (Tal cual lo tienes en el Schema)
        // Tu Schema dice: ['activo', 'inactivo', 'sancionado', 'pendiente_devolucion']
        const estadosProhibidos = ['inactivo', 'sancionado', 'pendiente_devolucion'];
        if (estadosProhibidos.includes(usuarioDB.estado)) {
            return res.status(403).json({
                message: `Acceso denegado: Tu cuenta está ${usuarioDB.estado}.`
            });
        }

        // 3. REVISIÓN DE BOLETAS ABIERTAS
        // Usamos el _id del usuario directamente
        const solicitudActiva = await Solicitudes.findOne({
            usuario: usuarioId, // <--- Aquí usamos usuarioId directamente
            estado: { $in: ['pendiente', 'aprobada', 'entregado', 'penalizado'] }
        });
        console.log('🔍 Solicitud activa encontrada:', solicitudActiva);

        if (solicitudActiva) {
            return res.status(403).json({
                message: `No puedes crear otra solicitud. Tienes una boleta en estado: ${solicitudActiva.estado}`,
                folio: solicitudActiva._id
            });
        }

        // 4. CREACIÓN (Sincronizado con tu Schema 'usuario')

        // Procesar insumos para convertir $oid a string si es necesario
        let insumosProcesados = [];
        if (insumos && Array.isArray(insumos)) {
            insumosProcesados = insumos.map(insumo => {
                let insumoProcesado = { ...insumo };

                // Convertir id_insumo de objeto a string si viene como $oid
                if (insumo.id_insumo && typeof insumo.id_insumo === 'object') {
                    insumoProcesado.id_insumo = insumo.id_insumo.$oid || insumo.id_insumo._id || insumo.id_insumo.id;
                    console.log('🔄 Convertido id_insumo de $oid a string:', insumoProcesado.id_insumo);
                }

                return insumoProcesado;
            });
        }

        // Procesar activos de la misma manera
        let activosProcesados = [];
        if (activos && Array.isArray(activos)) {
            activosProcesados = activos.map(activo => {
                let activoProcesado = { ...activo };

                // Convertir referencias de objeto a string si es necesario
                if (activo.codigo_activo && typeof activo.codigo_activo === 'object') {
                    activoProcesado.codigo_activo = activo.codigo_activo.$oid || activo.codigo_activo._id || activo.codigo_activo.id;
                    console.log('🔄 Convertido codigo_activo de $oid a string:', activoProcesado.codigo_activo);
                }

                return activoProcesado;
            });
        }

        console.log('📝 Insumos procesados para guardar:', insumosProcesados);
        console.log('🔧 Activos procesados para guardar:', activosProcesados);

        const nuevaSolicitud = new Solicitudes({
            usuario: usuarioId, // <--- Usamos usuarioId directamente
            activos: activosProcesados,
            insumos: insumosProcesados,
            fecha_entrega_esperada,
            estado: 'pendiente',
            historico_estados: [{
                estado: 'pendiente',
                fecha: new Date(),
                observaciones: 'Solicitud creada exitosamente.'
            }]
        });

        console.log('📝 Nueva solicitud a guardar:', nuevaSolicitud);

        const solicitudGuardada = await nuevaSolicitud.save();
        console.log('✅ Solicitud guardada en Atlas:', solicitudGuardada);

        return res.status(201).json({
            message: "¡Solicitud registrada con éxito!",
            data: solicitudGuardada
        });

    } catch (error) {
        console.error('❌ Error en createSolicitud:', error);
        return res.status(500).json({
            message: 'Error interno en la creación de solicitud',
            error: error.message
        });
    }
};
/**
 * @route GET /api/solicitudes/estudiante/:id
 * @desc Obtiene una solicitud específica para estudiantes (solo si les pertenece)
 * @access Estudiantes y Docentes (solo sus propias solicitudes)
 */
exports.getSolicitudByIdForStudent = async (req, res) => {
    try {
        const SolicitudxId = await Solicitudes.findById(req.params.id)
            .populate('usuario', 'nombre_completo correo_electronico')
            .populate('activos', 'marca modelo numActivo')
            .populate({
                path: 'insumos.id_insumo',
                model: 'Insumo',
                select: 'NombProducto'
            })
            .lean()
            .select('-__v')
            .exec();

        if (!SolicitudxId) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        // Ordenamos el historial
        if (SolicitudxId.historico_estados) {
            SolicitudxId.historico_estados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }

        // Verificación mejorada: el usuario debe ser el dueño de la solicitud
        const solicitudUserId = SolicitudxId.usuario._id ?
            SolicitudxId.usuario._id.toString() :
            SolicitudxId.usuario.toString();

        const currentUserId = req.user.id || req.user._id;

        console.log('🔍 Verificación de permisos:', {
            solicitudUserId,
            currentUserId,
            userRole: req.user.role
        });

        if (solicitudUserId !== currentUserId) {
            return res.status(403).json({
                message: 'No tienes permiso para ver esta solicitud. Solo puedes ver tus propias solicitudes.'
            });
        }

        res.json(SolicitudxId);

    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener la solicitud',
            error: error.message
        });
    }
};

/**
 * @route GET /api/solicitudes/:id
 * @desc Obtiene el detalle completo de una sola solicitud por su ID.
 */

exports.getSolicitudById = async (req, res) => {
    try {
        const SolicitudxId = await Solicitudes.findById(req.params.id)
            // 1. Cambiamos 'estudiante' por 'usuario' (el nombre real del Schema)
            .populate('usuario', 'nombre_completo correo_electronico')
            .populate('activos', 'marca modelo numActivo')
            .populate({
                path: 'insumos.id_insumo',
                model: 'Insumo',
                select: 'NombProducto'
            })
            // Nota: Quitamos los populates del historial porque son datos simples, no IDs.
            .lean()
            .select('-__v')
            .exec();

        if (!SolicitudxId) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        // Ordenamos el historial (lo más nuevo arriba)
        if (SolicitudxId.historico_estados) {
            SolicitudxId.historico_estados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }

        // --- SECURITY CHECK ---
        const isAdmin = ['admin', 'administrador'].includes(req.user.role);

        // Usamos .usuario._id porque el populate lo convirtió en objeto
        const isOwner = SolicitudxId.usuario._id.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'No tienes permiso para ver esta solicitud.' });
        }

        res.json(SolicitudxId);

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

        const MapearEstadoSoli = await Solicitudes.findById(req.params.id);
        if (!MapearEstadoSoli) return res.status(404).json({ message: 'Solicitud no encontrada.' });

        // --- CASCADA HACIA EL USUARIO ---
        let estadoUsuarioDestino = null;
        if (nuevoEstado === 'entregado') estadoUsuarioDestino = 'pendiente_devolucion';
        else if (nuevoEstado === 'devuelto') estadoUsuarioDestino = 'activo';
        else if (nuevoEstado === 'penalizado') estadoUsuarioDestino = 'sancionado';

        if (estadoUsuarioDestino) {
            // Usamos 'solicitud.usuario' como dicta tu Schema
            await Usuarios.findByIdAndUpdate(MapearEstadoSoli.usuario, {
                estado: estadoUsuarioDestino
            });
        }

        // --- ACTUALIZACIÓN DEL HISTÓRICO ---
        MapearEstadoSoli.historico_estados.push({
            estado: nuevoEstado,
            fecha: new Date(),
            observaciones: observaciones // Mongoose validará esto según tu validator
        });

        // Actualizamos campos de fecha si es devolución
        if (nuevoEstado === 'devuelto') {
            MapearEstadoSoli.fecha_devolucion_real = new Date();
        }

        await MapearEstadoSoli.save(); // Aquí se dispara tu validación del Schema

        return res.json({
            message: `Cambio exitoso a ${nuevoEstado}`,
            historico: MapearEstadoSoli.historico_estados
        });

    } catch (error) {
        // Si falta la observación en un estado crítico, este mensaje vendrá del Schema
        return res.status(400).json({
            message: 'Error en la validación de la solicitud',
            error: error.message
        });
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
        const eliminarSoli = await Solicitudes.findById(req.params.id);

        if (!eliminarSoli) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        // 2. REGLA DE ORO 1: ¿Es el dueño? 
        // Comparamos el ID del usuario de la solicitud con el ID del usuario en el token (req.user.id)
        if (eliminarSoli.usuario.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'No tienes permiso. Solo el dueño puede cancelar esta solicitud.'
            });
        }

        // 3. REGLA DE ORO 2: ¿Sigue pendiente?
        // Si ya fue aceptada o rechazada, el Admin ya trabajó en ella. No se toca.
        if (eliminarSoli.estado && eliminarSoli.estado !== 'pendiente') {
            return res.status(400).json({
                message: `No se puede eliminar. La solicitud ya se encuentra en estado: ${eliminarSoli.estado}.`
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
        const { nuevoEstadoAdmin, observaciones } = req.body;
        const { id } = req.params;

        // Nombre único: EstadoSoli
        const EstadoSoli = await Solicitudes.findById(id);
        if (!EstadoSoli) return res.status(404).json({ message: 'Solicitud no encontrada' });

        // --- 1. VALIDACIÓN DE RECHAZO ---
        if (nuevoEstadoAdmin === 'rechazada' && (!observaciones || observaciones.trim().length < 5)) {
            return res.status(400).json({
                message: 'Error: Debes proporcionar una justificación detallada para rechazar la solicitud.'
            });
        }

        // Bloqueo de integridad: Usamos EstadoSoli.estado (el nombre del Schema)
        if (['rechazada', 'devuelto'].includes(EstadoSoli.estado)) {
            return res.status(400).json({
                message: `Integridad de datos: No se puede modificar una solicitud que ya está ${EstadoSoli.estado}.`
            });
        }

        // --- 2. MOTOR DE INVENTARIO ---
        try {
            if (nuevoEstadoAdmin === 'aprobada') {
                await stockManager.processApproval(EstadoSoli);
            } else if (nuevoEstadoAdmin === 'devuelto') {
                await stockManager.processReturn(EstadoSoli);
            }
        } catch (errorStock) {
            return res.status(400).json({
                message: 'Error de Inventario',
                detalles: errorStock.message
            });
        }

        // --- 3. ACTUALIZACIÓN FINAL ---
        // Aquí sincronizamos: campo del Schema = nuestra variable local
        EstadoSoli.estado = nuevoEstadoAdmin;

        EstadoSoli.historico_estados.push({
            estado: nuevoEstadoAdmin,
            fecha: new Date(),
            observaciones: observaciones || `El Administrador cambió el estado a ${nuevoEstadoAdmin}.`
        });

        await EstadoSoli.save();

        res.json({
            message: `Solicitud marcada como ${nuevoEstadoAdmin} con éxito.`,
            visualizacion_usuario: {
                estado_actual: EstadoSoli.estado,
                ultimo_comentario: observaciones || "Sin observaciones adicionales."
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en la gestión administrativa', error: error.message });
    }
};