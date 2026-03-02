    const app = require('./app');
    const connectDB = require('./config/db');

// 1. Primero configuramos el puerto
const PORT = process.env.PORT || 4000;

// 2. Conectamos a la base de datos ANTES de arrancar el servidor
connectDB().then(() => {
    // 3. Solo si la DB conecta, encendemos el servidor
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log('✅ Base de datos y servidor listos');
    });
}).catch(err => {
    console.error('❌ No se pudo iniciar el proyecto:', err);
});