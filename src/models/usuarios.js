const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // ¡No olvides instalarlo con npm install bcryptjs!
const { text } = require('express');

const usuarioSchema = new mongoose.Schema({
    id_usuario: {
        type: Number,
        unique: true,
        index: true,
        required: true
    },
    cedula: {
        type: String,
        required: [true, 'La cédula es obligatoria'],
        unique: true,
        trim: true,
        match: [
           /^\d{9,12}$/, 
            'La cédula debe tener entre 9 y 12 dígitos numéricos'
        ]
    },
    nombre_completo: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },
    correo_electronico: {
        type: String,
        required: [true, 'El correo electrónico es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[\w-\.]+@(est\.utn\.ac\.cr|utn\.ac\.cr)$/, 
            'Solo se permiten correos de la UTN (@est.utn.ac.cr o @utn.ac.cr)'
        ]
    },
    hash_contraseña: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres']   
    },
    telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true,
    match: [/^\+506\s\d{8}$/, 'El formato debe ser +506 seguido de 8 dígitos']
},
    //roles tipo enum   enum: ['activo', 'inactivo', 'sancionado'],
    tipo_rol: {
        type: String,
        required: true, // Te recomiendo agregar esto para que no sea opcional
        enum: ['estudiante', 'docente', 'administrativo', 'admin'],
        lowercase: true, // Opcional: convierte todo a minúsculas automáticamente
        trim: true      // Opcional: quita espacios en blanco accidentales
    },
    estado: {
        type: String,
        enum: ['activo', 'inactivo', 'sancionado'],
        default: 'activo'
    },
    //efectos de auditoria
    fecha_creacion: {
        type: Date,
        default: Date.now
    },
    ultimo_acceso: {
        type: Date
    }       
}, { 
    timestamps: true 
});

// --- MIDDLEWARE PARA ENCRIPTAR ---
// Usamos usuarioSchema (el nombre que definiste arriba)
usuarioSchema.pre('save', async function(next) {
    // Si la contraseña no ha sido modificada, pasamos al siguiente middleware
    if (!this.isModified('hash_contraseña')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        // Usamos hash_contraseña para que coincida con tu campo del esquema
        this.hash_contraseña = await bcrypt.hash(this.hash_contraseña, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Usuarios', usuarioSchema);