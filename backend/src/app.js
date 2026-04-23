const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorMiddleware');

require('dotenv').config();

const app = express();

// Importar modelos para búsqueda de coincidencias
const Insumo = require('./models/insumos');
const Activo = require('./models/activos');


// --- 1. MIDDLEWARES DE ENTRADA (Configuración inicial) ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:4000', 'http://127.0.0.1:5173', 'http://10.90.29.31:3000', 'http://10.90.29.31:4000', 'http://10.90.29.31:5173', 'http://192.168.0.9:3000', 'http://192.168.0.9:5173', 'https://192.168.0.9:3000', 'https://192.168.0.9:5173', 'https://monsoon-aim-mashed.ngrok-free.dev', 'https://*.ngrok-free.dev', 'https://*.ngrok.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With'],
    credentials: true
}));
app.use(helmet());

// Middleware para asegurar codificación UTF-8
app.use((req, res, next) => {
    // Para respuestas JSON
    if (req.accepts('json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    // Para respuestas HTML
    else if (req.accepts('html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    // Para texto plano
    else if (req.accepts('text')) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    // Por defecto para cualquier otro contenido
    else {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    next();
});

// Middleware para capturar errores de JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ [JSON ERROR] Error parsing JSON:', err.message);
        console.error('❌ [JSON ERROR] Body recibido:', err.body);
        return res.status(400).json({ message: 'JSON inválido', error: err.message });
    }
    next();
});

app.use(express.json({ strict: false, limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Permite leer formularios
app.use(morgan('dev'));

// Middleware de debugging DESPUÉS del parsing para ver qué llegó
app.use((req, res, next) => {
    if (req.method === 'POST' && req.url.includes('/solicitudes')) {
        if (req.body) {
        }
    }
    next();
});

// Middleware para servir archivos estáticos (imágenes subidas)
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Crear directorio uploads si no existe
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- 2. RUTAS DE LA API ---
app.use('/api/usuarios', require('./routes/usuariosRoutes'));
app.use('/api/activos', require('./routes/activosRoutes'));
app.use('/api/insumos', require('./routes/insumosRoutes'));
app.use('/api/solicitudes', require('./routes/solicitudesRoutes'));
app.use('/api/historial-usuarios', require('./routes/UsuariosHistorialRoutes'));
app.use('/api/listaEspera', require('./routes/listaEsperaRoutes'));
app.use('/api/kardex', require('./routes/kardexRoutes'));
app.use('/api/estadisticas', require('./routes/estadisticasRoutes'));
app.use('/api/cuatrimestre', require('./routes/cuatrimestreRoutes'));

// --- 3. RUTAS PÚBLICAS Y PRUEBAS ---
app.post('/api/test-utf8', (req, res) => {
    
    const response = {
        recibido: req.body,
        procesado: {
            nombre: req.body.nombre || '',
            descripcion: req.body.descripcion || '',
            observaciones: req.body.observaciones || '',
            mensaje: req.body.mensaje || ''
        },
        mensaje: "Datos procesados correctamente con caracteres UTF-8: ñ, á, é, í, ó, ú, Á, É, Í, Ó, Ú, ¿, ¡",
        timestamp: new Date().toISOString()
    };
    
    res.status(200).json(response);
});

app.post('/api/upload', (req, res) => {
    
    // Usar multer para manejar la subida de archivos
    const multer = require('multer');
    const upload = multer({ 
        dest: 'uploads/',
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB límite
        }
    }).single('imagen');
    
    upload(req, res, (err) => {
        if (err) {
            console.error('❌ Error al subir archivo:', err);
            return res.status(500).json({ 
                error: 'Error al subir archivo',
                details: err.message 
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No se proporcionó ningún archivo' 
            });
        }
        
        
        // Construir URL pública del archivo
        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({ 
            success: true,
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    });
});

app.post('/api/upload/imagenes', (req, res) => {
    
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    // Crear directorio específico para imágenes de items si no existe
    const itemsImagesDir = path.join(__dirname, '..', 'uploads', 'items');
    if (!fs.existsSync(itemsImagesDir)) {
        fs.mkdirSync(itemsImagesDir, { recursive: true });
    }
    
    // Configurar almacenamiento
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, itemsImagesDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, 'item-' + uniqueSuffix + ext);
        }
    });
    
    const upload = multer({ 
        storage: storage,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB límite por imagen
        },
        fileFilter: (req, file, cb) => {
            // Aceptar formatos comunes de cámara/celular.
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
            const ext = path.extname(file.originalname).toLowerCase();
            
            
            if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error(`Solo se permiten imágenes JPG, PNG o WEBP. Recibido: ${file.mimetype}`), false);
            }
        }
    }).array('imagenes', 50); // Aceptar hasta 50 archivos en el campo 'imagenes'
    
    upload(req, res, async (err) => {
        if (err) {
            console.error('❌ Error al subir archivos:', err);
            return res.status(500).json({ 
                error: 'Error al subir archivos',
                details: err.message 
            });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                error: 'No se proporcionó ningún archivo' 
            });
        }
        
        
        const tipoCarga = ((req.body?.tipo || req.body?.modulo || 'insumo') + '').toLowerCase();
        const esActivo = tipoCarga.includes('activo');


        // Analizar nombres de archivos y buscar coincidencias con items sin foto
        const sugerencias = [];
        
        for (const file of req.files) {
            // Extraer nombre sin extensión y crear múltiples variantes de búsqueda
            const nombreOriginal = path.basename(file.originalname, path.extname(file.originalname));
            
            // Variantes de búsqueda para mejorar coincidencias
            const variantes = [
                nombreOriginal, // Original exacto
                nombreOriginal.replace(/[-_]/g, ' '), // Guiones a espacios
                nombreOriginal.replace(/\s+/g, ' ').trim(), // Múltiples espacios a uno
                nombreOriginal.toLowerCase(), // Todo minúsculas
                nombreOriginal.replace(/[-_]/g, ' ').toLowerCase(), // Guiones a espacios + minúsculas
                nombreOriginal.replace(/\s+/g, ' ').trim().toLowerCase(), // Espacios normalizados + minúsculas
            ];
            
            // Eliminar duplicados
            const variantesUnicas = [...new Set(variantes)];
            
            
            // Primero intentar búsqueda simple con el nombre original
            const busquedaSimple = esActivo
                ? await Activo.find({
                    $or: [
                        { marca: { $regex: nombreOriginal, $options: 'i' } },
                        { modelo: { $regex: nombreOriginal, $options: 'i' } },
                        { numActivo: { $regex: nombreOriginal, $options: 'i' } },
                        { numSerie: { $regex: nombreOriginal, $options: 'i' } }
                    ]
                }).limit(10)
                : await Insumo.find({
                    $or: [
                        { NombProducto: { $regex: nombreOriginal, $options: 'i' } },
                        { codigo: { $regex: nombreOriginal, $options: 'i' } }
                    ]
                }).limit(10);
            
            
            // Si la búsqueda simple no funciona, probar con variantes
            let coincidencias = busquedaSimple;
            
            if (coincidencias.length === 0) {
                
                // Crear condiciones de búsqueda más flexibles
                const crearCondiciones = (variantes, campos) => {
                    const condiciones = [];
                    for (const variante of variantesUnicas) {
                        for (const campo of campos) {
                            condiciones.push({ [campo]: { $regex: variante, $options: 'i' } });
                        }
                    }
                    return condiciones;
                };
                
                coincidencias = esActivo
                    ? await Activo.find({
                        $or: crearCondiciones(variantesUnicas, ['marca', 'modelo', 'numActivo', 'numSerie'])
                    }).limit(15)
                    : await Insumo.find({
                        $or: crearCondiciones(variantesUnicas, ['NombProducto', 'codigo'])
                    }).limit(15);
                
            }
            
            
            // Mostrar detalles de coincidencias encontradas
            if (coincidencias.length > 0) {
            } else {
                // Mostrar una muestra de insumos/activos existentes para debug
                const muestra = esActivo 
                    ? await Activo.find().limit(3).select('marca modelo numActivo numSerie')
                    : await Insumo.find().limit(3).select('NombProducto codigo');
            }
            
            sugerencias.push({
                filename: file.filename,
                originalname: file.originalname,
                url: `/uploads/items/${file.filename}`,
                nombreAnalizado: nombreOriginal,
                tipo: esActivo ? 'activo' : 'insumo',
                coincidencias: coincidencias.map(i => ({
                    id: i._id,
                    codigo: esActivo ? (i.numActivo || i.numSerie) : i.codigo,
                    nombre: esActivo ? `${i.marca || ''} ${i.modelo || ''}`.trim() : i.NombProducto,
                    categoria: i.categoria
                }))
            });
        }
        
        res.json({ 
            success: true,
            cantidad: req.files.length,
            sugerencias: sugerencias
        });
    });
});

// Endpoint para asociar imagen a insumo o activo específico
app.post('/api/upload/asociar', async (req, res) => {

    try {
        const { insumoId, activoId, imageUrl, tipo } = req.body;
        const itemId = insumoId || activoId;

        if (!itemId || !imageUrl) {
            return res.status(400).json({
                error: 'Se requiere insumoId o activoId, e imageUrl'
            });
        }

        // Determinar tipo si no se especificó
        let tipoItem = tipo;
        if (!tipoItem) {
            // Inferir por el campo usado en la petición
            tipoItem = activoId ? 'activo' : 'insumo';
        }

        let itemActualizado;
        let nombreItem;
        let codigoItem;

        if (tipoItem === 'activo') {
            // Actualizar activo
            itemActualizado = await Activo.findByIdAndUpdate(
                itemId,
                { imagenUrl: imageUrl },
                { new: true }
            );
            nombreItem = itemActualizado ? `${itemActualizado.marca || ''} ${itemActualizado.modelo || ''}`.trim() : null;
            codigoItem = itemActualizado ? (itemActualizado.numActivo || itemActualizado.numSerie) : null;
        } else {
            // Actualizar insumo (default)
            itemActualizado = await Insumo.findByIdAndUpdate(
                itemId,
                { imagenUrl: imageUrl },
                { new: true }
            );
            nombreItem = itemActualizado ? itemActualizado.NombProducto : null;
            codigoItem = itemActualizado ? itemActualizado.codigo : null;
        }

        if (!itemActualizado) {
            return res.status(404).json({
                error: `${tipoItem === 'activo' ? 'Activo' : 'Insumo'} no encontrado`
            });
        }


        res.json({
            success: true,
            mensaje: 'Imagen asociada correctamente',
            item: {
                id: itemActualizado._id,
                tipo: tipoItem,
                codigo: codigoItem,
                nombre: nombreItem,
                imagenUrl: itemActualizado.imagenUrl
            }
        });
    } catch (error) {
        console.error('❌ Error al asociar imagen:', error);
        res.status(500).json({
            error: 'Error al asociar imagen',
            details: error.message
        });
    }
});

app.get('/api', (req, res) => {
    res.json({ message: 'API del Laboratorio funcionando ' });
});

// Servir frontend estático desde carpeta frontend
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

// Fallback para rutas del frontend (SPA)
app.use((req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint no encontrado' });
    }
    res.sendFile(path.join(frontendPath, 'login.html'));
});

// --- 4. MIDDLEWARE DE SALIDA (Manejo de errores) ---
// ¡Importante! No pongas ninguna ruta después de esto, no funcionaría.
app.use(errorHandler);

// --- 5. ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 4000;
// Solo hacemos el listen si este archivo es el principal
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
    });
}

module.exports = app;
