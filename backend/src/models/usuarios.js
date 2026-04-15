const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    id_usuario: { type: Number, unique: true},
    cedula: {type: String,required: [true, 'La cédula es obligatoria'],unique: true,trim: true,match: [/^[\d]{5,12}$/, 'La cédula debe tener entre 5 y 12 dígitos (sin guiones)']},
    nombre_completo: {type: String,required: [true, 'El nombre completo es obligatorio'],trim: true},
    correo_electronico: {type: String,required: [true, 'El correo electrónico es obligatorio'],unique: true,trim: true,lowercase: true, match: [/^[\w-\.]+@(est\.utn\.ac\.cr|utn\.ac\.cr)$/, 'Solo se permiten correos de la UTN']},
    hash_contraseña: {type: String,required: [true, 'La contraseña es obligatoria'],minlength: [8, 'La contraseña debe tener al menos 8 caracteres']   },
    tipo_rol: {type: String,required: true, enum: ['estudiante', 'docente', 'administrativo', 'operador', 'admin'],default: 'estudiante',lowercase: true, trim: true      },
    permisos: { type: [String], default: [] },
    estado_usuario: { type: String, enum: ['activo', 'inactivo'], default: 'inactivo' },
    
    // --- Datos de Estudiante (Opcionales para otros roles) ---
    codigo_estudiante: String,grado: String,materia: String,tipo_grupo: String,creditos: Number,costo_matricula: Number,cuatrimestre: String,año_matricula: Number,
    
    estado_matricula: { type: String, default: 'Matriculado A' },
    carrera: {
        type: String,
        enum: [
            'Ingenieria Electronica',
            'Ingenieria Electrica',
            'Ingenieria en Tecnologias de Informacion',
            'Ingenieria en Produccion Industrial',
            'Ingeniería Electrónica',
            'Ingeniería Eléctrica',
            'Ingeniería en Tecnologías de Información',
            'Ingeniería en Producción Industrial',
            'N/A'
        ],
        default: 'N/A'
    },
    estado: {type: String,enum: ['activo', 'inactivo', 'sancionado', 'pendiente_devolucion'],default: 'inactivo'},

    // Verificacion por boleta PDF
    boleta_pdf_url: { type: String, default: null },
    boleta_nombre_archivo: { type: String, default: null },
    boleta_cuatrimestre: { type: String, default: null },
    boleta_validada: { type: Boolean, default: false },
    boleta_estado: {
        type: String,
        enum: ['pendiente_boleta', 'pendiente_revision', 'validada', 'rechazada'],
        default: 'pendiente_boleta'
    },
    boleta_observaciones: { type: String, default: '' },
    boleta_fecha_carga: { type: Date, default: null },
    boleta_fecha_inicio: { type: Date, default: null },
    boleta_fecha_fin: { type: Date, default: null },
    boleta_texto_resumen: { type: String, default: null },
    
    ultimo_acceso: Date, inactivo_desde: Date,
    // --- Sanción / Penalización ---
    sancion_motivo: { type: String, trim: true },
    sancion_fecha_inicio: { type: Date },
    sancion_fecha_fin: { type: Date },   // null = permanente hasta desbloqueo manual
    sancion_activa: { type: Boolean, default: false }
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
