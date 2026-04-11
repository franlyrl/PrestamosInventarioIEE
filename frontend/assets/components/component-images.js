// URLs temporales que funcionan sin CORS (placeholder con diseño)
const COMPONENT_IMAGES = {
    // Componentes Digitales
    'arduino-uno': 'https://picsum.photos/400/300?random=1&blur=2&grayscale&text=Arduino+UNO',
    'arduino-nano': 'https://picsum.photos/400/300?random=2&blur=2&grayscale&text=Arduino+Nano',
    'esp32': 'https://picsum.photos/400/300?random=3&blur=2&grayscale&text=ESP32+DevKit',
    'esp8266': 'https://picsum.photos/400/300?random=4&blur=2&grayscale&text=ESP8266+NodeMCU',
    'dht11': 'https://picsum.photos/400/300?random=5&blur=2&grayscale&text=DHT11+Sensor',
    'dht22': 'https://picsum.photos/400/300?random=6&blur=2&grayscale&text=DHT22+Sensor',
    'hc-sr04': 'https://picsum.photos/400/300?random=7&blur=2&grayscale&text=HC-SR04+Ultrasonic',
    'hc-sr501': 'https://picsum.photos/400/300?random=8&blur=2&grayscale&text=HC-SR501+PIR',
    'led': 'https://picsum.photos/400/300?random=9&blur=2&grayscale&text=LED+5mm',
    'led rgb': 'https://picsum.photos/400/300?random=10&blur=2&grayscale&text=LED+RGB',
    'lcd': 'https://picsum.photos/400/300?random=11&blur=2&grayscale&text=LCD+16x2',
    'servo': 'https://picsum.photos/400/300?random=12&blur=2&grayscale&text=SG90+Servo',
    
    // Componentes Analógicos
    'resistencia': 'https://picsum.photos/400/300?random=13&blur=2&grayscale&text=Resistencia+1K',
    'capacitor electrolitico': 'https://picsum.photos/400/300?random=14&blur=2&grayscale&text=Capacitor+100uF',
    'capacitor ceramico': 'https://picsum.photos/400/300?random=15&blur=2&grayscale&text=Capacitor+104',
    'diodo': 'https://picsum.photos/400/300?random=16&blur=2&grayscale&text=Diodo+1N4007',
    'transistor': 'https://picsum.photos/400/300?random=17&blur=2&grayscale&text=Transistor+BC547',
    
    // Consumibles
    'estaño': 'https://picsum.photos/400/300?random=18&blur=2&grayscale&text=Estaño+Soldadura',
    'pasta termica': 'https://picsum.photos/400/300?random=19&blur=2&grayscale&text=Pasta+Termica',
    'flux': 'https://picsum.photos/400/300?random=20&blur=2&grayscale&text=Flux+Soldadura',
    
    // Herramientas
    'multimetro': 'https://picsum.photos/400/300?random=21&blur=2&grayscale&text=Multimetro',
    'soldador': 'https://picsum.photos/400/300?random=22&blur=2&grayscale&text=Soldador',
    'pinza': 'https://picsum.photos/400/300?random=23&blur=2&grayscale&text=Pinza',
    
    // Imagen por defecto
    'default': 'https://picsum.photos/400/300?random=24&blur=2&grayscale&text=Componente'
};

// Función para obtener la imagen de un componente
function getComponentImage(nombre, categoria) {
    const nombreLower = (nombre || '').toLowerCase();
    const categoriaLower = (categoria || '').toLowerCase();
    
    // Intentar usar imágenes locales primero (evitan CORS)
    if (typeof window.getLocalImage === 'function') {
        const localImage = window.getLocalImage(nombre, categoria);
        if (localImage) return localImage;
    }
    
    // Fallback a imágenes externas si las locales no funcionan
    if (typeof window.getBase64Image === 'function') {
        const base64Image = window.getBase64Image(nombre, categoria);
        if (base64Image) return base64Image;
    }
    
    // Buscar coincidencia exacta o parcial en el nombre
    for (const [key, url] of Object.entries(COMPONENT_IMAGES)) {
        if (nombreLower.includes(key) || key.includes(nombreLower)) {
            return url;
        }
    }
    
    // Buscar por categoría
    if (categoriaLower.includes('digital')) return COMPONENT_IMAGES['arduino-uno'];
    if (categoriaLower.includes('analógico')) return COMPONENT_IMAGES['resistencia'];
    if (categoriaLower.includes('consumible')) return COMPONENT_IMAGES['estaño'];
    if (categoriaLower.includes('herramienta')) return COMPONENT_IMAGES['multimetro'];
    
    // Imagen por defecto
    return COMPONENT_IMAGES['default'];
}

// Exportar para uso global
window.COMPONENT_IMAGES = COMPONENT_IMAGES;
window.getComponentImage = getComponentImage;
