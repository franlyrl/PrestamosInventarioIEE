const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    activos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activo'
    }],

    insumos: [{
        id_insumo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Insumo',
            required: true
        },
        cantidad: { type: Number, required: true },
        caracteristicas: String,
        descripcion: String
    }],

    historico_estados: [{
        estado: {
            type: String,
            enum: ['pendiente', 'aprobada', 'rechazada', 'entregado', 'penalizado', 'devuelto'],
            default: 'pendiente'
        },
        fecha: { 
            type: Date, 
            default: Date.now 
        },
        observaciones: { 
            type: String, 
            validate: {
                validator: function(v) {
                    // Validación de seguridad: obligatorios en casos críticos
                    if (['penalizado', 'devuelto', 'rechazada'].includes(this.estado)) {
                        return v && v.trim().length > 0; 
                    }
                    return true;
                },
                message: 'Las observaciones son obligatorias para penalizaciones, devoluciones o rechazos.'
            },
            default: 'Sin observaciones'
        }
    }],
    fecha_prestamo: { type: Date, default: Date.now },
    fecha_entrega_esperada: { type: Date }, 
    fecha_devolucion_real: { type: Date }, 
    comentario_admin: { type: String, trim: true }
    
}, { 
    timestamps: true // Esto te crea automáticamente 'createdAt' y 'updatedAt'
});

module.exports = mongoose.model('Solicitudes', solicitudSchema);