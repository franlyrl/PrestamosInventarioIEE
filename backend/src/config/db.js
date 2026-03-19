const mongoose = require('mongoose');

const connectDB = async (retries = 5, delayMs = 2000) => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.URI || 'mongodb://127.0.0.1:27017/inventarioEE';
  if (!mongoUri) {
    throw new Error('Falta MONGO_URI en el archivo .env (o MONGO_URL/URI).');
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Conexión a MongoDB exitosa');
      return;
    } catch (error) {
      console.error(`❌ Intento ${attempt}/${retries} falló:`, error.message);
      if (attempt === retries) {
        throw new Error(`No se pudo conectar a MongoDB tras ${retries} intentos. Asegúrate de arrancar MongoDB o validar MONGO_URI.`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = connectDB;