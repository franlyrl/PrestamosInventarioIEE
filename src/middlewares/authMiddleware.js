    const jwt = require('jsonwebtoken');
    const usuarios = require('../models/usuarios');
    const usuarioControllers = require('../controllers/usuarioControllers');

    /**
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns Middleware de autenticación para proteger rutas. Verifica que el usuario tenga un token válido y que su cuenta esté activa.
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
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }

            if (!token) return res.status(401).json({ message: 'No enviaste el token.' });

            // --- DEPURACIÓN ---
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("ID decodificado del Token:", decoded.id); 

            const usuarioActual = await usuarios.findById(decoded.id);
            console.log("¿Se encontró usuario en DB?:", usuarioActual ? "SÍ" : "NO");
            // ------------------

            if (!usuarioActual) {
                return res.status(401).json({ message: 'El ID del token no coincide con ningún usuario.' });
            }

            req.user = usuarioActual;
            next();
            console.log("✅ [Middleware] Usuario localizado:", req.user.correo_electronico);
        } catch (error) {
            console.log("Error en Middleware:", error.message);
            res.status(401).json({ message: 'Token inválido', error: error.message });
        }
    };