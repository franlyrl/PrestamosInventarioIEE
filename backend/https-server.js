const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');

// Opciones para certificado auto-firmado (desarrollo)
const options = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'server.crt'))
};

const PORT = process.env.HTTPS_PORT || 443;

// Crear servidor HTTPS
https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 Servidor HTTPS corriendo en https://0.0.0.0:${PORT}`);
    console.log(`🔒 Acceso local: https://192.168.0.9:${PORT}`);
    console.log('🔒 Monitoreando peticiones con Morgan...');
});

// Mantener servidor HTTP también para redirección
const http = require('http');
const HTTP_PORT = process.env.PORT || 4000;

http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
}).listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`🌐 Servidor HTTP redirigiendo a HTTPS en puerto ${HTTP_PORT}`);
});
