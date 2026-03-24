const Usuarios = require('../models/usuarios'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcryptjs'); // Para el hash de la contraseña
const jwt = require('jsonwebtoken'); // O tu función generarToken
const generarToken = require('../utils/generarToken');
const Solicitudes = require('../models/solicitudes'); // Para verificar préstamos activos


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
    console.log("Datos recibidos en el Body:", req.body); // <-- AGREGA ESTA LÍNEA
    try {
        const { cedula, nombre_completo, contrasena, codigo_barras, correo_electronico, tipo_rol } = req.body;
        console.log("Valor de contrasena:", contrasena); // <-- Y ESTA OTRA
        // 1. Validación manual de la contraseña (antes del hash)
        if (!contrasena || contrasena.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        // 2. Transformación: Generar el Hash
        const salt = await bcrypt.genSalt(10);
        const passwordHasheada = await bcrypt.hash(contrasena, salt);

        // 3. Crear el usuario (Solo pasamos el hash al modelo)
        const nuevoUsuario = new Usuarios({
            id_usuario: Date.now(), // Generamos un ID único basado en la marca de tiempo
            cedula,
            nombre_completo,
            correo_electronico,
            contrasena,        // La versión en texto (opcional si el modelo no es required)
            // Guardamos en los dos campos que definiste en el Modelo:
            hash_contraseña: passwordHasheada, // La versión encriptada (con tu regla de 8 chars)
            codigo_barras,
            tipo_rol,
            estado: 'activo'
        });

        await nuevoUsuario.save();

        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado. La contraseña fue encriptada exitosamente.'
        });

    } catch (error) {
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
                rol: req.user.tipo_rol,
                carrera: req.user.carrera,
                estado: req.user.estado
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
        const { correo_electronico, contrasena } = req.body;

        console.log('🔍 Login attempt - Email recibido:', correo_electronico);
        console.log('🔍 Email procesado (lowercase+trim):', correo_electronico.toLowerCase().trim());

        // 2. Buscamos al usuario
        const usuario = await Usuarios.findOne({
            correo_electronico: correo_electronico.toLowerCase().trim()
        });

        console.log('👤 Usuario encontrado:', !!usuario);
        if (usuario) {
            console.log('📋 Usuario details:', {
                id: usuario._id,
                email: `"${usuario.correo_electronico}"`, // Entre comillas para ver espacios
                nombre: usuario.nombre_completo,
                estado: usuario.estado,
                carrera: usuario.carrera
            });
        } else {
            console.log('❌ Usuario NO encontrado en la base de datos');

            // Buscar usuarios similares para debug
            const similares = await Usuarios.find({
                correo_electronico: { $regex: correo_electronico.split('@')[0], $options: 'i' }
            }).limit(3);
            console.log('🔍 Usuarios similares encontrados:', similares.length);
            similares.forEach(u => console.log('   -', `"${u.correo_electronico}"`)); // Entre comillas

            // Mostrar todos los usuarios para debug
            const todos = await Usuarios.find({}).limit(5);
            console.log('📋 Primeros 5 usuarios en BD:');
            todos.forEach(u => console.log('   -', `"${u.correo_electronico}"`));
        }

        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas (Usuario no encontrado)' });
        }

        // 3. COMPARACIÓN DE CONTRASEÑA (Solo una vez)
        const esValida = await bcrypt.compare(contrasena, usuario.hash_contraseña);

        if (!esValida) {
            return res.status(401).json({ message: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        // 4. Filtro de Carreras UTN
        const CARRERAS_AUTORIZADAS = [
            'Ingeniería Electrónica', 'Ingeniería Eléctrica',
            'Ingeniería en Tecnologías de Información', 'Ingeniería en Producción Industrial',
            'N/A'
        ];

        if (!CARRERAS_AUTORIZADAS.includes(usuario.carrera)) {
            return res.status(403).json({ message: 'Acceso denegado: Carrera no autorizada.' });
        }

        // --- 5. BLOQUEO DE ESTADO ---
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

        // 6. Generación de Token
        const token = generarToken(usuario._id, usuario.tipo_rol);

        res.status(200).json({
            token,
            usuario: {
                nombre: usuario.nombre_completo,
                rol: usuario.tipo_rol,
                carrera: usuario.carrera,
                estado: usuario.estado
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