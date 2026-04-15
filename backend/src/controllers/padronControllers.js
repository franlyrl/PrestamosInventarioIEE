const XLSX = require('xlsx');
const PadronEstudiantes = require('../models/padronEstudiantes');

/**
 * Normaliza una cédula: quita guiones, puntos y espacios.
 * Así '5-5678-9012', '5 5678 9012' y '556789012' son equivalentes.
 */
function normalizarCedula(valor) {
    if (!valor) return '';
    return String(valor).replace(/[\s\-\.]/g, '').trim();
}

// Mapeo flexible de nombres de columna del Excel
const COLUMN_MAP = {
    cedula:             ['cedula', 'cédula', 'cedula_identidad', 'id', 'identificacion', 'identificación'],
    nombre_completo:    ['nombre_completo', 'nombre completo', 'nombre', 'nombres', 'alumno', 'estudiante'],
    correo_estudiantil: ['correo_estudiantil', 'correo estudiantil', 'correo', 'email', 'correo_electronico', 'correo electronico'],
    estado:             ['estado', 'status', 'activo', 'estado_matricula'],
    carrera:            ['carrera', 'programa', 'plan', 'carrera_academica']
};

/**
 * Normaliza el valor de estado a 'activo' o 'inactivo'
 */
function normalizarEstado(valor) {
    if (!valor) return 'activo';
    const v = String(valor).toLowerCase().trim();
    if (['activo', 'active', '1', 'si', 'sí', 'yes', 'true', 'matriculado'].includes(v)) return 'activo';
    return 'inactivo';
}

/**
 * Normaliza la carrera al enum permitido
 */
function normalizarCarrera(valor) {
    const carreras = {
        'electronica': 'Ingeniería Electrónica',
        'electrónica': 'Ingeniería Electrónica',
        'ingeniería electrónica': 'Ingeniería Electrónica',
        'ingenieria electronica': 'Ingeniería Electrónica',
        'electrica': 'Ingeniería Eléctrica',
        'eléctrica': 'Ingeniería Eléctrica',
        'ingeniería eléctrica': 'Ingeniería Eléctrica',
        'ingenieria electrica': 'Ingeniería Eléctrica',
        'ti': 'Ingeniería en Tecnologías de Información',
        'tecnologias de informacion': 'Ingeniería en Tecnologías de Información',
        'tecnologías de información': 'Ingeniería en Tecnologías de Información',
        'ingeniería en tecnologías de información': 'Ingeniería en Tecnologías de Información',
        'ingenieria en tecnologias de informacion': 'Ingeniería en Tecnologías de Información',
        'produccion industrial': 'Ingeniería en Producción Industrial',
        'producción industrial': 'Ingeniería en Producción Industrial',
        'ingeniería en producción industrial': 'Ingeniería en Producción Industrial',
        'ingenieria en produccion industrial': 'Ingeniería en Producción Industrial',
    };
    if (!valor) return 'N/A';
    const v = String(valor).toLowerCase().trim();
    return carreras[v] || valor || 'N/A';
}

/**
 * Encuentra el valor de una columna usando el mapa flexible
 */
function getColValue(row, fieldName) {
    const aliases = COLUMN_MAP[fieldName] || [fieldName];
    const rowLower = {};
    for (const key of Object.keys(row)) {
        rowLower[key.toLowerCase().trim()] = row[key];
    }
    for (const alias of aliases) {
        if (rowLower[alias] !== undefined && rowLower[alias] !== null && rowLower[alias] !== '') {
            return String(rowLower[alias]).trim();
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
// POST /api/padron/importar
// ─────────────────────────────────────────────────────────────
exports.importarPadron = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió ningún archivo.' });
        }

        const cuatrimestre = req.body.cuatrimestre || null;
        const filename = (req.file.originalname || '').toLowerCase();

        // Detectar si es CSV para usar el parser correcto
        const esCSV = filename.endsWith('.csv') ||
                      req.file.mimetype === 'text/csv' || req.file.mimetype === 'text/plain';

        let rows = [];
        try {
            if (esCSV) {
                // Para CSV: leer como texto y parsear con xlsx en modo CSV
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer', codepage: 65001 });
                const sheetName = workbook.SheetNames[0];
                rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
            } else {
                // Para Excel (.xlsx, .xls)
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
            }
        } catch (parseErr) {
            return res.status(400).json({
                message: `No se pudo leer el archivo "${req.file.originalname}". Verificá que sea un archivo válido (.xlsx, .xls o .csv).`,
                error: parseErr.message
            });
        }

        if (!rows.length) {
            return res.status(400).json({ message: 'El archivo Excel está vacío o no tiene datos válidos.' });
        }

        const operaciones = [];
        const errores = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const fila = i + 2; // +2 porque la fila 1 es el encabezado

            const cedulaRaw         = getColValue(row, 'cedula');
            const cedula            = normalizarCedula(cedulaRaw); // sin guiones
            const nombre_completo   = getColValue(row, 'nombre_completo');
            const correo_estudiantil= (getColValue(row, 'correo_estudiantil') || '').toLowerCase();
            const estadoRaw         = getColValue(row, 'estado');
            const carreraRaw        = getColValue(row, 'carrera');

            // Validaciones mínimas
            if (!cedula || !correo_estudiantil) {
                errores.push({ fila, error: 'Faltan campos obligatorios: cédula o correo.' });
                continue;
            }
            if (!correo_estudiantil.includes('@')) {
                errores.push({ fila, cedula, error: `Correo inválido: "${correo_estudiantil}"` });
                continue;
            }

            const estado  = normalizarEstado(estadoRaw);
            const carrera = normalizarCarrera(carreraRaw);

            operaciones.push({
                updateOne: {
                    filter: { correo_estudiantil },
                    update: {
                        $set: {
                            cedula,
                            nombre_completo: nombre_completo || '',
                            correo_estudiantil,
                            estado,
                            carrera,
                            cuatrimestre_carga: cuatrimestre,
                            fecha_importacion: new Date()
                        }
                    },
                    upsert: true
                }
            });
        }

        let resultado = { upsertedCount: 0, modifiedCount: 0 };
        if (operaciones.length > 0) {
            resultado = await PadronEstudiantes.bulkWrite(operaciones, { ordered: false });
        }

        res.status(200).json({
            message: 'Importacion completada.',
            resumen: {
                total_filas:    rows.length,
                nuevos:         resultado.upsertedCount,
                actualizados:   resultado.modifiedCount,
                errores:        errores.length,
                detalle_errores: errores
            }
        });

    } catch (error) {
        console.error('Error en importarPadron:', error);
        res.status(500).json({ message: 'Error al procesar el archivo.', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/padron   → listar con filtros
// ─────────────────────────────────────────────────────────────
exports.getPadron = async (req, res) => {
    try {
        const { estado, carrera, q, page = 1, limit = 50 } = req.query;
        const filtro = {};

        if (estado)  filtro.estado  = estado;
        if (carrera) filtro.carrera = carrera;
        if (q) {
            filtro.$or = [
                { nombre_completo:   { $regex: q, $options: 'i' } },
                { correo_estudiantil:{ $regex: q, $options: 'i' } },
                { cedula:            { $regex: q, $options: 'i' } }
            ];
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await PadronEstudiantes.countDocuments(filtro);
        const datos = await PadronEstudiantes.find(filtro)
            .sort({ nombre_completo: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({ total, page: parseInt(page), limit: parseInt(limit), datos });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el padrón.', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/padron/estadisticas
// ─────────────────────────────────────────────────────────────
exports.getEstadisticasPadron = async (req, res) => {
    try {
        const [total, activos, inactivos, porCarrera] = await Promise.all([
            PadronEstudiantes.countDocuments(),
            PadronEstudiantes.countDocuments({ estado: 'activo' }),
            PadronEstudiantes.countDocuments({ estado: 'inactivo' }),
            PadronEstudiantes.aggregate([
                { $group: { _id: '$carrera', total: { $sum: 1 }, activos: { $sum: { $cond: [{ $eq: ['$estado','activo'] }, 1, 0] } } } },
                { $sort: { total: -1 } }
            ])
        ]);
        res.json({ total, activos, inactivos, porCarrera });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas.', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/padron/estado-padron  → indica si el padrón tiene datos
// PÚBLICO — usado en signup para mostrar aviso si el padrón está vacío
// ─────────────────────────────────────────────────────────────
exports.estadoPadron = async (req, res) => {
    try {
        const total   = await PadronEstudiantes.countDocuments();
        const activos = await PadronEstudiantes.countDocuments({ estado: 'activo' });
        res.json({ tieneData: total > 0, total, activos });
    } catch (error) {
        res.status(500).json({ tieneData: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/padron/buscar-cedula/:cedula
// ─────────────────────────────────────────────────────────────
exports.buscarPorCedula = async (req, res) => {
    try {
        const { cedula } = req.params;
        const cedulaNorm = normalizarCedula(cedula);

        if (!cedulaNorm || cedulaNorm.length < 5) {
            return res.status(400).json({ message: 'Cedula demasiado corta.' });
        }

        // Verificar primero si el padrón tiene datos
        const totalPadron = await PadronEstudiantes.countDocuments();
        if (totalPadron === 0) {
            return res.status(503).json({
                message: 'El padron de matricula aun no ha sido cargado. Contacta al administrador del laboratorio.',
                autorizado: false,
                padronVacio: true
            });
        }

        // Búsqueda robusta: 
        // 1. Coincidencia exacta con la cédula normalizada (ej: '556789012')
        // 2. Coincidencia flexible usando regex: permite guiones, espacios o puntos entre los números
        //    (Así '556789012' hace un match con '5-5678-9012' en la BD)
        const regexStr = cedulaNorm.split('').join('[\\s\\-\\.]*');
        
        const estudiante = await PadronEstudiantes.findOne({
            $or: [
                { cedula: cedulaNorm },
                { cedula: { $regex: `^${regexStr}$`, $options: 'i' } }
            ]
        }).lean();

        if (!estudiante) {
            return res.status(404).json({
                message: 'Cedula no encontrada en el padron de matriculados del cuatrimestre actual.',
                autorizado: false
            });
        }

        if (estudiante.estado === 'inactivo') {
            return res.status(403).json({
                message: 'Este estudiante no esta activo en el padron de matricula actual. Contacta al administrador del laboratorio.',
                autorizado: false
            });
        }

        res.json({
            autorizado: true,
            datos: {
                cedula:             estudiante.cedula,
                nombre_completo:    estudiante.nombre_completo,
                correo_estudiantil: estudiante.correo_estudiantil,
                carrera:            estudiante.carrera,
                estado:             estudiante.estado
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar en el padron.', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/padron/:id/estado  → cambiar estado individual
// ─────────────────────────────────────────────────────────────
exports.cambiarEstadoEstudiante = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['activo', 'inactivo'].includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido. Use activo o inactivo.' });
        }

        const actualizado = await PadronEstudiantes.findByIdAndUpdate(
            req.params.id,
            { estado },
            { new: true }
        );

        if (!actualizado) {
            return res.status(404).json({ message: 'Estudiante no encontrado en el padrón.' });
        }

        res.json({ message: `Estado actualizado a "${estado}".`, estudiante: actualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar estado.', error: error.message });
    }
};
