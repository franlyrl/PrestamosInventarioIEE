/** 
@author: Ashly
@param {*} req 
@param {*} res 
@param {*} next 
@returns
@description: Middleware para controlar el acceso a rutas según el rol del usuario.
@ usage: Se utiliza en las rutas para protegerlas y restringir el acceso a ciertos roles.
@example: router.post('/admin-only', protect, restrictTo('admin'), adminController);

* Middleware para restringir el acceso a ciertas rutas según el rol del usuario.
* Se debe usar después del middleware de autenticación (protect) para asegurar que req.user esté disponible.
*/

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // 1. Verificamos si el usuario existe (debería venir del authMiddleware previo)
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }

        // 2. Verificamos si el rol del usuario está dentro de los permitidos
        // req.user.tipo_rol es el campo que definimos en tu esquema
        if (!roles.includes(req.user.tipo_rol)) {
            return res.status(403).json({ 
                message: 'Acceso denegado: No tienes los permisos necesarios para realizar esta acción.' 
            });
        }

        // 3. Si todo está bien, dejamos pasar
        next();
    };
};
