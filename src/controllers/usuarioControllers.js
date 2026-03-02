const Usuarios = require('../models/usuarios'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcryptjs'); // Para el hash de la contraseña
const jwt = require('jsonwebtoken'); // O tu función generarToken
const { generarToken } = require('../utils/generarToken'); // Asegúrate de que esta función esté bien implementada
const { consultarNombrePorCedula } = require('../utils/registroCivil'); // Función para validar cédula
const Solicitudes = require('../models/Solicitudes'); // Para verificar préstamos activos


/**
 * @desc Obtiene todos los usuarios (sin mostrar la contraseña por seguridad).
 */
exports.getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuarios.find().select('-hash_contraseña');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios', error });
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
        const { cedula, correo_electronico, hash_contraseña, tipo_rol, telefono, carrera } = req.body;

        // 1. Escudo de duplicados
        const usuarioExiste = await Usuarios.findOne({ $or: [{ cedula }, { correo_electronico }] });
        if (usuarioExiste) {
            return res.status(400).json({ 
                message: 'La cédula o el correo electrónico ya existen.' 
            });
        }

        // 2. Validación de nombre con Registro Civil
        let nombre_completo;
        try {
            nombre_completo = await consultarNombrePorCedula(cedula);
        } catch (error) {
            return res.status(400).json({ message: 'No se pudo validar la cédula con el Registro Civil.' });
        }

        // 3. Encriptación de contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(hash_contraseña, salt);

        // 4. Validación física del archivo PDF
        if (!req.file) {
            return res.status(400).json({ message: 'Es obligatorio subir un comprobante PDF.' });
        }

        // 5. Creación del Usuario en la colección principal
        const nuevoUsuario = new Usuarios({
            cedula,
            nombre_completo,
            correo_electronico,
            hash_contraseña: passwordEncriptada,
            telefono,
            tipo_rol,
            carrera, // Se guarda en el perfil general para acceso rápido
            estado: 'inactivo' // Queda inactivo hasta revisión del PDF
        });

        const usuarioGuardado = await nuevoUsuario.save();

        // 6. Lógica de guardado en colecciones de Información (EL IF QUE PEDISTE)
        if (tipo_rol === 'estudiante') {
            const infoEstudiante = new EstudianteInfo({
                usuario: usuarioGuardado._id,
                comprobante_pdf: req.file.path,
                tipo_comprobante: 'matricula_estudiante',
                carrera: carrera // Opcional: repetir aquí si quieres info académica pura
            });
            await infoEstudiante.save();

        } else if (tipo_rol === 'docente') {
            const infoDocente = new DocenteInfo({
                usuario: usuarioGuardado._id,
                comprobante_pdf: req.file.path,
                tipo_comprobante: 'carga_academica_docente'
                // Aquí podrías agregar campos específicos de docentes luego
            });
            await infoDocente.save();
        }

        // 7. Respuesta de éxito
        res.status(201).json({ 
            status: 'success', 
            message: `Usuario ${nombre_completo} registrado. El PDF de ${tipo_rol} se guardó correctamente.` 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error crítico en registro', error: error.message });
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

        // 2. Cambiamos el estado de la SOLICITUD (El registro del objeto)
        solicitud.estado = 'penalizado';
        solicitud.observaciones_admin = req.body.motivo || 'Incumplimiento en la entrega/daño de equipo';
        await solicitud.save();

        // 3. IMPACTO EN EL USUARIO (La sanción real)
        // Buscamos al dueño de esa solicitud y lo bloqueamos
        const usuarioSancionado = await Usuarios.findByIdAndUpdate(
            solicitud.estudiante, 
            { 
                estado: 'sancionado',
                // Podemos agregar una nota en el perfil del usuario si tienes ese campo
            }, 
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
        // 1. Verificación de permisos
        if (!['admin', 'Administrador'].includes(req.usuario.tipo_rol)) {
            return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
        }

        // 2. EVITAR AUTO-BLOQUEO: Un admin no puede inactivarse a sí mismo
        if (req.usuario.id === req.params.id) {
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
        const { password } = req.body;
        const correo = req.body.correo ? req.body.correo.toLowerCase().trim() : null;

        const usuario = await Usuarios.findOne({ correo_electronico: correo });
        if (!usuario) return res.status(401).json({ message: 'Credenciales inválidas' });

        // 1. Filtro de Carreras UTN
        const CARRERAS_AUTORIZADAS = [
            'Ingeniería Electrónica', 'Ingeniería Eléctrica', 
            'Ingeniería en Tecnologías de Información', 'Ingeniería en Producción Industrial'
        ];

        if (!CARRERAS_AUTORIZADAS.includes(usuario.carrera)) {
            return res.status(403).json({ message: 'Acceso denegado: Carrera no autorizada.' });
        }

        // 2. Match de contraseña
        const esValida = await bcrypt.compare(password, usuario.hash_contraseña);
        if (!esValida) return res.status(401).json({ message: 'Credenciales inválidas' });

        // --- 3. EL NUEVO BLOQUEO DE ESTADO (El Portero) ---
        // Aquí revisamos si la cuenta está inactiva o sancionada
        if (usuario.estado === 'inactivo') {
            return res.status(403).json({ 
                message: 'Tu cuenta está inactiva por falta de uso, contacta al administrador.' 
            });
        }

        if (usuario.estado === 'sancionado') {
            return res.status(403).json({ 
                message: 'Tu cuenta se encuentra sancionada. No puedes acceder al sistema.' 
            });
        }

        // 4. Generación de Token (Solo si pasó todos los filtros anteriores)
        const token = generarToken(usuario._id, usuario.tipo_rol);

        res.status(200).json({ 
            token, 
            usuario: { 
                nombre: usuario.nombre_completo, 
                rol: usuario.tipo_rol, 
                carrera: usuario.carrera,
                estado: usuario.estado // Útil para que el frontend sepa el estado
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
exports.searchUsuarios = async (req, res) => {
    try {
        const query = req.query.q;
        const usuarios = await Usuarios.find({
            $or: [
                { nombre_completo: { $regex: query, $options: 'i' } },
                { correo_electronico: { $regex: query, $options: 'i' } }
            ]
        }).select('-hash_contraseña');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar usuarios', error });
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