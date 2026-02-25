const jwt = require('jsonwebtoken');
const Usuarios = require('../models/usuarios');

/**
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 * 
 *  Middleware de autenticación para proteger rutas. Verifica que el usuario tenga un token válido y que su cuenta esté activa.
 * Se debe usar en las rutas que requieren autenticación, por ejemplo: router.get('/perfil', protect, userController.getPerfil);
 * Proceso: 
 * 1. Extrae el token del header Authorization (Bearer token).
 * 2. Verifica el token usando JWT y la clave secreta.
 * 3. Busca el usuario en la base de datos usando el ID del token.
 * 4. Verifica que el usuario no esté inactivo o sancionado.
 * 5. Si todo es correcto, inyecta el usuario en req.user para que los controladores puedan acceder a su información.
 * 6. Si hay algún error (token inválido, usuario no encontrado, cuenta inactiva), responde con el error correspondiente.
 */
exports.protect = async (req, res, next) => {
    try {
        // 1. Obtener el token del header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'No has iniciado sesión. Por favor, autentícate.' });
        }

        // 2. Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Buscar el usuario que pertenece al token
        const usuarioActual = await Usuarios.findById(decoded.id);
        if (!usuarioActual) {
            return res.status(401).json({ message: 'El usuario ya no existe.' });
        }

        // 4. VERIFICACIÓN EXTRA: ¿Está el usuario inactivo o sancionado?
        if (usuarioActual.estado === 'inactivo' || usuarioActual.estado === 'sancionado') {
            return res.status(403).json({ message: `Acceso denegado: Tu cuenta está ${usuarioActual.estado}.` });
        }

        // 5. INYECCIÓN: Guardamos el usuario en el objeto req
        req.user = usuarioActual; 
        
        // 6. ¡Todo listo! Pasamos al siguiente controlador
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};