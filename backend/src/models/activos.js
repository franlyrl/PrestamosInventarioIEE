const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la gestión de activos (equipos) del inventario con soporte de imagen.
 */
const activoSchema = new mongoose.Schema({
    numActivo: {
        type: Number,
        unique: true,
        index: true,
        required: [true, 'El número de activo es obligatorio'],
        min: [1, 'El número de activo debe ser un número positivo']
    },
    numSerie: {
        type: String,
        required: [true, 'El número de serie es obligatorio'],
        unique: true,
        trim: true
    },
    estadoActivo: {
        type: String,
        required: [true, 'El estado del activo es obligatorio'],
        enum: ['prestado', 'disponible', 'deteriorado', 'dañado'],
        lowercase: true,
        trim: true
    },
    marca: {
        type: String,
        required: [true, 'La marca es obligatoria'],
        trim: true
    },
    modelo: {
        type: String,
        required: [true, 'El modelo es obligatorio'],
        trim: true
    },
    categoria: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        enum: ['Instrumentos', 'Herramientas'],
        trim: true
    },
    /** * @property {String} imagenUrl
     * URL o ruta de la imagen del activo para identificación visual.
     */
    imagenUrl: {
        type: String,
        default: 'https://via.placeholder.com/150?text=Sin+Imagen', // Imagen por defecto
        trim: true
    },
    observaciones: {
        type: String,
        trim: true,
        default: 'Sin observaciones particulares'
    },
    caracteristicas: {
        type: String,
        required: [true, 'Las características son obligatorias'],
        trim: true
    }
}, {
    timestamps: true
});

activoSchema.index({ marca: 'text', modelo: 'text', caracteristicas: 'text' });

const Activo = mongoose.model('Activo', activoSchema);
module.exports = Activo;