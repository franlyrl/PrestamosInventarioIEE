const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    id_usuario: { type: Number},
    cedula: {type: String,required: [true, 'La cédula es obligatoria'],unique: true,trim: true,match: [/^\d{9,12}$/, 'La cédula debe tener entre 9 y 12 dígitos numéricos']},
    nombre_completo: {type: String,required: [true, 'El nombre completo es obligatorio'],trim: true},
    correo_electronico: {type: String,required: [true, 'El correo electrónico es obligatorio'],unique: true,trim: true,lowercase: true, match: [/^[\w-\.]+@(est\.utn\.ac\.cr|utn\.ac\.cr)$/, 'Solo se permiten correos de la UTN']},
    contrasena: {type: String},
    hash_contraseña: {type: String,required: [true, 'La contraseña es obligatoria'],minlength: [8, 'La contraseña debe tener al menos 8 caracteres']   },
    codigo_barras: { type: String, required: true, unique: true }, // <--- El ID del carné
    tipo_rol: {type: String,required: true, enum: ['estudiante', 'docente', 'administrativo', 'admin'],default: 'usuario',lowercase: true, trim: true      },
    estado_usuario: { type: String, enum: ['activo', 'inactivo'], default: 'inactivo' },
    
    // --- Datos de Estudiante (Opcionales para otros roles) ---
    codigo_estudiante: String,grado: String,materia: String,tipo_grupo: String,creditos: Number,costo_matricula: Number,cuatrimestre: String,año_matricula: Number,
    
    estado_matricula: { type: String, default: 'Matriculado A' },
    carrera: { type: String, enum: ['Ingeniería Electrónica','Ingeniería Eléctrica','Ingeniería en Tecnologías de Información','Ingeniería en Producción Industrial','N/A' ],default: 'N/A'},
    estado: {type: String,enum: ['activo', 'inactivo', 'sancionado', 'pendiente_devolucion'],default: 'inactivo'},
    
    ultimo_acceso: Date,inactivo_desde: Date   
}, {
    timestamps: true 
});

/** 
// Middleware pre-save para encriptación
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('hash_contraseña')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.hash_contraseña = await bcrypt.hash(this.hash_contraseña, salt);
        next();
    } catch (error) {
        next(error);
    }
});***/
usuarioSchema.methods.compararContraseña = async function(contraseñaIngresada) {
    return await bcrypt.compare(contraseñaIngresada, this.hash_contraseña);
};

module.exports = mongoose.model('Usuario', usuarioSchema);