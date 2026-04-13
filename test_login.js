// Test login endpoint
const http = require('http');

const testData = {
    correo_electronico: 'sasa@utn.ac.cr',
    contrasena: 'utn123456'
};

const postData = JSON.stringify(testData);

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/usuarios/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🔍 Testing login with:', testData);
console.log('📡 Sending request to http://localhost:4000/api/usuarios/login');

const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📊 Status Text: ${res.statusMessage}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📦 Response:', data);
        try {
            const jsonData = JSON.parse(data);
            console.log('✅ Parsed JSON:', jsonData);
        } catch (e) {
            console.log('❌ Failed to parse JSON:', e.message);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
    console.log('💡 Make sure the backend server is running on port 4000');
});

req.write(postData);
req.end();
