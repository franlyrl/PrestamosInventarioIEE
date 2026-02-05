const mongoose = require('mongoose');

const insumoSchema = new mongoose.Schema({
    id_insumo: {
        type: Number,
        unique: true,
        index: true,
        required: true
    },
    nombre_insumo: {
        type: String,
        required: [true, 'El nombre del insumo es obligatorio'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    categoria: { 
        type: String,
        required: [true, 'Especifique tipo de insumo'],
        enum: {
            values: ['Componentes', 'Herramientas', 'Maquinaria', 'Consumibles'],
            message: '{VALUE} no es una categoría válida'
        }
    },  
    estado_insumo: {
        type: String,
        enum: ['disponible', 'agotado', 'en pedido', 'dañado'],
        default: 'disponible' // Es bueno tener un valor inicial
    },
    cantidad: {
        type: Number,
        required: [true, 'La cantidad del insumo es obligatoria'],
        min: [0, 'La cantidad no puede ser negativa']
    },
    cantidad_disponible: {
        type: Number,
        required: [true, 'La cantidad disponible del insumo es obligatoria'],
        min: [0, 'La cantidad disponible no puede ser negativa']
    },
    numero_serie: {
        type: String,
        unique: true,
        sparse: true, // Esto permite que varios insumos NO tengan serie sin dar error
        trim: true
    }               
}, { 
    timestamps: true 
});

// Exportamos como 'Insumos' para que no choque con el de Usuarios
module.exports = mongoose.model('Insumos', insumoSchema);