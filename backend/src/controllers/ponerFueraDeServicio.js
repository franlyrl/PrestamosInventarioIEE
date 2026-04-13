/**
 * @route PUT /api/solicitudes/poner-fuera-servicio/:id
 * @desc Pone todos los artículos de una solicitud en estado "mal_estado" (fuera de servicio)
 * @access Solo Administrador
 */
const Solicitudes = require('../models/solicitudes');
const Activo = require('../models/activos');
const Insumo = require('../models/insumos');

const ponerFueraDeServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const solicitud = await Solicitudes.findById(id);
        
        if (!solicitud) {
            return res.status(404).json({ message: 'Solicitud no encontrada.' });
        }
        
        // Poner activos en fuera de servicio
        if (solicitud.activos && solicitud.activos.length > 0) {
            for (const activoId of solicitud.activos) {
                await Activo.findByIdAndUpdate(activoId, {
                    estadoActivo: 'fuera de servicio',
                    observacion_estado: `fuera de servicio por penalizacion - Solicitud #${solicitud.folio || 'N/A'}`
                });
            }
        }
        
        // Poner insumos en fuera de servicio
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            for (const item of solicitud.insumos) {
                await Insumo.findByIdAndUpdate(item.id_insumo, {
                    estado: 'fuera de servicio',
                    observacion_estado: `fuera de servicio por penalizacion - Solicitud #${solicitud.folio || 'N/A'}`
                });
            }
        }
        
        // Actualizar historial
        solicitud.historico_estados.push({
            estado: 'penalizado',
            fecha: new Date(),
            observaciones: 'Artículos puestos fuera de servicio manualmente por administrador'
        });
        
        // También actualizar el estado principal de la solicitud
        solicitud.estado = 'penalizado';
        
        await solicitud.save();
        
        res.json({
            message: 'Artículos puestos fuera de servicio correctamente',
            solicitud: solicitud
        });
        
    } catch (error) {
        console.error('Error al poner fuera de servicio:', error);
        res.status(500).json({
            message: 'Error al poner fuera de servicio',
            error: error.message
        });
    }
};

module.exports = { ponerFueraDeServicio };
