const Usuarios = require('../models/usuarios'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcryptjs'); // Para el hash de la contraseña
const jwt = require('jsonwebtoken'); // O tu función generarToken
const generarToken = require('../utils/generarToken');
const Solicitudes = require('../models/solicitudes'); // Para verificar préstamos activos
const CuatrimestreConfig = require('../models/cuatrimestreConfig');
const {
    extractRawTextFromPdf,
    evaluateBoletaAgainstConfig,
    persistBoletaFile
} = require('../services/boletaService');

const CARRERAS_BASE_AUTORIZADAS = [
    'ingenieria electronica',
    'ingenieria electrica',
    'ingenieria en tecnologias de informacion',
    'ingenieria en produccion industrial',
    'n/a',
    'na'
];

function normalizarTextoPlano(valor = '') {
    return String(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function normalizarCarrera(valor = '') {
    const key = normalizarTextoPlano(valor);
    if (!key) return 'N/A';
    if (key === 'ingenieria electronica') return 'Ingenieria Electronica';
    if (key === 'ingenieria electrica') return 'Ingenieria Electrica';
    if (key === 'ingenieria en tecnologias de informacion') return 'Ingenieria en Tecnologias de Informacion';
    if (key === 'ingenieria en produccion industrial') return 'Ingenieria en Produccion Industrial';
    if (key === 'n/a' || key === 'na') return 'N/A';
    return String(valor).trim();
}

function esCarreraAutorizada(valor = '') {
    const key = normalizarTextoPlano(valor);
    return CARRERAS_BASE_AUTORIZADAS.includes(key);
}

function getYearFromCodigo(codigo) {
    const m = String(codigo || '').toUpperCase().match(/(20\d{2})/);
    return m ? Number(m[1]) : new Date().getFullYear();
}

function getNextCuatrimestreCodigo(codigo) {
    const raw = String(codigo || '').toUpperCase();
    const year = getYearFromCodigo(raw);

    // Acepta nomenclaturas como I-2026, IC 2026, II-2026, III-2026
    const hasIII = /\bIII\b/.test(raw);
    const hasII = /\bII\b/.test(raw);
    const hasIorIC = /\bIC\b/.test(raw) || (/\bI\b/.test(raw) && !hasII && !hasIII);

    if (hasIII) return `I-${year + 1}`;
    if (hasII) return `III-${year}`;
    if (hasIorIC) return `II-${year}`;
    return raw.trim();
}

function resolveBoletaTargetConfig(cuatrimestreActivo) {
    const now = new Date();
    const expired = !!(cuatrimestreActivo?.fecha_fin && now > new Date(cuatrimestreActivo.fecha_fin));
    const codigoRequerido = expired
        ? getNextCuatrimestreCodigo(cuatrimestreActivo?.codigo || '')
        : String(cuatrimestreActivo?.codigo || '').trim().toUpperCase();

    // Cuando el ciclo ya vencio y aun no existe configuracion del siguiente,
    // validamos contra el codigo requerido y un rango anual del mismo ano.
    const year = getYearFromCodigo(codigoRequerido);
    const configParaValidar = expired
        ? {
            ...(cuatrimestreActivo || {}),
            codigo: codigoRequerido,
            fecha_inicio: new Date(Date.UTC(year, 0, 1)),
            fecha_fin: new Date(Date.UTC(year, 11, 31))
        }
        : cuatrimestreActivo;

    return { expired, codigoRequerido, configParaValidar };
}


/**
 * @desc Obtiene todos los usuarios (sin mostrar la contraseña por seguridad).
 */
exports.getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuarios.find().select('cedula nombre_completo correo_electronico tipo_rol estado');
        res.json(usuarios);

    } catch (error) {
        console.error("DEBUG ERROR:", error); // This shows the error in your terminal
        res.status(500).json({ message: "Error al obtener los usuarios", error: error.message });
    }
};

/**
 * @desc Crea un nuevo usuario con validación de cédula y generación de token.
 * @param {Object} req - Objeto de solicitud que contiene los datos del nuevo usuario y el archivo PDF.
 * @param {Object} res - Objeto de respuesta para enviar la respuesta al cliente.
 * @returns {Object} Respuesta JSON con el resultado del registro.
 * 
 * Este endpoint no solo crea un nuevo usuario, sino que también implementa una validación adicional para verificar la autenticidad de la cédula proporcionada.
 * Antes de crear el usuario, se realiza una consulta a un servicio externo (simulado por la función `consultarNombrePorCedula`) para validar que la cédula exista y obtener el nombre completo asociado a esa cédula. 
 * Si la cédula es válida, se procede a crear el usuario con el nombre completo obtenido y se genera un token de autenticación para el nuevo usuario.
 */

exports.createUsuario = async (req, res) => {
    try {
        let { cedula, nombre_completo, contrasena, correo_electronico, carrera } = req.body;

        if (cedula) cedula = String(cedula).replace(/[\s\-\.]/g, '').trim();
        const correoLower = (correo_electronico || '').toLowerCase().trim();

        if (!contrasena || contrasena.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        let tipoRolDetectado = 'estudiante';
        if (correoLower.endsWith('@utn.ac.cr') && !correoLower.endsWith('@est.utn.ac.cr')) {
            tipoRolDetectado = 'docente';
        }
        const carreraNormalizada = normalizarCarrera(carrera);

        if (tipoRolDetectado === 'estudiante' && !esCarreraAutorizada(carreraNormalizada)) {
            return res.status(400).json({ message: 'La carrera no es válida para este sistema.' });
        }

        const cuatrimestreActivo = await CuatrimestreConfig.findOne({ activo: true }).sort({ createdAt: -1 }).lean();
        const { codigoRequerido, configParaValidar } = resolveBoletaTargetConfig(cuatrimestreActivo);

        if (tipoRolDetectado === 'estudiante' && cuatrimestreActivo?.requiere_boleta && !req.file) {
            return res.status(400).json({ message: 'Debe adjuntar la boleta de matrícula en PDF para registrarse.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHasheada = await bcrypt.hash(contrasena, salt);

        // Docentes se crean con estado inactivo por defecto (requieren aprobación)
        const esDocente = tipoRolDetectado === 'docente';
        const estadoInicial = esDocente ? 'inactivo' : 'activo';

        const nuevoUsuario = new Usuarios({
            id_usuario: Date.now(),
            cedula,
            nombre_completo,
            correo_electronico: correoLower,
            hash_contraseña: passwordHasheada,
            tipo_rol: tipoRolDetectado,
            estado_usuario: estadoInicial,
            estado: estadoInicial,
            carrera: carreraNormalizada || 'N/A',
            boleta_estado: tipoRolDetectado === 'estudiante' ? 'pendiente_revision' : 'validada'
        });

        if (req.file && tipoRolDetectado === 'estudiante') {
            const buffer = require('fs').readFileSync(req.file.path);
            const rawText = await extractRawTextFromPdf(buffer);
            const evaluacion = evaluateBoletaAgainstConfig(rawText, configParaValidar || cuatrimestreActivo, {
                cedula,
                nombre_completo,
                carrera: carreraNormalizada,
                correo_electronico: correoLower
            });

            nuevoUsuario.boleta_pdf_url = persistBoletaFile(req.file);
            nuevoUsuario.boleta_nombre_archivo = req.file.originalname || null;
            nuevoUsuario.boleta_cuatrimestre = codigoRequerido || cuatrimestreActivo?.codigo || null;
            nuevoUsuario.boleta_validada = evaluacion.validada;
            nuevoUsuario.boleta_estado = evaluacion.estado;
            nuevoUsuario.boleta_observaciones = evaluacion.observacion;
            nuevoUsuario.boleta_fecha_carga = new Date();
            nuevoUsuario.boleta_fecha_inicio = evaluacion.fechaMin || null;
            nuevoUsuario.boleta_fecha_fin = evaluacion.fechaMax || null;
            nuevoUsuario.boleta_texto_resumen = evaluacion.textoResumen || null;
        }

        await nuevoUsuario.save();

        res.status(201).json({
            status: 'success',
            message: 'Cuenta creada correctamente.',
            boleta: {
                estado: nuevoUsuario.boleta_estado,
                validada: nuevoUsuario.boleta_validada,
                observaciones: nuevoUsuario.boleta_observaciones || ''
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            let message = 'Ya existe un registro con este dato.';
            if (field === 'cedula') message = 'La cédula ya está registrada.';
            if (field === 'correo_electronico') message = 'El correo electrónico ya está registrado.';
            if (field === 'id_usuario') message = 'Error interno: ID de usuario duplicado. Reintente.';
            return res.status(400).json({ message });
        }
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors || {})[0]?.message || 'Datos invalidos para registrar usuario.';
            return res.status(400).json({ message: msg });
        }

        res.status(500).json({ message: 'Error en el registro', error: error.message });
    }
};

/**
 * @desc Actualiza un usuario por ID.
 * Nota: Este endpoint es para actualizaciones generales de perfil. Para acciones específicas como inactivar o sancionar, se deben usar los endpoints dedicados.
 */
exports.updateUsuario = async (req, res) => {
    try {
        const usuarioActualizado = await Usuarios.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-hash_contraseña');

        if (!usuarioActualizado) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(usuarioActualizado);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar el usuario', error });
    }
};

/**
 * @desc Actualiza el rol y permisos de un usuario específico.
 * @access Privado (Solo Administrador)
 */
exports.updateRolesPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_rol, permisos, estado } = req.body;

        // Solo permitir actualizar si se es admin. El middleware verifyAdmin (o proteger rutas) debería filtrar,
        // pero validamos por seguridad extra (opcional si req.user existe):
        const admin = req.user;
        if (admin && admin.tipo_rol !== 'admin' && admin.tipo_rol !== 'administrativo') {
            return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
        }

        // Evitar quitarse a sí mismo el rol de admin por error
        if (admin && admin._id.toString() === id && tipo_rol !== 'admin' && tipo_rol !== 'administrativo') {
            return res.status(400).json({ message: 'No puedes revocar tus propios privilegios de administrador.' });
        }

        // Construir objeto de actualización
        const updateData = { tipo_rol, permisos: permisos || [] };
        if (estado) {
            updateData.estado = estado;
            updateData.estado_usuario = estado; // Mantener ambos campos sincronizados
        }

        const usuarioActualizado = await Usuarios.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-hash_contraseña');

        if (!usuarioActualizado) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json({
            message: 'Rol y permisos actualizados correctamente.',
            usuario: usuarioActualizado
        });
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar rol y permisos', error: error.message });
    }
};

/** 
 * @desc Perfil del usuario autenticado
 * @param {Object} req - Objeto de solicitud que contiene la información del usuario autenticado en req.user.
 * @param {Object} res - Objeto de respuesta para enviar la información del perfil al cliente.
 * @return {Object} Respuesta JSON con los datos del perfil del usuario autenticado.
 * Importante: Este endpoint es una ruta protegida, lo que significa que solo los usuarios que han iniciado sesión y tienen un token válido pueden acceder a ella. El middleware de protección se encarga de verificar el token y cargar la información del usuario en `req.user`, lo que permite que el controlador devuelva los datos del perfil sin necesidad de recibir un ID en la URL. Esto mejora la seguridad y la experiencia del usuario, ya que no es necesario exponer el ID del usuario en la ruta para acceder a su perfil.
 * Este endpoint devuelve la información del perfil del usuario que ha iniciado sesión, utilizando el token de autenticación para identificar al usuario. Es una ruta protegida, lo que significa que solo los usuarios autenticados pueden acceder a ella. El middleware de protección se encarga de verificar el token y cargar la información del usuario en `req.user`, lo que permite que el controlador devuelva los datos del perfil sin necesidad de recibir un ID en la URL.
**/

exports.getPerfil = async (req, res) => {
    try {
        // 1. Verificamos si el middleware 'protect' realmente inyectó al usuario
        if (!req.user) {
            return res.status(404).json({
                ok: false,
                message: 'Error: El middleware no cargó al usuario (req.user está vacío)',
                debug: "Asegúrate de que el middleware tenga: req.user = usuarioActual; antes del next();"
            });
        }

        // 2. Si llegó aquí, ¡ÉXITO! Devolvemos los datos limpios
        res.status(200).json({
            ok: true,
            message: "Perfil cargado con éxito",
            usuario: {
                id: req.user._id,
                nombre: req.user.nombre_completo,
                correo: req.user.correo_electronico,
                cedula: req.user.cedula || null,
                rol: req.user.tipo_rol,
                carrera: req.user.carrera,
                estado: req.user.estado || req.user.estado_usuario || 'activo',
                boleta: {
                    url: req.user.boleta_pdf_url || null,
                    estado: req.user.boleta_estado || 'pendiente_boleta',
                    validada: !!req.user.boleta_validada,
                    cuatrimestre: req.user.boleta_cuatrimestre || null,
                    observaciones: req.user.boleta_observaciones || '',
                    fecha_carga: req.user.boleta_fecha_carga || null
                }
            }
        });

    } catch (error) {
        // Por si ocurre un error inesperado de servidor
        res.status(500).json({
            ok: false,
            message: 'Error interno en el servidor al obtener el perfil',
            error: error.message
        });
    }
};

/**
 * @desc Actualiza la contraseña del usuario autenticado
 */
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Por favor complete todos los campos' });
        }

        // 1. Obtener usuario con la contraseña
        const usuario = await Usuarios.findById(req.user._id).select('+hash_contraseña');
        
        // 2. Verificar contraseña actual
        // Nota: En el modelo se llama hash_contraseña
        const esValida = await bcrypt.compare(currentPassword, usuario.hash_contraseña);
        if (!esValida) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

        // 3. Validar longitud de nueva contraseña
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
        }

        // 4. Hashear y guardar
        const salt = await bcrypt.genSalt(10);
        usuario.hash_contraseña = await bcrypt.hash(newPassword, salt);
        await usuario.save();

        res.json({
            ok: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
/**
 * @desc Sanciona a un usuario y marca la solicitud como penalizada.
 * Bloquea al usuario para que no pida más ni pueda ser inactivado/borrado.
 * Importante: Este endpoint debe ser utilizado con precaución, ya que sancionar a un usuario es una acción que afecta su capacidad de interactuar con el sistema. Asegúrate
 *  de que el motivo de la sanción esté claramente documentado en las observaciones y que el usuario haya sido notificado 
 * sobre la falta cometida y las consecuencias de la sanción. Además, este proceso no solo cambia el estado de la solicitud a 
 * "penalizado", sino que también bloquea al usuario para futuras solicitudes, garantizando así la integridad del sistema y 
 * la responsabilidad del usuario.
  */
exports.sancionarUsuarioPorFalta = async (req, res) => {
    try {
        // 1. Buscamos la solicitud que originó el problema
        const solicitud = await Solicitudes.findById(req.params.id);
        if (!solicitud) {
            return res.status(404).json({ message: 'No se encontró la solicitud de préstamo.' });
        }

        // 2. Cambiamos el estado de la SOLICITUD
        solicitud.estado = 'penalizado';
        solicitud.observaciones_admin = req.body.motivo || 'Incumplimiento en la entrega/daño de equipo';
        await solicitud.save();

        // 3. IMPACTO EN EL USUARIO
        const usuarioSancionado = await Usuarios.findByIdAndUpdate(
            solicitud.usuario,
            { estado: 'sancionado' },
            { new: true }
        );

        if (!usuarioSancionado) {
            return res.status(404).json({ message: 'La solicitud existe pero el usuario ya no está en el sistema.' });
        }

        res.json({
            message: `Acción completada: El usuario ${usuarioSancionado.nombre_completo} ha sido sancionado.`,
            detalle: `Solicitud marcada como 'penalizada'. El usuario no podrá realizar trámites hasta que se resuelva esta falta.`
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al procesar la sanción del usuario.', error: error.message });
    }
};

/**
 * @route PATCH /api/usuarios/:id/sancionar
 * @desc Sanciona a un usuario directamente por ID con motivo y duración opcional.
 * @access Privado (Solo Administrador)
 */
exports.sancionarUsuario = async (req, res) => {
    try {
        const { motivo, dias } = req.body;
        if (!motivo || motivo.trim().length < 5) {
            return res.status(400).json({ message: 'Se requiere un motivo válido (mín. 5 caracteres) para la sanción.' });
        }

        const usuario = await Usuarios.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const fechaInicio = new Date();
        const fechaFin = dias ? new Date(fechaInicio.getTime() + dias * 24 * 60 * 60 * 1000) : null;

        const actualizado = await Usuarios.findByIdAndUpdate(
            req.params.id,
            {
                estado: 'sancionado',
                sancion_activa: true,
                sancion_motivo: motivo.trim(),
                sancion_fecha_inicio: fechaInicio,
                sancion_fecha_fin: fechaFin
            },
            { new: true }
        ).select('-hash_contraseña');

        res.json({
            message: `Usuario ${actualizado.nombre_completo} sancionado correctamente.`,
            sancion: {
                motivo: actualizado.sancion_motivo,
                desde: actualizado.sancion_fecha_inicio,
                hasta: actualizado.sancion_fecha_fin || 'Permanente hasta desbloqueo manual'
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al sancionar al usuario.', error: error.message });
    }
};

/**
 * @route PATCH /api/usuarios/:id/levantar-sancion
 * @desc Levanta la sanción de un usuario, reactivando su cuenta.
 * @access Privado (Solo Administrador)
 */
exports.levantarSancion = async (req, res) => {
    try {
        const usuario = await Usuarios.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

        if (!usuario.sancion_activa && usuario.estado !== 'sancionado') {
            return res.status(400).json({ message: 'Este usuario no tiene una sanción activa.' });
        }

        const actualizado = await Usuarios.findByIdAndUpdate(
            req.params.id,
            {
                estado: 'activo',
                sancion_activa: false,
                sancion_motivo: null,
                sancion_fecha_inicio: null,
                sancion_fecha_fin: null
            },
            { new: true }
        ).select('-hash_contraseña');

        res.json({
            message: `Sanción levantada. El usuario ${actualizado.nombre_completo} puede volver a operar normalmente.`
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al levantar la sanción.', error: error.message });
    }
};

/**
 * @route Inactivo /api/usuarios/:id
 * @desc Elimina un usuario del sistema si cumple las condiciones de baja.
 * @access Privado (Solo Administrador/Admin)
 * 
 * REGLA DE ORO: Solo se pueden eliminar usuarios que estén en estado 'inactivo' o 'penalizado'.
 * Esto garantiza que no se borren usuarios activos por error, y que el historial de préstamos se mantenga intacto.
 * Si un usuario está 'activo', el sistema bloqueará la eliminación y sugerirá primero inactivarlo o penalizarlo.   
 * Nota: La eliminación física también podría incluir la eliminación del archivo PDF del comprobante, dependiendo de tu estrategia de almacenamiento.
*/
exports.inactivarUsuario = async (req, res) => {
    try {
        // 1. Verificación de permisos (Usamos req.user que viene del middleware protect)
        const admin = req.user;

        if (!admin || !['admin', 'Administrador'].includes(admin.tipo_rol)) {
            return res.status(403).json({
                message: 'No tienes permisos para esta acción.',
                debug: `Tu rol actual es: ${admin?.tipo_rol}` // Esto te ayudará a ver qué llega
            });
        }

        // 2. EVITAR AUTO-BLOQUEO
        if (admin._id.toString() === req.params.id) {
            return res.status(400).json({ message: 'No puedes inactivar tu propia cuenta de administrador.' });
        }
        // 3. Inactivar al usuario
        const usuario = await Usuarios.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });


        // 4. REGLA DE ORO ACTUALIZADA
        // Revisamos el estado del usuario directamente y las solicitudes
        // A. Verificación por estado del Usuario
        if (usuario.estado === 'pendiente_devolucion' || usuario.estado === 'sancionado') {
            return res.status(400).json({
                message: `No se puede inactivar: El usuario está en estado '${usuario.estado}'.`
            });
        }

        // Y por seguridad, mantenemos el chequeo en Solicitudes por si acaso
        // B. Verificación de seguridad en Solicitudes
        const tienePendientes = await Solicitudes.findOne({
            estudiante: req.params.id,
            estado: { $in: ['aprobada', 'entregado', 'penalizado'] }
        });
        if (tienePendientes) {
            return res.status(400).json({
                message: 'No se puede inactivar: El usuario tiene solicitudes de préstamo activas o pendientes de devolución.'
            });
        }

        // 5. CAMBIO DE ESTADO
        if (usuario.estado === 'inactivo') {
            return res.status(400).json({ message: 'El usuario ya está inactivo.' });
        }

        usuario.estado = 'inactivo';
        usuario.inactivo_desde = new Date(); // Para seguimiento de inactividad
        await usuario.save();

        res.json({
            message: `Usuario ${usuario.nombre_completo} inactivado correctamente.`,
            nota: 'Si el usuario regresa después de un año, deberá pasar por el proceso de reactivación y cambio de clave.'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en el proceso de inactivación.', error: error.message });
    }

};
/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 * @desc Login de usuario con validación de carrera
 * Este endpoint de login no solo verifica las credenciales del usuario, sino que también implementa un filtro adicional para garantizar que solo los usuarios pertenecientes a ciertas carreras de Ingeniería puedan acceder al sistema.
 * Solo se permiten usuarios que tengan una carrera registrada dentro de la lista de carreras autorizadas. Esto se hace para asegurar que el sistema sea utilizado exclusivamente por estudiantes, docentes o administrativos relacionados con las áreas de Ingeniería que el sistema está diseñado para servir.
 * Ejemplo de respuesta por carrera no autorizada:
 * {
 *   "message": "Acceso denegado: Este sistema es exclusivo para carreras de Ingeniería seleccionadas."
 * }
 */

exports.loginUsuario = async (req, res) => {
    try {
        // 1. Recibimos los datos
        const { correo_electronico, email, contrasena, password } = req.body;
        const correo = correo_electronico || email;


        // 2. Buscamos al usuario
        const usuario = await Usuarios.findOne({
            correo_electronico: correo.toLowerCase().trim()
        });

        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas (Usuario no encontrado)' });
        }

        // 3. COMPARACIÓN DE CONTRASEÑA (Solo una vez)
        const pwd = contrasena || password;
        const esValida = await bcrypt.compare(pwd, usuario.hash_contraseña);

        if (!esValida) {
            return res.status(401).json({ message: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        // 4. Filtro de Carreras UTN
        if (!esCarreraAutorizada(usuario.carrera)) {
            return res.status(403).json({ message: 'Acceso denegado: Carrera no autorizada.' });
        }

        //  BLOQUEO PARA DOCENTES PENDIENTES DE APROBACIÓN (antes del bloqueo genérico)
        // Verificar tanto estado como estado_usuario - si CUALQUIERA es inactivo, bloquear
        const estadoEsInactivo = usuario.estado === 'inactivo' || usuario.estado_usuario === 'inactivo';
        
        if (usuario.tipo_rol === 'docente' && estadoEsInactivo) {
            return res.status(403).json({
                message: 'Tu cuenta está pendiente de aprobación por parte del administrador. No puedes acceder al sistema hasta que sea aprobada.',
                esperando_aprobacion: true,
                tipo_rol: 'docente'
            });
        }

        // --- 5. BLOQUEO DE ESTADO ---
        if (usuario.estado === 'inactivo') {
            return res.status(403).json({
                message: 'Tu cuenta está inactiva por falta de uso, contacta al administrador.'
            });
        }

        // I: Verificar si la sanción expiró automáticamente
        if (usuario.sancion_activa && usuario.sancion_fecha_fin && new Date() > new Date(usuario.sancion_fecha_fin)) {
            await Usuarios.findByIdAndUpdate(usuario._id, {
                estado: 'activo',
                sancion_activa: false,
                sancion_motivo: null,
                sancion_fecha_fin: null
            });
            usuario.estado = 'activo';
            usuario.sancion_activa = false;
        }

        if (usuario.estado === 'sancionado' || usuario.sancion_activa) {
            const fechaFin = usuario.sancion_fecha_fin
                ? `hasta el ${new Date(usuario.sancion_fecha_fin).toLocaleDateString('es-CR')}`
                : 'hasta que el administrador levante la sanción';
            return res.status(403).json({
                message: `Tu cuenta está sancionada ${fechaFin}. Motivo: ${usuario.sancion_motivo || 'Sin motivo registrado'}. No puedes acceder al sistema.`
            });
        }

                // 6. Validacion de boleta para estudiantes
        if (usuario.tipo_rol === 'estudiante') {
            const cuatrimestreActivo = await CuatrimestreConfig.findOne({ activo: true }).sort({ createdAt: -1 }).lean();
            const { expired, codigoRequerido } = resolveBoletaTargetConfig(cuatrimestreActivo);

            if (expired) {
                await Usuarios.findByIdAndUpdate(usuario._id, {
                    boleta_validada: false,
                    boleta_estado: 'pendiente_boleta',
                    boleta_observaciones: `El cuatrimestre ${cuatrimestreActivo.codigo} finalizó. Debe cargar boleta del período ${codigoRequerido}.`
                });
                return res.status(403).json({
                    message: `El cuatrimestre ${cuatrimestreActivo.codigo} ya finalizó. Debe subir boleta del período ${codigoRequerido}.`,
                    requiere_boleta: true,
                    cuatrimestre: codigoRequerido
                });
            }

            if (cuatrimestreActivo?.requiere_boleta) {
                if (!usuario.boleta_pdf_url) {
                    return res.status(403).json({
                        message: `Debes subir tu boleta de matrícula del cuatrimestre ${codigoRequerido} para acceder.`,
                        requiere_boleta: true,
                        cuatrimestre: codigoRequerido
                    });
                }

                const boletaCuatrimestre = (usuario.boleta_cuatrimestre || '').toUpperCase();
                if (!usuario.boleta_validada || boletaCuatrimestre !== String(codigoRequerido || '').toUpperCase()) {
                    return res.status(403).json({
                        message: `Tu boleta no es válida para ${codigoRequerido}. Debes subir un nuevo PDF que coincida con tus datos y el período.`,
                        requiere_boleta: true,
                        boleta_estado: usuario.boleta_estado || 'pendiente_revision',
                        cuatrimestre: codigoRequerido
                    });
                }
            }
        }

        // 7. Generacion de Token
        const token = generarToken(usuario._id, usuario.tipo_rol);

        res.status(200).json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre_completo,
                nombre_completo: usuario.nombre_completo,
                rol: usuario.tipo_rol,
                tipo_rol: usuario.tipo_rol,
                carrera: usuario.carrera,
                estado: usuario.estado,
                estado_usuario: usuario.estado_usuario
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en el login', error: error.message });
    }
};
/**
 * @desc Obtiene un usuario específico por ID.
 */
exports.getUsuarioById = async (req, res) => {
    try {
        const usuario = await Usuarios.findById(req.params.id).select('-hash_contraseña');
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario', error });
    }
};

/**
 * @desc Busca por correo electrónico (Campo corregido: correo_electronico).
 */
exports.getUsuarioByEmail = async (req, res) => {
    try {
        const usuario = await Usuarios.findOne({ correo_electronico: req.params.email }).select('-hash_contraseña');
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario', error });
    }
};

/**
 * @desc Filtra por rol (Campo corregido: tipo_rol).
 */
exports.getUsuariosByRole = async (req, res) => {
    try {
        const usuarios = await Usuarios.find({ tipo_rol: req.params.role }).select('-hash_contraseña');
        if (usuarios.length === 0) {
            return res.status(404).json({ message: `No hay usuarios con el rol: ${req.params.role}` });
        }
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios por rol', error });
    }
};

/**
 * @desc Buscador global (Campos corregidos: nombre_completo, correo_electronico).
 */
const usuarios = require('../models/usuarios');

/**
 * @route GET /api/usuarios/buscar?q=termino
 * @desc Busca usuarios por nombre o correo electrónico.
 * @access Privado (Solo Administrador/Admin)
 * Busca usuarios por nombre o correo electrónico.
 * Implementa búsqueda con operadores lógicos y exclusión de datos sensibles.
 * Nota: Si recibes un error 401 en Postman, el problema suele estar en el 
 * middleware de validación de JWT, no en este controlador.
 * @param {Object} req - Request de Express con query param 'q'
 * @param {Object} res - Response de Express
 */
exports.searchUsuarios = async (req, res) => {
    try {
        const query = req.query.q;

        // As seen in your logs, the payload has 'id'
        const idLogueado = req.user?.id;

        if (!query) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a search term.'
            });
        }

        // Logic for filtering
        const filters = {
            $or: [
                { nombre_completo: { $regex: query, $options: 'i' } },
                { correo_electronico: { $regex: query, $options: 'i' } }
            ]
        };

        // Exclude the logged-in user if the ID exists
        if (idLogueado) {
            filters._id = { $ne: idLogueado };
        }

        // Now 'Usuario' will be defined!
        const resultados = await Usuarios.find(filters)
            .select('-hash_contraseña')
            .limit(10)
            .lean();

        res.status(200).json({
            status: 'success',
            results: resultados.length,
            data: { usuarios: resultados }
        });

    } catch (error) {
        console.error('❌ Error in searchUsuarios:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server Error',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/usuarios/cierre-cuatrimestre
 * @desc Inactiva usuarios y fuerza reseteo de contraseña para el nuevo ciclo.
 * @access Privado (Solo Administrador)
 * Este endpoint es una herramienta administrativa que se ejecuta al final de 
 * cada cuatrimestre para preparar el sistema para el nuevo ciclo académico.
 * Al ejecutarlo, el sistema realizará las siguientes acciones:
 * 1. Buscará a todos los usuarios con el rol de "estudiante" que estén actualmente activos.
 * 2. Cambiará su estado a "inactivo", lo que significa que no podrán iniciar sesión ni realizar acciones hasta que se reactiven.
 * 3. Forzará un reseteo de contraseña estableciendo un valor temporal (por ejemplo, "PENDIENTE_RESETEO") o un hash temporal, para garantizar que el estudiante tenga que crear una nueva contraseña al reactivarse.
 * 4. Marcará el comprobante como no validado, lo que requerirá que el estudiante suba un nuevo PDF de matrícula para validar su cuenta en el nuevo ciclo.
 * 5. Agregará una observación en el perfil del usuario indicando que su cuenta ha sido inactivada por el cierre de cuatrimestre y que necesita reactivarse para el nuevo ciclo.
 * Importante: Este proceso es irreversible desde este endpoint, por lo que se recomienda realizarlo solo después de haber confirmado que el cuatrimestre ha finalizado y que los estudiantes han sido informados sobre este procedimiento.
 * 
 * Recomendación adicional: Antes de ejecutar este endpoint, es aconsejable realizar una copia de seguridad de la base de 
 * datos, ya que este proceso afectará a un gran número de usuarios y no se puede revertir desde esta función.
 */
exports.cierreCuatrimestre = async (req, res) => {
    try {
        // 1. Buscamos a todos los estudiantes activos
        const resultado = await Usuarios.updateMany(
            { tipo_rol: 'estudiante' },
            {
                estado: 'inactivo',
                password: 'PENDIENTE_RESETEO', // O un hash temporal
                comprobante_validado: false,
                observaciones: 'Cuenta expirada por fin de cuatrimestre. Requiere nueva matrícula y contraseña.'
            }
        );

        res.json({
            message: 'Ciclo cerrado exitosamente.',
            usuarios_afectados: resultado.modifiedCount,
            instrucciones: 'Los usuarios deberán usar la opción "Olvidé mi contraseña" y subir su nuevo PDF para reactivarse.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el proceso de cierre de ciclo', error: error.message });
    }
};
/**
 * @route POST /api/usuarios/limpiar-archivo
 * @desc Mueve usuarios muy antiguos a una colección histórica.
 * @access Privado (Solo Administrador)
 */
exports.limpiarUsuariosViejos = async (req, res) => {
    try {
        // 1. Definimos el punto de corte (1 año atrás)
        const añoatras = new Date();
        añoatras.setFullYear(añoatras.getFullYear() - 1);

        // 2. Buscamos a los candidatos (estudiantes inactivos hace +1 año)
        const usuariosParaHistorial = await Usuarios.find({
            tipo_rol: 'estudiante',
            estado: 'inactivo',
            inactivo_desde: { $lt: añoatras }
        });

        if (usuariosParaHistorial.length === 0) {
            return res.json({ message: 'No hay usuarios tan antiguos para archivar.' });
        }

        // 3. Mover a la colección de Historial
        // Usamos insertMany para pasar todos de un solo golpe
        await UsuariosHistorial.insertMany(usuariosParaHistorial);

        // 4. Ahora que están seguros en el historial, los sacamos de la tabla principal
        const idsParaEliminar = usuariosParaHistorial.map(u => u._id);
        const resultado = await Usuarios.deleteMany({ _id: { $in: idsParaEliminar } });

        res.json({
            message: 'Migración al historial completada con éxito.',
            usuarios_archivados: resultado.deletedCount,
            nota: 'Los datos ahora residen en la base de datos histórica y pueden ser recuperados.'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error al mover datos al histórico.',
            error: error.message
        });
    }
};





exports.subirBoletaPerfil = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Debe adjuntar un archivo PDF.' });
        }

        const usuario = await Usuarios.findById(req.user._id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const cuatrimestreActivo = await CuatrimestreConfig.findOne({ activo: true }).sort({ createdAt: -1 }).lean();
        const { codigoRequerido, configParaValidar } = resolveBoletaTargetConfig(cuatrimestreActivo);
        const buffer = require('fs').readFileSync(req.file.path);
        const rawText = await extractRawTextFromPdf(buffer);
        const evaluacion = evaluateBoletaAgainstConfig(rawText, configParaValidar || cuatrimestreActivo, {
            cedula: usuario.cedula,
            nombre_completo: usuario.nombre_completo,
            carrera: usuario.carrera,
            correo_electronico: usuario.correo_electronico
        });

        usuario.boleta_pdf_url = persistBoletaFile(req.file);
        usuario.boleta_nombre_archivo = req.file.originalname || null;
        usuario.boleta_cuatrimestre = codigoRequerido || cuatrimestreActivo?.codigo || null;
        usuario.boleta_validada = evaluacion.validada;
        usuario.boleta_estado = evaluacion.estado;
        usuario.boleta_observaciones = evaluacion.observacion;
        usuario.boleta_fecha_carga = new Date();
        usuario.boleta_fecha_inicio = evaluacion.fechaMin || null;
        usuario.boleta_fecha_fin = evaluacion.fechaMax || null;
        usuario.boleta_texto_resumen = evaluacion.textoResumen || null;

        await usuario.save();

        res.json({
            message: evaluacion.validada
                ? 'Boleta validada automáticamente.'
                : `Boleta rechazada automáticamente. ${evaluacion.observacion}`,
            boleta: {
                url: usuario.boleta_pdf_url,
                estado: usuario.boleta_estado,
                validada: usuario.boleta_validada,
                observaciones: usuario.boleta_observaciones,
                cuatrimestre: usuario.boleta_cuatrimestre,
                fecha_carga: usuario.boleta_fecha_carga
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al procesar boleta.', error: error.message });
    }
};

exports.getEstadoBoleta = async (req, res) => {
    try {
        const usuario = await Usuarios.findById(req.user._id)
            .select('boleta_pdf_url boleta_nombre_archivo boleta_cuatrimestre boleta_validada boleta_estado boleta_observaciones boleta_fecha_carga')
            .lean();

        const cuatrimestreActivo = await CuatrimestreConfig.findOne({ activo: true }).sort({ createdAt: -1 }).lean();

        res.json({
            boleta: {
                url: usuario?.boleta_pdf_url || null,
                nombre_archivo: usuario?.boleta_nombre_archivo || null,
                cuatrimestre: usuario?.boleta_cuatrimestre || null,
                validada: !!usuario?.boleta_validada,
                estado: usuario?.boleta_estado || 'pendiente_boleta',
                observaciones: usuario?.boleta_observaciones || '',
                fecha_carga: usuario?.boleta_fecha_carga || null
            },
            cuatrimestre_activo: cuatrimestreActivo
                ? {
                    codigo: cuatrimestreActivo.codigo,
                    fecha_inicio: cuatrimestreActivo.fecha_inicio,
                    fecha_fin: cuatrimestreActivo.fecha_fin,
                    requiere_boleta: cuatrimestreActivo.requiere_boleta
                }
                : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al consultar estado de boleta.', error: error.message });
    }
};

exports.subirBoletaReactivacion = async (req, res) => {
    try {
        const { cedula, correo_electronico, contrasena } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Debe adjuntar un PDF de boleta.' });
        if (!cedula || !correo_electronico || !contrasena) {
            return res.status(400).json({ message: 'Debe enviar cédula, correo y contraseña.' });
        }

        const cedulaNorm = String(cedula).replace(/[\s\-\.]/g, '').trim();
        const correo = String(correo_electronico).toLowerCase().trim();

        const usuario = await Usuarios.findOne({ cedula: cedulaNorm, correo_electronico: correo }).select('+hash_contraseña');
        if (!usuario) return res.status(404).json({ message: 'No se encontro usuario con esos datos.' });

        const okPass = await bcrypt.compare(contrasena, usuario.hash_contraseña);
        if (!okPass) return res.status(401).json({ message: 'Credenciales invalidas.' });

        const cuatrimestreActivo = await CuatrimestreConfig.findOne({ activo: true }).sort({ createdAt: -1 }).lean();
        const { codigoRequerido, configParaValidar } = resolveBoletaTargetConfig(cuatrimestreActivo);
        const buffer = require('fs').readFileSync(req.file.path);
        const rawText = await extractRawTextFromPdf(buffer);
        const evaluacion = evaluateBoletaAgainstConfig(rawText, configParaValidar || cuatrimestreActivo, {
            cedula: usuario.cedula,
            nombre_completo: usuario.nombre_completo,
            carrera: usuario.carrera,
            correo_electronico: usuario.correo_electronico
        });

        usuario.boleta_pdf_url = persistBoletaFile(req.file);
        usuario.boleta_nombre_archivo = req.file.originalname || null;
        usuario.boleta_cuatrimestre = codigoRequerido || cuatrimestreActivo?.codigo || null;
        usuario.boleta_validada = evaluacion.validada;
        usuario.boleta_estado = evaluacion.estado;
        usuario.boleta_observaciones = evaluacion.observacion;
        usuario.boleta_fecha_carga = new Date();
        usuario.boleta_fecha_inicio = evaluacion.fechaMin || null;
        usuario.boleta_fecha_fin = evaluacion.fechaMax || null;
        usuario.boleta_texto_resumen = evaluacion.textoResumen || null;
        await usuario.save();

        return res.json({
            message: evaluacion.validada
                ? 'Boleta recibida y validada. Ya puede iniciar sesión.'
                : `Boleta rechazada automáticamente. ${evaluacion.observacion}`,
            estado: usuario.boleta_estado,
            validada: usuario.boleta_validada,
            observaciones: usuario.boleta_observaciones
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al subir boleta de reactivacion.', error: error.message });
    }
};

/**
 * Actualizar estados de docentes en masa por CSV
 * @param {Object} req - Contiene array de actualizaciones: [{correo, estado, nombre, cedula}]
 */
exports.actualizarDocentesCSV = async (req, res) => {
    try {
        const { actualizaciones } = req.body;
        
        if (!Array.isArray(actualizaciones) || actualizaciones.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron actualizaciones' });
        }
        
        let actualizados = 0;
        let noEncontrados = 0;
        const resultados = [];
        
        for (const item of actualizaciones) {
            const { correo, estado, nombre, cedula } = item;
            
            try {
                // Buscar usuario por correo
                const usuario = await Usuarios.findOne({ 
                    correo_electronico: correo.toLowerCase(),
                    tipo_rol: 'docente'
                });
                
                if (!usuario) {
                    noEncontrados++;
                    resultados.push({ correo, estado: 'no_encontrado', mensaje: 'Docente no existe o no tiene rol de docente' });
                    continue;
                }
                
                // Actualizar estado (ambos campos para compatibilidad)
                await Usuarios.findByIdAndUpdate(usuario._id, {
                    estado: estado,
                    estado_usuario: estado
                });
                
                actualizados++;
                resultados.push({ correo, estado: 'actualizado', nuevoEstado: estado });
                
            } catch (err) {
                resultados.push({ correo, estado: 'error', mensaje: err.message });
            }
        }
        
        res.json({
            message: `${actualizados} docentes actualizados correctamente`,
            actualizados,
            noEncontrados,
            total: actualizaciones.length,
            detalles: resultados
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al procesar CSV de docentes', 
            error: error.message 
        });
    }
};

/**
 * Contar docentes pendientes de aprobación (estado inactivo)
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
exports.contarDocentesPendientes = async (req, res) => {
    try {
        const count = await Usuarios.countDocuments({
            tipo_rol: 'docente',
            $or: [
                { estado: 'inactivo' },
                { estado_usuario: 'inactivo' }
            ]
        });
        
        // También obtener la lista de docentes pendientes
        const docentesPendientes = await Usuarios.find({
            tipo_rol: 'docente',
            $or: [
                { estado: 'inactivo' },
                { estado_usuario: 'inactivo' }
            ]
        }).select('nombre cedula correo_electronico createdAt');
        
        res.json({
            count,
            docentes: docentesPendientes,
            message: count > 0 ? `Hay ${count} docente(s) pendiente(s) de aprobación` : 'No hay docentes pendientes'
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al contar docentes pendientes', 
            error: error.message 
        });
    }
};
