/**
 * Script de migración: cambiar tipo de 'consumible' a 'insumo'
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventarioEE';

async function migrar() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('insumos');

        // Buscar documentos con tipo 'consumible'
        const consumibles = await collection.find({ tipo: 'consumible' }).toArray();
        console.log(`📊 Encontrados ${consumibles.length} documentos con tipo 'consumible'`);

        if (consumibles.length === 0) {
            console.log('✅ No hay documentos para migrar');
            return;
        }

        // Actualizar todos de 'consumible' a 'insumo'
        const result = await collection.updateMany(
            { tipo: 'consumible' },
            { $set: { tipo: 'insumo' } }
        );

        console.log(`✅ Migración completada:`);
        console.log(`   - Documentos modificados: ${result.modifiedCount}`);
        console.log(`   - Documentos coincidentes: ${result.matchedCount}`);

    } catch (error) {
        console.error('❌ Error en migración:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

migrar();
