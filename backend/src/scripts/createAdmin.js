const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Usuario = require('../models/usuarios');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventarioEE');

        const email = 'admin@utn.ac.cr';
        const password = 'utn1234567';

        // Verificar si ya existe
        let admin = await Usuario.findOne({ correo_electronico: email });

        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(password, salt);

        if (admin) {
            await Usuario.updateOne({ correo_electronico: email }, {
                $set: {
                    hash_contraseña: hashedPw,
                    tipo_rol: 'admin',
                    estado: 'activo',
                    estado_usuario: 'activo'
                }
            });
        } else {
            await Usuario.collection.insertOne({
                id_usuario: Date.now(),
                cedula: '123456789',
                nombre_completo: 'Administrador Maestro',
                correo_electronico: email,
                hash_contraseña: hashedPw,
                tipo_rol: 'admin',
                estado: 'activo',
                estado_usuario: 'activo',
                codigo_barras: 'ADMIN-MASTER-01', // Valor único para el índice fantasma
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error al crear el administrador:', error);
        process.exit(1);
    }
};

createAdmin();
