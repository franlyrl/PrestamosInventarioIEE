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

        // 2. Validación de nombre (Asumiendo que tienes la función externa)
        let nombre_completo;
        try {
            nombre_completo = await consultarNombrePorCedula(cedula);
        } catch (error) {
            return res.status(400).json({ message: 'No se pudo validar la cédula con el Registro Civil.' });
        }

        // 3. Encriptación
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(hash_contraseña, salt);

        // 4. Validación del PDF
        if (!req.file) {
            return res.status(400).json({ message: 'Es obligatorio subir un comprobante PDF.' });
        }

        // 5. Creación
        const nuevoUsuario = new Usuarios({
            cedula,
            nombre_completo,
            correo_electronico,
            hash_contraseña: passwordEncriptada,
            telefono,
            tipo_rol,
            carrera,
            comprobante_pdf: req.file.path,
            estado: 'inactivo' // Esperando aprobación
        });

        await nuevoUsuario.save();
        res.status(201).json({ status: 'success', message: `Usuario ${nombre_completo} registrado.` });

    } catch (error) {
        res.status(500).json({ message: 'Error crítico en registro', error: error.message });
    }
};


/**
 * @desc Actualiza un usuario por ID.
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
 * @route Inactivo /api/usuarios/:id
 * @desc Elimina un usuario del sistema si cumple las condiciones de baja.
 * @access Privado (Solo Administrador/Admin)
 * 
 * REGLA DE ORO: Solo se pueden eliminar usuarios que estén en estado 'inactivo' o 'penalizado'.
 * Esto garantiza que no se borren usuarios activos por error, y que el historial de préstamos se mantenga intacto.
 * Si un usuario está 'activo', el sistema bloqueará la eliminación y sugerirá primero inactivarlo o penalizarlo.   
 * 
 * Nota: La eliminación física también podría incluir la eliminación del archivo PDF del comprobante, dependiendo de tu estrategia de almacenamiento.
 *` 
 * Ejemplo de respuesta por usuario activo:
 * {    
 *  
 *   "message": "No se puede eliminar: El usuario está activo. Primero inactiva o penaliza al usuario."`
 * Importante: Asegúrate de que el middleware de autenticación esté configurado para agregar el objeto `usuario` al `req`, 
 * con al menos el campo `tipo_rol` para esta verificación.
 */
exports.inactivarUsuario = async (req, res) => {
    try {
        if (!['admin', 'Administrador'].includes(req.usuario.tipo_rol)) {
            return res.status(403).json({ message: 'No tienes permisos.' });
        }

        const tienePrestamos = await Solicitudes.findOne({ 
            estudiante: req.params.id, 
            estado: { $in: ['aprobada', 'entregado'] } 
        });

        if (tienePrestamos) {
            return res.status(400).json({ message: 'El usuario tiene equipos sin devolver.' });
        }

        const usuario = await Usuarios.findByIdAndUpdate(
            req.params.id, 
            { 
                estado: 'inactivo',
                inactivo_desde: new Date() // Sello para la limpieza anual
            }, 
            { new: true }
        );

        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

        res.json({ message: `Usuario ${usuario.nombre_completo} inactivado.` });
    } catch (error) {
        res.status(500).json({ message: 'Error al inactivar.', error: error.message });
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

        // Filtro de Carreras UTN
        const CARRERAS_AUTORIZADAS = [
            'Ingeniería Electrónica', 'Ingeniería Eléctrica', 
            'Ingeniería en Tecnologías de Información', 'Ingeniería en Producción Industrial'
        ];

        if (!CARRERAS_AUTORIZADAS.includes(usuario.carrera)) {
            return res.status(403).json({ message: 'Acceso denegado: Carrera no autorizada.' });
        }

        // Match de contraseña (usando el campo correcto: hash_contraseña)
        const esValida = await bcrypt.compare(password, usuario.hash_contraseña);
        if (!esValida) return res.status(401).json({ message: 'Credenciales inválidas' });

        const token = generarToken(usuario._id, usuario.tipo_rol);

        res.status(200).json({ 
            token, 
            usuario: { nombre: usuario.nombre_completo, rol: usuario.tipo_rol, carrera: usuario.carrera }
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
 * 
 * Importante: Este proceso es irreversible desde este endpoint, por lo que se recomienda realizarlo solo después de haber confirmado que el cuatrimestre ha finalizado y que los estudiantes han sido informados sobre este procedimiento.
 * 
 * Ejemplo de respuesta exitosa:
 * {
 *   "message": "Ciclo cerrado exitosamente.",
 *   "usuarios_afectados": 150,
 *   "instrucciones": "Los usuarios deberán usar la opción 'Olvidé mi contraseña' y subir su nuevo PDF para reactivarse."
 * }
 * Ejemplo de respuesta por falta de permisos:
 * {
 *  "message": "Acceso denegado. No tiene permisos para cerrar el ciclo."
 * }
 * Ejemplo de respuesta por error en el proceso:
 * {
 *  "message": "Error en el proceso de cierre de ciclo",
 * "error": "Descripción detallada del error"
 * }
 * Nota: Asegúrate de que el middleware de autenticación esté configurado para agregar el objeto `usuario` al `req`,
 * con al menos el campo `tipo_rol` para esta verificación.
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