const mongoose = require('mongoose');

const kardexSchema = new mongoose.Schema({
    // Usamos ObjectId para que se conecte con la colección Usuarios
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuarios',
        required: true,
        unique: true // Un solo historial por usuario
    },
    historial_prestamos: [
        {
            id_solicitud: { // Referencia a la solicitud original
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Solicitudes'
            },
            // IMPORTANTE: ¿Qué pidió? (Insumo o Activo)
            items: [{
                item_id: mongoose.Schema.Types.ObjectId,
                nombre: String,
                cantidad: Number
            }],
            fecha_prestamo: {
                type: Date,
                default: Date.now,
                required: true
            },
            fecha_devolucion: {
                type: Date
            },
            estado_prestamo: {
                type: String,
                enum: ['activo', 'devuelto', 'retrasado'],
                default: 'activo'
            }
        }
    ]
}, { timestamps: true });

const Kardex = mongoose.model('Kardex', kardexSchema);
module.exports = Kardex;