const Usuarios = require('../models/usuarios'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcryptjs'); // Para el hash de la contraseña


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
        const { cedula, correo_electronico, hash_contraseña, tipo_rol, telefono } = req.body;

        // 1. EL "ESCUDO" DE DUPLICADOS
        const usuarioExiste = await Usuario.findOne({ $or: [{ cedula }, { correo_electronico }] });
        if (usuarioExiste) {
            return res.status(400).json({ 
                message: 'Error: La cédula o el correo electrónico ya se encuentran en nuestra base de datos.' 
            });
        }

        // 2. CONSULTA REAL DE IDENTIDAD (Criterio Picky)
        // En lugar de confiar en el nombre que mande el usuario, lo traemos de la fuente oficial
        let nombre_completo;
        try {
            nombre_completo = await consultarNombrePorCedula(cedula);
        } catch (error) {
            // Si la API falla, podrías permitir que lo escriban o lanzar error
            return res.status(400).json({ message: 'No se pudo validar la cédula con el Registro Civil.' });
        }

        // 3. SEGURIDAD DE CONTRASEÑA (Lo que hablábamos del Salt)
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(hash_contraseña, salt);

        // 4. VALIDACIÓN DEL COMPROBANTE (PDF)
        // Usamos req.file (asumiendo Multer como middleware en la ruta) //en un futuro podríamos validar 
        // el contenido del PDF para asegurarnos que es un documento válido de la UTN
        if (!req.file) {
            return res.status(400).json({ message: 'Es obligatorio subir un comprobante (PDF) para validar su rol.' });
        }

        // 5. CREACIÓN DEL REGISTRO
        const nuevoUsuario = new Usuario({
            cedula,
            nombre_completo,
            correo_electronico,
            hash_contraseña: passwordEncriptada,
            telefono,
            tipo_rol,
            comprobante_pdf: req.file.path, // Guardamos la ruta del archivo, hay que crear el campo en el modelo
            estado: 'inactivo', // Nace inactivo para que el admin lo revise
            fecha_creacion: Date.now()
        });

        await nuevoUsuario.save();

        res.status(201).json({
            status: 'success',
            message: `Usuario ${nombre_completo} registrado correctamente. Su cuenta está en revisión administrativa.`
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error crítico en el proceso de registro', 
            error: error.message 
        });
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
 * @route DELETE /api/usuarios/:id
 * @desc Elimina un usuario del sistema si cumple las condiciones de baja.
 * @access Privado (Solo Administrador/Admin)
 * 
 * REGLA DE ORO: Solo se pueden eliminar usuarios que estén en estado 'inactivo' o 'penalizado'.
 * Esto garantiza que no se borren usuarios activos por error, y que el historial de préstamos se mantenga intacto.
 * Si un usuario está 'activo', el sistema bloqueará la eliminación y sugerirá primero inactivarlo o penalizarlo.   
 * 
 * Nota: La eliminación física también podría incluir la eliminación del archivo PDF del comprobante, dependiendo de tu estrategia de almacenamiento.
 * 
 * Ejemplo de respuesta exitosa:
 * {
 *   "message": "Usuario Juan Pérez eliminado permanentemente.",
 *   "razon": "Estado previo: inactivo"
 * }
 *  
 * Ejemplo de respuesta por intentar eliminar un usuario activo:
 * {
 *   "message": "No se puede eliminar un usuario activo. Primero debe ser inactivado o penalizado."
 * }
 *  
 * Ejemplo de respuesta por falta de permisos:
 * {
 *   "message": "Acceso denegado. No tiene permisos para eliminar usuarios."
 * }
 *  
 * Ejemplo de respuesta por usuario no encontrado:
 * {
 *   "message": "Usuario no encontrado."
 * }
 *  
 * 
 * Importante: Asegúrate de que el middleware de autenticación esté configurado para agregar el objeto `usuario` al `req`, 
 * con al menos el campo `tipo_rol` para esta verificación.
 */
exports.deleteUsuario = async (req, res) => {
    try {
        // 1. Verificación de Rol (Solo la jerarquía alta)
        if (req.usuario.tipo_rol !== 'admin' && req.usuario.tipo_rol !== 'Administrador') {
            return res.status(403).json({ message: 'Acceso denegado. No tiene permisos para eliminar usuarios.' });
        }

        const usuario = await Usuarios.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

        // 2. REGLA DE ORO: Solo si está Inactivo o Penalizado
        // Si el usuario está 'activo', el sistema bloquea el borrado para evitar errores.
        if (usuario.estado === 'activo') {
            return res.status(400).json({ 
                message: 'No se puede eliminar un usuario activo. Primero debe ser inactivado o penalizado.' 
            });
        }

        // 3. Eliminación física (Aquí podrías también borrar el archivo PDF del storage)
        await Usuarios.findByIdAndDelete(req.params.id);

        res.json({ 
            message: `Usuario ${usuario.nombre} eliminado permanentemente.`,
            razon: `Estado previo: ${usuario.estado}`
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario.', error: error.message });
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
 * 
 * Ejemplo de respuesta por falta de permisos:
 * {
 *  "message": "Acceso denegado. No tiene permisos para cerrar el ciclo."
 * }
 *
 * Ejemplo de respuesta por error en el proceso:
 * {
 *  "message": "Error en el proceso de cierre de ciclo",
 * "error": "Descripción detallada del error"
 * }
 *
 * Nota: Asegúrate de que el middleware de autenticación esté configurado para agregar el objeto `usuario` al `req`,
 * con al menos el campo `tipo_rol` para esta verificación.
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
 * @route DELETE /api/usuarios/limpieza-antiguos
 * @desc Borra permanentemente usuarios que no se han reactivado en mucho tiempo.
 * @access Privado (Solo Administrador)
 */
exports.limpiarUsuariosViejos = async (req, res) => {
    try {
        // Definimos qué es "viejo": por ejemplo, alguien que no se loguea hace 1 año
        const unAnioAtras = new Date();
        unAnioAtras.setFullYear(unAnioAtras.getFullYear() - 1);

        // 1. Buscamos y borramos a los que:
        // - Son estudiantes
        // - Están inactivos
        // - Su última actualización fue hace más de un año
        const resultado = await Usuarios.deleteMany({
            tipo_rol: 'estudiante',
            estado: 'inactivo',
            updatedAt: { $lt: unAnioAtras }
        });

        res.json({ 
            message: 'Limpieza de base de datos completada.',
            usuarios_eliminados: resultado.deletedCount,
            nota: 'Se eliminaron registros sin actividad por más de un año.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en la purga de datos.', error: error.message });
    }
};