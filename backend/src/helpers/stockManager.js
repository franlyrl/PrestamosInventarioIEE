const stockManager = {
    // Aquí irá la lógica para bajar o subir stock después de un préstamo
    actualizarStock: async (id, cantidad) => {
        return true;
    },

    // Procesar aprobación de solicitud
    processApproval: async (solicitud) => {
        try {
            const ListaEspera = require('../models/listaEspera');
            const Insumos = require('../models/insumos');

            // Lógica para reservar activos y reducir stock de insumos
            if (solicitud.activos && solicitud.activos.length > 0) {
                const Activos = require('../models/activos');
                
                // Verificar si algún activo está en mal_estado (fuera de servicio)
                for (const activoId of solicitud.activos) {
                    const activo = await Activos.findById(activoId);
                    if (activo.estadoActivo === 'fuera de servicio') {
                        throw new Error(`No se puede aprobar la solicitud. El activo ${activo.numActivo || activoId} está fuera de servicio.`);
                    }
                }
                
                // Si todos los activos están disponibles, proceder con la aprobación
                for (const activoId of solicitud.activos) {
                    await Activos.findByIdAndUpdate(activoId, { estadoActivo: 'prestado' });
                }
            }

            if (solicitud.insumos && solicitud.insumos.length > 0) {
                for (const item of solicitud.insumos) {
                    // 1. Buscar el insumo en la base de datos
                    const insumoDB = await Insumos.findById(item.id_insumo);

                    if (!insumoDB) {
                        throw new Error(`Insumo no encontrado: ${item.id_insumo}`);
                    }

                    // 2. Verificar si hay stock suficiente
                    if (insumoDB.cantidad < item.cantidad) {
                        // 3. Agregar a la lista de espera
                        try {
                            // Verificar si ya está en la lista de espera
                            const yaEnLista = await ListaEspera.findOne({
                                usuario: solicitud.usuario,
                                insumo: item.id_insumo
                            });

                            if (!yaEnLista) {
                                const nuevoTurno = new ListaEspera({
                                    usuario: solicitud.usuario,
                                    insumo: item.id_insumo,
                                    cantidad_solicitada: item.cantidad
                                });

                                await nuevoTurno.save();
                            }
                        } catch (errorLista) {
                            // Error silencioso
                        }

                        // Lanzar error para detener la aprobación
                        throw new Error(`Stock insuficiente para ${insumoDB.NombProducto}. Usuario agregado a lista de espera.`);
                    }

                    // 4. Si hay stock, reducir la cantidad
                    await Insumos.findByIdAndUpdate(item.id_insumo, {
                        $inc: { cantidad: -item.cantidad }
                    });
                }
            }

            return true;
        } catch (error) {
            throw error;
        }
    },

    // Procesar penalización de solicitud (poner artículos en fuera de servicio)
    processPenalty: async (solicitud, observaciones) => {
        try {
            const Activo = require('../models/activos');
            
            // Lógica para poner activos en fuera de servicio
            if (solicitud.activos && solicitud.activos.length > 0) {
                for (const activoId of solicitud.activos) {
                    await Activos.findByIdAndUpdate(activoId, {
                        estadoActivo: 'fuera de servicio',
                        observacion_estado: `fuera de servicio por penalizacion - Solicitud #${solicitud.folio || 'N/A'}`
                    });
                }
            }
            
            // Lógica para poner insumos en fuera de servicio
            if (solicitud.insumos && solicitud.insumos.length > 0) {
                for (const item of solicitud.insumos) {
                    await Insumos.findByIdAndUpdate(item.id_insumo, {
                        estado: 'fuera de servicio',
                        observacion_estado: `fuera de servicio por penalizacion - Solicitud #${solicitud.folio || 'N/A'}`
                    });
                }
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Procesar devolución de solicitud
    processReturn: async (solicitud) => {
        try {
            const Insumos = require('../models/insumos');
            const ListaEspera = require('../models/listaEspera');

            // Lógica para liberar activos y restaurar stock de insumos
            if (solicitud.activos && solicitud.activos.length > 0) {
                const Activos = require('../models/activos');
                for (const activoId of solicitud.activos) {
                    await Activos.findByIdAndUpdate(activoId, { estadoActivo: 'disponible' });
                }
            }

            if (solicitud.insumos && solicitud.insumos.length > 0) {
                for (const item of solicitud.insumos) {
                    // 1. Restaurar el stock
                    await Insumos.findByIdAndUpdate(item.id_insumo, {
                        $inc: { cantidad: item.cantidad }
                    });

                    // 2. Verificar si hay usuarios en lista de espera para este insumo
                    const listaEsperaOrdenada = await ListaEspera.find({
                        insumo: item.id_insumo
                    })
                        .populate('usuario', 'nombre_completo correo_electronico')
                        .sort({ prioridad: -1, createdAt: 1 });

                    if (listaEsperaOrdenada.length > 0) {
                        // 3. Procesar al primero de la lista si hay stock suficiente
                        const primerUsuario = listaEsperaOrdenada[0];
                        const insumoDB = await Insumos.findById(item.id_insumo);

                        if (insumoDB.cantidad >= primerUsuario.cantidad_solicitada) {
                            // Eliminar de la lista de espera
                            await ListaEspera.findByIdAndDelete(primerUsuario._id);
                        }
                    }
                }
            }

            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = stockManager;