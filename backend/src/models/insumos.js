const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la coleccion de Insumos.
 */
const insumoSchema = new mongoose.Schema({
    id_insumo: {
        type: Number,
        unique: true,
        index: true,
        required: [true, 'El ID es obligatorio'],
        min: [1, 'El ID del insumo debe ser un numero positivo']
    },
    codigo: {
        type: String,
        unique: true,
        index: true,
        required: [true, 'El codigo unico es obligatorio'],
        trim: true
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de insumo es obligatorio'],
        enum: ['activo', 'consumible'],
        default: 'consumible',
        lowercase: true,
        trim: true
    },
    NombProducto: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true
    },
    cantidad: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [0, 'La cantidad no puede ser menor a 0']
    },
    caracteristicas: {
        type: String,
        required: [true, 'Las caracteristicas son obligatorias'],
        trim: true
    },
    categoria: {
        type: String,
        required: [true, 'La categoria del insumo es obligatoria'],
        enum: ['Analógico', 'Digital'],
        trim: true
    },
    imagenUrl: {
        type: String,
        trim: true,
        default: ''
    },
    ubicacion: {
        type: String,
        trim: true,
        default: 'Laboratorio de Electronica'
    },
    estado: {
        type: String,
        enum: ['disponible', 'prestado', 'en espera', 'fuera de stock', 'eliminado', 'fuera de servicio'],
        default: 'disponible',
        lowercase: true,
        trim: true
    },
    observacion_estado: {
        type: String,
        trim: true,
        default: ''
    },
    justificacion_baja: {
        type: String,
        trim: true
    },
    fecha_baja: {
        type: Date
    },
    eliminado_por: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    movimientos: [{
        tipo: {
            type: String,
            enum: ['registro', 'edicion', 'ajuste_stock', 'baja', 'reactivacion'],
            required: true
        },
        cantidad_anterior: {
            type: Number,
            default: null
        },
        cantidad_nueva: {
            type: Number,
            default: null
        },
        estado_anterior: {
            type: String,
            default: null
        },
        estado_nuevo: {
            type: String,
            default: null
        },
        observacion: {
            type: String,
            trim: true,
            default: ''
        },
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            default: null
        },
        fecha: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

insumoSchema.pre('save', function normalizarEstado() {
    if (typeof this.cantidad === 'number') {
        if (this.cantidad <= 0) {
            this.cantidad = 0;
            this.estado = 'fuera de stock';
        } else if (!['prestado', 'en espera', 'eliminado'].includes(this.estado)) {
            this.estado = 'disponible';
        }
    }
});

const Insumo = mongoose.model('Insumo', insumoSchema);
module.exports = Insumo;
