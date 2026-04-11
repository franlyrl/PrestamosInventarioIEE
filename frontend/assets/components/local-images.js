// URLs de imágenes locales a través del backend para evitar CORS
const LOCAL_IMAGES = {
    'arduino-uno': '/api/components/image/arduino-uno',
    'arduino-nano': '/api/components/image/arduino-nano',
    'esp32': '/api/components/image/esp32',
    'esp8266': '/api/components/image/esp8266',
    'dht11': '/api/components/image/dht11',
    'dht22': '/api/components/image/dht22',
    'hc-sr04': '/api/components/image/hc-sr04',
    'hc-sr501': '/api/components/image/hc-sr501',
    'led': '/api/components/image/led',
    'led rgb': '/api/components/image/led-rgb',
    'lcd': '/api/components/image/lcd',
    'servo': '/api/components/image/servo',
    'resistencia': '/api/components/image/resistencia',
    'capacitor electrolitico': '/api/components/image/capacitor-electrolitico',
    'capacitor ceramico': '/api/components/image/capacitor-ceramico',
    'diodo': '/api/components/image/diodo',
    'transistor': '/api/components/image/transistor',
    'estaño': '/api/components/image/estano',
    'pasta termica': '/api/components/image/pasta-termica',
    'flux': '/api/components/image/flux',
    'multimetro': '/api/components/image/multimetro',
    'soldador': '/api/components/image/soldador',
    'pinza': '/api/components/image/pinza',
    'default': '/api/components/image/default'
};

// Función para obtener imagen local
function getLocalImage(nombre, categoria) {
    const nombreLower = (nombre || '').toLowerCase();
    const categoriaLower = (categoria || '').toLowerCase();
    
    // Mapeo de componentes a imágenes locales
    if (nombreLower.includes('arduino')) return LOCAL_IMAGES['arduino-uno'];
    if (nombreLower.includes('esp32')) return LOCAL_IMAGES['esp32'];
    if (nombreLower.includes('esp8266')) return LOCAL_IMAGES['esp8266'];
    if (nombreLower.includes('dht11')) return LOCAL_IMAGES['dht11'];
    if (nombreLower.includes('dht22')) return LOCAL_IMAGES['dht22'];
    if (nombreLower.includes('hc-sr04')) return LOCAL_IMAGES['hc-sr04'];
    if (nombreLower.includes('hc-sr501') || nombreLower.includes('pir')) return LOCAL_IMAGES['hc-sr501'];
    if (nombreLower.includes('resistencia')) return LOCAL_IMAGES['resistencia'];
    if (nombreLower.includes('capacitor electrolitico')) return LOCAL_IMAGES['capacitor electrolitico'];
    if (nombreLower.includes('capacitor ceramico')) return LOCAL_IMAGES['capacitor ceramico'];
    if (nombreLower.includes('diodo')) return LOCAL_IMAGES['diodo'];
    if (nombreLower.includes('transistor')) return LOCAL_IMAGES['transistor'];
    if (nombreLower.includes('led rgb')) return LOCAL_IMAGES['led rgb'];
    if (nombreLower.includes('led')) return LOCAL_IMAGES['led'];
    if (nombreLower.includes('lcd')) return LOCAL_IMAGES['lcd'];
    if (nombreLower.includes('servo')) return LOCAL_IMAGES['servo'];
    if (nombreLower.includes('estaño')) return LOCAL_IMAGES['estaño'];
    if (nombreLower.includes('pasta termica')) return LOCAL_IMAGES['pasta termica'];
    if (nombreLower.includes('flux')) return LOCAL_IMAGES['flux'];
    if (nombreLower.includes('multimetro')) return LOCAL_IMAGES['multimetro'];
    if (nombreLower.includes('soldador')) return LOCAL_IMAGES['soldador'];
    if (nombreLower.includes('pinza')) return LOCAL_IMAGES['pinza'];
    
    // Por categoría
    if (categoriaLower.includes('digital')) return LOCAL_IMAGES['arduino-uno'];
    if (categoriaLower.includes('analógico')) return LOCAL_IMAGES['resistencia'];
    if (categoriaLower.includes('consumible')) return LOCAL_IMAGES['estaño'];
    if (categoriaLower.includes('herramienta')) return LOCAL_IMAGES['multimetro'];
    
    return LOCAL_IMAGES['default'];
}

// Exportar para uso global
window.getLocalImage = getLocalImage;
window.LOCAL_IMAGES = LOCAL_IMAGES;
