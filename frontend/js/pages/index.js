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
                console.log('📦 Tipo de datos activos:', typeof activos);
                console.log('📦 Tipo de datos insumos:', typeof insumos);
                console.log('📦 Es array activos:', Array.isArray(activos));
                console.log('📦 Es array insumos:', Array.isArray(insumos));

                // Asegurar que ambos sean arrays
                const activosArray = Array.isArray(activos) ? activos : [];
                const insumosArray = Array.isArray(insumos) ? insumos : [];

                // Combinar datos y agregar tipo
                const allRealItems = [
                    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
                    ...insumosArray.map(item => ({ ...item, tipo: 'insumo' }))
                ];

                console.log('📊 Items reales combinados (directos):', allRealItems.length);
                console.log('📊 Muestra de datos:', allRealItems.slice(0, 3));

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

        this.filteredItems = this.allItems.filter(item => {
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
                if (estado === 'disponible' && itemCantidad <= 0) return false;
                if (estado === 'con-stock' && itemCantidad <= 0) return false;
                if (estado === 'bajo-stock' && itemCantidad > 5) return false;
                if (estado === 'sin-stock' && itemCantidad > 0) return false;
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

        // NO limpiar el grid si ya tiene contenido para evitar parpadeo
        if (itemsGrid.children.length === 0) {
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
