    const mongoose = require('mongoose');

    const activoSchema = new mongoose.Schema({
        numActivo: {
            type: Number,
            unique: true,
            index: true,
            required: [true, 'El número de activo es obligatorio'], // Agregué mensaje aquí también
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
        enum: [
            'Sistemas de Control', 
            'Instrumental', 
            'Comunicaciones', 
            'Sensores', 
            'Herramientas', 
            'Robótica', 
            'IoT',
            'Otro'
        ],
        trim: true
    },
        observaciones: {
            type: String,
            // Quitamos required para que sea opcional de verdad
            trim: true,
            default: 'Sin observaciones particulares' 
        },
        caracteristicas: {
            type: String,
            required: [true, 'Las características son obligatorias, datos a especificar del equipo'],
            trim: true
        }
    }, { 
        timestamps: true // Esto creará createdAt y updatedAt automáticamente
    });

    const Activo = mongoose.model('Activo', activoSchema);
    module.exports = Activo; // ¡No olvides exportarlo para usarlo en tus rutas!