/**
 * @file insumoControllers.js
 * @description Gestion de insumos con estandarizacion de estados y trazabilidad.
 */
const Insumos = require('../models/insumos');
const google = require('googlethis');

const ROLES_AUTORIZADOS = ['admin', 'administrador', 'Administrador', 'administrativo'];

const normalizarTexto = (valor = '') => String(valor).trim();

// Helper para corregir codificación de caracteres especiales
const fixEncoding = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    try {
        // Si el texto no contiene secuencias corruptas comunes, devolverlo
        if (!text.includes('Ã')) return text;
        // Decodificar UTF-8 mal interpretado como Latin-1
        const decoded = Buffer.from(text, 'latin1').toString('utf8');
        console.log(`[ENCODING] "${text}" -> "${decoded}"`);
        return decoded;
    } catch (e) {
        return text;
    }
};

const normalizarEstadoPorCantidad = (cantidad, estadoActual = 'disponible') => {
    const cantidadNumero = Number(cantidad);
    if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
        return 'fuera de stock';
    }

    const estado = normalizarTexto(estadoActual).toLowerCase();
    if (['prestado', 'en espera', 'eliminado'].includes(estado)) {
        return estado;
    }
    return 'disponible';
};

const construirCodigo = ({ codigo, tipo }) => {
    const codigoLimpio = normalizarTexto(codigo).toUpperCase();
    const tipoLimpio = normalizarTexto(tipo).toLowerCase() === 'activo' ? 'activo' : 'insumo';
    if (!codigoLimpio) return codigoLimpio;

    if (codigoLimpio.startsWith('ACT-') || codigoLimpio.startsWith('INS-')) {
        return codigoLimpio;
    }

    const prefijo = tipoLimpio === 'activo' ? 'ACT-' : 'INS-';
    return `${prefijo}${codigoLimpio}`;
};

const registrarMovimiento = (insumo, payload = {}) => {
    if (!insumo.movimientos) {
        insumo.movimientos = [];
    }
    insumo.movimientos.push(payload);
};

// Helper para corregir codificación de un insumo
const corregirInsumo = (insumo) => {
    if (!insumo) return insumo;
    const insumoObj = insumo.toObject ? insumo.toObject() : insumo;
    return {
        ...insumoObj,
        NombProducto: fixEncoding(insumoObj.NombProducto),
        categoria: fixEncoding(insumoObj.categoria),
        caracteristicas: fixEncoding(insumoObj.caracteristicas),
        descripcion: fixEncoding(insumoObj.descripcion),
        marca: fixEncoding(insumoObj.marca),
        modelo: fixEncoding(insumoObj.modelo),
        ubicacion: fixEncoding(insumoObj.ubicacion),
        observaciones: fixEncoding(insumoObj.observaciones)
    };
};

exports.getInsumos = async (req, res) => {
    try {
        const insumos = await Insumos.find();
        console.log('[DEBUG] Total insumos:', insumos.length);
        
        // Corregir codificación de caracteres especiales
        const insumosCorregidos = insumos.map(insumo => {
            const insumoObj = insumo.toObject ? insumo.toObject() : insumo;
            const original = insumoObj.NombProducto;
            const corregido = fixEncoding(original);
            if (original !== corregido) {
                console.log(`[DEBUG] Corregido: "${original}" -> "${corregido}"`);
            }
            return {
                ...insumoObj,
                NombProducto: fixEncoding(insumoObj.NombProducto),
                categoria: fixEncoding(insumoObj.categoria),
                caracteristicas: fixEncoding(insumoObj.caracteristicas),
                descripcion: fixEncoding(insumoObj.descripcion),
                marca: fixEncoding(insumoObj.marca),
                modelo: fixEncoding(insumoObj.modelo),
                ubicacion: fixEncoding(insumoObj.ubicacion),
                observaciones: fixEncoding(insumoObj.observaciones)
            };
        });
        res.json(insumosCorregidos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los insumos', error: error.message });
    }
};

exports.createInsumo = async (req, res) => {
    try {
        if (!req.user || !ROLES_AUTORIZADOS.includes(req.user.tipo_rol)) {
            return res.status(403).json({
                message: 'Acceso denegado: No tienes permisos para anadir insumos.',
                debug: `rol actual: ${req.user?.tipo_rol}`
            });
        }

        const datos = req.body;
        const categoriasValidas = Insumos.schema.path('categoria').enumValues;
        const tiposValidos = Insumos.schema.path('tipo').enumValues;

        const validarObjeto = obj => {
            const { NombProducto, caracteristicas, categoria, codigo, tipo } = obj;
            if (!NombProducto || !caracteristicas || !categoria || !codigo || !tipo) {
                return false;
            }
            if (!categoriasValidas.includes(categoria)) {
                return false;
            }
            if (!tiposValidos.includes(String(tipo).toLowerCase())) {
                return false;
            }
            return true;
        };

        const prepararDatos = item => {
            const payload = { ...item };
            payload.tipo = normalizarTexto(payload.tipo).toLowerCase();
            payload.codigo = construirCodigo(payload);
            payload.cantidad = Math.max(0, Number(payload.cantidad || 0));
            payload.ubicacion = normalizarTexto(payload.ubicacion || 'Laboratorio de Electronica');
            payload.estado = normalizarEstadoPorCantidad(payload.cantidad, payload.estado);
            return payload;
        };

        if (Array.isArray(datos)) {
            if (datos.length === 0) {
                return res.status(400).json({ message: 'Array vacio enviado para creacion masiva.' });
            }

            const lote = [];
            for (const item of datos) {
                if (!validarObjeto(item)) {
                    return res.status(400).json({
                        message: 'Uno o mas objetos del array no son validos (faltan campos obligatorios o enum invalido).'
                    });
                }

                const preparado = prepararDatos(item);
                preparado.movimientos = [{
                    tipo: 'registro',
                    cantidad_anterior: null,
                    cantidad_nueva: preparado.cantidad,
                    estado_anterior: null,
                    estado_nuevo: preparado.estado,
                    observacion: 'Registro inicial masivo del insumo.',
                    usuario: req.user?._id || null,
                    fecha: new Date()
                }];
                lote.push(preparado);
            }

            const insertados = await Insumos.insertMany(lote);
            return res.status(201).json({
                message: 'Insumos registrados con exito (bulk).',
                count: insertados.length,
                data: insertados
            });
        }

        if (!validarObjeto(datos)) {
            return res.status(400).json({
                message: 'Error: Codigo, Tipo, Nombre, Caracteristicas y Categoria son campos obligatorios.'
            });
        }

        const payload = prepararDatos(datos);
        const nuevoInsumo = new Insumos(payload);
        registrarMovimiento(nuevoInsumo, {
            tipo: 'registro',
            cantidad_anterior: null,
            cantidad_nueva: payload.cantidad,
            estado_anterior: null,
            estado_nuevo: payload.estado,
            observacion: 'Registro inicial del insumo.',
            usuario: req.user?._id || null,
            fecha: new Date()
        });

        const insumoGuardado = await nuevoInsumo.save();

        return res.status(201).json({
            message: 'Insumo registrado con exito',
            data: insumoGuardado
        });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.codigo) {
            return res.status(409).json({ message: 'El codigo ingresado ya existe. Debe ser unico.' });
        }

        res.status(500).json({
            message: 'Error interno al registrar el insumo',
            error: error.message
        });
    }
};

exports.updateInsumo = async (req, res) => {
    try {
        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const estadoAnterior = insumo.estado;
        const cantidadAnterior = insumo.cantidad;

        const camposPermitidos = [
            'id_insumo',
            'codigo',
            'tipo',
            'NombProducto',
            'cantidad',
            'caracteristicas',
            'categoria',
            'imagenUrl',
            'ubicacion',
            'estado'
        ];

        for (const campo of camposPermitidos) {
            if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
                insumo[campo] = req.body[campo];
            }
        }

        insumo.tipo = normalizarTexto(insumo.tipo).toLowerCase();
        insumo.codigo = construirCodigo({ codigo: insumo.codigo, tipo: insumo.tipo });

        if (req.body.cantidad !== undefined) {
            insumo.cantidad = Math.max(0, Number(req.body.cantidad));
            insumo.estado = normalizarEstadoPorCantidad(insumo.cantidad, req.body.estado || insumo.estado);
        }

        registrarMovimiento(insumo, {
            tipo: 'edicion',
            cantidad_anterior: cantidadAnterior,
            cantidad_nueva: insumo.cantidad,
            estado_anterior: estadoAnterior,
            estado_nuevo: insumo.estado,
            observacion: normalizarTexto(req.body.motivo_movimiento || 'Edicion manual del insumo.'),
            usuario: req.user?._id || null,
            fecha: new Date()
        });

        const insumoActualizado = await insumo.save();
        res.json(insumoActualizado);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.codigo) {
            return res.status(409).json({ message: 'El codigo ingresado ya existe. Debe ser unico.' });
        }

        res.status(400).json({ message: 'Error al actualizar el insumo', error: error.message });
    }
};

exports.getInsumoById = async (req, res) => {
    try {
        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }
        res.json(corregirInsumo(insumo));
    } catch (error) {
        res.status(400).json({ message: 'Error al obtener el insumo', error: error.message });
    }
};

exports.deleteInsumo = async (req, res) => {
    try {
        const { motivo_eliminacion } = req.body;

        if (!req.user || (req.user.tipo_rol !== 'admin' && req.user.tipo_rol !== 'Administrador')) {
            return res.status(403).json({
                message: 'No autorizado. Solo administradores pueden dar de baja insumos.'
            });
        }

        if (!motivo_eliminacion || motivo_eliminacion.trim().length < 10) {
            return res.status(400).json({
                message: 'Se requiere una justificacion (min. 10 caracteres) para la baja del insumo.'
            });
        }

        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'El insumo no existe.' });
        }

        const estadoAnterior = insumo.estado;
        const cantidadAnterior = insumo.cantidad;

        insumo.estado = 'eliminado';
        insumo.justificacion_baja = motivo_eliminacion;
        insumo.fecha_baja = new Date();
        insumo.eliminado_por = req.user._id;

        registrarMovimiento(insumo, {
            tipo: 'baja',
            cantidad_anterior: cantidadAnterior,
            cantidad_nueva: cantidadAnterior,
            estado_anterior: estadoAnterior,
            estado_nuevo: 'eliminado',
            observacion: motivo_eliminacion,
            usuario: req.user?._id || null,
            fecha: new Date()
        });

        const insumoActualizado = await insumo.save();

        res.json({
            message: 'Insumo dado de baja correctamente.',
            detalles: {
                id: insumoActualizado._id,
                nombre: insumoActualizado.NombProducto,
                motivo: insumoActualizado.justificacion_baja
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al procesar la baja del insumo.',
            error: error.message
        });
    }
};

exports.getInsumosByCategoria = async (req, res) => {
    try {
        const { cat } = req.params;
        const insumos = await Insumos.find({ categoria: cat });
        res.json(insumos.map(corregirInsumo));
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar insumos', error: error.message });
    }
};

exports.getEnumCategorias = (req, res) => {
    try {
        const categorias = Insumos.schema.path('categoria').enumValues;
        res.json({ total: categorias.length, categorias });
    } catch (error) {
        res.status(500).json({ message: 'Error al extraer las categorias', error: error.message });
    }
};

exports.getInsumosPorCategoria = async (req, res) => {
    try {
        const { categoria } = req.params;
        const categoriasValidas = Insumos.schema.path('categoria').enumValues;

        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({
                message: `La categoria '${categoria}' no es valida.`,
                opcionesValidas: categoriasValidas
            });
        }

        const insumos = await Insumos.find({ categoria });
        res.json({
            categoriaSeleccionada: categoria,
            total: insumos.length,
            data: insumos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar los insumos', error: error.message });
    }
};

exports.searchInsumos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.json([]);
        }

        const regex = new RegExp(q, 'i');
        const insumos = await Insumos.find({
            $or: [{ NombProducto: regex }, { caracteristicas: regex }, { codigo: regex }]
        });

        res.json(insumos.map(corregirInsumo));
    } catch (error) {
        res.status(500).json({
            message: 'Error al buscar insumos',
            error: error.message
        });
    }
};

exports.getInsumosByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        const insumos = await Insumos.find({ estado: estado.toLowerCase() });
        res.json({
            estadoFiltrado: estado,
            total: insumos.length,
            data: insumos
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al filtrar insumos por estado', error: error.message });
    }
};

exports.updateStock = async (req, res) => {
    try {
        const cantidad = Number(req.body.cantidad);
        const { operacion } = req.body;

        if (!Number.isFinite(cantidad) || cantidad <= 0 || !operacion) {
            return res.status(400).json({
                message: 'Se requieren los campos "cantidad" (numero > 0) y "operacion"'
            });
        }

        if (!['incrementar', 'decrementar'].includes(operacion)) {
            return res.status(400).json({
                message: 'La operacion debe ser "incrementar" o "decrementar"'
            });
        }

        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const cantidadAnterior = insumo.cantidad;
        const estadoAnterior = insumo.estado;

        const nuevaCantidad = operacion === 'incrementar'
            ? insumo.cantidad + cantidad
            : insumo.cantidad - cantidad;

        if (nuevaCantidad < 0) {
            return res.status(400).json({
                message: 'La cantidad resultante no puede ser negativa'
            });
        }

        insumo.cantidad = nuevaCantidad;
        insumo.estado = normalizarEstadoPorCantidad(nuevaCantidad, insumo.estado);

        registrarMovimiento(insumo, {
            tipo: 'ajuste_stock',
            cantidad_anterior: cantidadAnterior,
            cantidad_nueva: insumo.cantidad,
            estado_anterior: estadoAnterior,
            estado_nuevo: insumo.estado,
            observacion: normalizarTexto(req.body.motivo || `Ajuste de stock (${operacion}).`),
            usuario: req.user?._id || null,
            fecha: new Date()
        });

        const actualizado = await insumo.save();

        res.json({
            message: `Stock ${operacion}do correctamente`,
            data: actualizado
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar el stock',
            error: error.message
        });
    }
};

exports.reactivarInsumo = async (req, res) => {
    try {
        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }

        const estadoAnterior = insumo.estado;

        insumo.estado = normalizarEstadoPorCantidad(insumo.cantidad, 'disponible');
        insumo.justificacion_baja = null;
        insumo.fecha_baja = null;
        insumo.eliminado_por = null;

        registrarMovimiento(insumo, {
            tipo: 'reactivacion',
            cantidad_anterior: insumo.cantidad,
            cantidad_nueva: insumo.cantidad,
            estado_anterior: estadoAnterior,
            estado_nuevo: insumo.estado,
            observacion: normalizarTexto(req.body?.motivo || 'Reactivacion manual del insumo.'),
            usuario: req.user?._id || null,
            fecha: new Date()
        });

        const reactivado = await insumo.save();

        res.json({
            message: 'Insumo reactivado correctamente',
            data: reactivado
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al reactivar el insumo',
            error: error.message
        });
    }
};

exports.getEstadisticas = async (req, res) => {
    try {
        const totalInsumos = await Insumos.countDocuments();
        const cantidadTotal = await Insumos.aggregate([
            { $group: { _id: null, total: { $sum: '$cantidad' } } }
        ]);

        const porCategoria = await Insumos.aggregate([
            { $group: { _id: '$categoria', cantidad: { $sum: '$cantidad' }, count: { $sum: 1 } } }
        ]);

        res.json({
            totalInsumos,
            cantidadTotal: cantidadTotal[0]?.total || 0,
            porCategoria
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener estadisticas',
            error: error.message
        });
    }
};

exports.getBajoStock = async (req, res) => {
    try {
        const limite = parseInt(req.query.limite, 10) || 5;
        const insumosBajos = await Insumos.find({ cantidad: { $lte: limite }, estado: { $ne: 'eliminado' } })
            .sort({ cantidad: 1 });

        res.json({
            insumos: insumosBajos.map(corregirInsumo),
            limite,
            total: insumosBajos.length,
            data: insumosBajos
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener insumos de bajo stock',
            error: error.message
        });
    }
};

exports.getAlertasStock = async (req, res) => {
    try {
        const UMBRAL_CRITICO = parseInt(req.query.umbral, 10) || 5;

        const insumosBajos = await Insumos.find({
            cantidad: { $lte: UMBRAL_CRITICO },
            estado: { $ne: 'eliminado' }
        })
            .select('id_insumo codigo NombProducto cantidad categoria ubicacion imagenUrl estado')
            .sort({ cantidad: 1 });

        return res.status(200).json({
            ok: true,
            total_alertas: insumosBajos.length,
            fecha_reporte: new Date().toLocaleString(),
            criterio: `Insumos con ${UMBRAL_CRITICO} unidades o menos.`,
            data: insumosBajos
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Error al generar el reporte de stock.',
            error: error.message
        });
    }
};

exports.autoAsignarImagenes = async (req, res) => {
    try {
        if (!req.user || !['admin', 'administrador', 'administrativo'].includes(req.user.tipo_rol.toLowerCase())) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const insumosSnImagen = await Insumos.find({ 
            $or: [ { imagenUrl: { $exists: false } }, { imagenUrl: "" } ],
            estado: { $ne: 'eliminado' }
        });

        if (insumosSnImagen.length === 0) {
            return res.json({ message: "Todo el catÃ¡logo ya cuenta con imÃ¡genes.", procesados: 0, actualizados: 0 });
        }

        let actualizados = 0;
        
        for (const insumo of insumosSnImagen) {
            // Busqueda mÃ¡s precisa usando Google Images con googlethis
            const query = insumo.NombProducto;
            
            try {
                // PequeÃ±o delay de 500-1500ms para evitar bloqueos por rate-limit de Google al procesar cientos masivamente
                await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
                
                const images = await google.image(query, { safe: false });
                if (images && images.length > 0) {
                    insumo.imagenUrl = images[0].url;
                    await insumo.save();
                    actualizados++;
                }
            } catch(e) {
                console.warn(`Error buscando imagen en Google para ${query}:`, e.message);
            }
        }

        res.json({
            message: "Auto-asignaciÃ³n inteligente completada con Google Images.",
            procesados: insumosSnImagen.length,
            actualizados: actualizados
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno en auto-asignaciÃ³n', error: error.message });
    }
};


/**
 * @route PATCH /api/insumos/:id/mal-estado
 * @desc Marca un insumo como 'mal_estado' con observacion descriptiva.
 */
exports.marcarMalEstado = async (req, res) => {
    try {
        if (!req.user || !ROLES_AUTORIZADOS.includes(req.user.tipo_rol)) {
            return res.status(403).json({ message: 'No autorizado.' });
        }
        const { observacion } = req.body;
        if (!observacion || observacion.trim().length < 5) {
            return res.status(400).json({ message: 'Se requiere una observacion (min. 5 caracteres).' });
        }
        const insumo = await Insumos.findById(req.params.id);
        if (!insumo) return res.status(404).json({ message: 'Insumo no encontrado.' });
        const estadoAnterior = insumo.estado;
        insumo.estado = 'mal_estado';
        insumo.observacion_estado = observacion.trim();
        registrarMovimiento(insumo, {
            tipo: 'edicion', cantidad_anterior: insumo.cantidad, cantidad_nueva: insumo.cantidad,
            estado_anterior: estadoAnterior, estado_nuevo: 'mal_estado',
            observacion: 'Marcado en mal estado: ' + observacion.trim(),
            usuario: req.user?._id || null, fecha: new Date()
        });
        const actualizado = await insumo.save();
        res.json({ message: 'Insumo "' + actualizado.NombProducto + '" marcado como en mal estado.', data: actualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar estado del insumo.', error: error.message });
    }
};

