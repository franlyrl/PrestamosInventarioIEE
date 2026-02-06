const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
    id_solicitud: {
        type: Number,
        unique: true,
        index: true,
        required: true
    },
    id_usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuarios',
        required: [true, 'El ID del usuario es obligatorio']
    }, // Modficar a vector de ObjectId si se permite varios insumos
    id_insumo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Insumos',
        required: [true, 'El ID del insumo es obligatorio']
    },
    fecha_prestamo: { 
        type: Date, 
        default: Date.now 
    },
    estado_admin: {
        type: String,
        // Agregamos 'pendiente' a la lista para que coincida con el default
        enum: ['pendiente', 'aprobada', 'rechazada', 'finalizada'], 
        default: 'pendiente'
    },
    fecha_entrega_esperada: { // Cuando el estudiante dice que lo va a devolver
        type: Date 
    },
    fecha_devolucion_real: { // Cuando realmente lo devolvió (para calcular sanciones)
        type: Date 
    },
    comentario_admin: { 
        type: String,
        trim: true 
        
    },
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Solicitudes', solicitudSchema);