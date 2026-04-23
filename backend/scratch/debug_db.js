const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventarioEE';
        await mongoose.connect(uri);
        
        const db = mongoose.connection.db;
        const collection = db.collection('usuarios');
        
        const indexes = await collection.indexes();
        
        const users = await collection.find().sort({ _id: -1 }).limit(5).toArray();
        users.forEach(u => {
        });
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
