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

/**
 * @route GET /api/reportes/alertas-activos
 * @desc Reporte de activos que requieren atención o están fuera de servicio.
 */
exports.getAlertasActivos = async (req, res) => {
    try {
        // 1. Buscamos activos que no están en condiciones óptimas
        const activosCriticos = await Activo.find({
            estadoActivo: { $in: ['deteriorado', 'dañado'] }
        }).select('numActivo numSerie estadoActivo modelo marca');

        // 2. Calculamos estadísticas de disponibilidad
        const totalActivos = await Activo.countDocuments();
        const prestados = await Activo.countDocuments({ estadoActivo: 'prestado' });
        const disponibles = await Activo.countDocuments({ estadoActivo: 'disponible' });

        res.json({
            resumen_inventario: {
                total: totalActivos,
                disponibles: disponibles,
                en_prestamo: prestados,
                fuera_de_servicio: activosCriticos.length
            },
            alerta_mantenimiento: {
                count: activosCriticos.length,
                items: activosCriticos
            },
            mensaje: activosCriticos.length > 0 
                ? "Atención: Hay equipos que requieren reparación o reposición." 
                : "Todos los equipos no prestados están en buen estado."
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error al generar reporte de activos', 
            error: error.message 
        });
    }
};