const mongoose = require('mongoose');
const Insumos = require('./src/models/insumos');
const ListaEspera = require('./src/models/listaEspera');

async function addToListaEspera() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/inventarioEE');

        // Find the insumo with 0 stock
        const insumo = await Insumos.findOne({ cantidad: 0 });
        if (!insumo) {
            console.log('No insumo with 0 stock found');
            return;
        }

        // Add to listaEspera
        const espera = new ListaEspera({
            usuario: '507f1f77bcf86cd799439011', // dummy user id
            insumo: insumo._id,
            cantidad_solicitada: 5
        });

        await espera.save();
        console.log('Added to listaEspera:', espera);
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
}

addToListaEspera();