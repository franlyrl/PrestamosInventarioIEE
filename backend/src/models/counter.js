const mongoose = require('mongoose');

/**
 * Modelo para gestionar contadores autoincrementales de forma centralizada.
 * Se utiliza para generar folios secuenciales en solicitudes u otros registros.
 */
const counterSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true,
        description: 'Nombre de la secuencia (ej. "solicitudes")'
    },
    seq: { 
        type: Number, 
        default: 0,
        description: 'Último número asignado'
    }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
module.exports = Counter;
