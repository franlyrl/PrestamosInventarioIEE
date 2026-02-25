/**
 * @param {*} err 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
    * @returns
    * Middleware global para manejar errores en la aplicación. Captura cualquier error que ocurra en los controladores o rutas y responde con un mensaje de error consistente.
    * Se debe usar al final de todas las rutas, por ejemplo: app.use(errorHandler);
    * Proceso:
    * 1. Recibe el error, la solicitud, la respuesta y el siguiente middleware.
    * 2. Si el error no tiene un código de estado, se asigna 500 (Error del servidor).
    * 3. Responde con un JSON que incluye el mensaje del error y, si no estamos en producción, el stack trace para facilitar la depuración.  
 *
 */
exports.errorHandler = (err, req, res, next) => {
    // Si el error no trae un código (status), por defecto es 500 (Error del servidor)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        message: err.message,
        // El stack solo se ve en desarrollo para ayudarte a encontrar la línea del error
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};