const mongoose = require('mongoose');
const Counter = require('./counter');
/**
 * Esquema de Mongoose para la gestión de préstamos y solicitudes.
 * Vincula usuarios con activos e insumos, rastreando el historial de estados.
 */
const solicitudesSchema = new mongoose.Schema({
    /** * @property {mongoose.Types.ObjectId} usuario 
     * Referencia al usuario que realiza la solicitud.
     */
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    /** * @property {Array<mongoose.Types.ObjectId>} activos 
     * Lista de activos (equipos) solicitados en préstamo.
     */
    activos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activo'
    }],

    /** * @property {Array<Object>} insumos 
     * Lista de insumos consumibles solicitados.
     */
    insumos: [{
        /** @property {mongoose.Types.ObjectId} id_insumo Referencia al insumo. */
        id_insumo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Insumo',
            required: true
        },
        /** @property {Number} cantidad Cantidad solicitada. */
        cantidad: { type: Number, required: true },
        /** @property {String} caracteristicas Especificaciones para el insumo. */
        caracteristicas: String,
        /** @property {String} descripcion Detalles adicionales. */
        descripcion: String
    }],

    /** * @property {Array<Object>} historico_estados 
     * Registro cronológico de los cambios de estado de la solicitud.
     */
    historico_estados: [{
        /** @property {String} estado Estado actual (pendiente, aprobada, etc.). */
        estado: {
            type: String,
            enum: ['pendiente', 'aprobada', 'rechazada', 'entregado', 'penalizado', 'devuelto', 'cancelada'],
            default: 'pendiente'
        },
        /** @property {Date} fecha Fecha en la que ocurrió el cambio de estado. */
        fecha: {
            type: Date,
            default: Date.now
        },
        /** @property {String} observaciones Notas del cambio; obligatorio en casos críticos. */
        observaciones: {
            type: String,
            validate: {
                validator: function (v) {
                    // Validación de seguridad: obligatorios en casos críticos
                    if (['penalizado', 'devuelto', 'rechazada'].includes(this.estado)) {
                        return v && v.trim().length > 0;
                    }
                    return true;
                },
                message: 'Las observaciones son obligatorias para penalizaciones, devoluciones o rechazos.'
            },
            default: 'Sin observaciones'
        },
        /** @property {String} usuario_cambio Email del usuario que realizó el cambio de estado. */
        usuario_cambio: {
            type: String,
            default: null
        },
        /** @property {String} operario Nombre del usuario que realizó el cambio de estado. */
        operario: {
            type: String,
            default: null
        }
    }],

    /** * @property {String} estado 
     * Estado actual de la solicitud (pendiente, aprobada, etc.).
     */
    estado: {
        type: String,
        enum: ['pendiente', 'aprobada', 'rechazada', 'entregado', 'penalizado', 'devuelto', 'cancelada'],
        default: 'pendiente'
    },

    /** * @property {Date} fecha_prestamo 
     * Fecha en la que se formaliza el préstamo.
     */
    fecha_prestamo: { type: Date, default: Date.now },

    /** * @property {Date} fecha_entrega_esperada 
     * Fecha límite para devolver los activos.
     */
    fecha_entrega_esperada: { type: Date },

    /** * @property {Date} fecha_devolucion_real 
     * Fecha efectiva en la que se retornaron los equipos.
     */
    fecha_devolucion_real: { type: Date },

    /** * @property {String} observaciones 
     * Motivo inicial proporcionado por el estudiante.
     */
    observaciones: { type: String, trim: true },

    /** * @property {String} comentario_admin 
     * Notas internas exclusivas del administrador.
     */
    comentario_admin: { type: String, trim: true },

    /** * @property {Date} fecha_recogida_programada
     * Fecha que el admin programa para que pase a recoger el artículo.
     */
    fecha_recogida_programada: { type: Date },

    /** * @property {String} hora_recogida
     * Hora programada (ej. '14:30') para recoger el artículo.
     */
    hora_recogida: { type: String, trim: true },

    /** * @property {Number} folio
     * Número secuencial de la solicitud (#001, #002, etc.).
     */
    folio: { type: Number, unique: true }

}, {
    /** Genera automáticamente campos de auditoría: createdAt y updatedAt. */
    timestamps: true
});

/**
 * Hook pre-save para asignar el folio secuencial automáticamente.
 */
solicitudesSchema.pre('save', async function() {
    if (!this.isNew) return;

    try {
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'solicitudes' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.folio = counter.seq;
    } catch (error) {
        throw error;
    }
});

/** * Modelo 'Solicitudes' para el control de flujo de préstamos.
 */

const solicitudes = mongoose.models.Solicitudes || mongoose.model('Solicitudes', solicitudesSchema);
module.exports = solicitudes;