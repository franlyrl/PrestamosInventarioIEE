const mongoose = require('mongoose');
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

    /** * @property {String} comentario_admin 
     * Notas internas exclusivas del administrador.
     */
    comentario_admin: { type: String, trim: true },

    /** * @property {Date} fecha_entrega 
     * Fecha asignada para la entrega/recogida de artículos.
     */
    fecha_entrega: { type: Date },

    /** * @property {Date} fecha_devolucion 
     * Fecha asignada para la devolución de artículos.
     */
    fecha_devolucion: { type: Date },

    /** * @property {Date} fecha_limite_devolucion 
     * Fecha límite para devolver los artículos.
     */
    fecha_limite_devolucion: { type: Date },

    /** * @property {String} horario_recogida 
     * Horario asignado para la recogida de artículos.
     */
    horario_recogida: { type: String, trim: true },

    /** * @property {Date} fecha_recogida 
     * Fecha asignada para la recogida (similar a fecha_entrega).
     */
    fecha_recogida: { type: Date },

    /** * @property {String} dias_disponibles 
     * Días y horarios disponibles para recoger los artículos.
     */
    dias_disponibles: { type: String, trim: true }

}, {
    /** Genera automáticamente campos de auditoría: createdAt y updatedAt. */
    timestamps: true
});

/** * Modelo 'Solicitudes' para el control de flujo de préstamos.
 */

const solicitudes = mongoose.models.Solicitudes || mongoose.model('Solicitudes', solicitudesSchema);
module.exports = solicitudes;