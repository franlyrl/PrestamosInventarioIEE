console.log(' Cargando server.js...');
const app = require('./app');
console.log(' app.js cargado, typeof app:', typeof app);
const connectDB = require('./config/db');
const { ensureAdmin } = require('./utils/adminSeeder');

// 1. Primero configuramos el puerto
const PORT = process.env.PORT || 4000;

// 2. Conectamos a la base de datos ANTES de arrancar el servidor
connectDB().then(async () => {
    // 2.1. Asegurar que exista un administrador (Auto-Seeding)
    await ensureAdmin();

    // 3. Solo si la DB conecta, encendemos el servidor
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log('✅ Base de datos y servidor listos');
    });
}).catch(err => {
    console.error('❌ No se pudo iniciar el proyecto:', err);
});