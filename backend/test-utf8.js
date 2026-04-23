#!/usr/bin/env node

/**
 * Script para probar codificación UTF-8 en el backend
 */

const http = require('http');

const testData = {
    nombre: "María González",
    descripcion: "Órdenes de electrónica con ñ y tildes",
    observaciones: "El análisis técnico está completó. ¡Funciona!",
    mensaje: "¿Qué tal? Está bien la conexión áéíóú"
};

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/test-utf8',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8'
    }
};

const req = http.request(options, (res) => {
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        
        // Verificar que los caracteres UTF-8 estén intactos
        const hasUTF8Chars = data.includes('María') && 
                           data.includes('González') && 
                           data.includes('Órdenes') && 
                           data.includes('electrónica') && 
                           data.includes('completó') && 
                           data.includes('¿Qué');
        
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(JSON.stringify(testData));
req.end();

