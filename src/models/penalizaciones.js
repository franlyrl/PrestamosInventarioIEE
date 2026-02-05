const mongoose = require('mongoose');

const penalizacionSchema = new mongoose.Schema({
    id_penalizacion: {
        type: Number,
        unique: true,
        index: true,
        required: true
    },
    id_usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuarios',
        required: [true, 'El ID del usuario es obligatorio']
    },
    id_solicitud: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Solicitudes',
        required: [true, 'La penalización debe estar ligada a una solicitud de préstamo']
    },
    tipo_sancion: {
        type: String,
        enum: ['leve', 'moderada', 'grave'],
        required: [true, 'El nivel de la penalización es obligatorio']
    },
    estado_actual: {
        type: String,
        enum: ['activa', 'cumplida', 'cancelada'],
        default: 'activa'
    },
    fecha_limite: { 
        type: Date,
        required: [true, 'Debes definir hasta cuándo dura la sanción']
    },
    comentario_admin: {
        type: String,
        trim: true,
        required: [true, 'Debes explicar el motivo de la sanción']
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Penalizaciones', penalizacionSchema);