const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuarios');

/**
 * Verifica si existe un administrador en la base de datos.
 * Si no existe, crea el usuario administrador por defecto.
 */
const ensureAdmin = async () => {
    try {
        
        const emailDefault = 'admin@utn.ac.cr';
        const passwordDefault = 'utn1234567';

        // 1. Buscar si hay ALGÚN administrador (no solo el de por defecto)
        const adminExistente = await Usuario.findOne({ tipo_rol: 'admin' });

        if (adminExistente) {
            return;
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(passwordDefault, salt);

        // Usamos insertOne directamente en la colección para evitar validaciones de middleware si fuera necesario,
        // pero mapeando los campos requeridos por el esquema.
        const nuevoAdmin = {
            id_usuario: Date.now(),
            cedula: '123456789',
            nombre_completo: 'Administrador Maestro',
            correo_electronico: emailDefault,
            hash_contraseña: hashedPw,
            tipo_rol: 'admin',
            estado: 'activo',
            estado_usuario: 'activo',
            carrera: 'N/A',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Lo creamos
        await Usuario.create(nuevoAdmin);


    } catch (error) {
        console.error('❌ [SEEDER] Error al inicializar el administrador:', error);
        // No detenemos el servidor por esto, pero lo registramos
    }
};

module.exports = { ensureAdmin };
