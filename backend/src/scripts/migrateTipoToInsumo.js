/**
 * Script de migración: cambiar tipo de 'consumible' a 'insumo'
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventarioEE';

async function migrar() {
    try {
        await mongoose.connect(MONGO_URI);

        const db = mongoose.connection.db;
        const collection = db.collection('insumos');

        // Buscar documentos con tipo 'consumible'
        const consumibles = await collection.find({ tipo: 'consumible' }).toArray();

        if (consumibles.length === 0) {
            return;
        }

        // Actualizar todos de 'consumible' a 'insumo'
        const result = await collection.updateMany(
            { tipo: 'consumible' },
            { $set: { tipo: 'insumo' } }
        );


    } catch (error) {
        console.error('❌ Error en migración:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrar();
