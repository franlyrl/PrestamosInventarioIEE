const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para gestionar la cola de usuarios esperando stock de insumos.
 */
const listaEsperaSchema = new mongoose.Schema({
    /** * @property {mongoose.Types.ObjectId} usuario 
     * Referencia al usuario que está en espera.
     */
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuarios',
        required: [true, 'El ID del usuario es obligatorio']
    },
    /** * @property {mongoose.Types.ObjectId} insumo 
     * Referencia al insumo específico que se está solicitando.
     */
    insumo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Insumos',
        required: [true, 'El ID del insumo es obligatorio']
    },
    /** * @property {Number} cantidad_solicitada 
     * Cantidad de unidades que el usuario necesita (por defecto 1).
     */
    cantidad_solicitada: { 
        type: Number, 
        default: 1 
    },
    /** * @property {String} estado 
     * Estado del turno en la lista (esperando, notificado, entregado, cancelado).
     */
    estado: {
        type: String,
        enum: ['esperando', 'notificado', 'entregado', 'cancelado'],
        default: 'esperando'
    },
    /** * @property {Number} prioridad 
     * Nivel de importancia en la cola. Valores más altos se atienden primero.
     */
    prioridad: { // Por si algún profe tiene prioridad sobre alumnos jaja
        type: Number,
        default: 0
    }
}, {
    /** Genera automáticamente createdAt (fecha de entrada a la lista) y updatedAt. */
    timestamps: true 
});

/** * Índice compuesto único: Evita que un usuario tenga múltiples registros 
 * activos en 'esperando' para el mismo insumo.
 */
listaEsperaSchema.index({ usuario: 1, insumo: 1, estado: 1 }, { unique: true });

/** * Modelo 'ListaEspera' para gestionar la fila virtual de inventario.
 */
module.exports = mongoose.model('ListaEspera', listaEsperaSchema);