const mongoose = require('mongoose');
const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventarioEE';

const usuarioSchema = new mongoose.Schema({
    id_usuario: Number,
    cedula: {type: String, unique: true},
    nombre_completo: String,
    correo_electronico: {type: String, unique: true},
    hash_contraseña: String,
    tipo_rol: String,
    estado: String,
    carrera: String,
    codigo_barras: {type: String, sparse: true}
});

const Usuario = mongoose.model('Usuario_Verify', usuarioSchema, 'usuarios');

async function verify() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to DB');

        // Cleanup any old test data
        await Usuario.deleteMany({ correo_electronico: { $in: ['v1@utn.ac.cr', 'v2@utn.ac.cr'] } });

        const u1 = new Usuario({
            id_usuario: Date.now(),
            cedula: '999888777',
            nombre_completo: 'Verify 1',
            correo_electronico: 'v1@utn.ac.cr',
            hash_contraseña: 'abc',
            tipo_rol: 'estudiante',
            estado: 'activo',
            carrera: 'N/A'
        });
        await u1.save();
        console.log('User 1 created successfully');

        const u2 = new Usuario({
            id_usuario: Date.now() + 10,
            cedula: '999888778',
            nombre_completo: 'Verify 2',
            correo_electronico: 'v2@utn.ac.cr',
            hash_contraseña: 'abc',
            tipo_rol: 'estudiante',
            estado: 'activo',
            carrera: 'N/A'
        });
        await u2.save();
        console.log('User 2 created successfully');

        console.log('✅ Success: Multiple users created without barcodes!');
        
        // Final cleanup
        await Usuario.deleteMany({ correo_electronico: { $in: ['v1@utn.ac.cr', 'v2@utn.ac.cr'] } });
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed:', e.message);
        process.exit(1);
    }
}

verify();
