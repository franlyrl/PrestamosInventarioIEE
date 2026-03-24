const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorMiddleware');

require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARES DE ENTRADA (Configuración inicial) ---
app.use(cors());
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
    app.listen(PORT, () => {
        console.log(` Servidor corriendo en http://localhost:${PORT}`);
        console.log(' Monitoreando peticiones con Morgan...');
    });
}

module.exports = app;