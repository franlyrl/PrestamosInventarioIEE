const mongoose = require('mongoose');

const listaEsperaSchema = new mongoose.Schema({
    id_espera: {
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
    id_insumo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Insumos',
        required: [true, 'El ID del insumo es obligatorio']
    },
    fecha_solicitud: { 
        type: Date, 
        default: Date.now 
    }
    }, {
        timestamps: true 
    });

module.exports = mongoose.model('ListaEspera', listaEsperaSchema);