const mongoose = require('mongoose');
const Solicitudes = require('../models/solicitudes');
const Counter = require('../models/counter');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prestamos';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);

        // 1. Obtener todas las solicitudes ordenadas por fecha de creación (ASC)
        const solicitudes = await Solicitudes.find().sort({ createdAt: 1 });
        
        if (solicitudes.length === 0) {
        } else {
            
            let count = 0;
            for (const s of solicitudes) {
                count++;
                s.folio = count;
                // Forzamos el guardado del folio
                await s.save();
            }

            // 2. Sincronizar el contador global
            await Counter.findByIdAndUpdate(
                { _id: 'solicitudes' },
                { seq: count },
                { upsert: true }
            );
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
}

migrate();
