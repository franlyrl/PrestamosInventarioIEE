const mongoose = require('mongoose');
const ListaEspera = require('./src/models/listaEspera');

async function removeTest() {
    try {
        await mongoose.connect('mongodb://localhost:27017/practicaprofesional'); // adjust if different

        await ListaEspera.deleteMany({}); // remove all for testing
        console.log('Test listaEspera removed');
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
}

removeTest();