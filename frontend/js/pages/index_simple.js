// Controlador simple para el dashboard
class IndexController {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        this.init();
    }

    async init() {
        console.log(' Iniciando IndexController simple...');

        // Esperar a que el DOM esté listo antes de configurar filtros y cargar items
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log(' DOM listo - Configurando filtros y cargando items...');
                this.setupFiltros(() => this.cargarItems());
            });
        } else {
            // DOM ya está listo, configurar filtros y cargar items
            setTimeout(() => {
                console.log(' DOM ya listo - Configurando filtros y cargando items...');
                this.setupFiltros(() => this.cargarItems());
            }, 100);
        }
    }

    setupFiltros(callback) {
        // Pequeña espera para asegurar que el DOM esté listo
        setTimeout(() => {
            const buscarBtn = document.getElementById('buscar-btn');
            const limpiarBtn = document.getElementById('limpiar-busqueda');
            const busquedaInput = document.getElementById('busqueda-universal');
            const tipoSelect = document.getElementById('tipo-select');
            const categoriaSelect = document.getElementById('categoria-select');
            const estadoSelect = document.getElementById('estado-select');

            if (buscarBtn && limpiarBtn && busquedaInput && tipoSelect && categoriaSelect && estadoSelect) {
                console.log(' Elementos de filtros encontrados, configurando eventos...');

                buscarBtn.addEventListener('click', () => this.aplicarFiltros());
                limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
                busquedaInput.addEventListener('input', () => this.aplicarFiltros());
                [tipoSelect, categoriaSelect, estadoSelect].forEach(select => {
                    select.addEventListener('change', () => this.aplicarFiltros());
                });

                // Ejecutar callback si se proporcionó
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                console.log(' No se encontraron todos los elementos de filtros');
            }
        }, 100);
    }

    async cargarItems() {
        try {
            console.log(' Cargando items desde la API...');
            const token = localStorage.getItem('utn_token');

            const [activosResponse, insumosResponse] = await Promise.all([
                fetch(`${window.CONFIG.API_BASE_URL}/activos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${window.CONFIG.API_BASE_URL}/insumos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (activosResponse.ok && insumosResponse.ok) {
                let activos = await activosResponse.json();
                let insumos = await insumosResponse.json();

                console.log(' Activos cargados:', activos?.todosLosActivos?.length || 0);
                console.log(' Insumos cargados:', insumos?.length || 0);

                const activosArray = Array.isArray(activos?.todosLosActivos) ? activos.todosLosActivos : [];
                const insumosArray = Array.isArray(insumos) ? insumos : [];

                this.allItems = [
                    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
                    ...insumosArray.map(item => ({ ...item, tipo: 'insumo' }))
                ];

                console.log(' Total items:', this.allItems.length);

                // Forzar valores iniciales
                const tipoSelect = document.getElementById('tipo-select');
                const categoriaSelect = document.getElementById('categoria-select');
                const estadoSelect = document.getElementById('estado-select');

                if (tipoSelect) tipoSelect.value = 'todos';
                if (categoriaSelect) categoriaSelect.value = 'todas';
                if (estadoSelect) estadoSelect.value = 'todos';

                this.filteredItems = [...this.allItems];
                this.renderItems();
            }
        } catch (error) {
            console.error(' Error cargando items:', error);
        }
    }

    aplicarFiltros() {
        const busqueda = document.getElementById('busqueda-universal')?.value.toLowerCase() || '';
        const tipo = document.getElementById('tipo-select')?.value || 'todos';
        const categoria = document.getElementById('categoria-select')?.value || 'todas';
        const estado = document.getElementById('estado-select')?.value || 'todos';

        this.filteredItems = this.allItems.filter(item => {
            if (item.estado === 'eliminado') return false;

            // Filtro de búsqueda
            if (busqueda) {
                const nombre = item.nombre || item.NombProducto || '';
                const descripcion = item.descripcion || item.caracteristicas || '';
                if (!nombre.toLowerCase().includes(busqueda) && !descripcion.toLowerCase().includes(busqueda)) {
                    return false;
                }
            }

            // Filtro de tipo
            if (tipo !== 'todos' && item.tipo !== tipo) {
                return false;
            }

            // Filtro de estado
            if (estado !== 'todos') {
                const cantidad = item.cantidad || item.stock_actual || 0;
                if (estado === 'sin-stock' && cantidad !== 0) return false;
                if (estado === 'con-stock' && cantidad <= 0) return false;
                if (estado === 'bajo-stock' && cantidad > 5) return false;
            }

            return true;
        });

        this.renderItems();
    }

    limpiarFiltros() {
        document.getElementById('busqueda-universal').value = '';
        document.getElementById('tipo-select').value = 'todos';
        document.getElementById('categoria-select').value = 'todas';
        document.getElementById('estado-select').value = 'todos';
        this.filteredItems = [...this.allItems];
        this.renderItems();
    }

    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        const resultadosCount = document.getElementById('resultados-count');
        const resultadosTitulo = document.getElementById('resultados-titulo');

        if (!itemsGrid) return;

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
                const sumaTotal = this.filteredItems.reduce((total, item) => {
                    const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                    return total + cantidad;
                }, 0);
                resultadosTitulo.textContent = `Todos los artículos (${this.filteredItems.length} items, ${sumaTotal} unidades)`;
            }
        }

        // Limpiar grid
        itemsGrid.innerHTML = '';

        if (this.filteredItems.length === 0) {
            itemsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-slate-400 text-lg"> No se encontraron resultados</div>
                    <div class="text-slate-500 text-sm mt-2">Intenta con otros criterios de búsqueda</div>
                </div>
            `;
            return;
        }

        // Renderizar items
        this.filteredItems.forEach((item, index) => {
            const card = this.crearItemCard(item);
            card.style.animationDelay = `${index * 50}ms`;
            itemsGrid.appendChild(card);
        });

        console.log(' Items renderizados:', this.filteredItems.length);
    }

    crearItemCard(item) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group';

        const tipo = item.tipo || 'insumo';
        const tipoIcon = tipo === 'activo' ? '' : '';

        if (!itemsGrid) return;

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
                const sumaTotal = this.filteredItems.reduce((total, item) => {
                    const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                    return total + cantidad;
                }, 0);
                resultadosTitulo.textContent = `Todos los artículos (${this.filteredItems.length} items, ${sumaTotal} unidades)`;
            }
        }

        // Limpiar grid
        itemsGrid.innerHTML = '';
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

        const getTipoClass = (tipo) => {
            if (tipo === 'activo') return 'text-blue-600 bg-blue-50';
            return 'text-green-600 bg-green-50';
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
                        <p class="text-[10px] text-slate-400">Num: ${item.numActivo || item.codigo || 'N/A'}</p>
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
                        <span class="text-slate-400">Disponibles: <span class="text-slate-700 font-bold">${cantidad}</span></span>
                        <span class="text-slate-700 font-medium">${categoria}</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200" onclick="console.log(' Click en solicitar:', '${item._id || item.id_insumo}'); alert(' Solicitud de ${nombre} (${tipo}) - Función en desarrollo')">
                         Solicitar
                    </button>
                </div>
            </div>
        `;

        // Añadir evento de clic a toda la tarjeta
        card.addEventListener('click', (e) => {
            // Evitar que se dispare si se hace clic en el botón
            if (e.target.tagName !== 'BUTTON') {
                this.handleCardClick(item);
            }
        });

        return card;
    }

    // Manejar clic en la tarjeta
    handleCardClick(item) {
        console.log(' Clic en tarjeta:', item);

        if (item.tipo === 'activo') {
            // Filtrar por categorías de componentes cuando se hace clic en un activo
            this.filtrarPorComponentes();
        } else {
            // Para insumos, mostrar detalles o hacer otra acción
            console.log(' Clic en insumo:', item.nombre || item.NombProducto);
        }
    }

    // Filtrar por categorías de componentes
    filtrarPorComponentes() {
        console.log(' Filtrando por categorías de componentes...');

        // Establecer filtros para mostrar componentes digitales y analógicos
        const tipoSelect = document.getElementById('tipo-select');
        const categoriaSelect = document.getElementById('categoria-select');
        const estadoSelect = document.getElementById('estado-select');

        if (tipoSelect && categoriaSelect && estadoSelect) {
            // Mostrar todos los tipos
            tipoSelect.value = 'todos';

            // Filtrar por categorías específicas (ajustar según las categorías reales)
            const categoriasComponentes = ['Componentes Digitales', 'Componentes Analógicos', 'Componentes', 'Electrónica'];

            // Buscar si alguna de estas categorías existe en el select
            const categoriaExistente = this.buscarCategoriaExistente(categoriasComponentes);

            if (categoriaExistente) {
                categoriaSelect.value = categoriaExistente;
            } else {
                // Si no existen las categorías específicas, mostrar todas
                categoriaSelect.value = 'todas';
            }

            estadoSelect.value = 'todos';

            // Aplicar filtros
            this.aplicarFiltros();

            // Mostrar mensaje
            if (window.Utils) {
                Utils.showToast(' Mostrando componentes digitales y analógicos', 'info');
            }
        }
    }

    // Buscar categoría existente en el select
    buscarCategoriaExistente(categoriasBuscadas) {
        const categoriaSelect = document.getElementById('categoria-select');
        if (!categoriaSelect) return null;

        // Obtener todas las opciones del select
        const opciones = Array.from(categoriaSelect.options).map(option => option.value);

        // Buscar la primera categoría que coincida
        for (const categoriaBuscada of categoriasBuscadas) {
            const encontrada = opciones.find(opcion =>
                opcion.toLowerCase().includes(categoriaBuscada.toLowerCase()) ||
                categoriaBuscada.toLowerCase().includes(opcion.toLowerCase())
            );
            if (encontrada) {
                console.log(' Categoría encontrada:', encontrada);
                return encontrada;
            }
        }

        console.log('️ No se encontraron categorías específicas, mostrando todas');
        return null;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log(' DOM listo - Inicializando IndexController simple...');
    window.indexController = new IndexController();
});
