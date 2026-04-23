const express = require('express');
const router = express.Router();
const Activos = require('../models/activos');
const Insumos = require('../models/insumos');
const Solicitudes = require('../models/solicitudes');

/**
 * @desc Obtiene estadísticas generales del sistema
 * @access Privado (solo admin)
 */
router.get('/totales', async (req, res) => {
    try {
        
        // Contar documentos en cada colección
        const [totalActivos, totalInsumos, totalSolicitudes] = await Promise.all([
            Activos.countDocuments({}),
            Insumos.countDocuments({}),
            Solicitudes.countDocuments({ estado: { $in: ['aprobada', 'entregado'] } })
        ]);


        res.json({
            success: true,
            totalActivos,
            totalInsumos,
            totalSolicitudes
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

/**
 * @desc Obtiene estadísticas detalladas por categoría
 * @access Privado (solo admin)
 */
router.get('/detalladas', async (req, res) => {
    try {
        
        // Estadísticas de activos por categoría
        const activosPorCategoria = await Activos.aggregate([
            {
                $group: {
                    _id: '$categoria',
                    total: { $sum: 1 },
                    disponibles: { 
                        $sum: { 
                            $cond: { if: { $eq: ['$estado', 'disponible'] }, then: 1, else: 0 } 
                        } 
                    }
                }
            }
        ]);

        // Estadísticas de insumos por categoría
        const insumosPorCategoria = await Insumos.aggregate([
            {
                $group: {
                    _id: '$categoria',
                    total: { $sum: 1 },
                    stockBajo: { 
                        $sum: { 
                            $cond: { if: { $lte: ['$stock_actual', 5] }, then: 1, else: 0 } 
                        } 
                    }
                }
            }
        ]);

        // Solicitudes por estado
        const solicitudesPorEstado = await Solicitudes.aggregate([
            {
                $group: {
                    _id: '$estado',
                    total: { $sum: 1 }
                }
            }
        ]);


        res.json({
            success: true,
            activosPorCategoria,
            insumosPorCategoria,
            solicitudesPorEstado
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas detalladas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas detalladas',
            error: error.message
        });
    }
});

module.exports = router;
