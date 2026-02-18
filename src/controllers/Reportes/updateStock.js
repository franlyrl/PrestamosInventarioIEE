const Insumo = require('../models/Insumo');
const Activo = require('../models/Activo');
const Solicitudes = require('../models/Solicitudes');

const updateStock = {
    
    // --- PROCESAMIENTO ---

    processApproval: async (solicitud) => {
        // VALIDACIÓN: ¿Hay suficiente stock de insumos antes de aprobar?
        if (solicitud.insumos?.length > 0) {
            for (const item of solicitud.insumos) {
                const insumoActual = await Insumo.findById(item.id_insumo);
                if (!insumoActual || insumoActual.cantidad < item.cantidad) {
                    throw new Error(`Stock insuficiente para el insumo: ${insumoActual?.NombProducto || 'Desconocido'}`);
                }
            }

            // Si hay stock, procedemos a restar
            for (const item of solicitud.insumos) {
                await Insumo.findByIdAndUpdate(item.id_insumo, { $inc: { cantidad: -item.cantidad } });
            }
        }

        // Marcar activos como prestados
        if (solicitud.activos?.length > 0) {
            await Activo.updateMany(
                { _id: { $in: solicitud.activos } },
                { $set: { estadoActivo: 'prestado' } }
            );
        }
    },

    processReturn: async (solicitud) => {
        if (solicitud.activos?.length > 0) {
            // Liberar activos
            await Activo.updateMany(
                { _id: { $in: solicitud.activos } },
                { $set: { estadoActivo: 'disponible' } }
            );
        }
        
        // EXTRA: Actualizar la fecha de devolución en la solicitud
        await Solicitudes.findByIdAndUpdate(solicitud._id, {
            fecha_devolucion_real: new Date()
        });
    },

    // --- REPORTES ---

    getReporteStockBajo: async (umbral = 10) => {
        // Convertimos a número por si viene como string de la URL
        const limite = parseInt(umbral);
        return await Insumo.find({ 
            cantidad: { $lte: limite } 
        }).select('NombProducto cantidad categoria');
    },

    getReportePendientesDevolucion: async () => {
        return await Solicitudes.find({ estado: 'aprobada' })
            .populate('usuario', 'nombre_completo correo_electronico')
            .populate('activos', 'marca modelo numActivo')
            .sort({ createdAt: 1 });
    }
};

module.exports = updateStock;