const { body, validationResult } = require('express-validator');

/**
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 * Middleware de validación para las rutas de autenticación (login y registro).
 * Utiliza express-validator para definir reglas de validación y manejar errores.
 * Se debe usar en las rutas de autenticación, por
 */
// Reglas de validación para el Login o Registro
exports.validarUsuario = [
    // 1. Reglas
    body('correo')
        .isEmail().withMessage('Debe ser un correo electrónico válido')
        .normalizeEmail(), // Limpia espacios y convierte a minúsculas
    body('password')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),

    // 2. Función que revisa si hubo errores
    (req, res, next) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ 
                message: 'Error de validación',
                errors: errores.array() 
            });
        }
        next();
    }
];