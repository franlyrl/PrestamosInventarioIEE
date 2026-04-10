const stockManager = {
    // Aquí irá la lógica para bajar o subir stock después de un préstamo
    actualizarStock: async (id, cantidad) => {
        console.log("Simulando actualización de stock...");
        return true;
    },

    // Procesar aprobación de solicitud
    processApproval: async (solicitud) => {
        console.log(" [StockManager] Procesando aprobación de solicitud:", solicitud._id);

        try {
            const ListaEspera = require('../models/listaEspera');
            const Insumos = require('../models/insumos');

            // Lógica para reservar activos y reducir stock de insumos
            if (solicitud.activos && solicitud.activos.length > 0) {
                console.log(` Reservando ${solicitud.activos.length} activos`);
                // Aquí iría la lógica para marcar activos como no disponibles
            }

            if (solicitud.insumos && solicitud.insumos.length > 0) {
                console.log(` Verificando stock de ${solicitud.insumos.length} tipos de insumos`);

                for (const item of solicitud.insumos) {
                    console.log(`   - Verificando ${item.cantidad} unidades de ${item.id_insumo}`);

                    // 1. Buscar el insumo en la base de datos
                    const insumoDB = await Insumos.findById(item.id_insumo);

                    if (!insumoDB) {
                        console.log(` Insumo no encontrado: ${item.id_insumo}`);
                        throw new Error(`Insumo no encontrado: ${item.id_insumo}`);
                    }

                    // 2. Verificar si hay stock suficiente
                    if (insumoDB.cantidad < item.cantidad) {
                        console.log(`  Stock insuficiente para ${insumoDB.NombProducto}`);
                        console.log(`   - Solicitado: ${item.cantidad}`);
                        console.log(`   - Disponible: ${insumoDB.cantidad}`);

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
                                console.log(` Usuario agregado a lista de espera para ${insumoDB.NombProducto}`);
                            } else {
                                console.log(`  Usuario ya está en lista de espera para ${insumoDB.NombProducto}`);
                            }
                        } catch (errorLista) {
                            console.error(` Error al agregar a lista de espera:`, errorLista.message);
                        }

                        // Lanzar error para detener la aprobación
                        throw new Error(`Stock insuficiente para ${insumoDB.NombProducto}. Usuario agregado a lista de espera.`);
                    }

                    // 4. Si hay stock, reducir la cantidad
                    console.log(` Stock suficiente. Reduciendo de ${insumoDB.cantidad} a ${insumoDB.cantidad - item.cantidad}`);
                    await Insumos.findByIdAndUpdate(item.id_insumo, {
                        $inc: { cantidad: -item.cantidad }
                    });
                }
            }

            console.log(" [StockManager] Aprobación procesada correctamente");
            return true;
        } catch (error) {
            console.error(" [StockManager] Error en processApproval:", error);
            throw error;
        }
    },

    // Procesar devolución de solicitud
    processReturn: async (solicitud) => {
        console.log(" [StockManager] Procesando devolución de solicitud:", solicitud._id);

        try {
            const Insumos = require('../models/insumos');
            const ListaEspera = require('../models/listaEspera');

            // Lógica para liberar activos y restaurar stock de insumos
            if (solicitud.activos && solicitud.activos.length > 0) {
                console.log(` Liberando ${solicitud.activos.length} activos`);
                // Aquí iría la lógica para marcar activos como disponibles
            }

            if (solicitud.insumos && solicitud.insumos.length > 0) {
                console.log(` Restaurando stock de ${solicitud.insumos.length} tipos de insumos`);

                for (const item of solicitud.insumos) {
                    console.log(`   - Insumo ${item.id_insumo} (cantidad: ${item.cantidad})`);

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
                        console.log(` Hay ${listaEsperaOrdenada.length} usuarios en lista de espera para este insumo`);

                        // 3. Procesar al primero de la lista si hay stock suficiente
                        const primerUsuario = listaEsperaOrdenada[0];
                        const insumoDB = await Insumos.findById(item.id_insumo);

                        if (insumoDB.cantidad >= primerUsuario.cantidad_solicitada) {
                            console.log(` Asignando stock a ${primerUsuario.usuario.nombre_completo}`);

                            // Aquí podrías enviar una notificación o crear una solicitud automática
                            console.log(`   - Cantidad asignada: ${primerUsuario.cantidad_solicitada}`);
                            console.log(`   - Stock restante: ${insumoDB.cantidad - primerUsuario.cantidad_solicitada}`);

                            // Eliminar de la lista de espera
                            await ListaEspera.findByIdAndDelete(primerUsuario._id);
                            console.log(` Usuario eliminado de lista de espera`);
                        }
                    }
                }
            }

            console.log(" [StockManager] Devolución procesada correctamente");
            return true;
        } catch (error) {
            console.error(" [StockManager] Error en processReturn:", error);
            throw error;
        }
    }
};

module.exports = stockManager;