// URLs de imágenes reales de productos de tiendas electrónicas
const REAL_COMPONENT_IMAGES = {
    'arduino-uno': 'https://store-cdn.arduino.cc/arduino-media/products/uno-r3/0_02_a_0001.png',
    'arduino-nano': 'https://store-cdn.arduino.cc/arduino-media/products/nano/0_02_a_0001.png',
    'esp32': 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/_images/esp32-devkitc-v4.jpg',
    'esp8266': 'https://www.nodemcu.com/images/nodemcu_devkit_v1.jpg',
    'dht11': 'https://www.mouser.com/images/microchip/DS1820%20IMG.jpg',
    'dht22': 'https://www.sparkfun.com/images/products/13887-01.jpg',
    'hc-sr04': 'https://www.sparkfun.com/images/products/13959-01.jpg',
    'hc-sr501': 'https://www.sparkfun.com/images/products/13285-01.jpg',
    'led': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/LED%20Basics/LED%20Basics%20_fig1.jpg',
    'led rgb': 'https://www.adafruit.com/images/1200x900/1376-01.jpg',
    'lcd': 'https://www.sparkfun.com/images/products/255-01.jpg',
    'servo': 'https://www.sparkfun.com/images/products/9065-01.jpg',
    'resistencia': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Resistor%20Basics/Resistor%20Basics_fig1.jpg',
    'capacitor electrolitico': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Capacitor%20Basics/Capacitor%20Basics_fig2.jpg',
    'capacitor ceramico': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Capacitor%20Basics/Capacitor%20Basics_fig3.jpg',
    'diodo': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Diode%20Basics/Diode%20Basics_fig1.jpg',
    'transistor': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Transistor%20Basics/Transistor%20Basics_fig1.jpg',
    'estaño': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Soldering%20Basics/Soldering%20Basics_fig1.jpg',
    'pasta termica': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Thermal%20Management/Thermal%20Management_fig1.jpg',
    'flux': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Soldering%20Basics/Soldering%20Basics_fig2.jpg',
    'multimetro': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Multimeter%20Basics/Multimeter%20Basics_fig1.jpg',
    'soldador': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Soldering%20Basics/Soldering%20Basics_fig3.jpg',
    'pinza': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Tools%20for%20Electronics/Tools%20for%20Electronics_fig1.jpg',
    'default': 'https://www.digikey.com/-/media/Images/DigiKey/Articles/Electronic%20Components/Electronic%20Components_fig1.jpg'
};

// Función para obtener imagen real de componente
function getBase64Image(nombre, categoria) {
    const nombreLower = (nombre || '').toLowerCase();
    const categoriaLower = (categoria || '').toLowerCase();
    
    // Mapeo de componentes a imágenes reales
    if (nombreLower.includes('arduino')) return REAL_COMPONENT_IMAGES['arduino-uno'];
    if (nombreLower.includes('esp32')) return REAL_COMPONENT_IMAGES['esp32'];
    if (nombreLower.includes('esp8266')) return REAL_COMPONENT_IMAGES['esp8266'];
    if (nombreLower.includes('dht11')) return REAL_COMPONENT_IMAGES['dht11'];
    if (nombreLower.includes('dht22')) return REAL_COMPONENT_IMAGES['dht22'];
    if (nombreLower.includes('hc-sr04')) return REAL_COMPONENT_IMAGES['hc-sr04'];
    if (nombreLower.includes('hc-sr501') || nombreLower.includes('pir')) return REAL_COMPONENT_IMAGES['hc-sr501'];
    if (nombreLower.includes('resistencia')) return REAL_COMPONENT_IMAGES['resistencia'];
    if (nombreLower.includes('capacitor electrolitico')) return REAL_COMPONENT_IMAGES['capacitor electrolitico'];
    if (nombreLower.includes('capacitor ceramico')) return REAL_COMPONENT_IMAGES['capacitor ceramico'];
    if (nombreLower.includes('diodo')) return REAL_COMPONENT_IMAGES['diodo'];
    if (nombreLower.includes('transistor')) return REAL_COMPONENT_IMAGES['transistor'];
    if (nombreLower.includes('led rgb')) return REAL_COMPONENT_IMAGES['led rgb'];
    if (nombreLower.includes('led')) return REAL_COMPONENT_IMAGES['led'];
    if (nombreLower.includes('lcd')) return REAL_COMPONENT_IMAGES['lcd'];
    if (nombreLower.includes('servo')) return REAL_COMPONENT_IMAGES['servo'];
    if (nombreLower.includes('estaño')) return REAL_COMPONENT_IMAGES['estaño'];
    if (nombreLower.includes('pasta termica')) return REAL_COMPONENT_IMAGES['pasta termica'];
    if (nombreLower.includes('flux')) return REAL_COMPONENT_IMAGES['flux'];
    if (nombreLower.includes('multimetro')) return REAL_COMPONENT_IMAGES['multimetro'];
    if (nombreLower.includes('soldador')) return REAL_COMPONENT_IMAGES['soldador'];
    if (nombreLower.includes('pinza')) return REAL_COMPONENT_IMAGES['pinza'];
    
    // Por categoría
    if (categoriaLower.includes('digital')) return REAL_COMPONENT_IMAGES['arduino-uno'];
    if (categoriaLower.includes('analógico')) return REAL_COMPONENT_IMAGES['resistencia'];
    if (categoriaLower.includes('consumible')) return REAL_COMPONENT_IMAGES['estaño'];
    if (categoriaLower.includes('herramienta')) return REAL_COMPONENT_IMAGES['multimetro'];
    
    return REAL_COMPONENT_IMAGES['default'];
}

// Exportar para uso global
window.getBase64Image = getBase64Image;
window.REAL_COMPONENT_IMAGES = REAL_COMPONENT_IMAGES;
