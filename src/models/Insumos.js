const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la colección de Insumos.
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

    /** * @property {String} categoria - Categoría a la que pertenece el insumo (según lista definida).
     */
    categoria: {
        type: String,
        required: [true, 'La categoría del insumo es obligatoria'],
        enum: [
            'Componentes Digitales', 
            'Componentes Analógicos',
        ],
        trim: true
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