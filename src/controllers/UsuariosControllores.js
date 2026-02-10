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
 * @desc Elimina un usuario por ID.
 */
exports.deleteUsuario = async (req, res) => {
    try {
        const usuarioEliminado = await Usuarios.findByIdAndDelete(req.params.id);
        if (!usuarioEliminado) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(400).json({ message: 'Error al eliminar el usuario', error });
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