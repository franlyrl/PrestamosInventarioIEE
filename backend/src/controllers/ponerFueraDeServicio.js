/**
 * @route PUT /api/solicitudes/poner-fuera-servicio/:id
 * @desc Pone todos los artículos de una solicitud en estado "mal_estado" (fuera de servicio)
 * @access Solo Administrador
 */
const Solicitudes = require('../models/solicitudes');
const Activo = require('../models/activos');
const Insumo = require('../models/insumos');

const ponerFueraDeServicio = async (req, res) => {
    console.log('🔍 [DEBUG] Iniciando ponerFueraDeServicio...');
    console.log('📥 [DEBUG] ID recibido:', req.params.id);
    
    try {
        const { id } = req.params;
        console.log('🔍 [DEBUG] Buscando solicitud con ID:', id);
        const solicitud = await Solicitudes.findById(id);
        console.log('📋 [DEBUG] Solicitud encontrada:', solicitud ? 'SÍ' : 'NO');
        
        if (!solicitud) {
            console.log('❌ [DEBUG] Solicitud no encontrada - retornando 404');
            return res.status(404).json({ message: 'Solicitud no encontrada.' });
        }
        
        // Poner activos en mal_estado
        console.log('🔧 [DEBUG] Procesando activos...');
        if (solicitud.activos && solicitud.activos.length > 0) {
            console.log(`📦 [DEBUG] Encontrados ${solicitud.activos.length} activos para poner en mal_estado`);
            for (const activoId of solicitud.activos) {
                console.log(`🔄 [DEBUG] Actualizando activo ${activoId} a mal_estado`);
                await Activo.findByIdAndUpdate(activoId, {
                    estadoActivo: 'mal_estado',
                    observacion_estado: `Artículo puesto fuera de servicio manualmente - Solicitud #${solicitud.folio || 'N/A'}`
                });
                console.log(`✅ [DEBUG] Activo ${activoId} actualizado correctamente`);
            }
        } else {
            console.log('📦 [DEBUG] No hay activos para procesar');
        }
        
        // Poner insumos en mal_estado
        console.log('📦 [DEBUG] Procesando insumos...');
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            console.log(`📦 [DEBUG] Encontrados ${solicitud.insumos.length} insumos para poner en mal_estado`);
            for (const item of solicitud.insumos) {
                console.log(`🔄 [DEBUG] Actualizando insumo ${item.id_insumo} a mal_estado`);
                await Insumo.findByIdAndUpdate(item.id_insumo, {
                    estado: 'mal_estado',
                    observacion_estado: `Artículo puesto fuera de servicio manualmente - Solicitud #${solicitud.folio || 'N/A'}`
                });
                console.log(`✅ [DEBUG] Insumo ${item.id_insumo} actualizado correctamente`);
            }
        } else {
            console.log('📦 [DEBUG] No hay insumos para procesar');
        }
        
        // Actualizar historial
        solicitud.historico_estados.push({
            estado: 'mal_estado_manual',
            fecha: new Date(),
            observaciones: 'Artículos puestos fuera de servicio manualmente por administrador'
        });
        
        console.log('💾 [DEBUG] Guardando solicitud en base de datos...');
        await solicitud.save();
        console.log('✅ [DEBUG] Solicitud guardada correctamente');
        
        console.log('📤 [DEBUG] Enviando respuesta exitosa al cliente');
        res.json({
            message: 'Artículos puestos fuera de servicio correctamente',
            solicitud: solicitud
        });
        console.log('✅ [DEBUG] Respuesta enviada exitosamente');
        
    } catch (error) {
        console.error('❌ [ERROR] Error en ponerFueraDeServicio:', error);
        console.error('❌ [ERROR] Stack trace:', error.stack);
        res.status(500).json({
            message: 'Error al poner fuera de servicio',
            error: error.message
        });
    }
};

module.exports = { ponerFueraDeServicio };
