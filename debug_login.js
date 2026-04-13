const mongoose = require('mongoose');

// Connection string
const MONGODB_URI = 'mongodb+srv://FranlyJavier:1004046606@clusterinventarioiee.6y4rj.mongodb.net/InventarioIEE?retryWrites=true&w=majority&appName=ClusterInventarioIEE';

async function debugLogin() {
    try {
        console.log('🔍 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado exitosamente');

        const db = mongoose.connection.db;
        const usuarios = db.collection('usuarios');

        // 1. Contar usuarios totales
        const totalUsers = await usuarios.countDocuments();
        console.log(`📊 Total usuarios en BD: ${totalUsers}`);

        // 2. Buscar usuario exacto
        const targetEmail = 'sasa@utn.ac.cr';
        console.log(`\n🔍 Buscando usuario con email: ${targetEmail}`);
        
        const exactUser = await usuarios.findOne({ correo_electronico: targetEmail });
        if (exactUser) {
            console.log('✅ Usuario encontrado con email exacto');
            console.log(`   Nombre: ${exactUser.nombre_completo}`);
            console.log(`   Estado: ${exactUser.estado}`);
            console.log(`   Carrera: ${exactUser.carrera}`);
            console.log(`   Rol: ${exactUser.tipo_rol}`);
        } else {
            console.log('❌ Usuario NO encontrado con email exacto');
        }

        // 3. Búsqueda case-insensitive
        console.log(`\n🔍 Búsqueda case-insensitive...`);
        const caseInsensitiveUser = await usuarios.findOne({
            correo_electronico: { $regex: targetEmail, $options: 'i' }
        });
        
        if (caseInsensitiveUser) {
            console.log('✅ Usuario encontrado con búsqueda case-insensitive');
            console.log(`   Email almacenado: "${caseInsensitiveUser.correo_electronico}"`);
            console.log(`   Email buscado: "${targetEmail}"`);
            console.log(`   ¿Coinciden?: "${caseInsensitiveUser.correo_electronico}" === "${targetEmail}" = ${caseInsensitiveUser.correo_electronico === targetEmail}`);
        } else {
            console.log('❌ Usuario NO encontrado ni con búsqueda case-insensitive');
        }

        // 4. Buscar usuarios con texto similar
        console.log(`\n🔍 Buscando usuarios que contengan "sasa"...`);
        const similarUsers = await usuarios.find({
            correo_electronico: { $regex: 'sasa', $options: 'i' }
        }).toArray();

        if (similarUsers.length > 0) {
            console.log(`✅ Encontrados ${similarUsers.length} usuarios similares:`);
            similarUsers.forEach((user, i) => {
                console.log(`   ${i+1}. "${user.correo_electronico}" - Estado: ${user.estado}`);
            });
        } else {
            console.log('❌ No se encontraron usuarios similares');
        }

        // 5. Mostrar todos los usuarios (limitado)
        console.log(`\n📋 Primeros 5 usuarios en la BD:`);
        const allUsers = await usuarios.find({}).limit(5).toArray();
        allUsers.forEach((user, i) => {
            console.log(`   ${i+1}. "${user.correo_electronico}" - ${user.nombre_completo} - ${user.estado}`);
        });

        // 6. Verificar el patrón de email
        console.log(`\n🔍 Verificando patrón de email...`);
        const emailPattern = /^[\w-\.]+@(est\.utn\.ac\.cr|utn\.ac\.cr)$/;
        console.log(`   Patrón: ${emailPattern}`);
        console.log(`   Email "sasa@utn.ac.cr" coincide: ${emailPattern.test(targetEmail)}`);
        console.log(`   Email "SASA@UTN.AC.CR" coincide: ${emailPattern.test('SASA@UTN.AC.CR')}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔚 Conexión cerrada');
        process.exit(0);
    }
}

debugLogin();
