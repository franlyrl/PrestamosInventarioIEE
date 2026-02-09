const mongoose = require('mongoose');

const insumoSchema = new mongoose.Schema({
    id_insumo: {
        type: Number,
        unique: true,
        index: true,
        required: [true, 'El ID es obligatorio'], // Agregué mensaje aquí también
        min: [1, 'El ID del insumo debe ser un número positivo']    
    },
    NombProducto: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true
    },
    cantidad: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [0, 'La cantidad no puede ser menor a 0'] // Cambié a 0 por si se agotan
    },
    caracteristicas: {
        type: String,
        required: [true, 'Las características son obligatorias'],
        trim: true
    },
    categoria: {
        type: String,
        required: [true, 'La categoría del insumo es obligatoria'],
        enum: [
            'Componentes Pasivos', 
            'Optoelectrónica', 
            'Actuadores', 
            'Sensores', 
            'Conectividad', 
            'Prototipado',
            'Otros'
        ],
        trim: true
    }
}, { 
    timestamps: true // Esto creará createdAt y updatedAt automáticamente
});

const Insumo = mongoose.model('Insumo', insumoSchema);
module.exports = Insumo; // ¡No olvides exportarlo para usarlo en tus rutas!