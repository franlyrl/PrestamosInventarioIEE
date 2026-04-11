// Script para generar imágenes de componentes usando Canvas API
function generateComponentImages() {
    const components = [
        { name: 'arduino-uno', text: 'Arduino UNO', color: '#f093fb' },
        { name: 'arduino-nano', text: 'Arduino Nano', color: '#f093fb' },
        { name: 'esp32-devkit', text: 'ESP32 DevKit', color: '#667eea' },
        { name: 'esp8266-nodemcu', text: 'ESP8266 NodeMCU', color: '#667eea' },
        { name: 'dht11-sensor', text: 'DHT11 Sensor', color: '#4facfe' },
        { name: 'dht22-sensor', text: 'DHT22 Sensor', color: '#4facfe' },
        { name: 'hc-sr04-ultrasonic', text: 'HC-SR04 Ultrasonic', color: '#4facfe' },
        { name: 'hc-sr501-pir', text: 'HC-SR501 PIR', color: '#4facfe' },
        { name: 'led-5mm-red', text: 'LED 5mm', color: '#ff6b6b' },
        { name: 'led-rgb-ws2812b', text: 'LED RGB WS2812B', color: '#ff6b6b' },
        { name: 'lcd-16x2', text: 'LCD 16x2', color: '#4facfe' },
        { name: 'sg90-servo', text: 'SG90 Servo', color: '#667eea' },
        { name: 'resistor-1k-ohm', text: 'Resistencia 1K', color: '#fa709a' },
        { name: 'capacitor-100uf-electrolytic', text: 'Capacitor 100uF', color: '#30cfd0' },
        { name: 'capacitor-ceramic-104', text: 'Capacitor 104', color: '#30cfd0' },
        { name: 'diode-1n4007', text: 'Diodo 1N4007', color: '#ff6b6b' },
        { name: 'transistor-bc547', text: 'Transistor BC547', color: '#30cfd0' },
        { name: 'soldering-wire', text: 'Estaño Soldadura', color: '#8e2de2' },
        { name: 'thermal-paste', text: 'Pasta Térmica', color: '#8e2de2' },
        { name: 'soldering-flux', text: 'Flux Soldadura', color: '#8e2de2' },
        { name: 'digital-multimeter', text: 'Multímetro', color: '#636363' },
        { name: 'soldering-iron-station', text: 'Soldador', color: '#636363' },
        { name: 'electronic-pliers', text: 'Pinza', color: '#636363' },
        { name: 'electronic-component-default', text: 'Componente', color: '#667eea' }
    ];

    components.forEach(comp => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');

        // Fondo con gradiente
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, comp.color);
        gradient.addColorStop(1, adjustColor(comp.color, -20));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);

        // Borde redondeado
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        roundRect(ctx, 10, 10, 380, 280, 15);
        ctx.stroke();

        // Texto principal
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(comp.text, 200, 150);

        // Icono simple
        ctx.font = '48px Arial';
        ctx.fillText('0', 200, 100);

        // Convertir a imagen y descargar
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = comp.name + '.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    });
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Auto-generar imágenes al cargar
window.generateComponentImages = generateComponentImages;
console.log('Generador de imágenes de componentes cargado. Ejecuta generateComponentImages() para crear las imágenes.');
