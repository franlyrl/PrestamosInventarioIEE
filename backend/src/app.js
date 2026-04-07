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