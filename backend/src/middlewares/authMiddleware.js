const jwt = require('jsonwebtoken');
const usuarios = require('../models/usuarios');

/**
 * Middleware de autenticación para proteger rutas.
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extraer el token del header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No enviaste el token.' });
    }

    // 2. Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("------------------------------------------");
    console.log(" [Middleware] Payload decodificado:", decoded);

    // 3. Buscar el usuario en la base de datos (incluir campos necesarios)
    const usuarioActual = await usuarios.findById(decoded.id)
            .select('nombre_completo correo_electronico tipo_rol estado');

    if (!usuarioActual) {
      console.log(" [Middleware] El ID del token no existe en la DB:", decoded.id);
      return res.status(401).json({ 
        message: 'El usuario asociado a este token ya no existe.' 
      });
    }

    // 4. Inyectar el usuario en la petición
    // IMPORTANTE: Usamos req.user (estándar) para que restrictTo lo encuentre
    req.user = usuarioActual;
    
    console.log("✅ [Middleware] Acceso concedido a:", usuarioActual.correo_electronico);
    console.log("------------------------------------------");
    
    next();
  } catch (error) {
    console.log("❌ [Middleware] Error de validación:", error.message);
    
    let mensaje = 'Token inválido';
    if (error.name === 'TokenExpiredError') mensaje = 'El token ha expirado. Inicia sesión de nuevo.';
    
    res.status(401).json({ 
      message: mensaje, 
      error: error.message 
    });
  }
};

/**
 * Middleware para restringir por roles (VA AFUERA de protect)
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Usamos req.user porque así lo nombramos en 'protect'
        if (!roles.includes(req.user.tipo_rol)) {
            return res.status(403).json({ 
                message: 'No tienes permiso para realizar esta acción' 
            });
        }
        next();
    };
};