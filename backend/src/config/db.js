const mongoose = require('mongoose');

const connectDB = async (retries = 5, delayMs = 2000) => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.URI || 'mongodb://127.0.0.1:27017/inventarioEE';

  console.log('🔍 Intentando conectar a MongoDB con URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Oculta password

  if (!mongoUri) {
    throw new Error('Falta MONGO_URI en el archivo .env (o MONGO_URL/URI).');
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(' Conexión a MongoDB exitosa');
      console.log(' Base de datos conectada:', conn.connection.name);
      console.log(' Host:', conn.connection.host);
      console.log(' Puerto:', conn.connection.port);

      // Verificar si podemos escribir en la base de datos
      const testDoc = { test: 'connection', date: new Date() };
      await conn.connection.db.collection('test').insertOne(testDoc);
      await conn.connection.db.collection('test').deleteOne(testDoc);
      console.log('✅ Conexión de lectura/escritura verificada');

      return;
    } catch (error) {
      console.error(`❌ Intento ${attempt}/${retries} falló:`, error.message);
      console.error('🔍 Error completo:', error);
      if (attempt === retries) {
        throw new Error(`No se pudo conectar a MongoDB tras ${retries} intentos. Asegúrate de arrancar MongoDB o validar MONGO_URI.`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = connectDB;