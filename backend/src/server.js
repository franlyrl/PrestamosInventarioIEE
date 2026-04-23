const app = require('./app');
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
    });
}).catch(err => {
    console.error('❌ No se pudo iniciar el proyecto:', err);
});