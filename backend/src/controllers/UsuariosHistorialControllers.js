const Usuarios = require('../models/usuarios');
const UsuariosHistorial = require('../models/UsuariosHistorial');
const { generarToken } = require('../utils/generarToken'); // Si necesitas autenticación para ciertas acciones
const { consultarNombrePorCedula } = require('../utils/registroCivil'); // Para validar cédula si es necesario
const Solicitudes = require('../models/solicitudes'); // Para verificar préstamos activos si es necesario
const { validationResult } = require('express-validator'); // Para validación de datos entrantes
const mongoose = require('mongoose'); // Para validaciones de ID y operaciones avanzadas con MongoDB


/**
 * @desc Controlador para manejar el historial de usuarios inactivos.
 * Este controlador se encarga de mover a los usuarios que han estado inactivos por más de 1 año
 * desde la colección principal "Usuarios" a la colección "UsuariosHistorial".
 */

const UserHist_Controller = {
    /**
     * @desc Establece fecha de inactividad a usuarios que no la tienen
     */
    establecerFechasInactividad: async (req, res) => {
        try {

            // Buscar usuarios inactivos sin fecha de inactividad
            const usuariosSinFecha = await Usuarios.find({
                estado: 'inactivo',
                inactivo_desde: { $exists: false }
            });


            if (usuariosSinFecha.length === 0) {
                return res.json({
                    message: 'Todos los usuarios inactivos ya tienen fecha establecida',
                    total_actualizados: 0
                });
            }

            // Establecer fecha de inactividad (hace 2 años para asegurar que califiquen)
            const fechaHaceDosAños = new Date();
            fechaHaceDosAños.setFullYear(fechaHaceDosAños.getFullYear() - 2);

            const resultado = await Usuarios.updateMany(
                {
                    estado: 'inactivo',
                    inactivo_desde: { $exists: false }
                },
                {
                    $set: { inactivo_desde: fechaHaceDosAños }
                }
            );


            res.json({
                message: 'Fechas de inactividad establecidas correctamente',
                total_actualizados: resultado.modifiedCount,
                fecha_establecida: fechaHaceDosAños,
                usuarios_procesados: usuariosSinFecha.map(u => ({
                    id: u._id,
                    nombre: u.nombre_completo,
                    cedula: u.cedula,
                    estado: u.estado
                }))
            });

        } catch (error) {
            console.error("❌ [Historial] Error al establecer fechas:", error);
            res.status(500).json({
                message: 'Error al establecer fechas de inactividad',
                error: error.message
            });
        }
    },

    /**
     * @desc Mueve usuarios inactivos por más de 1 año al historial.
     */
    ejecutarLimpiezaHistorial: async (req, res) => {
        try {

            // 1. Calculamos la fecha límite (Hoy menos 12 meses)
            const fechaLimite = new Date();
            fechaLimite.setFullYear(fechaLimite.getFullYear() - 1);

            // 2. Buscamos a los que cumplen el tiempo
            const candidatos = await Usuarios.find({
                tipo_rol: 'estudiante',
                estado: 'inactivo',
                inactivo_desde: { $lt: fechaLimite }
            });


            if (candidatos.length === 0) {
                return res.status(200).json({
                    message: 'No hay registros antiguos para mover al historial.',
                    fecha_limite: fechaLimite,
                    criterios: {
                        tipo_rol: 'estudiante',
                        estado: 'inactivo',
                        antiguedad_minima: '1 año'
                    }
                });
            }

            // 3. Verificar que no tengan préstamos activos
            const Solicitudes = require('../models/solicitudes');
            const idsCandidatos = candidatos.map(u => u._id);

            const prestamosActivos = await Solicitudes.find({
                usuario: { $in: idsCandidatos },
                estado: { $in: ['pendiente', 'aprobada', 'entregado'] }
            });

            if (prestamosActivos.length > 0) {
                return res.status(400).json({
                    message: 'No se puede archivar. Hay usuarios con préstamos activos.',
                    prestamos_activos: prestamosActivos.length,
                    usuarios_con_prestamos: prestamosActivos.map(p => ({
                        usuario_id: p.usuario,
                        estado_prestamo: p.estado
                    }))
                });
            }

            // 3. Preparar los datos para el historial
            const datosParaMover = candidatos.map(u => {
                const doc = u.toObject();

                // Eliminar campos que no se necesitan en el historial
                delete doc._id;
                delete doc.__v;
                delete doc.updatedAt;

                // Asegurar campos requeridos
                doc.estado = 'archivado';
                doc.fecha_archivado = new Date();
                doc.fecha_creacion = u.createdAt;
                doc.ultimo_acceso = u.ultimo_acceso || null;

                // Campos opcionales con valores por defecto
                doc.comprobante_pdf = u.comprobante_pdf || 'No disponible';

                return doc;
            });

            // 4. Mover físicamente los datos entre colecciones
            await UsuariosHistorial.insertMany(datosParaMover);

            // 5. Eliminar de la tabla principal
            const idsParaBorrar = candidatos.map(u => u._id);
            const resultado = await Usuarios.deleteMany({ _id: { $in: idsParaBorrar } });


            res.status(200).json({
                message: 'Proceso de archivado completado.',
                total_movidos: resultado.deletedCount,
                fecha_archivado: new Date(),
                criterios_aplicados: {
                    tipo_rol: 'estudiante',
                    estado: 'inactivo',
                    antiguedad_minima: '1 año',
                    fecha_limite: fechaLimite
                },
                nota: 'Los datos están seguros en la colección de historial.'
            });

        } catch (error) {
            console.error("❌ [Historial] Error en proceso de archivado:", error);
            res.status(500).json({
                error: 'Error al procesar el historial académico.',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    /**
     * @desc Obtiene todo el historial de usuarios archivados.
     */
    getHistorialCompleto: async (req, res) => {
        try {
            const historial = await UsuariosHistorial.find()
                .sort({ fecha_archivado: -1 });

            res.json({
                total: historial.length,
                data: historial
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al obtener el historial completo',
                error: error.message
            });
        }
    },

    /**
     * @desc Busca un usuario específico en el historial por cédula.
     */
    getUsuarioHistorial: async (req, res) => {
        try {
            const { cedula } = req.params;

            const historial = await UsuariosHistorial.find({ cedula: cedula })
                .sort({ fecha_archivado: -1 });

            if (historial.length === 0) {
                return res.status(404).json({
                    message: `No se encontró historial para la cédula: ${cedula}`
                });
            }

            res.json({
                cedula: cedula,
                total_encontrados: historial.length,
                data: historial
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al buscar historial por cédula',
                error: error.message
            });
        }
    },

    /**
     * @desc Elimina registros del historial más antiguos que los años especificados.
     */
    limpiarHistorialAntiguo: async (req, res) => {
        try {
            const { años = 5 } = req.query; // Por defecto 5 años

            const fechaLimite = new Date();
            fechaLimite.setFullYear(fechaLimite.getFullYear() - años);

            const resultado = await UsuariosHistorial.deleteMany({
                fecha_archivado: { $lt: fechaLimite }
            });

            res.json({
                message: `Historial limpiado. Registros eliminados: ${resultado.deletedCount}`,
                años_eliminados: años,
                fecha_limite: fechaLimite
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al limpiar historial antiguo',
                error: error.message
            });
        }
    },

    /**
     * @desc Obtiene estadísticas del historial de usuarios.
     */
    getEstadisticasHistorial: async (req, res) => {
        try {
            const stats = await UsuariosHistorial.aggregate([
                {
                    $group: {
                        _id: '$estado',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const totalRegistros = await UsuariosHistorial.countDocuments();
            const ultimoArchivo = await UsuariosHistorial
                .findOne()
                .sort({ fecha_archivado: -1 });

            res.json({
                total_registros: totalRegistros,
                por_estado: stats,
                ultimo_archivado: ultimoArchivo?.fecha_archivado,
                generacion: new Date()
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al obtener estadísticas del historial',
                error: error.message
            });
        }
    }
};

module.exports = {
    establecerFechasInactividad: UserHist_Controller.establecerFechasInactividad,
    ejecutarLimpiezaHistorial: UserHist_Controller.ejecutarLimpiezaHistorial,
    getHistorialCompleto: UserHist_Controller.getHistorialCompleto,
    getUsuarioHistorial: UserHist_Controller.getUsuarioHistorial,
    limpiarHistorialAntiguo: UserHist_Controller.limpiarHistorialAntiguo,
    getEstadisticasHistorial: UserHist_Controller.getEstadisticasHistorial
};