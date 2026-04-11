const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorMiddleware');

require('dotenv').config();

const app = express();

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

// Middleware para servir archivos estáticos (imágenes subidas) con encabezados CORP correctos
app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path, stat) => {
        // Permitir acceso desde cualquier origen
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Configurar Cross-Origin-Resource-Policy para permitir acceso
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        
        // Configurar Cross-Origin-Embedder-Policy si es necesario
        res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
        
        // Cache control para imágenes
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 día
    }
}));

// Crear directorio uploads si no existe
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
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