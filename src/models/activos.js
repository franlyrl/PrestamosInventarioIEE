const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la gestión de activos (equipos) del inventario.
 */
const activoSchema = new mongoose.Schema({
    /** * @property {Number} numActivo 
     * Número identificador único del activo; debe ser positivo.
     */
    numActivo: {
        type: Number,
        unique: true,
        index: true,
        required: [true, 'El número de activo es obligatorio'], 
        min: [1, 'El número de activo debe ser un número positivo']    
    },
    /** * @property {String} numSerie 
     * Número de serie único del fabricante para identificación precisa.
     */
    numSerie: {
        type: String,
        required: [true, 'El número de serie es obligatorio'],
        unique: true,
        trim: true
    },
    /** * @property {String} estadoActivo 
     * Estado actual del equipo (prestado, disponible, deteriorado, dañado).
     */
    estadoActivo: {
        type: String,
        required: [true, 'El estado del activo es obligatorio'],
        enum: ['prestado', 'disponible', 'deteriorado', 'dañado'],
        lowercase: true,
        trim: true
    },
    /** * @property {String} marca 
     * Fabricante o marca del activo.
     */
    marca: {
        type: String,
        required: [true, 'La marca es obligatoria'],
        trim: true
    },
    /** * @property {String} modelo 
     * Referencia o modelo específico del equipo.
     */
    modelo: {
        type: String,
        required: [true, 'El modelo es obligatorio'],
        trim: true
    },
    /** * @property {String} categoria 
     * Clasificación técnica del activo según su área de aplicación.
     */
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
    /** * @property {String} observaciones 
     * Notas adicionales. Por defecto: 'Sin observaciones particulares'.
     */
    observaciones: {
        type: String,
        trim: true,
        default: 'Sin observaciones particulares' 
    },
    /** * @property {String} caracteristicas 
     * Especificaciones técnicas detalladas del equipo.
     */
    caracteristicas: {
        type: String,
        required: [true, 'Las características son obligatorias, datos a especificar del equipo'],
        trim: true
    }
}, { 
    /** Genera automáticamente campos de auditoría: createdAt y updatedAt. */
    timestamps: true 
});

/** * Modelo 'Activo' para interactuar con la colección de activos en la base de datos.
 */
const Activo = mongoose.model('Activo', activoSchema);

/** * Exportación del modelo Activo.
 */
module.exports = Activo;