const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventarioEE';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        
        const db = mongoose.connection.db;
        const collection = db.collection('usuarios');
        
        console.log('\n--- INDEXES ---');
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));
        
        console.log('\n--- RECENT USERS (Last 5) ---');
        const users = await collection.find().sort({ _id: -1 }).limit(5).toArray();
        users.forEach(u => {
            console.log(`ID: ${u.id_usuario}, Ced: ${u.cedula}, Email: ${u.correo_electronico}, Role: ${u.tipo_rol}`);
        });
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
