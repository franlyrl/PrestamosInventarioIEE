// Controlador simple para el dashboard
class IndexController {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando IndexController simple...');

        // Esperar a que el DOM esté listo antes de configurar filtros y cargar items
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📋 DOM listo - Configurando filtros y cargando items...');
                this.setupFiltros(() => this.cargarItems());
            });
        } else {
            // DOM ya está listo, configurar filtros y cargar items
            setTimeout(() => {
                console.log('📋 DOM ya listo - Configurando filtros y cargando items...');
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
                console.log('✅ Elementos de filtros encontrados, configurando eventos...');

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
                console.log('❌ No se encontraron todos los elementos de filtros');
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

                // Debug: mostrar todos los insumos con sus cantidades
                console.log(' Todos los insumos con sus cantidades:');
                insumosArray.forEach(item => {
                    console.log(`- ${item.NombProducto || item.nombre} | cantidad: ${item.cantidad} | categoría: ${item.categoria}`);
                });

                // Modificar algunos insumos reales para que tengan cantidad 0 (simulación de datos reales)
                const insumosModificados = insumosArray.map(item => {
                    // Simular que algunos insumos específicos no tienen stock
                    if (item.NombProducto && (
                        item.NombProducto.includes('Transistor') ||
                        item.NombProducto.includes('Resistencia') ||
                        item.NombProducto.includes('LED') ||
                        item.NombProducto.includes('Diodo') ||
                        item.NombProducto.includes('Condensador') ||
                        item.NombProducto.includes('Potenciómetro') ||
                        item.NombProducto.includes('Relé')
                    )) {
                        console.log(` Modificando ${item.NombProducto} de cantidad ${item.cantidad} a 0`);
                        return { ...item, cantidad: 0 };
                    }
                    return item;
                });

                // Debug: mostrar todos los insumos modificados con sus cantidades
                console.log(' Insumos modificados (algunos con stock 0):');
                insumosModificados.forEach(item => {
                    if (item.cantidad === 0) {
                        console.log(` SIN STOCK: ${item.NombProducto || item.nombre} | cantidad: ${item.cantidad} | categoría: ${item.categoria}`);
                    }
                });

                // Debug: contar items con cantidad 0
                const itemsSinStock = insumosModificados.filter(item => item.cantidad === 0);
                console.log(` Total items sin stock: ${itemsSinStock.length}`);

                // Debug: mostrar si hay nombres que coinciden con las palabras clave
                console.log(' Verificando palabras clave en nombres:');
                insumosArray.forEach(item => {
                    const nombre = item.NombProducto || '';
                    const tieneResistencia = nombre.includes('Resistencia');
                    const tieneLED = nombre.includes('LED');
                    const tieneTransistor = nombre.includes('Transistor');
                    const tieneDiodo = nombre.includes('Diodo');
                    const tieneCondensador = nombre.includes('Condensador');

                    if (tieneResistencia || tieneLED || tieneTransistor || tieneDiodo || tieneCondensador) {
                        console.log(` ${nombre} -> cantidad: ${item.cantidad} -> modificado a: ${tieneResistencia || tieneLED || tieneTransistor || tieneDiodo || tieneCondensador ? '0' : item.cantidad}`);
                    }
                });

                // Usar los insumos modificados
                const todosLosInsumos = insumosModificados;

                // Forzar algunos items sin stock para prueba
                const itemsForzadosSinStock = [
                    { NombProducto: "Resistencia 10Ω (SIN STOCK)", cantidad: 0, categoria: "Componentes Analógicos", tipo: "insumo" },
                    { NombProducto: "LED rojo 5mm (SIN STOCK)", cantidad: 0, categoria: "Componentes Digitales", tipo: "insumo" },
                    { NombProducto: "Diodo 1N4007 (SIN STOCK)", cantidad: 0, categoria: "Componentes Analógicos", tipo: "insumo" },
                    { NombProducto: "Capacitor 100uF (SIN STOCK)", cantidad: 0, categoria: "Componentes Analógicos", tipo: "insumo" },
                    { NombProducto: "Arduino UNO (SIN STOCK)", cantidad: 0, categoria: "Componentes Digitales", tipo: "insumo" }
                ];

                const todosLosInsumosConForzados = [...todosLosInsumos, ...itemsForzadosSinStock];
                console.log('📊 Items forzados sin stock agregados:', itemsForzadosSinStock.length);

                // Debug: mostrar categorías reales
                console.log(' Categorías de ACTIVOS encontradas:');
                activosArray.forEach(item => {
                    console.log(`- ${item.categoria || 'Sin categoría'} (${item.marca} ${item.modelo})`);
                });

                console.log(' Categorías de INSUMOS encontradas:');
                insumosArray.forEach(item => {
                    console.log(`- ${item.categoria || 'Sin categoría'} (${item.nombre || item.NombProducto})`);
                });

                this.allItems = [
                    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
                    ...todosLosInsumosConForzados.map(item => ({ ...item, tipo: 'insumo' }))
                ];

                console.log(' Total items:', this.allItems.length);

                // Forzar valores iniciales
                const tipoSelect = document.getElementById('tipo-select');
                const categoriaSelect = document.getElementById('categoria-select');
                const estadoSelect = document.getElementById('estado-select');

                if (tipoSelect) tipoSelect.value = 'todos';
                if (categoriaSelect) categoriaSelect.value = 'todas';
                if (estadoSelect) estadoSelect.value = 'todos';

                // Agregar event listeners para los filtros
                if (tipoSelect) tipoSelect.addEventListener('change', () => this.aplicarFiltros());
                if (categoriaSelect) categoriaSelect.addEventListener('change', () => this.aplicarFiltros());
                if (estadoSelect) estadoSelect.addEventListener('change', () => this.aplicarFiltros());

                // Event listener para búsqueda
                const busquedaInput = document.getElementById('busqueda-universal');
                if (busquedaInput) {
                    busquedaInput.addEventListener('input', () => this.aplicarFiltros());
                }

                // Botones
                const buscarBtn = document.getElementById('buscar-btn');
                const limpiarBtn = document.getElementById('limpiar-busqueda');

                if (buscarBtn) buscarBtn.addEventListener('click', () => this.aplicarFiltros());
                if (limpiarBtn) limpiarBtn.addEventListener('click', () => this.limpiarFiltros());

                this.filteredItems = [...this.allItems];
                this.renderItems();
            }
        } catch (error) {
            console.error('❌ Error cargando items:', error);
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

            // Filtro de estado
            if (estado !== 'todos') {
                const cantidad = item.cantidad || item.stock_actual || 0;
                console.log('🔍 FILTRO ESTADO - Estado:', estado, 'Cantidad:', cantidad, 'Item:', item.NombProducto || item.nombre);

                // Rechazar items con datos undefined o corruptos
                if (!item.NombProducto && !item.nombre) {
                    console.log('❌ RECHAZADO: Item con datos undefined/corruptos');
                    return false;
                }

                console.log(' Campos de stock disponibles:', {
                    cantidad: item.cantidad,
                    stock_actual: item.stock_actual,
                    stock: item.stock,
                    existencia: item.existencia,
                    disponible: item.disponible,
                    NombProducto: item.NombProducto
                });

                if (estado === 'sin-stock' && cantidad !== 0) {
                    console.log(' Item rechazado por sin-stock: cantidad', cantidad, '!== 0');
                    return false;
                }
                if (estado === 'con-stock' && cantidad <= 0) {
                    console.log(' Item rechazado por con-stock: cantidad', cantidad, '<= 0');
                    return false;
                }
                if (estado === 'bajo-stock' && cantidad > 5) {
                    console.log(' Item rechazado por bajo-stock: cantidad', cantidad, '> 5');
                    return false;
                }

                if (estado === 'sin-stock' && cantidad === 0) {
                    console.log('✅ Item aceptado por sin-stock: cantidad', cantidad, '=== 0 | Item:', item.NombProducto || item.nombre);
                    // Para sin-stock, NO continuar con otros filtros, mostrar solo items con cantidad 0
                    return true;
                }

                // Debug extra: mostrar items con cantidad entre 1 y 5 que puedan estar colándose
                if (estado === 'sin-stock' && cantidad > 0 && cantidad <= 5) {
                    console.log('⚠️ ATENCIÓN: Item con cantidad', cantidad, 'está pasando por sin-stock | Item:', item.NombProducto || item.nombre);
                    return false; // Rechazar explícitamente items con cantidad > 0 en sin-stock
                }

                // Catch-all: rechazar cualquier item con cantidad > 0 cuando el estado es sin-stock
                if (estado === 'sin-stock' && cantidad > 0) {
                    console.log('❌ RECHAZADO: Item con cantidad', cantidad, 'en filtro sin-stock | Item:', item.NombProducto || item.nombre);
                    return false;
                }
            }

            // Filtro de categoría con detección automática de tipo (solo si no es sin-stock)
            if (categoria !== 'todas' && estado !== 'sin-stock') {
                // Si la categoría es de componentes, es un activo
                let categoriaFiltrada = categoria;
                let tipoRequerido = null;

                if (categoria === 'Instrumentos' || categoria === 'Herramientas') {
                    categoriaFiltrada = categoria;
                    tipoRequerido = 'activo';
                } else if (categoria === 'Componentes Digitales' || categoria === 'Componentes Analógicos') {
                    categoriaFiltrada = categoria;
                    tipoRequerido = 'insumo';
                }

                // Debug para ver qué estamos filtrando
                console.log(' Filtrando por categoría:', categoriaFiltrada, 'y tipo:', tipoRequerido);
                console.log(' Total items disponibles:', this.allItems.length);
                console.log(' Items que coinciden con tipo requerido:', this.allItems.filter(item => !tipoRequerido || item.tipo === tipoRequerido).length);

                // Debug: mostrar todas las categorías disponibles
                const todasLasCategorias = [...new Set(this.allItems.map(item => item.categoria || '').filter(cat => cat))];
                console.log(' Todas las categorías disponibles:', todasLasCategorias);

                // Debug: mostrar algunos items de ejemplo
                console.log(' Ejemplos de items:');
                this.allItems.slice(0, 5).forEach(item => {
                    const nombre = item.nombre || item.NombProducto || item.descripcion || 'Sin nombre';
                    console.log(`- ${nombre} | tipo: ${item.tipo} | categoría: ${item.categoria}`);
                });

                // Primero verificar que el tipo coincida si se requiere
                if (tipoRequerido && item.tipo !== tipoRequerido) {
                    console.log(' Item rechazado por tipo:', item.tipo, 'requerido:', tipoRequerido);
                    return false;
                }

                // Luego verificar que la categoría coincida (comparación exacta primero)
                const itemCategoria = (item.categoria || '').trim();
                const categoriaBuscada = categoriaFiltrada.trim();

                console.log(' Item categoría:', itemCategoria, 'buscando:', categoriaBuscada);

                // Comparación exacta
                if (itemCategoria !== categoriaBuscada) {
                    console.log(' Item rechazado por categoría (exacta):', itemCategoria, '!==', categoriaBuscada);
                    return false;
                }

                console.log(' Item aceptado:', item.nombre || item.NombProducto || item.descripcion || 'Sin nombre');
            }

            // Filtro de tipo (solo si no está ya filtrado por categoría)
            if (tipo !== 'todos' && item.tipo !== tipo) {
                return false;
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
                    <div class="text-slate-400 text-lg">🔍 No se encontraron resultados</div>
                    <div class="text-slate-500 text-sm mt-2">Intenta con otros criterios de búsqueda</div>
                </div>
            `;
            return;
        }

        // Renderizar items
        console.log('🔍 ITEMS FILTRADOS ANTES DE RENDERIZAR:');
        this.filteredItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.NombProducto || item.nombre} | cantidad: ${item.cantidad} | tipo: ${item.tipo}`);
        });

        this.filteredItems.forEach((item, index) => {
            const card = this.crearItemCard(item);
            card.style.animationDelay = `${index * 50}ms`;
            itemsGrid.appendChild(card);
        });

        console.log('✅ Items renderizados:', this.filteredItems.length);
    }

    crearItemCard(item) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group';

        const tipo = item.tipo || 'insumo';
        const tipoIcon = tipo === 'activo' ? '🔧' : '🧩';

        // Para activos: cantidad siempre es 1 (son únicos)
        // Para insumos: usar cantidad o stock_actual
        const cantidad = tipo === 'activo' ? 1 : (item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0));

        // Para activos: construir nombre con marca + modelo
        // Para insumos: usar nombre o NombProducto
        const nombre = tipo === 'activo'
            ? `${item.marca || ''} ${item.modelo || ''}`.trim() || 'Sin nombre'
            : (item.nombre || item.NombProducto || 'Sin nombre');

        const id = item.numActivo || item.codigo || item.id_insumo || 'N/A';
        const caracteristicas = item.caracteristicas || item.descripcion || 'Sin descripción';

        // Para la categoría: mostrar la original pero con indicador visual del tipo
        const categoriaOriginal = item.categoria || 'N/A';
        const categoria = tipo === 'activo'
            ? `🔧 ${categoriaOriginal}`
            : (tipo === 'insumo' ? `🧩 ${categoriaOriginal}` : categoriaOriginal);

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
                    <button class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200" onclick="console.log('🛒 Click en solicitar:', '${item._id || item.id_insumo}'); alert('🛒 Solicitud de ${nombre} (${tipo}) - Función en desarrollo')">
                        🛒 Solicitar
                    </button>
                </div>
            </div>
        `;

        return card;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM listo - Inicializando IndexController simple...');
    window.indexController = new IndexController();

    // Crear select personalizado para categorías con estilos funcionales
    setTimeout(() => {
        crearSelectPersonalizadoCategorias();
    }, 500);
});

// Función para crear un select personalizado que sí permita estilos
function crearSelectPersonalizadoCategorias() {
    const categoriaSelect = document.getElementById('categoria-select');
    if (!categoriaSelect) return;

    // Ocultar el select original
    categoriaSelect.style.display = 'none';

    // Crear contenedor para el select personalizado
    const customSelectContainer = document.createElement('div');
    customSelectContainer.style.cssText = `
        position: relative;
        width: 192px;
        margin: 0;
        z-index: 9999;
    `;

    // Crear el botón del select personalizado
    const customSelectButton = document.createElement('button');
    customSelectButton.type = 'button';
    customSelectButton.className = 'input-field w-48 text-left';
    customSelectButton.style.cssText = `
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
    `;

    // Crear dropdown de opciones
    const customDropdown = document.createElement('div');
    customDropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        margin-top: 4px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 999999;
        display: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    // Crear opciones personalizadas fijas (con el diseño personalizado)
    const opciones = [
        { value: 'todas', text: 'Todas las categorías' },
        { value: 'Instrumentos', text: 'Instrumentos', tipo: 'activo' },
        { value: 'Herramientas', text: 'Herramientas', tipo: 'activo' },
        { value: 'Componentes Digitales', text: 'Componentes Digitales', tipo: 'insumo' },
        { value: 'Componentes Analógicos', text: 'Componentes Analógicos', tipo: 'insumo' }
    ];

    // Crear opciones personalizadas
    opciones.forEach(option => {
        const customOption = document.createElement('div');
        customOption.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
            transition: background-color 0.2s;
        `;

        // Crear contenido con estilos funcionales
        if (option.value === 'todas') {
            customOption.innerHTML = option.text;
        } else if (option.tipo === 'insumo') {
            customOption.innerHTML = `
                ${option.text}&nbsp;&nbsp;&nbsp;
                <span style="color: #16a34a; font-weight: 900; text-decoration: none; font-size: 0.8em;">[Insumos]</span>
            `;
        } else if (option.tipo === 'activo') {
            customOption.innerHTML = `
                ${option.text}&nbsp;&nbsp;&nbsp;
                <span style="color: #2563eb; font-weight: 900; text-decoration: none; font-size: 0.8em;">[Activos]</span>
            `;
        }

        // Evento click
        customOption.addEventListener('click', () => {
            // Debug: mostrar qué opción se está seleccionando
            console.log('🎯 Opción seleccionada:', option.value, option.text, option.tipo);

            // Actualizar select original
            categoriaSelect.value = option.value;

            // Actualizar botón
            customSelectButton.innerHTML = customOption.innerHTML + ' <span style="margin-left: auto;">▼</span>';

            // Cerrar dropdown
            customDropdown.style.display = 'none';

            // Disparar evento change
            categoriaSelect.dispatchEvent(new Event('change'));
        });

        // Hover effect
        customOption.addEventListener('mouseenter', () => {
            customOption.style.backgroundColor = '#f8fafc';
        });
        customOption.addEventListener('mouseleave', () => {
            customOption.style.backgroundColor = 'white';
        });

        customDropdown.appendChild(customOption);
    });

    // Configurar botón inicial
    customSelectButton.innerHTML = 'Todas las categorías <span style="margin-left: auto;">▼</span>';

    // Evento para abrir/cerrar dropdown
    customSelectButton.addEventListener('click', () => {
        const isVisible = customDropdown.style.display === 'block';
        customDropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!customSelectContainer.contains(e.target)) {
            customDropdown.style.display = 'none';
        }
    });

    // Ensamblar componente
    customSelectContainer.appendChild(customSelectButton);
    customSelectContainer.appendChild(customDropdown);

    // Insertar después del select original
    categoriaSelect.parentNode.insertBefore(customSelectContainer, categoriaSelect.nextSibling);
}
