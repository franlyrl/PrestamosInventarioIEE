// Controlador de la página de Insumos
class InsumosController {
    constructor() {
        this.insumos = [];
        this.filtros = {
            busqueda: '',
            categoria: 'todas',
            stock: 'todos'
        };
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.uploadedImages = new Map(); // Almacenar imágenes subidas temporalmente
    }

    async initialize() {
        await this.cargarInsumos();
        this.setupEventListeners();
        this.renderInsumos();
    }

    setupEventListeners() {
        // Búsqueda
        const busquedaInput = document.getElementById('busqueda-input');
        if (busquedaInput) {
            busquedaInput.addEventListener('input', (e) => {
                this.filtros.busqueda = e.target.value;
                this.renderInsumos();
            });
        }

        // Categoría
        const categoriaSelect = document.getElementById('categoria-select');
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', (e) => {
                this.filtros.categoria = e.target.value;
                this.renderInsumos();
            });
        }

        // Stock
        const stockSelect = document.getElementById('stock-select');
        if (stockSelect) {
            stockSelect.addEventListener('change', (e) => {
                this.filtros.stock = e.target.value;
                this.renderInsumos();
            });
        }

        // Botones
        const buscarBtn = document.getElementById('buscar-btn');
        const limpiarBtn = document.getElementById('limpiar-btn');
        const agregarBtn = document.getElementById('agregar-btn');
        const agregarMasivoBtn = document.getElementById('agregar-masivo-btn');
        const subirImagenesBtn = document.getElementById('subir-imagenes-btn');
        const exportarBtn = document.getElementById('exportar-btn');

        if (buscarBtn) {
            buscarBtn.addEventListener('click', () => this.renderInsumos());
        }

        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
        }

        if (agregarBtn) {
            agregarBtn.addEventListener('click', () => {
                window.modalController?.showAgregarInsumo();
            });
        }

        if (agregarMasivoBtn) {
            agregarMasivoBtn.addEventListener('click', () => {
                window.modalController?.showAgregarMasivo();
            });
        }

        if (subirImagenesBtn) {
            subirImagenesBtn.addEventListener('click', () => {
                document.getElementById('zip-upload-input').click();
            });
        }

        if (exportarBtn) {
            exportarBtn.addEventListener('click', () => this.exportarDatos());
        }
    }

    async cargarInsumos() {
        try {
            Utils.showLoading(true);
            const response = await ApiService.getInsumos();
            this.insumos = response.data || response;
            Utils.showLoading(false);
        } catch (error) {
            console.error('Error cargando insumos:', error);
            Utils.showToast('Error al cargar insumos', 'error');
            Utils.showLoading(false);
        }
    }

    renderInsumos() {
        const grid = document.getElementById('insumos-grid');
        const emptyState = document.getElementById('empty-state');
        const resultadosCount = document.getElementById('resultados-count');

        if (!grid) return;

        const insumosFiltrados = this.filtrarInsumos();

        // Actualizar contador
        if (resultadosCount) {
            resultadosCount.textContent = insumosFiltrados.length;
        }

        // Mostrar/ocultar empty state
        if (emptyState) {
            emptyState.classList.toggle('hidden', insumosFiltrados.length > 0);
        }

        if (insumosFiltrados.length === 0) {
            grid.innerHTML = '';
            return;
        }

        grid.innerHTML = insumosFiltrados.map((insumo, index) =>
            this.createInsumoCard(insumo, index)
        ).join('');
    }

    filtrarInsumos() {
        return this.insumos.filter(insumo => {
            const coincideBusqueda = !this.filtros.busqueda ||
                (insumo.NombProducto && insumo.NombProducto.toLowerCase().includes(this.filtros.busqueda.toLowerCase())) ||
                (insumo.caracteristicas && insumo.caracteristicas.toLowerCase().includes(this.filtros.busqueda.toLowerCase()));

            const coincideCategoria = this.filtros.categoria === 'todas' ||
                insumo.categoria === this.filtros.categoria;

            const coincideStock = this.checkStockFilter(insumo, this.filtros.stock);

            return coincideBusqueda && coincideCategoria && coincideStock;
        });
    }

    checkStockFilter(insumo, stockFilter) {
        const cantidad = insumo.cantidad || 0;

        switch (stockFilter) {
            case 'con-stock':
                return cantidad > 0;
            case 'sin-stock':
                return cantidad === 0;
            case 'bajo-stock':
                return cantidad > 0 && cantidad <= 5; // Cambiado de 10 a 5
            default:
                return true;
        }
    }

    createInsumoCard(insumo, index) {
        const stockClass = this.getStockClass(insumo.cantidad);
        const stockText = this.getStockText(insumo.cantidad);

        return `
            <div class="insumo-card card p-5 fade-in" style="animation-delay: ${index * 50}ms">
                <div class="insumo-stock ${stockClass}">
                    ${stockText}
                </div>
                
                <div class="mb-4">
                    ${(() => {
                        const imageUrl = insumo.imagenUrl;
                        
                        if (imageUrl && imageUrl.trim() !== '') {
                            return `
                                <img src="${imageUrl}" alt="${insumo.NombProducto}" 
                                     class="w-full h-full object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="insumo-imagen-fallback" style="display: none;">
                                    ${this.getInsumoVisual(insumo)}
                                </div>
                            `;
                        } else {
                            return `
                                <div class="insumo-imagen-placeholder">
                                    ${this.getInsumoVisual(insumo)}
                                </div>
                            `;
                        }
                    })()}
                </div>
                
                <div class="insumo-info">
                    <h3>${insumo.NombProducto || 'Sin nombre'}</h3>
                    <p>ID: ${insumo.id_insumo || 'N/A'}</p>
                    <div class="categoria-badge ${this.getCategoriaClass(insumo.categoria)}">
                        ${insumo.categoria || 'Sin categoría'}
                    </div>
                </div>
                
                <div class="insumo-cantidad">
                    <span class="insumo-cantidad-label">Stock</span>
                    <span class="insumo-cantidad-valor">${insumo.cantidad || 0}</span>
                </div>
                
                ${insumo.caracteristicas ? `
                    <div class="insumo-caracteristicas">
                        ${insumo.caracteristicas}
                    </div>
                ` : ''}
                
                <div class="insumo-acciones">
                    <button class="btn btn-primary" onclick="insumosController.editarInsumo('${insumo._id}')">
                        Editar
                    </button>
                </div>
            </div>
        `;
    }

    getStockClass(cantidad) {
        if (cantidad === 0) return 'sin-stock';
        if (cantidad <= 10) return 'bajo-stock';
        return 'con-stock';
    }

    getStockText(cantidad) {
        if (cantidad === 0) return 'Sin Stock';
        if (cantidad <= 10) return 'Bajo Stock';
        return 'Disponible';
    }

    getCategoriaClass(categoria) {
        const categoriaMap = {
            'Componentes Analógicos': 'componentes-analogicos',
            'Componentes Digitales': 'componentes-digitales',
            'Herramientas Menores': 'herramientas-menores',
            'Consumibles de Soldadura': 'consumibles-soldadura',
            'Otros': 'otros'
        };
        return categoriaMap[categoria] || 'otros';
    }

    async getInternetImage(insumo) {
        const nombre = insumo.NombProducto || '';
        const categoria = (insumo.categoria || '').toLowerCase();
        
        // Generar términos de búsqueda específicos según el componente
        let searchTerms = [];
        
        if (categoria.includes('digital')) {
            if (nombre.toLowerCase().includes('arduino')) {
                searchTerms = [
                    `${nombre} official image`,
                    `${nombre} board photo`,
                    `${nombre} development board`,
                    `${nombre} microcontroller`
                ];
            } else if (nombre.toLowerCase().includes('sensor')) {
                searchTerms = [
                    `${nombre} sensor module`,
                    `${nombre} electronic component`,
                    `${nombre} sensor photo`
                ];
            } else if (nombre.toLowerCase().includes('led')) {
                searchTerms = [
                    `${nombre} led component`,
                    `${nombre} electronic part`,
                    `${nombre} light emitting diode`
                ];
            } else {
                searchTerms = [
                    `${nombre} electronic component`,
                    `${nombre} module`,
                    `${nombre} integrated circuit`
                ];
            }
        } else if (categoria.includes('analógico')) {
            if (nombre.toLowerCase().includes('resistencia')) {
                searchTerms = [
                    `${nombre} resistor`,
                    `${nombre} electronic component`,
                    `${nombre} axial resistor`
                ];
            } else if (nombre.toLowerCase().includes('capacitor')) {
                searchTerms = [
                    `${nombre} capacitor`,
                    `${nombre} electronic component`,
                    `${nombre} electrolytic capacitor`
                ];
            } else {
                searchTerms = [
                    `${nombre} analog component`,
                    `${nombre} electronic part`,
                    `${nombre} passive component`
                ];
            }
        } else if (categoria.includes('consumible')) {
            if (nombre.toLowerCase().includes('estaño')) {
                searchTerms = [
                    `${nombre} solder wire`,
                    `${nombre} solder material`,
                    `${nombre} welding solder`
                ];
            } else {
                searchTerms = [
                    `${nombre} consumable`,
                    `${nombre} supply`,
                    `${nombre} material`
                ];
            }
        } else if (categoria.includes('herramienta')) {
            searchTerms = [
                `${nombre} tool`,
                `${nombre} equipment`,
                `${nombre} instrument`
            ];
        } else {
            searchTerms = [
                `${nombre} electronic component`,
                `${nombre} part`,
                `${nombre} device`
            ];
        }

        // Construir URL de búsqueda usando una API de imágenes (usaremos Pixabay como ejemplo)
        const apiKey = '42333435-a9644b4c7f58c8f7c6e8'; // Puedes usar una API key gratuita o cambiar la API
        const searchTerm = searchTerms[0].replace(/\s+/g, '+');
        const imageUrl = `https://pixabay.com/api/?key=${apiKey}&q=${searchTerm}&image_type=photo&category=electronics&per_page=3&min_width=400&min_height=300`;

        return `
            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-4">
                <!-- Imagen de búsqueda con fallback -->
                <img src="${imageUrl}" 
                     alt="${nombre}" 
                     class="w-full h-full object-contain rounded-lg shadow-md"
                     style="max-width: 100%; max-height: 100%;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     loading="lazy">
                
                <!-- Fallback visual si la imagen no carga -->
                <div class="internet-image-fallback" style="display: none;">
                    ${this.getInsumoVisual(insumo)}
                </div>
                
                <!-- Indicador de búsqueda -->
                <div class="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full opacity-75">
                    🔍
                </div>
            </div>
        `;
    }

    getInternetImage(insumo) {
        const nombre = insumo.NombProducto || '';
        const categoria = insumo.categoria || '';
        
        // Usar el repositorio local de imágenes
        let componentImageUrl = '';
        
        try {
            // Intentar usar la función del repositorio si está disponible
            if (typeof window.getComponentImage === 'function') {
                componentImageUrl = window.getComponentImage(nombre, categoria);
            } else {
                // Fallback si el repositorio no está cargado
                componentImageUrl = '/assets/components/electronic-component-default.jpg';
            }
        } catch (error) {
            console.log('Error obteniendo imagen del componente:', error);
            componentImageUrl = '/assets/components/electronic-component-default.jpg';
        }
        
        return `
            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-4 relative">
                <img src="${componentImageUrl}" 
                     alt="${insumo.NombProducto}" 
                     class="w-full h-full object-contain rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     loading="lazy">
                
                <div class="internet-image-fallback" style="display: none;">
                    ${this.getInsumoVisual(insumo)}
                </div>
                
                <div class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full opacity-75">
                    0
                </div>
            </div>
        `;
    }

    getInsumoVisual(insumo) {
        // Mostrar imagen automática con botón para añadir foto personalizada
        const imageUrl = this.getAutomaticImage(insumo);
        
        return `
            <div class="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative group">
                <img src="${imageUrl}" 
                     alt="${insumo.NombProducto}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='https://picsum.photos/400/300?random=${insumo._id}&blur=1';">
                
                <!-- Botón para añadir foto -->
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <button onclick="this.parentElement.parentElement.querySelector('input[type=file]').click()" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Añadir foto
                    </button>
                </div>
                
                <!-- Input oculto para subir archivo -->
                <input type="file" 
                       accept="image/*" 
                       onchange="window.insumosController.handleImageUpload(event, '${insumo._id}')"
                       class="hidden">
            </div>
        `;
    }

    getAutomaticImage(insumo) {
        const nombre = (insumo.NombProducto || '').toLowerCase();
        
        // Sistema local de representación visual SVG
        return this.getFallbackImage(nombre, insumo.categoria);
    }

    
    getFallbackImage(nombre, categoria) {
        const categoriaLower = (categoria || '').toLowerCase();
        
        // Colores por categoría para representación visual
        const categoryColors = {
            'componentes digitales': '#3B82F6', // Azul
            'componentes analógicos': '#10B981', // Verde
            'herramientas menores': '#F59E0B', // Amarillo
            'consumibles de soldadura': '#EF4444', // Rojo
            'otros': '#6B7280' // Gris
        };
        
        // Iconos por componente
        const componentIcons = {
            'arduino': 'MC', // Microcontrolador
            'esp32': 'ESP', // ESP32
            'esp8266': 'WiFi', // WiFi
            'sensor': 'SN', // Sensor
            'dht': 'TH', // Temperatura/Humedad
            'hc-sr': 'US', // Ultrasonido
            'pir': 'PIR', // PIR
            'led': 'LED', // LED
            'lcd': 'LCD', // LCD
            'oled': 'OLED', // OLED
            'servo': 'SV', // Servo
            'motor': 'MT', // Motor
            'resist': 'R', // Resistencia
            'cap': 'C', // Capacitor
            'diod': 'D', // Diodo
            'trans': 'T', // Transistor
            'multi': 'MM', // Multímetro
            'sold': 'SL', // Soldador
            'estañ': 'SN', // Estaño
            'protob': 'PB', // Protoboard
            'buzzer': 'BZ', // Buzzer
            'rele': 'RL', // Relé
            'switch': 'SW', // Switch
            'poten': 'PT', // Potenciómetro
            'bateria': 'BT' // Batería
        };
        
        // Determinar icono
        let icon = 'IC'; // Icono por defecto
        for (const [key, value] of Object.entries(componentIcons)) {
            if (nombre.includes(key)) {
                icon = value;
                break;
            }
        }
        
        // Determinar color por categoría
        let color = categoryColors['otros'];
        for (const [key, value] of Object.entries(categoryColors)) {
            if (categoriaLower.includes(key)) {
                color = value;
                break;
            }
        }
        
        // Generar SVG con el icono y color (corregido para evitar caracteres inválidos)
        const svgContent = `
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.4" />
                    </linearGradient>
                </defs>
                <rect width="400" height="300" fill="url(#bg)" />
                <text x="200" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
                      text-anchor="middle" fill="white" dominant-baseline="middle">${icon}</text>
                <text x="200" y="200" font-family="Arial, sans-serif" font-size="16" 
                      text-anchor="middle" fill="white" dominant-baseline="middle">${nombre.substring(0, 20).toUpperCase()}</text>
            </svg>
        `.trim();
        
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
    }

    getInsumoIcon(insumo) {
        const nombre = (insumo.NombProducto || '').toLowerCase();
        const categoria = (insumo.categoria || '').toLowerCase();
        
        if (categoria.includes('digital') || nombre.includes('microcontrolador')) return 'IC';
        if (categoria.includes('digital') || nombre.includes('arduino')) return 'MC';
        if (categoria.includes('digital') || nombre.includes('sensor')) return 'SN';
        if (categoria.includes('digital') || nombre.includes('esp32')) return 'ESP';
        if (categoria.includes('digital') || nombre.includes('esp8266')) return 'WiFi';
        if (categoria.includes('analógico') || nombre.includes('resistencia')) return 'R';
        if (categoria.includes('analógico') || nombre.includes('capacitor')) return 'C';
        if (categoria.includes('analógico') || nombre.includes('diodo')) return 'D';
        if (categoria.includes('analógico') || nombre.includes('transistor')) return 'T';
        if (categoria.includes('consumible') || nombre.includes('estaño')) return 'S';
        if (categoria.includes('consumible') || nombre.includes('soldadura')) return 'S';
        if (categoria.includes('consumible') || nombre.includes('pasta')) return 'PT';
        if (categoria.includes('herramienta') || nombre.includes('multimetro')) return 'MM';
        if (categoria.includes('herramienta') || nombre.includes('soldador')) return 'SI';
        if (categoria.includes('herramienta') || nombre.includes('pinza')) return 'PL';
        
        return 'IC';
    }

    handleImageUpload(event, insumoId) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido');
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 5MB');
            return;
        }

        // Convertir a base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            this.updateInsumoImage(insumoId, imageUrl);
            this.showToast('Foto añadida exitosamente', 'success');
        };
        reader.readAsDataURL(file);
    }

    // Sistema de subida masiva de ZIP
    async handleZipUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar que sea un ZIP
        if (!file.name.toLowerCase().endsWith('.zip')) {
            this.showToast('Por favor, selecciona un archivo ZIP válido', 'error');
            return;
        }

        // Validar tamaño (máximo 50MB)
        if (file.size > 50 * 1024 * 1024) {
            this.showToast('El archivo es demasiado grande. Máximo 50MB', 'error');
            return;
        }

        this.showToast('Procesando archivo ZIP...', 'info');

        try {
            // Cargar JSZip dinámicamente si no está disponible
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }

            // Usar JSZip para extraer las imágenes
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            
            const imageFiles = [];
            this.uploadedImages.clear();

            // Extraer solo archivos de imagen
            for (const [filename, fileData] of Object.entries(zipContent.files)) {
                if (!fileData.dir && this.isImageFile(filename)) {
                    const imageData = await fileData.async('base64');
                    const mimeType = this.getMimeType(filename);
                    const dataUrl = `data:${mimeType};base64,${imageData}`;
                    
                    // Extraer nombre base del archivo (sin extensión)
                    const baseName = filename.replace(/\.[^/.]+$/, '').toLowerCase();
                    
                    this.uploadedImages.set(baseName, {
                        filename: filename,
                        dataUrl: dataUrl,
                        mimeType: mimeType
                    });
                    
                    imageFiles.push({
                        filename: filename,
                        baseName: baseName,
                        dataUrl: dataUrl
                    });
                }
            }

            if (imageFiles.length === 0) {
                this.showToast('No se encontraron imágenes en el archivo ZIP', 'warning');
                return;
            }

            this.showToast(`Se encontraron ${imageFiles.length} imágenes`, 'success');
            this.showImageAssignmentModal(imageFiles);

        } catch (error) {
            console.error('Error procesando ZIP:', error);
            this.showToast('Error al procesar el archivo ZIP', 'error');
        }
    }

    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    getMimeType(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    showImageAssignmentModal(imageFiles) {
        // Crear modal para asignar imágenes a insumos
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
                <h3 class="text-xl font-bold mb-4">Asignar Imágenes a Insumos</h3>
                <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 class="font-semibold text-blue-800 mb-2">📋 ¿Cómo funciona?</h4>
                    <ul class="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Asignación Individual:</strong> Selecciona un insumo específico para cada imagen</li>
                        <li>• <strong>Asignación Masiva:</strong> Si no seleccionas nada, la imagen se aplicará a TODOS los insumos similares</li>
                        <li>• <strong>Ejemplo:</strong> Una imagen "resistencia.jpg" se aplicará a todas las resistencias</li>
                    </ul>
                    <button onclick="window.insumosController.autoAssignImages()" class="mt-3 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                        🤖 Asignación Automática Inteligente
                    </button>
                </div>
                <div class="space-y-4 max-h-96 overflow-y-auto">
                    ${imageFiles.map(img => `
                        <div class="border rounded-lg p-3 flex items-center space-x-4 ${img.baseName.includes('resistencia') || img.baseName.includes('resistor') ? 'bg-red-50 border-red-200' : ''}">
                            <img src="${img.dataUrl}" alt="${img.filename}" class="w-16 h-16 object-cover rounded border-2 border-gray-300">
                            <div class="flex-1">
                                <p class="font-medium text-gray-800">${img.filename}</p>
                                <p class="text-xs text-gray-500 mb-2">
                                    ${img.baseName.includes('resistencia') || img.baseName.includes('resistor') ? 
                                        '⚡ Esta imagen se aplicará a TODAS las resistencias si no seleccionas un insumo específico' : 
                                        'Selecciona un insumo específico o deja vacío para asignación masiva automática'}
                                </p>
                                <select class="mt-1 w-full p-2 border rounded" id="assign-${img.baseName}">
                                    <option value="">🌐 Aplicar a todos los similares (Recomendado)</option>
                                    <option value="" disabled>─────────────────────────</option>
                                    ${this.insumos.map(insumo => `
                                        <option value="${insumo._id}" ${this.matchImageToInsumo(img.baseName, insumo) ? 'selected' : ''}>
                                            ${insumo.NombProducto} - ${insumo.categoria}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-6 flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        💡 <strong>Tip:</strong> Nombra tus imágenes como "resistencia.jpg", "led.jpg", "sensor.jpg" para asignación automática
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                            Cancelar
                        </button>
                        <button onclick="window.insumosController.assignImagesToInsumos()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            ✅ Asignar Imágenes
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    matchImageToInsumo(imageBaseName, insumo) {
        const insumoName = (insumo.NombProducto || '').toLowerCase();
        const imageBase = imageBaseName.toLowerCase().replace(/[_\-\s]/g, '');
        const insumoBase = insumoName.replace(/[_\-\s]/g, '');
        
        // Coincidencia exacta o parcial
        return insumoBase.includes(imageBase) || imageBase.includes(insumoBase);
    }

    autoAssignImages() {
        let autoAssignedCount = 0;
        
        this.uploadedImages.forEach((imageData, baseName) => {
            const select = document.getElementById(`assign-${baseName}`);
            if (select) {
                // Buscar coincidencia automática
                for (const insumo of this.insumos) {
                    if (this.matchImageToInsumo(baseName, insumo)) {
                        select.value = insumo._id;
                        autoAssignedCount++;
                        break;
                    }
                }
            }
        });

        this.showToast(`Asignación automática: ${autoAssignedCount} imágenes coincidentes`, 'info');
    }

    assignImagesToInsumos() {
        let assignedCount = 0;
        
        this.uploadedImages.forEach((imageData, baseName) => {
            const select = document.getElementById(`assign-${baseName}`);
            
            if (select && select.value) {
                // Asignación individual (seleccionado manualmente)
                this.updateInsumoImage(select.value, imageData.dataUrl);
                assignedCount++;
            } else if (select && !select.value) {
                // Asignación masiva automática si no hay selección manual
                const matchingInsumos = this.findMatchingInsumos(baseName);
                matchingInsumos.forEach(insumo => {
                    this.updateInsumoImage(insumo._id, imageData.dataUrl);
                    assignedCount++;
                });
            }
        });

        // Cerrar modal
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) modal.remove();

        // Limpiar imágenes temporales
        this.uploadedImages.clear();

        // Recargar para mostrar cambios
        this.renderInsumos();

        this.showToast(`Se asignaron ${assignedCount} imágenes exitosamente`, 'success');
    }

    findMatchingInsumos(imageBaseName) {
        const imageBase = imageBaseName.toLowerCase().replace(/[_\-\s]/g, '');
        
        // Mapeo de palabras clave a categorías de componentes
        const componentKeywords = {
            'resistencia': ['resistencia', 'resistor', 'r', 'resistencias', 'resistores'],
            'capacitor': ['capacitor', 'cap', 'condensador', 'capacitores', 'condensadores'],
            'diodo': ['diodo', 'diode', 'diodos', 'diodos'],
            'led': ['led', 'leds', 'diodo led'],
            'transistor': ['transistor', 'trans', 'transistores', 'bc547', '2n2222'],
            'arduino': ['arduino', 'arduino uno', 'arduino nano', 'arduino mega'],
            'esp32': ['esp32', 'esp-32'],
            'esp8266': ['esp8266', 'esp-8266', 'nodemcu'],
            'sensor': ['sensor', 'sensores', 'dht', 'hc-sr', 'pir', 'ldr', 'mq'],
            'motor': ['motor', 'servo', 'dc', 'stepper', 'motores'],
            'buzzer': ['buzzer', 'buzzer', 'zumbador'],
            'rele': ['rele', 'relay', 'reles', 'relays'],
            'switch': ['switch', 'pulsador', 'boton', 'interruptor'],
            'protoboard': ['protoboard', 'breadboard', 'protoboards', 'breadboards'],
            'cable': ['cable', 'jumper', 'dupont', 'cables'],
            'bateria': ['bateria', 'pila', 'battery', 'pilas'],
            'multimetro': ['multimetro', 'multimeter', 'tester'],
            'soldador': ['soldador', 'cautin', 'soldering', 'soldadura'],
            'lcd': ['lcd', 'display', 'pantalla'],
            'potenciometro': ['potenciometro', 'pot', 'trimmer', 'potencio']
        };

        // Buscar coincidencias por palabras clave
        let matchingInsumos = [];
        
        for (const [component, keywords] of Object.entries(componentKeywords)) {
            if (keywords.includes(imageBase) || imageBase.includes(component)) {
                // Encontrar todos los insumos que coincidan con este tipo de componente
                matchingInsumos = this.insumos.filter(insumo => {
                    const insumoName = (insumo.NombProducto || '').toLowerCase();
                    return keywords.some(keyword => insumoName.includes(keyword));
                });
                break;
            }
        }

        // Si no hay coincidencia por palabras clave, buscar coincidencia parcial
        if (matchingInsumos.length === 0) {
            matchingInsumos = this.insumos.filter(insumo => {
                const insumoName = (insumo.NombProducto || '').toLowerCase().replace(/[_\-\s]/g, '');
                return insumoName.includes(imageBase) || imageBase.includes(insumoName);
            });
        }

        return matchingInsumos;
    }

    showToast(message, type = 'info') {
        // Crear toast de notificación
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Eliminar después de 3 segundos
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    async editarInsumo(id) {
        const insumo = this.insumos.find(i => i._id === id);
        if (!insumo) return;

        // Abrir modal de edición con los datos del insumo
        abrirModalEditarInsumo(insumo);
    }

    limpiarFiltros() {
        this.filtros = {
            busqueda: '',
            categoria: 'todas',
            stock: 'todos'
        };

        // Limpiar inputs
        const busquedaInput = document.getElementById('busqueda-input');
        const categoriaSelect = document.getElementById('categoria-select');
        const stockSelect = document.getElementById('stock-select');

        if (busquedaInput) busquedaInput.value = '';
        if (categoriaSelect) categoriaSelect.value = 'todas';
        if (stockSelect) stockSelect.value = 'todos';

        this.renderInsumos();
    }

    exportarDatos() {
        const insumosFiltrados = this.filtrarInsumos();

        if (insumosFiltrados.length === 0) {
            Utils.showToast('No hay datos para exportar', 'error');
            return;
        }

        // Crear CSV
        const headers = ['Nombre', 'ID', 'Cantidad', 'Categoría', 'Características'];
        const csvContent = [
            headers.join(','),
            ...insumosFiltrados.map(insumo => [
                insumo.NombProducto || '',
                insumo.id_insumo || '',
                insumo.cantidad || 0,
                insumo.categoria || '',
                insumo.caracteristicas || ''
            ].join(','))
        ].join('\n');

        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insumos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        Utils.showToast('Datos exportados exitosamente', 'success');
    }

    // Recargar insumos
    async recargarInsumos() {
        await this.cargarInsumos();
        this.renderInsumos();
    }
}

// Crear instancia global
window.insumosController = new InsumosController();
