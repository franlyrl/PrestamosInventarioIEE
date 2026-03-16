const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.URI;
    if (!mongoUri) {
      throw new Error('Falta MONGO_URI en el archivo .env (o MONGO_URL/URI).');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Conexión a MongoDB exitosa');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;