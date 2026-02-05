const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    id_rol: {
        type: Number,
        unique: true,
        index: true,
        required: true
    },
    tipo_rol: {
        type: String,
        required: [true, 'El tipo de rol es obligatorio'],
        trim: true,
        enum: {
            values: ['adm', 'usuario'], // Solo permite estos dos valores
            message: '{VALUE} no es un rol válido (debe ser adm o usuario)'
        },
        default: 'usuario' // Por defecto, todos son usuarios normales
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción del rol es obligatoria'],
        trim: true
    }
}, { 
    // Los timestamps van dentro de este segundo objeto, después de la llave de los campos
    timestamps: true 
});

module.exports = mongoose.model('Roles', roleSchema);