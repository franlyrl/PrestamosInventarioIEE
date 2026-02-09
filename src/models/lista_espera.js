const mongoose = require('mongoose');

const listaEsperaSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuarios',
        required: [true, 'El ID del usuario es obligatorio']
    },
    insumo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Insumos',
        required: [true, 'El ID del insumo es obligatorio']
    },
    cantidad_solicitada: { 
        type: Number, 
        default: 1 
    },
    estado: {
        type: String,
        enum: ['esperando', 'notificado', 'entregado', 'cancelado'],
        default: 'esperando'
    },
    prioridad: { // Por si algún profe tiene prioridad sobre alumnos jaja
        type: Number,
        default: 0
    }
}, {
    timestamps: true 
});

// Índice para que un usuario no se anote dos veces seguidas por el mismo insumo
listaEsperaSchema.index({ usuario: 1, insumo: 1, estado: 1 }, { unique: true });

module.exports = mongoose.model('ListaEspera', listaEsperaSchema);