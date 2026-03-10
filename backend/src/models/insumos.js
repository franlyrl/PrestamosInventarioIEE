const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la colección de Insumos.
 * Se ha añadido el soporte para URLs de imágenes.
 */
const insumoSchema = new mongoose.Schema({
    /** * @property {Number} id_insumo - Identificador único numérico del insumo.
     */
    id_insumo: {
        type: Number,
        unique: true,
        index: true,
        required: [true, 'El ID es obligatorio'],
        min: [1, 'El ID del insumo debe ser un número positivo']
    },

    /** * @property {String} NombProducto - Nombre comercial o técnico del producto.
     */
    NombProducto: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true
    },

    /** * @property {Number} cantidad - Cantidad disponible en inventario.
     */
    cantidad: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [0, 'La cantidad no puede ser menor a 0']
    },

    /** * @property {String} caracteristicas - Descripción detallada y especificaciones.
     */
    caracteristicas: {
        type: String,
        required: [true, 'Las características son obligatorias'],
        trim: true
    },

    /** * @property {String} categoria - Categoría a la que pertenece el insumo.
     */
    categoria: {
        type: String,
        required: [true, 'La categoría del insumo es obligatoria'],
        enum: [
            'Componentes Digitales',
            'Componentes Analógicos',
            'Herramientas Menores',
            'Consumibles de Soldadura',
            'Otros'
        ],
        trim: true
    },

    /** * @property {String} imagenUrl - Enlace a la fotografía o icono del insumo.
     */
    imagenUrl: {
        type: String,
        trim: true,
        default: '' // Permite que sea opcional pero existente en el objeto
    },

    /** * @property {String} estado - Estado del insumo para borrado lógico.
     */
    estado: {
        type: String,
        enum: ['activo', 'eliminado'],
        default: 'activo'
    },

    /** * @property {String} justificacion_baja - Justificación cuando se da de baja.
     */
    justificacion_baja: {
        type: String,
        trim: true
    },

    /** * @property {Date} fecha_baja - Fecha cuando se dio de baja.
     */
    fecha_baja: {
        type: Date
    },

    /** * @property {ObjectId} eliminado_por - Usuario que dio de baja.
     */
    eliminado_por: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    /** @type {Boolean} - Habilita la creación automática de campos createdAt y updatedAt. */
    timestamps: true
});

/**
 * Modelo de Mongoose para realizar operaciones CRUD sobre Insumos.
 */
const Insumo = mongoose.model('Insumo', insumoSchema);

/**
 * Exportación del modelo Insumo para su uso en controladores y rutas.
 */
module.exports = Insumo;