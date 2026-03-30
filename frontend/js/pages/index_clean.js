// Controlador del Dashboard (Página Principal)
console.log('🚀 index.js - Iniciando carga del script...');

class IndexController {
    constructor() {
        console.log('🚀 index.js - Constructor de IndexController ejecutado');
        this.allItems = [];
        this.filteredItems = [];
        this.initializeEventListeners();
        this.setupFiltros();
    }

    initializeEventListeners() {
        // Botones de acciones rápidas
        const nuevaSolicitudBtn = document.querySelector('button');
        if (nuevaSolicitudBtn) {
            nuevaSolicitudBtn.addEventListener('click', () => {
                window.location.href = 'pages/solicitudes.html';
            });
        }
    }

    // Configurar filtros de búsqueda
    setupFiltros() {
        console.log('🔍 Configurando filtros de búsqueda desde index.js...');

        const buscarBtn = document.getElementById('buscar-btn');
        const limpiarBtn = document.getElementById('limpiar-busqueda');
        const busquedaInput = document.getElementById('busqueda-universal');
        const tipoSelect = document.getElementById('tipo-select');
        const categoriaSelect = document.getElementById('categoria-select');
        const estadoSelect = document.getElementById('estado-select');

        if (buscarBtn && limpiarBtn && busquedaInput) {
            console.log('✅ Elementos de filtros encontrados');

            // Evento de búsqueda
            buscarBtn.addEventListener('click', () => {
                console.log('🔎 Ejecutando búsqueda desde index.js...');
                this.aplicarFiltrosDirectamente();
            });

            // Evento de limpiar
            limpiarBtn.addEventListener('click', () => {
                console.log('🔄 Limpiando filtros desde index.js...');
                this.limpiarFiltros();
            });

            // Búsqueda en tiempo real
            busquedaInput.addEventListener('input', () => {
                console.log('⚡ Búsqueda en tiempo real desde index.js...');
                this.aplicarFiltrosDirectamente();
            });

            // Cambio en selects
            [tipoSelect, categoriaSelect, estadoSelect].forEach(select => {
                if (select) {
                    select.addEventListener('change', () => {
                        console.log('🔄 Cambio en select desde index.js:', select.id);
                        this.aplicarFiltrosDirectamente();
                    });
                }
            });

            // Cargar datos iniciales
            this.cargarItemsParaFiltrar();
        } else {
            console.log('❌ No se encontraron elementos de filtros:', {
                buscarBtn: !!buscarBtn,
                limpiarBtn: !!limpiarBtn,
                busquedaInput: !!busquedaInput
            });
        }
    }

    // Cargar items para filtrar
    async cargarItemsParaFiltrar() {
        try {
            console.log('📡 Cargando items para filtrar desde index.js...');

            // Cargar datos como lo hace insumos.html - DIRECTOS de la API
            const token = localStorage.getItem('utn_token');

            // Cargar activos
            const activosResponse = await fetch(`${window.CONFIG.API_BASE_URL}/activos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Cargar insumos
            const insumosResponse = await fetch(`${window.CONFIG.API_BASE_URL}/insumos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (activosResponse.ok && insumosResponse.ok) {
                // Cargar datos DIRECTOS como insumos.html
                let activos = await activosResponse.json();
                let insumos = await insumosResponse.json();

                console.log('📦 Activos cargados (directos):', activos?.length || 'undefined');
                console.log('📦 Insumos cargados (directos):', insumos?.length || 'undefined');

                // Asegurar que ambos sean arrays
                const activosArray = Array.isArray(activos) ? activos : [];
                const insumosArray = Array.isArray(insumos) ? insumos : [];

                // Combinar datos y agregar tipo
                const allRealItems = [
                    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
                    ...insumosArray.map(item => ({ ...item, tipo: 'insumo' }))
                ];

                console.log('📊 Items reales combinados (directos):', allRealItems.length);

                // Si hay datos reales, usarlos
                if (allRealItems.length > 0) {
                    this.allItems = allRealItems;
                    console.log('✅ Usando datos reales DIRECTOS de la base de datos');
                } else {
                    // Si no hay datos, usar datos de ejemplo
                    console.log('⚠️ No hay datos reales, usando datos de ejemplo...');
                    this.allItems = this.getDatosDeEjemplo();
                }

            } else {
                console.log('❌ Error en respuesta de API, usando datos de ejemplo...');
                this.allItems = this.getDatosDeEjemplo();
            }

            console.log('📊 Datos finales desde index.js:', this.allItems.length);

            // Mostrar todos los items inicialmente
            this.filteredItems = [...this.allItems];
            this.renderItemsDirectamente(this.allItems);
            this.setupFiltrosDirectamente(this.allItems);

        } catch (error) {
            console.error('❌ Error cargando items desde index.js:', error);
            console.log('🔄 Usando datos de ejemplo como fallback...');
            this.allItems = this.getDatosDeEjemplo();

            this.filteredItems = [...this.allItems];
            this.renderItemsDirectamente(this.allItems);
            this.setupFiltrosDirectamente(this.allItems);
        }
    }

    // Método para obtener datos de ejemplo
    getDatosDeEjemplo() {
        return [
            // Activos de ejemplo
            {
                _id: 'act001',
                codigo: 'ACT-001',
                nombre: 'Multímetro Digital',
                descripcion: 'Multímetro digital con medición de voltaje, corriente y resistencia',
                categoria: 'Instrumentos de Medición',
                cantidad: 5,
                tipo: 'activo',
                estado: 'disponible'
            },
            {
                _id: 'act002',
                codigo: 'ACT-002',
                nombre: 'Osciloscopio',
                descripcion: 'Osciloscopio de doble canal 100MHz',
                categoria: 'Instrumentos de Medición',
                cantidad: 2,
                tipo: 'activo',
                estado: 'disponible'
            },
            // Insumos de ejemplo
            {
                _id: 'ins001',
                id_insumo: 'INS-001',
                codigo: 'RES-001',
                nombre: 'Resistencia 1kΩ',
                NombProducto: 'Resistencia 1kΩ 1/4W',
                descripcion: 'Resistencia carbón 1kΩ 1/4W 5%',
                categoria: 'Componentes Digitales',
                cantidad: 100,
                tipo: 'insumo',
                stock_actual: 100,
                stock_minimo: 20
            },
            {
                _id: 'ins002',
                id_insumo: 'INS-002',
                codigo: 'CAP-001',
                nombre: 'Capacitor 100µF',
                NombProducto: 'Capacitor electrolítico 100µF 16V',
                descripcion: 'Capacitor electrolítico 100µF 16V',
                categoria: 'Componentes Digitales',
                cantidad: 0,
                tipo: 'insumo',
                stock_actual: 0,
                stock_minimo: 10,
                estado: 'activo'
            },
            {
                _id: 'ins003',
                id_insumo: 'INS-003',
                codigo: 'LED-001',
                nombre: 'LED Rojo 5mm',
                NombProducto: 'LED rojo 5mm de alta luminosidad',
                descripcion: 'LED rojo 5mm 20mA',
                categoria: 'Componentes Digitales',
                cantidad: 0,
                tipo: 'insumo',
                stock_actual: 0,
                stock_minimo: 50,
                estado: 'activo'
            }
        ];
    }

    // Renderizar items directamente
    renderItemsDirectamente(items) {
        this.allItems = items;
        this.aplicarFiltrosDirectamente();
    }

    // Configurar filtros directamente
    setupFiltrosDirectamente(items) {
        this.allItems = items;

        // Event listeners para filtros
        document.getElementById('busqueda-universal')?.addEventListener('input', () => this.aplicarFiltrosDirectamente());
        document.getElementById('tipo-select')?.addEventListener('change', () => this.aplicarFiltrosDirectamente());
        document.getElementById('categoria-select')?.addEventListener('change', () => this.aplicarFiltrosDirectamente());
        document.getElementById('estado-select')?.addEventListener('change', () => this.aplicarFiltrosDirectamente());

        document.getElementById('limpiar-busqueda')?.addEventListener('click', () => this.limpiarFiltros());
    }

    // Aplicar filtros directamente
    aplicarFiltrosDirectamente() {
        console.log('🔍 Aplicando filtros directamente desde index.js...');

        const busqueda = document.getElementById('busqueda-universal')?.value.toLowerCase() || '';
        const tipo = document.getElementById('tipo-select')?.value || 'todos';
        const categoria = document.getElementById('categoria-select')?.value || 'todas';
        const estado = document.getElementById('estado-select')?.value || 'todos';

        console.log('🔍 Criterios de filtro desde index.js:', { busqueda, tipo, categoria, estado });

        // Si el filtro es sin-stock, hacer consulta directa a la API
        if (estado === 'sin-stock') {
            this.cargarItemsSinStock();
            return;
        }

        // Para los demás filtros, usar la lógica normal
        this.filtrarItemsLocales(busqueda, tipo, categoria, estado);
    }

    // Cargar items sin stock directamente desde la API
    async cargarItemsSinStock() {
        try {
            console.log('🔍 Cargando items sin stock directamente desde API...');

            const token = localStorage.getItem('utn_token');

            // Consultar insumos con cantidad = 0
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/insumos?cantidad=0`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const insumosSinStock = await response.json();
                console.log('📦 Insumos sin stock cargados:', insumosSinStock.length);

                // Verificar qué datos retornó la API
                console.log('📊 Muestra de datos retornados por API:', insumosSinStock.slice(0, 5).map(item => ({
                    nombre: item.NombProducto || item.nombre,
                    cantidad: item.cantidad,
                    stock_actual: item.stock_actual,
                    id: item.id_insumo
                })));

                // Verificar cuántos realmente tienen cantidad = 0
                const realesSinStock = insumosSinStock.filter(item => item.cantidad === 0);
                console.log('📊 Items que realmente tienen cantidad = 0:', realesSinStock.length);

                // Verificar si hay algún campo con stock 0
                const stockActualCero = insumosSinStock.filter(item => (item.stock_actual || 0) === 0);
                console.log('📊 Items con stock_actual = 0:', stockActualCero.length);

                // Mostrar rangos de cantidades
                const cantidades = insumosSinStock.map(item => item.cantidad || 0);
                const minCantidad = Math.min(...cantidades);
                const maxCantidad = Math.max(...cantidades);
                console.log('📊 Rango de cantidades:', { min: minCantidad, max: maxCantidad });
                console.log('📊 Cantidades únicas:', [...new Set(cantidades.slice(0, 10))]);

                // Si la API no filtró por cantidad, filtrar localmente
                const itemsFiltrados = insumosSinStock.filter(item => {
                    // Solo items con stock_actual = 0 (el campo correcto)
                    if ((item.stock_actual || 0) !== 0) return false;

                    // Aplicar filtros adicionales (búsqueda, tipo, categoría)
                    const busqueda = document.getElementById('busqueda-universal')?.value.toLowerCase() || '';
                    const tipo = document.getElementById('tipo-select')?.value || 'todos';
                    const categoria = document.getElementById('categoria-select')?.value || 'todas';

                    // Filtro de búsqueda
                    if (busqueda && !item.nombre?.toLowerCase().includes(busqueda) &&
                        !item.caracteristicas?.toLowerCase().includes(busqueda) &&
                        !item.codigo?.toLowerCase().includes(busqueda) &&
                        !item.NombProducto?.toLowerCase().includes(busqueda)) {
                        return false;
                    }

                    // Filtro de tipo
                    if (tipo !== 'todos' && tipo !== 'insumo') return false;

                    // Filtro de categoría
                    if (categoria !== 'todas' && item.categoria !== categoria) return false;

                    return true;
                });

                this.filteredItems = itemsFiltrados;
                console.log('✅ Items sin stock filtrados (reales):', this.filteredItems.length);
                this.mostrarItemsFiltrados();

            } else {
                console.log('❌ Error cargando items sin stock, usando fallback...');
                this.filtrarItemsLocales('', 'insumo', 'todas', 'sin-stock');
            }

        } catch (error) {
            console.error('❌ Error en consulta directa de sin stock:', error);
            console.log('🔄 Usando filtro local como fallback...');
            this.filtrarItemsLocales('', 'insumo', 'todas', 'sin-stock');
        }
    }

    // Filtrar items localmente (método original)
    filtrarItemsLocales(busqueda, tipo, categoria, estado) {
        console.log('🔍 Filtrando items localmente...');

        this.filteredItems = this.allItems.filter(item => {
            // Excluir items eliminados
            if (item.estado === 'eliminado') return false;

            // Filtro de búsqueda
            if (busqueda && !item.nombre?.toLowerCase().includes(busqueda) &&
                !item.descripcion?.toLowerCase().includes(busqueda) &&
                !item.codigo?.toLowerCase().includes(busqueda) &&
                !item.NombProducto?.toLowerCase().includes(busqueda)) {
                return false;
            }

            // Filtro de tipo
            if (tipo !== 'todos') {
                if (tipo === 'activo' && item.tipo !== 'activo') return false;
                if (tipo === 'insumo' && item.tipo !== 'insumo') return false;
            }

            // Filtro de categoría
            if (categoria !== 'todas' && item.categoria !== categoria) {
                return false;
            }

            // Filtro de estado
            if (estado !== 'todos') {
                const itemCantidad = item.cantidad || 0;
                const itemStockActual = item.stock_actual !== undefined ? item.stock_actual : item.cantidad || 0;

                if (estado === 'disponible' && itemStockActual <= 0) return false;
                if (estado === 'con-stock' && itemStockActual <= 0) return false;
                if (estado === 'bajo-stock' && !(itemStockActual > 0 && itemStockActual <= 5)) return false;
                if (estado === 'sin-stock' && itemStockActual !== 0) return false;
            }

            return true;
        });

        console.log('✅ Items filtrados desde index.js:', this.filteredItems.length);
        this.mostrarItemsFiltrados();
    }

// Inicializar el controlador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 index.js - DOM listo, inicializando IndexController...');
    window.indexController = new IndexController();
});

// También inicializar si el DOM ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 index.js - DOM cargando, esperando...');
    });
} else {
    console.log('🚀 index.js - DOM ya listo, inicializando IndexController...');
    window.indexController = new IndexController();
}

console.log('🎨 Renderizando items en el grid...', this.filteredItems.length);

// Actualizar contador
if (resultadosCount) {
    resultadosCount.textContent = `(${this.filteredItems.length})`;
}

// Actualizar título
if (resultadosTitulo) {
    const busqueda = document.getElementById('busqueda-universal')?.value;
    if (busqueda) {
        resultadosTitulo.textContent = 'Resultados de búsqueda';
    } else {
        resultadosTitulo.textContent = 'Todos los artículos';
    }
}

// Limpiar grid
itemsGrid.innerHTML = '';

// Mostrar items
if (this.filteredItems.length === 0) {
    itemsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-slate-400 text-lg">🔍 No se encontraron resultados</div>
                    <div class="text-slate-500 text-sm mt-2">Intenta con otros criterios de búsqueda</div>
                </div>
            `;
} else {
    this.filteredItems.forEach((item, index) => {
        const itemCard = this.crearItemCard(item);
        itemCard.style.animationDelay = `${index * 50}ms`;
        itemsGrid.appendChild(itemCard);
    });
}

console.log('✅ Items mostrados en el grid desde index.js:', this.filteredItems.length);
    }

// Crear card para item (estilo insumos.html)
crearItemCard(item) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group';

    // Debug para ver los valores
    console.log('🔍 Creando card para item:', {
        nombre: item.NombProducto || item.nombre,
        stock_actual: item.stock_actual,
        cantidad: item.cantidad,
        stockReal: item.stock_actual !== undefined ? item.stock_actual : item.cantidad || 0
    });

    // Determinar tipo y icono
    const tipo = item.tipo || 'insumo'; // Default a 'insumo' si no está definido
    const tipoIcon = tipo === 'activo' ? '🔧' : '🧩';

    // Usar stock_actual para el badge (el campo correcto para sin stock)
    const stockReal = item.stock_actual !== undefined ? item.stock_actual : item.cantidad || 0;

    // Debug del stockReal
    console.log(`🔍 Stock real para "${item.NombProducto || item.nombre}": ${stockReal}`);

    // Usar los mismos campos que insumos.html
    const nombre = item.NombProducto || item.nombre || 'Sin nombre';
    const id = item.id_insumo || item.codigo || 'N/A';
    const caracteristicas = item.caracteristicas || item.descripcion || 'Sin descripción';
    const categoria = item.categoria || 'N/A';

    // Determinar clase de stock como en insumos.html (usando stock_real)
    const getStockClass = (stockReal) => {
        if (stockReal <= 0) return 'bg-red-100 text-red-600';
        if (stockReal <= 5) return 'bg-yellow-100 text-yellow-600';
        return 'bg-green-100 text-green-600';
    };

    const getStockText = (stockReal) => {
        if (stockReal <= 0) return 'SIN STOCK';
        if (stockReal <= 5) return 'BAJO STOCK';
        return 'CON STOCK';
    };

    const stockClass = getStockClass(stockReal);
    const stockBadgeText = getStockText(stockReal);

    // Debug del badge
    console.log(`🔍 Badge para "${nombre}": "${stockBadgeText}" (stockReal: ${stockReal})`);

    // Determinar clase de tipo con safe check
    const getTipoClass = (tipo) => {
        if (tipo === 'activo') return 'text-blue-600 bg-blue-50';
        return 'text-green-600 bg-green-50'; // Default para insumo
    };

    const tipoClass = getTipoClass(tipo);

    card.innerHTML = `
            <div class="relative h-32 bg-slate-100 overflow-hidden">
                <img src="https://picsum.photos/seed/${tipo}-${id}/400/300.jpg" class="w-full h-full object-cover">
                <div class="absolute top-2 right-2">
                    <span class="px-2 py-1 text-[10px] font-bold uppercase rounded-full ${stockClass}">
                        ${stockBadgeText}
                    </span>
                </div>
                <div class="absolute top-2 left-2">
                    <span class="text-2xl">${tipoIcon}</span>
                </div>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <h3 class="font-bold text-slate-800 text-sm line-clamp-1">${nombre}</h3>
                        <p class="text-[10px] text-slate-400">ID: ${id}</p>
                    </div>
                    <span class="text-[10px] font-medium ${tipoClass} px-2 py-0.5 rounded">
                        ${tipo.toUpperCase()}
                    </span>
                </div>
                
                <div class="space-y-3 mb-4">
                    <div class="flex flex-col text-xs border-b border-slate-50 pb-1">
                        <span class="text-slate-400 font-semibold mb-1">Características:</span>
                        <span class="text-slate-700 leading-relaxed">${caracteristicas}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs pt-1">
                        <span class="text-slate-400">Disponibles: <span class="text-slate-700 font-bold">${stockReal}</span></span>
                        <span class="text-slate-700 font-medium">${categoria}</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200" onclick="window.indexController.agregarAlCarrito('${item._id || item.id_insumo}')">
                        🛒 Solicitar
                    </button>
                </div>
            </div>
        `;

    return card;
}

// Limpiar filtros
limpiarFiltros() {
    console.log('🔄 Limpiando filtros desde index.js...');
    document.getElementById('busqueda-universal').value = '';
    document.getElementById('tipo-select').value = 'todos';
    document.getElementById('categoria-select').value = 'todas';
    document.getElementById('estado-select').value = 'todos';

    // Resetear items
    this.filteredItems = [...this.allItems];
    this.mostrarItemsFiltrados();

    if (window.Utils) {
        Utils.showToast('🔄 Filtros limpiados', 'success');
    }
}

// Agregar al carrito
agregarAlCarrito(itemId) {
    console.log('🛒 Agregando al carrito desde index.js:', itemId);
    if (window.Utils) {
        Utils.showToast('🛒 Agregado al carrito', 'success');
    }
}

    // Cargar items sin stock directamente desde la API
    async cargarItemsSinStock() {
    try {
        console.log('🔍 Cargando items sin stock directamente desde API...');

        const token = localStorage.getItem('utn_token');

        // Consultar insumos con cantidad = 0
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/insumos?cantidad=0`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const insumosSinStock = await response.json();
            console.log('📦 Insumos sin stock cargados:', insumosSinStock.length);

            // Verificar qué datos retornó la API
            console.log('📊 Muestra de datos retornados por API:', insumosSinStock.slice(0, 5).map(item => ({
                nombre: item.NombProducto || item.nombre,
                cantidad: item.cantidad,
                stock_actual: item.stock_actual,
                id: item.id_insumo
            })));

            // Verificar cuántos realmente tienen cantidad = 0
            const realesSinStock = insumosSinStock.filter(item => item.cantidad === 0);
            console.log('� Items que realmente tienen cantidad = 0:', realesSinStock.length);

            // Verificar si hay algún campo con stock 0
            const stockActualCero = insumosSinStock.filter(item => (item.stock_actual || 0) === 0);
            console.log('📊 Items con stock_actual = 0:', stockActualCero.length);

            // Mostrar rangos de cantidades
            const cantidades = insumosSinStock.map(item => item.cantidad || 0);
            const minCantidad = Math.min(...cantidades);
            const maxCantidad = Math.max(...cantidades);
            console.log('📊 Rango de cantidades:', { min: minCantidad, max: maxCantidad });
            console.log('📊 Cantidades únicas:', [...new Set(cantidades.slice(0, 10))]);

            // Si la API no filtró por cantidad, filtrar localmente
            const itemsFiltrados = insumosSinStock.filter(item => {
                // Solo items con stock_actual = 0 (el campo correcto)
                if ((item.stock_actual || 0) !== 0) return false;

                // Aplicar filtros adicionales (búsqueda, tipo, categoría)
                const busqueda = document.getElementById('busqueda-universal')?.value.toLowerCase() || '';
                const tipo = document.getElementById('tipo-select')?.value || 'todos';
                const categoria = document.getElementById('categoria-select')?.value || 'todas';

                // Filtro de búsqueda
                if (busqueda && !item.nombre?.toLowerCase().includes(busqueda) &&
                    !item.caracteristicas?.toLowerCase().includes(busqueda) &&
                    !item.codigo?.toLowerCase().includes(busqueda) &&
                    !item.NombProducto?.toLowerCase().includes(busqueda)) {
                    return false;
                }

                // Filtro de tipo
                if (tipo !== 'todos' && tipo !== 'insumo') return false;

                // Filtro de categoría
                if (categoria !== 'todas' && item.categoria !== categoria) return false;

                return true;
            });

            this.filteredItems = itemsFiltrados;
            console.log('✅ Items sin stock filtrados (reales):', this.filteredItems.length);
            this.mostrarItemsFiltrados();

        } else {
            console.log('❌ Error cargando items sin stock, usando fallback...');
            this.filtrarItemsLocales('', 'insumo', 'todas', 'sin-stock');
        }

    } catch (error) {
        console.error('❌ Error en consulta directa de sin stock:', error);
        console.log('🔄 Usando filtro local como fallback...');
        this.filtrarItemsLocales('', 'insumo', 'todas', 'sin-stock');
    }
}
filtrarItemsLocales(busqueda, tipo, categoria, estado) {
    console.log('🔍 Filtrando items localmente...');

    this.filteredItems = this.allItems.filter(item => {
        // Excluir items eliminados
        if (item.estado === 'eliminado') return false;

        // Filtro de búsqueda
        if (busqueda && !item.nombre?.toLowerCase().includes(busqueda) &&
            !item.descripcion?.toLowerCase().includes(busqueda) &&
            !item.codigo?.toLowerCase().includes(busqueda) &&
            !item.NombProducto?.toLowerCase().includes(busqueda)) {
            return false;
            const tipoClass = getTipoClass(tipo);

            card.innerHTML = `
            <div class="relative h-32 bg-slate-100 overflow-hidden">
                <img src="https://picsum.photos/seed/${tipo}-${id}/400/300.jpg" class="w-full h-full object-cover">
                <div class="absolute top-2 right-2">
                    <span class="px-2 py-1 text-[10px] font-bold uppercase rounded-full ${stockClass}">
                        ${stockBadgeText}
                    </span>
                </div>
                <div class="absolute top-2 left-2">
                    <span class="text-2xl">${tipoIcon}</span>
                </div>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <h3 class="font-bold text-slate-800 text-sm line-clamp-1">${nombre}</h3>
                        <p class="text-[10px] text-slate-400">ID: ${id}</p>
                    </div>
                    <span class="text-[10px] font-medium ${tipoClass} px-2 py-0.5 rounded">
                        ${tipo.toUpperCase()}
                    </span>
                </div>
                
                <div class="space-y-3 mb-4">
                    <div class="flex flex-col text-xs border-b border-slate-50 pb-1">
                        <span class="text-slate-400 font-semibold mb-1">Características:</span>
                        <span class="text-slate-700 leading-relaxed">${caracteristicas}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs pt-1">
                        <span class="text-slate-400">Disponibles: <span class="text-slate-700 font-bold">${stockReal}</span></span>
                        <span class="text-slate-700 font-medium">${categoria}</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200" onclick="window.indexController.agregarAlCarrito('${item._id || item.id_insumo}')">
                        🛒 Solicitar
                    </button>
                </div>
            </div>
        `;

            return card;
        }

        // Limpiar filtros
        limpiarFiltros() {
            console.log('🔄 Limpiando filtros desde index.js...');
            document.getElementById('busqueda-universal').value = '';
            document.getElementById('tipo-select').value = 'todos';
            document.getElementById('categoria-select').value = 'todas';
            document.getElementById('estado-select').value = 'todos';

            // Resetear items
            this.filteredItems = [...this.allItems];
            this.mostrarItemsFiltrados();

            if (window.Utils) {
                Utils.showToast('🔄 Filtros limpiados', 'success');
            }
        }

        // Agregar al carrito
        agregarAlCarrito(itemId) {
            console.log('🛒 Agregando al carrito desde index.js:', itemId);
            if (window.Utils) {
                Utils.showToast('🛒 Agregado al carrito', 'success');
            }
        }
    }

// Inicializar el controlador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 index.js - DOM listo, inicializando IndexController...');
        window.indexController = new IndexController();
    });

    // También inicializar si el DOM ya está listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 index.js - DOM cargando, esperando...');
        });
    } else {
        console.log('🚀 index.js - DOM ya listo, inicializando IndexController...');
        window.indexController = new IndexController();
    }
