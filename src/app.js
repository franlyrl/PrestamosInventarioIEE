const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config();

const app = express();

// middlewares básicos
app.use(cors());
app.use(helmet());
app.use(express.json());

// prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando ✅' });
});

module.exports = app;


