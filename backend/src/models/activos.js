const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la gestion de activos del inventario.
 */
const activoSchema = new mongoose.Schema({
    numActivo: {
        type: String,
        unique: true,
        index: true,
        required: [true, 'El numero de activo/placa es obligatorio'],
        trim: true
    },
    numSerie: {
        type: String,
        required: [true, 'El numero de serie es obligatorio'],
        unique: true,
        trim: true
    },
    estadoActivo: {
        type: String,
        required: [true, 'El estado del activo es obligatorio'],
        enum: ['disponible', 'prestado', 'en espera', 'fuera de stock', 'eliminado', 'fuera de servicio'],
        default: 'disponible',
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
        required: [true, 'La categoria es obligatoria'],
        enum: ['Instrumentos', 'Herramientas'],
        trim: true
    },
    imagenUrl: {
        type: String,
        default: 'https://via.placeholder.com/150?text=Sin+Imagen',
        trim: true
    },
    observaciones: {
        type: String,
        trim: true,
        default: 'Sin observaciones particulares'
    },
    caracteristicas: {
        type: String,
        required: [true, 'Las caracteristicas son obligatorias'],
        trim: true
    },
    observacion_estado: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

activoSchema.index({ marca: 'text', modelo: 'text', caracteristicas: 'text' });

const Activo = mongoose.model('Activo', activoSchema);
module.exports = Activo;
