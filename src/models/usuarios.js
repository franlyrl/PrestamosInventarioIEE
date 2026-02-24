const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // ¡No olvides instalarlo con npm install bcryptjs!
const { text } = require('express');

/**
 * Esquema de Mongoose para la gestión de usuarios y autenticación.
 */
const usuarioSchema = new mongoose.Schema({
    /** * @property {Number} id_usuario 
     * Identificador único interno para el usuario.
     */
    id_usuario: {
        type: Number,
        unique: true,
        index: true,
        required: true
    },
    /** * @property {String} cedula 
     * Documento de identidad. Debe tener entre 9 y 12 dígitos.
     */
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
    /** * @property {String} nombre_completo 
     * Nombre y apellidos del usuario.
     */
    nombre_completo: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },
    /** * @property {String} correo_electronico 
     * Correo institucional restringido a dominios @est.utn.ac.cr o @utn.ac.cr.
     */
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
    /** * @property {String} hash_contraseña 
     * Contraseña del usuario (se guarda como hash). Mínimo 8 caracteres.
     */
    hash_contraseña: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres']   
    },
    /** * @property {String} telefono 
     * Número telefónico en formato costarricense (+506 ########).
     */
    telefono: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        trim: true,
        match: [/^\+506\s\d{8}$/, 'El formato debe ser +506 seguido de 8 dígitos']
    },
    /** * @property {String} tipo_rol 
     * Rol asignado: estudiante, docente, administrativo o admin.
     */
    tipo_rol: {
        type: String,
        required: true, 
        enum: ['estudiante', 'docente', 'administrativo', 'admin'],
        lowercase: true, 
        trim: true      
    },
     /** * @property {String} estado 
     * Pdf del comprobante de rol (subido por el usuario, revisado por admin). Guardamos la ruta del archivo.
     */
    comprobante_pdf: {
        type: String,
        required: [true, 'El comprobante PDF es obligatorio']
    },

        /** * @property {String} estado 
     * Estado de la cuenta de usuario para control de acceso.
     */
    estado: {
        type: String,
        enum: ['activo', 'inactivo', 'sancionado', 'pendiente_devolucion'],
        default: 'activo'
    },
    /** * @property {Date} fecha_creacion 
     * Fecha de registro inicial en el sistema.
     */
    fecha_creacion: {
        type: Date,
        default: Date.now
    },
    /** * @property {Date} ultimo_acceso 
     * Registro de la última vez que el usuario inició sesión.
     */
    ultimo_acceso: {
        type: Date
    },
    // --- AQUÍ EL CAMBIO CLAVE ---
    carrera: { 
        type: String, 
        required: true,
        // Opcional: Puedes listar todas aquí o dejarlo abierto y filtrar solo en el código
        enum: [
            'Ingeniería Electrónica',
            'Ingeniería Eléctrica',
            'Ingeniería en Tecnologías de Información',
            'Ingeniería en Producción Industrial'
        ]
    },
    inactivo_desde: {
        type: Date
    }   
}, {
    /** Incluye automáticamente campos de auditoría: createdAt y updatedAt. */
    timestamps: true 
});

/**
 * Middleware 'pre-save' para encriptar la contraseña antes de guardarla en la BD.
 * Solo actúa si el campo 'hash_contraseña' ha sido modificado.
 */
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('hash_contraseña')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.hash_contraseña = await bcrypt.hash(this.hash_contraseña, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Método de instancia para comparar una contraseña ingresada con el hash almacenado.
 * @param {String} contraseñaIngresada - La contraseña que el usuario intenta usar para iniciar sesión.
 * @returns {Promise<Boolean>} - Devuelve true si la contraseña es correcta, false si no lo es.
 */

usuarioSchema.methods.compararContraseña = async function(contraseñaIngresada) {
    return await bcrypt.compare(contraseñaIngresada, this.hash_contraseña);
};

// Exportamos el modelo de Mongoose basado en el esquema definido
module.exports = mongoose.model('Usuario', usuarioSchema);

