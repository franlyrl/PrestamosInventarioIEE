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

console.log('✅ [DEBUG] app.js cargado - versión con endpoint /api/upload/imagenes');

// --- 1. MIDDLEWARES DE ENTRADA (Configuración inicial) ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:4000', 'http://127.0.0.1:5173', 'http://10.90.29.31:3000', 'http://10.90.29.31:4000', 'http://10.90.29.31:5173', 'http://192.168.0.9:3000', 'http://192.168.0.9:5173', 'https://192.168.0.9:3000', 'https://192.168.0.9:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With'],
    credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Permite leer formularios
app.use(morgan('dev'));

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
app.post('/api/upload', (req, res) => {
    console.log('📤 Petición de subida de archivo recibida');
    
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
        
        console.log('✅ Archivo subido:', req.file);
        
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
    console.log('📤 [DEBUG] POST /api/upload/imagenes - Headers:', req.headers['content-type']);
    console.log('📤 [DEBUG] Body keys:', Object.keys(req.body || {}));
    
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
            // Aceptar imágenes JPG/JPEG por MIME o extensión
            const allowedMimeTypes = ['image/jpeg', 'image/jpg'];
            const allowedExtensions = ['.jpg', '.jpeg'];
            const ext = path.extname(file.originalname).toLowerCase();
            
            console.log(`📁 [UPLOAD] Archivo: ${file.originalname} | MIME: ${file.mimetype} | Ext: ${ext}`);
            
            if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
                console.log(`✅ [UPLOAD] Aceptado: ${file.originalname}`);
                cb(null, true);
            } else {
                console.log(`❌ [UPLOAD] Rechazado: ${file.originalname} - MIME no permitido: ${file.mimetype}`);
                cb(new Error(`Solo se permiten imágenes JPG o JPEG. Recibido: ${file.mimetype}`), false);
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
        
        console.log('✅ Archivos subidos:', req.files.length);
        
        // Analizar nombres de archivos y buscar coincidencias con insumos sin foto
        const sugerencias = [];
        
        for (const file of req.files) {
            // Extraer nombre sin extensión y normalizar
            const nombreBase = path.basename(file.originalname, path.extname(file.originalname))
                .replace(/[-_]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
            
            console.log('🔍 Buscando coincidencias para:', nombreBase);
            
            // Buscar TODOS los insumos que coincidan por nombre o código
            // (incluye los que ya tienen foto para poder actualizarla)
            const insumosSinFoto = await Insumo.find({
                $or: [
                    { NombProducto: { $regex: nombreBase, $options: 'i' } },
                    { codigo: { $regex: nombreBase, $options: 'i' } }
                ]
            }).limit(10);
            
            console.log(`  → Encontrados ${insumosSinFoto.length} insumos sin foto`);
            
            sugerencias.push({
                filename: file.filename,
                originalname: file.originalname,
                url: `/uploads/items/${file.filename}`,
                nombreAnalizado: nombreBase,
                coincidencias: insumosSinFoto.map(i => ({
                    id: i._id,
                    codigo: i.codigo,
                    nombre: i.NombProducto,
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
    console.log('🔗 [DEBUG] POST /api/upload/asociar - Body:', req.body);

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

        console.log(`✅ Imagen asociada a ${tipoItem}:`, nombreItem || codigoItem);

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

app.get('/', (req, res) => {
    res.json({ message: 'API del Laboratorio funcionando ' });
});

// --- 4. MIDDLEWARE DE SALIDA (Manejo de errores) ---
// ¡Importante! No pongas ninguna ruta después de esto, no funcionaría.
app.use(errorHandler);

// --- 5. ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 4000;
// Solo hacemos el listen si este archivo es el principal
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(` Servidor corriendo en http://0.0.0.0:${PORT}`);
        console.log(` Acceso local: http://10.90.29.31:${PORT}`);
        console.log(' Monitoreando peticiones con Morgan...');
    });
}

module.exports = app;
