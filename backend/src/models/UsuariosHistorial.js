const mongoose = require('mongoose');


/**
 * @model UsuarioHistorial
 * @description Mirror collection for archiving inactive students. 
 * This keeps the main 'Usuarios' collection lean and fast.
 */
const usuarioHistorialSchema = new mongoose.Schema({
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
        match: [/^\d{9,12}$/, 'La cédula debe tener entre 9 y 12 dígitos numéricos']
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
        required: [true, 'La contraseña es obligatoria']
    },
    tipo_rol: {
        type: String,
        required: true,
        enum: ['estudiante', 'docente', 'administrativo', 'admin'],
        lowercase: true,
        trim: true
    },
    comprobante_pdf: {
        type: String,
        required: [true, 'El comprobante PDF es obligatorio']
    },
    estado: {
        type: String,
        enum: ['activo', 'inactivo', 'sancionado', 'archivado'],
        default: 'archivado'
    },
    fecha_creacion: {
        type: Date,
        default: Date.now
    },
    ultimo_acceso: {
        type: Date
    },
    carrera: {
        type: String,
        required: true,
        enum: [
            'Ingeniería Electrónica',
            'Ingeniería Eléctrica',
            'Ingeniería en Tecnologías de Información',
            'Ingeniería en Producción Industrial'
        ]
    },
    inactivo_desde: {
        type: Date
    },
    /**
     * Sello de tiempo específico para el proceso de archivado.
     */
    fecha_archivado: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'usuarios_historial'
});

module.exports = mongoose.model('UsuariosHistorial', usuarioHistorialSchema);