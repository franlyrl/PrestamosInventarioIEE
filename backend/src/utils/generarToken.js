const jwt = require('jsonwebtoken');

const generarToken = (id) => {
    // Usa la clave secreta de tu .env
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // El token dura 30 días
    });
};

module.exports = generarToken;