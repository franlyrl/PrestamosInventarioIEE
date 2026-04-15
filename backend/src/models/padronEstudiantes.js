const mongoose = require('mongoose');

/**
 * PadronEstudiantes — Registro oficial de estudiantes matriculados
 * 
 * Se actualiza cada cuatrimestre mediante importación de Excel.
 * Solo los estudiantes registrados aquí con estado 'activo' pueden
 * registrarse en el sistema y hacer login.
 */
const padronEstudiantesSchema = new mongoose.Schema({
    cedula: {
        type: String,
        required: [true, 'La cédula es obligatoria'],
        trim: true,
        index: true
    },
    nombre_completo: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true
    },
    correo_estudiantil: {
        type: String,
        required: [true, 'El correo estudiantil es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true
    },
    estado: {
        type: String,
        enum: ['activo', 'inactivo'],
        default: 'activo'
    },
    carrera: {
        type: String,
        enum: [
            'Ingeniería Electrónica',
            'Ingeniería Eléctrica',
            'Ingeniería en Tecnologías de Información',
            'Ingeniería en Producción Industrial',
            'N/A'
        ],
        default: 'N/A'
    },
    // Metadatos del cuatrimestre en que fue cargado
    cuatrimestre_carga: {
        type: String,
        trim: true
    },
    fecha_importacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PadronEstudiantes', padronEstudiantesSchema);
