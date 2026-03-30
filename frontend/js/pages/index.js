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
                console.log('📊 Muestra de datos retornados por API:', insumosSinStock.slice(0, 3).map(item => ({
                    nombre: item.NombProducto || item.nombre,
                    cantidad: item.cantidad,
                    id: item.id_insumo
                })));

                // Verificar cuántos realmente tienen cantidad = 0
                const realesSinStock = insumosSinStock.filter(item => item.cantidad === 0);
                console.log('📊 Items que realmente tienen cantidad = 0:', realesSinStock.length);

                // Si la API no filtró por cantidad, filtrar localmente
                const itemsFiltrados = insumosSinStock.filter(item => {
                    // Solo items con cantidad = 0
                    if (item.cantidad !== 0) return false;

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

    // Mostrar items filtrados
    mostrarItemsFiltrados() {
        const itemsGrid = document.getElementById('itemsGrid');
        const resultadosCount = document.getElementById('resultados-count');
        const resultadosTitulo = document.getElementById('resultados-titulo');

        if (!itemsGrid) {
            console.log('❌ No se encontró itemsGrid desde index.js');
            return;
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

        const tipoIcon = item.tipo === 'activo' ? '🔧' : '🧩';
        const cantidad = item.cantidad || 0;

        // Usar los mismos campos que insumos.html
        const nombre = item.NombProducto || item.nombre || 'Sin nombre';
        const id = item.id_insumo || item.codigo || 'N/A';
        const caracteristicas = item.caracteristicas || item.descripcion || 'Sin descripción';
        const categoria = item.categoria || 'N/A';

        // Determinar clase de stock como en insumos.html
        const getStockClass = (cantidad) => {
            if (cantidad <= 0) return 'bg-red-100 text-red-600';
            if (cantidad <= 5) return 'bg-yellow-100 text-yellow-600';
            return 'bg-green-100 text-green-600';
        };

        const getStockText = (cantidad) => {
            if (cantidad <= 0) return 'SIN STOCK';
            if (cantidad <= 5) return 'BAJO STOCK';
            return 'CON STOCK';
        };

        const stockClass = getStockClass(cantidad);
        const stockBadgeText = getStockText(cantidad);

        card.innerHTML = `
            <div class="relative h-32 bg-slate-100 overflow-hidden">
                <img src="https://picsum.photos/seed/${item.tipo}-${id}/400/300.jpg" class="w-full h-full object-cover">
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
                    <span class="text-[10px] font-medium ${item.tipo === 'activo' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'} px-2 py-0.5 rounded">
                        ${item.tipo.toUpperCase()}
                    </span>
                </div>
                
                <div class="space-y-3 mb-4">
                    <div class="flex flex-col text-xs border-b border-slate-50 pb-1">
                        <span class="text-slate-400 font-semibold mb-1">Características:</span>
                        <span class="text-slate-700 leading-relaxed">${caracteristicas}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs pt-1">
                        <span class="text-slate-400">Disponibles: <span class="text-slate-700 font-bold">${cantidad}</span></span>
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
const allRealItems = [
    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
    ...insumosArray.map(item => ({ ...item, tipo: 'insumo' }))
];

console.log('📊 Items reales combinados (directos):', allRealItems.length);
console.log('📊 Muestra de datos:', allRealItems.slice(0, 3).map(item => ({
    nombre: item.NombProducto || item.nombre,
    cantidad: item.cantidad,
    stock_actual: item.stock_actual,
    tipo: item.tipo,
    estado: item.estado,
    id: item.id_insumo || item.codigo
})));

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

// Si estamos usando datos de ejemplo, verificar si hay items sin stock
const itemsSinStock = this.allItems.filter(item => {
    const stock = item.stock_actual !== undefined ? item.stock_actual : item.cantidad || 0;
    return stock === 0;
});
console.log('📊 Items con stock 0 en datos finales:', itemsSinStock.length);

// Mostrar todos los items inicialmente
this.filteredItems = [...this.allItems];
this.renderItemsDirectamente(this.allItems);
this.setupFiltrosDirectamente(this.allItems);

        } catch (error) {
    console.error('❌ Error cargando items desde index.js:', error);
    console.log('🔄 Usando datos de ejemplo como fallback...');
    this.allItems = this.getDatosDeEjemplo();

    // Verificar items sin stock en el fallback
    const itemsSinStock = this.allItems.filter(item => {
        const stock = item.stock_actual !== undefined ? item.stock_actual : item.cantidad || 0;
        return stock === 0;
    });
    console.log('📊 Items con stock 0 en fallback:', itemsSinStock.length);

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
        {
            _id: 'act003',
            codigo: 'ACT-003',
            nombre: 'Fuente de Poder',
            descripcion: 'Fuente de poder regulable 0-30V DC',
            categoria: 'Fuentes de Poder',
            cantidad: 8,
            tipo: 'activo',
            estado: 'disponible'
        },
        {
            _id: 'act004',
            codigo: 'ACT-004',
            nombre: 'Generador de Funciones',
            descripcion: 'Generador de funciones 20MHz',
            categoria: 'Generadores',
            cantidad: 3,
            tipo: 'activo',
            estado: 'disponible'
        },
        {
            _id: 'act005',
            codigo: 'ACT-005',
            nombre: 'Protoboard',
            descripcion: 'Protoboard de 830 puntos',
            categoria: 'Componentes Digitales',
            cantidad: 15,
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
            cantidad: 50,
            tipo: 'insumo',
            stock_actual: 50,
            stock_minimo: 10
        },
        {
            _id: 'ins003',
            id_insumo: 'INS-003',
            codigo: 'LED-001',
            nombre: 'LED Rojo 5mm',
            NombProducto: 'LED rojo 5mm de alta luminosidad',
            descripcion: 'LED rojo 5mm 20mA',
            categoria: 'Componentes Digitales',
            cantidad: 200,
            tipo: 'insumo',
            stock_actual: 200,
            stock_minimo: 50
        },
        {
            _id: 'ins004',
            id_insumo: 'INS-004',
            codigo: 'BC547',
            nombre: 'Transistor NPN',
            NombProducto: 'Transistor BC547 NPN',
            descripcion: 'Transistor NPN BC547',
            categoria: 'Componentes Analógicos',
            cantidad: 75,
            tipo: 'insumo',
            stock_actual: 75,
            stock_minimo: 15
        },
        {
            _id: 'ins005',
            id_insumo: 'INS-005',
            codigo: 'DIOD-001',
            nombre: 'Diodo 1N4007',
            NombProducto: 'Diodo rectificador 1N4007',
            descripcion: 'Diodo rectificador 1N4007 1000V',
            categoria: 'Componentes Analógicos',
            cantidad: 150,
            tipo: 'insumo',
            stock_actual: 150,
            stock_minimo: 30
        },
        // Items SIN STOCK para prueba
        {
            _id: 'ins006',
            id_insumo: 'INS-006',
            codigo: 'RES-010',
            nombre: 'Resistencia 10Ω',
            NombProducto: 'Resistencia 10Ω 1/4W',
            descripcion: 'Resistencia carbón 10Ω 1/4W 5%',
            categoria: 'Componentes Digitales',
            cantidad: 0,
            tipo: 'insumo',
            stock_actual: 0,
            stock_minimo: 20,
            estado: 'activo'
        },
        {
            _id: 'ins007',
            id_insumo: 'INS-007',
            codigo: 'LED-RED',
            nombre: 'LED rojo 5mm',
            NombProducto: 'LED rojo 5mm alta luminosidad',
            descripcion: 'LED rojo 5mm 20mA',
            categoria: 'Componentes Digitales',
            cantidad: 0,
            tipo: 'insumo',
            stock_actual: 0,
            stock_minimo: 50,
            estado: 'activo'
        },
        {
            _id: 'ins008',
            id_insumo: 'INS-008',
            codigo: 'TRANS-2222',
            nombre: 'Transistor NPN 2N2222',
            NombProducto: 'Transistor NPN 2N2222',
            descripcion: 'Transistor NPN 2N2222',
            categoria: 'Componentes Analógicos',
            cantidad: 0,
            tipo: 'insumo',
            stock_actual: 0,
            stock_minimo: 15,
            estado: 'activo'
        },
        {
            _id: 'ins009',
            id_insumo: 'INS-009',
            codigo: 'CAP-10NF',
            nombre: 'Capacitor cerámico 10nF',
            NombProducto: 'Capacitor cerámico 10nF',
            descripcion: 'Capacitor cerámico 10nF 50V',
            categoria: 'Componentes Digitales',
            cantidad: 0,
            tipo: 'insumo',
            stock_actual: 0,
            stock_minimo: 25,
            estado: 'activo'
        },
        {
            _id: 'ins010',
            id_insumo: 'INS-010',
            codigo: 'DIOD-1N4007',
            nombre: 'Diodo rectificador 1N4007',
            NombProducto: 'Diodo rectificador 1N4007',
            descripcion: 'Diodo rectificador 1N4007 1000V',
            categoria: 'Componentes Analógicos',
            cantidad: 0,
            tipo: 'insumo',
            stock_actual: 0,
            stock_minimo: 30,
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
            console.log('📊 Muestra de datos retornados por API:', insumosSinStock.slice(0, 3).map(item => ({
                nombre: item.NombProducto || item.nombre,
                cantidad: item.cantidad,
                id: item.id_insumo
            })));

            // Verificar cuántos realmente tienen cantidad = 0
            const realesSinStock = insumosSinStock.filter(item => item.cantidad === 0);
            console.log('📊 Items que realmente tienen cantidad = 0:', realesSinStock.length);

            // Si la API no filtró por cantidad, filtrar localmente
            const itemsFiltrados = insumosSinStock.filter(item => {
                // Solo items con cantidad = 0
                if (item.cantidad !== 0) return false;

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

                // Debug: mostrar algunos items y sus cantidades
                if (estado === 'sin-stock') {
                    console.log('🔍 Buscando items sin stock...');
                    console.log('📊 Muestra de items con cantidad:', this.allItems.slice(0, 10).map(item => ({
                        nombre: item.NombProducto || item.nombre,
                        cantidad: item.cantidad,
                        stock_actual: item.stock_actual,
                        stock_minimo: item.stock_minimo,
                        estado: item.estado,
                        tipo: item.tipo,
                        id: item.id_insumo || item.codigo
                    })));

                    // Mostrar items que tienen cantidad 0
                    const itemsSinStock = this.allItems.filter(item => (item.cantidad || 0) === 0);
                    console.log('📊 Items con cantidad 0 encontrados:', itemsSinStock.length);

                    // También buscar por stock_actual si existe
                    const itemsSinStockActual = this.allItems.filter(item => (item.stock_actual || 0) === 0);
                    console.log('📊 Items con stock_actual 0 encontrados:', itemsSinStockActual.length);

                    // Mostrar muestra de items con stock_actual 0
                    console.log('📊 Muestra de items con stock_actual 0:', itemsSinStockActual.slice(0, 2).map(item => ({
                        nombre: item.NombProducto || item.nombre,
                        cantidad: item.cantidad,
                        stock_actual: item.stock_actual,
                        estado: item.estado,
                        tipo: item.tipo,
                        id: item.id_insumo || item.codigo,
                        objetoCompleto: item
                    })));

                    // Verificar si los items de prueba están en allItems
                    const itemsDePrueba = this.allItems.filter(item =>
                        item.id_insumo && ['INS-006', 'INS-007', 'INS-008', 'INS-009', 'INS-010'].includes(item.id_insumo)
                    );
                    console.log('📊 Items de prueba con stock_actual 0:', itemsDePrueba.length);
                    console.log('📊 Items de prueba encontrados:', itemsDePrueba.map(item => ({
                        nombre: item.NombProducto || item.nombre,
                        stock_actual: item.stock_actual,
                        cantidad: item.cantidad
                    })));

                    // Filtrar solo items activos
                    const itemsActivosSinStock = itemsSinStockActual.filter(item => item.estado !== 'eliminado');
                    console.log('📊 Items activos con stock_actual 0:', itemsActivosSinStock.length);

                    // Buscar items con stock bajo (cerca de mínimo)
                    const itemsStockBajo = this.allItems.filter(item => {
                        const actual = item.stock_actual || item.cantidad || 0;
                        const minimo = item.stock_minimo || 0;
                        return actual <= minimo && actual > 0;
                    });
                    console.log('📊 Items con stock bajo encontrados:', itemsStockBajo.length);

                    console.log('📊 Muestra de items sin stock:', itemsSinStock.slice(0, 5).map(item => ({
                        nombre: item.NombProducto || item.nombre,
                        cantidad: item.cantidad,
                        stock_actual: item.stock_actual,
                        estado: item.estado,
                        id: item.id_insumo || item.codigo
                    })));
                }

                this.filteredItems = this.allItems.filter(item => {
                    // Debug para sin-stock
                    if (estado === 'sin-stock') {
                        console.log(` Analizando item: ${item.NombProducto || item.nombre}`);
                        console.log(`  - stock_actual: ${item.stock_actual}`);
                        console.log(`  - cantidad: ${item.cantidad}`);
                        console.log(`  - tipo: ${item.tipo}`);
                        console.log(`  - estado: ${item.estado}`);
                        console.log(`  - pasa estado: ${(item.stock_actual || 0) === 0}`);
                    }

                    // Excluir items eliminados
                    if (item.estado === 'eliminado') {
                        if (estado === 'sin-stock') console.log(`  Eliminado, descartando`);
                        return false;
                    }

                    // Filtro de búsqueda
                    if (busqueda && !item.nombre?.toLowerCase().includes(busqueda) &&
                        !item.descripcion?.toLowerCase().includes(busqueda) &&
                        !item.codigo?.toLowerCase().includes(busqueda) &&
                        !item.NombProducto?.toLowerCase().includes(busqueda)) {
                        if (estado === 'sin-stock') console.log(`  No coincide con búsqueda`);
                        return false;
                    }

                    // Filtro de tipo
                    if (tipo !== 'todos') {
                        // Debug para ver el tipo de los items
                        if (estado === 'sin-stock') {
                            console.log(` Verificando tipo: ${item.NombProducto || item.nombre} - Tipo: ${item.tipo} - Requiere: ${tipo}`);
                        }

                        if (tipo === 'activo' && item.tipo !== 'activo') return false;
                        if (tipo === 'insumo' && item.tipo !== 'insumo') return false;
                    }

                    // Filtro de categoría
                    if (categoria !== 'todas' && item.categoria !== categoria) {
                        if (estado === 'sin-stock') console.log(`  No coincide con categoría`);
                        return false;
                    }

                    // Filtro de estado
                    if (estado !== 'todos') {
                        const itemCantidad = item.cantidad || 0;
                        const itemStockActual = item.stock_actual !== undefined ? item.stock_actual : item.cantidad || 0;

                        if (estado === 'disponible' && itemStockActual <= 0) return false;
                        if (estado === 'con-stock' && itemStockActual <= 0) return false;
                        if (estado === 'bajo-stock' && !(itemStockActual > 0 && itemStockActual <= 5)) return false;
                        if (estado === 'sin-stock' && itemStockActual !== 0) {
                            if (estado === 'sin-stock') console.log(`  No tiene stock 0, tiene ${itemStockActual} (usando ${item.stock_actual !== undefined ? 'stock_actual' : 'cantidad'})`);
                            return false;
                        }

                        // Debug para sin-stock
                        if (estado === 'sin-stock') {
                            console.log(` Item pasa filtro sin-stock`);
                        }
                    }

                    return true;
                });

                console.log('✅ Items filtrados desde index.js:', this.filteredItems.length);
                this.mostrarItemsFiltrados();
            }

            // Mostrar items filtrados
            mostrarItemsFiltrados() {
                const itemsGrid = document.getElementById('itemsGrid');
                const resultadosCount = document.getElementById('resultados-count');
                const resultadosTitulo = document.getElementById('resultados-titulo');

                if(!itemsGrid) {
                    console.log('❌ No se encontró itemsGrid desde index.js');
                    return;
                }

                console.log('🎨 Renderizando items en el grid...', this.filteredItems.length);

                // Actualizar contador
                if(resultadosCount) {
                    resultadosCount.textContent = `(${this.filteredItems.length})`;
                }

                // Actualizar título
                if(resultadosTitulo) {
                    const busqueda = document.getElementById('busqueda-universal')?.value;
                    if (busqueda) {
                        resultadosTitulo.textContent = 'Resultados de búsqueda';
                    } else {
                        resultadosTitulo.textContent = 'Todos los artículos';
                    }
                }

                // NO limpiar el grid si ya tiene contenido para evitar parpadeo
                if(itemsGrid.children.length === 0) {
                    itemsGrid.innerHTML = '';
        } else {
            // Solo limpiar si es necesario
            const currentItems = itemsGrid.children.length;
            if (currentItems !== this.filteredItems.length) {
                itemsGrid.innerHTML = '';
            }
        }

        // Mostrar items
        if (this.filteredItems.length === 0) {
            itemsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-slate-400 text-lg">🔍 No se encontraron resultados</div>
                    <div class="text-slate-500 text-sm mt-2">Intenta con otros criterios de búsqueda</div>
                </div>
            `;
        } else {
            // Limpiar solo si es necesario para evitar parpadeo
            if (itemsGrid.children.length !== this.filteredItems.length) {
                itemsGrid.innerHTML = '';
            }

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

        const tipoIcon = item.tipo === 'activo' ? '🔧' : '🧩';
        const cantidad = item.cantidad || 0;

        // Usar los mismos campos que insumos.html
        const nombre = item.NombProducto || item.nombre || 'Sin nombre';
        const id = item.id_insumo || item.codigo || 'N/A';
        const caracteristicas = item.caracteristicas || item.descripcion || 'Sin descripción';
        const categoria = item.categoria || 'N/A';

        // Determinar clase de stock como en insumos.html
        const getStockClass = (cantidad) => {
            if (cantidad <= 0) return 'bg-red-100 text-red-600';
            if (cantidad <= 5) return 'bg-yellow-100 text-yellow-600';
            return 'bg-green-100 text-green-600';
        };

        const getStockText = (cantidad) => {
            if (cantidad <= 0) return 'SIN STOCK';
            if (cantidad <= 5) return 'BAJO STOCK';
            return 'CON STOCK';
        };

        const stockClass = getStockClass(cantidad);
        const stockBadgeText = getStockText(cantidad);

        card.innerHTML = `
            <div class="relative h-32 bg-slate-100 overflow-hidden">
                <img src="https://picsum.photos/seed/${item.tipo}-${id}/400/300.jpg" class="w-full h-full object-cover">
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
                    <span class="text-[10px] font-medium ${item.tipo === 'activo' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'} px-2 py-0.5 rounded">
                        ${item.tipo.toUpperCase()}
                    </span>
                </div>
                
                <div class="space-y-3 mb-4">
                    <div class="flex flex-col text-xs border-b border-slate-50 pb-1">
                        <span class="text-slate-400 font-semibold mb-1">Características:</span>
                        <span class="text-slate-700 leading-relaxed">${caracteristicas}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs pt-1">
                        <span class="text-slate-400">Disponibles: <span class="text-slate-700 font-bold">${cantidad}</span></span>
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

    async loadDashboardData() {
        try {
            console.log('📊 Cargando datos del dashboard desde index.js...');

            // No cargar datos del dashboard para evitar conflictos con los filtros
            // Los filtros ya cargan sus propios datos en cargarItemsParaFiltrar()
            console.log('⚠️ Dashboard data loading skipped para evitar conflictos con filtros');

        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Error al cargar los datos', 'error');
            }
        }
    }

    updateStatistics(activos, insumos, solicitudes) {
        // Total de activos
        const totalActivosElement = document.getElementById('totalActivos');
        if (totalActivosElement) {
            totalActivosElement.textContent = activos.length;
        }

        // Total de insumos
        const totalInsumosElement = document.getElementById('totalInsumos');
        if (totalInsumosElement) {
            totalInsumosElement.textContent = insumos.length;
        }

        // Solicitudes pendientes
        const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
        const solicitudesPendientesElement = document.getElementById('solicitudesPendientes');
        if (solicitudesPendientesElement) {
            solicitudesPendientesElement.textContent = solicitudesPendientes.length;
        }

        // Usuarios activos (simulado - en producción vendría de API)
        const usuariosActivosElement = document.getElementById('usuariosActivos');
        if (usuariosActivosElement) {
            usuariosActivosElement.textContent = '42'; // Valor simulado
        }
    }

    updateRecentActivity(solicitudes) {
        const actividadElement = document.getElementById('actividadReciente');
        if (!actividadElement) return;

        // Obtener las últimas 5 solicitudes
        const solicitudesRecientes = solicitudes
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (solicitudesRecientes.length === 0) {
            actividadElement.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-2">📋</div>
                    <p class="text-slate-500">No hay actividad reciente</p>
                </div>
            `;
            return;
        }

        actividadElement.innerHTML = solicitudesRecientes.map(solicitud => {
            const fecha = Utils.formatDateTime(solicitud.createdAt);
            const icono = this.getActivityIcon(solicitud);
            const descripcion = this.getActivityDescription(solicitud);

            return `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${icono}</span>
                        <div>
                            <p class="font-medium">${descripcion}</p>
                            <p class="text-sm text-slate-600">Solicitado por ${solicitud.usuario?.nombre_completo || 'Usuario'}</p>
                        </div>
                    </div>
                    <span class="text-sm text-slate-500">${this.getTimeAgo(solicitud.createdAt)}</span>
                </div>
                `;
        }).join('');
    }

    getActivityIcon(solicitud) {
        if (solicitud.activos && solicitud.activos.length > 0) {
            return '🔧';
        } else if (solicitud.insumos && solicitud.insumos.length > 0) {
            return '📦';
        }
        return '📋';
    }

    getActivityDescription(solicitud) {
        if (solicitud.activos && solicitud.activos.length > 0) {
            const activo = solicitud.activos[0];
            return activo.nombre || 'Activo';
        } else if (solicitud.insumos && solicitud.insumos.length > 0) {
            const insumo = solicitud.insumos[0];
            return insumo.nombreProducto || 'Insumo';
        }
        return 'Solicitud';
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `Hace ${diffMins} min`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} horas`;
        } else {
            return `Hace ${diffDays} días`;
        }
    }

    // Inicializar dashboard
    async initialize() {
        // Verificar autenticación
        const isAuth = window.authController?.checkAuthStatus();

        if (!isAuth) {
            return;
        }

        // Cargar datos
        await this.loadDashboardData();

        // Inicializar filtros
        this.setupFiltros();
    }
}

// Crear instancia global
window.indexController = new IndexController();

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando indexController desde index.js...');
    window.indexController.initialize();
});
