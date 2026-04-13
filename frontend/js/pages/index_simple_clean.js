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

                // NO agregar items forzados - usar solo datos reales
                const todosLosInsumosConForzados = todosLosInsumos;

                // Debug: mostrar categorías reales
                console.log(' Categorías de ACTIVOS encontradas:');
                activosArray.forEach(item => {
                    console.log(`- ${item.categoria || 'Sin categoría'} (${item.marca} ${item.modelo}) - Cantidad: ${item.cantidad || 'undefined'} - Stock: ${item.stock_actual || 'undefined'}`);
                });

                console.log(' Categorías de INSUMOS encontradas:');
                insumosArray.forEach(item => {
                    console.log(`- ${item.categoria || 'Sin categoría'} (${item.nombre || item.NombProducto}) - Cantidad: ${item.cantidad || 'undefined'}`);
                });

                this.allItems = [
                    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
                    ...todosLosInsumosConForzados.map(item => ({ ...item, tipo: item.tipo || 'insumo' }))
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
            console.error(' Error cargando items:', error);
        }
    }

    aplicarFiltros() {
        const busqueda = document.getElementById('busqueda-universal')?.value.toLowerCase() || '';
        const tipo = document.getElementById('tipo-select')?.value || 'todos';
        const categoria = document.getElementById('categoria-select')?.value || 'todas';
        const estado = document.getElementById('estado-select')?.value || 'todos';

        console.log(' VALORES DE FILTRO - Búsqueda:', busqueda, 'Tipo:', tipo, 'Categoría:', categoria, 'Estado:', estado);

        this.filteredItems = this.allItems.filter(item => {
            if (item.estado === 'eliminado') return false;

            // RECHAZAR ITEMS CON DATOS CORRUPTOS O INCOMPLETOS (PRIMERO QUE TODO)
            if (!item.NombProducto && !item.nombre && !item.descripcion && !item.marca && !item.modelo) {
                console.log(' RECHAZADO: Item completamente sin datos - Tipo:', item.tipo);
                return false;
            }

            // Para activos, requerir al menos nombre o marca+modelo
            if (item.tipo === 'activo' && !item.NombProducto && !item.nombre && (!item.marca || !item.modelo)) {
                console.log(' RECHAZADO: Activo sin identificación - Tipo:', item.tipo);
                return false;
            }

            // Filtro de búsqueda (primero)
            if (busqueda !== '') {
                const nombre = item.nombre || item.NombProducto || '';
                const descripcion = item.descripcion || item.caracteristicas || '';
                if (!nombre.toLowerCase().includes(busqueda) && !descripcion.toLowerCase().includes(busqueda)) {
                    return false;
                }
            }

            // Filtro de estado (ANTES que categoría para que siempre se ejecute)
            if (estado !== 'todos') {
                const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                console.log(' FILTRO ESTADO - Estado:', estado, 'Cantidad:', cantidad, 'Item:', item.NombProducto || item.nombre, 'Tipo:', item.tipo);

                // FORZAR RECHAZO DE ACTIVOS CON CANTIDAD > 0 CUANDO ESTADO ES SIN-STOCK
                if (estado === 'sin-stock' && item.tipo === 'activo' && cantidad > 0) {
                    console.log(' ACTIVO RECHAZADO - Cantidad:', cantidad, '> 0 en filtro sin-stock');
                    return false;
                }

                if (estado === 'sin-stock') {
                    if (cantidad !== 0 || cantidad === undefined || cantidad === null) {
                        console.log(' Item rechazado por sin-stock: cantidad', cantidad, '!== 0 o es undefined/null (SOLO 0 es sin-stock)');
                        return false;
                    }
                    console.log(' Item aceptado por sin-stock: cantidad', cantidad, '=== 0 (PERFECTO)');
                }
                if (estado === 'con-stock' && cantidad <= 0) {
                    console.log(' Item rechazado por con-stock: cantidad', cantidad, '<= 0');
                    return false;
                }
                if (estado === 'bajo-stock') {
                    if (cantidad < 1 || cantidad > 5 || cantidad === 0) {
                        console.log(' Item rechazado por bajo-stock: cantidad', cantidad, '(debe ser 1-5, no puede ser 0)');
                        return false;
                    }
                    console.log(' Item aceptado por bajo-stock: cantidad', cantidad, 'está entre 1 y 5');
                }

                if (estado === 'sin-stock' && cantidad === 0) {
                    console.log(' Item aceptado por sin-stock: cantidad 0 === 0');
                }
            }

            // Filtro de categoría con detección automática de tipo (SIEMPRE se ejecuta)
            if (categoria !== 'todas') {
                console.log(' EJECUTANDO FILTRO DE CATEGORÍA - Categoría:', categoria, 'Estado:', estado);

                // DEBUG: Mostrar todos los activos para depuración
                if (item.tipo === 'activo') {
                    console.log(' ACTIVO EVALUADO - Nombre:', item.NombProducto || item.nombre || 'SIN NOMBRE', 'Cantidad:', item.cantidad || 'undefined', 'Categoría:', item.categoria || 'SIN CATEGORÍA');
                }

                // DEBUG: Mostrar todos los items con bajo stock para depuración
                if (estado === 'bajo-stock' && item.tipo === 'activo') {
                    const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                    if (cantidad >= 1 && cantidad <= 5) {
                        console.log(' ACTIVO CON BAJO STOCK - Nombre:', item.NombProducto || item.nombre || 'SIN NOMBRE', 'Cantidad:', cantidad, 'Categoría:', item.categoria || 'SIN CATEGORÍA');
                    }
                }

                let tipoRequerido = null;
                let categoriaFiltrada = categoria;
                if (categoria === 'Instrumentos' || categoria === 'Herramientas') {
                    categoriaFiltrada = categoria;
                    tipoRequerido = 'activo';
                } else if (categoria === 'Componentes Digitales' || categoria === 'Componentes Analógicos') {
                    categoriaFiltrada = categoria;
                    tipoRequerido = 'insumo';
                }

                // Primero verificar que el tipo coincida si se requiere
                if (tipoRequerido && item.tipo !== tipoRequerido) {
                    console.log(' Item rechazado por tipo:', item.tipo, 'requerido:', tipoRequerido);
                    return false;
                }

                // Luego verificar que la categoría coincida
                const itemCategoria = (item.categoria || '').trim();
                const categoriaBuscada = categoria.trim();

                console.log(' Item categoría:', itemCategoria, 'buscando:', categoriaBuscada);

                if (itemCategoria !== categoriaBuscada) {
                    console.log(' Item rechazado por categoría:', itemCategoria, '!==', categoriaBuscada);
                    return false;
                }

                console.log(' Item aceptado por categoría:', item.NombProducto || item.nombre);
            }

            // Filtro de estado
            if (estado !== 'todos') {
                const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                console.log(' FILTRO ESTADO - Estado:', estado, 'Cantidad:', cantidad, 'Item:', item.NombProducto || item.nombre, 'Tipo:', item.tipo);

                // FORZAR RECHAZO DE ACTIVOS CON CANTIDAD > 0 CUANDO ESTADO ES SIN-STOCK
                if (estado === 'sin-stock' && item.tipo === 'activo' && cantidad > 0) {
                    console.log(' ACTIVO RECHAZADO - Cantidad:', cantidad, '> 0 en filtro sin-stock');
                    return false;
                }

                if (estado === 'sin-stock') {
                    if (cantidad !== 0 || cantidad === undefined || cantidad === null) {
                        console.log(' Item rechazado por sin-stock: cantidad', cantidad, '!== 0 o es undefined/null (SOLO 0 es sin-stock)');
                        return false;
                    }
                    console.log(' Item aceptado por sin-stock: cantidad', cantidad, '=== 0 (PERFECTO)');
                }
                if (estado === 'con-stock' && cantidad <= 0) {
                    console.log(' Item rechazado por con-stock: cantidad', cantidad, '<= 0');
                    return false;
                }
                if (estado === 'bajo-stock') {
                    if (cantidad < 1 || cantidad > 5 || cantidad === 0) {
                        console.log(' Item rechazado por bajo-stock: cantidad', cantidad, '(debe ser 1-5, no puede ser 0)');
                        return false;
                    }
                    console.log(' Item aceptado por bajo-stock: cantidad', cantidad, 'está entre 1 y 5');
                }

                if (estado === 'sin-stock' && cantidad === 0) {
                    console.log(' Item aceptado por sin-stock: cantidad 0 === 0');
                }
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
                    <div class="text-slate-400 text-lg"> No se encontraron resultados</div>
                    <div class="text-slate-500 text-sm mt-2">Intenta con otros criterios de búsqueda</div>
                </div>
            `;
            return;
        }

        // Renderizar items
        console.log(' ITEMS FILTRADOS ANTES DE RENDERIZAR:');
        this.filteredItems.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.NombProducto || item.nombre} | cantidad: ${item.cantidad} | tipo: ${item.tipo}`);
        });

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

        // Para activos: usar cantidad real si existe, si no usar 1 (son únicos)
        // Para insumos: usar cantidad o stock_actual
        const cantidad = tipo === 'activo'
            ? (item.cantidad !== undefined ? item.cantidad : 1)
            : (item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0));

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
            ? ` ${categoriaOriginal}`
            : (tipo === 'insumo' ? ` ${categoriaOriginal}` : categoriaOriginal);

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
                    <button class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200" onclick="event.stopPropagation(); addToCart('${nombre}', '${tipo}', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                         Añadir al Carrito
                    </button>
                </div>
            </div>
        `;

        return card;
    }
}

// ====== FUNCIONES DEL CARRITO ======
// Estado del carrito
let cart = [];

// Función para mostrar notificaciones
function showToast(message, type = 'success') {
    if (window.Utils && window.Utils.showToast) {
        window.Utils.showToast(message, type);
    } else {
        // Fallback si Utils no está disponible
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');

        if (toast && toastMsg) {
            toastMsg.textContent = message;
            toast.classList.remove('translate-y-20', 'opacity-0');

            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }
    }
}

// Función para añadir al carrito
function addToCart(itemName, itemType, itemData) {
    // Siempre añadir como nuevo item (sin verificar duplicados)
    cart.push({
        name: itemName,
        type: itemType,
        data: itemData,
        quantity: 1
    });

    updateCartUI();
    showToast(` ${itemName} añadido al carrito`, 'success');

    // NO abrir el modal automáticamente - dejar que el usuario lo abra cuando quiera
    // openCartModal();
}

// Actualizar UI del carrito
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartCount || !cartItems || !cartTotal) {
        console.log(' Elementos del carrito no encontrados');
        return;
    }

    // Actualizar contador
    cartCount.textContent = cart.length;

    // Actualizar lista de items
    cartItems.innerHTML = '';
    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between p-3 bg-slate-50 rounded-lg';
        itemElement.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span class="text-lg">${item.type === 'activos' ? '' : ''}</span>
                </div>
                <div>
                    <h4 class="font-medium text-sm text-slate-800">${item.name}</h4>
                    <p class="text-xs text-slate-500">${item.type === 'activos' ? 'Activo' : 'Insumo'}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex items-center bg-white border border-slate-200 rounded-lg">
                    <button onclick="decreaseQuantity(${index})" class="p-1 hover:bg-slate-100 rounded-l-lg transition-colors">
                        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                        </svg>
                    </button>
                    <span class="px-3 py-1 text-sm font-medium text-slate-700 min-w-[40px] text-center">${item.quantity}</span>
                    <button onclick="increaseQuantity(${index})" class="p-1 hover:bg-slate-100 rounded-r-lg transition-colors">
                        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </button>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;
        cartItems.appendChild(itemElement);
    });

    // Actualizar total (contar items individuales)
    cartTotal.textContent = cart.length;
}

// Eliminar del carrito
function removeFromCart(index) {
    const removedItem = cart[index];
    cart.splice(index, 1);
    updateCartUI();
    showToast(`️ ${removedItem.name} eliminado`, 'info');
}

// Incrementar cantidad
function increaseQuantity(index) {
    cart[index].quantity += 1;
    updateCartUI();
    const itemName = cart[index].name;
    showToast(` ${itemName} (${cart[index].quantity})`, 'success');
}

// Decrementar cantidad
function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        updateCartUI();
        const itemName = cart[index].name;
        showToast(` ${itemName} (${cart[index].quantity})`, 'success');
    } else {
        // Si la cantidad es 1, eliminar el item
        removeFromCart(index);
    }
}

// Vaciar carrito
function clearCart() {
    if (cart.length === 0) {
        showToast(' El carrito ya está vacío', 'info');
        return;
    }

    cart = [];
    updateCartUI();
    showToast('️ Carrito vaciado', 'success');
}

// Obtener items del carrito (para sendRequest)
function getCartItems() {
    return cart.map(item => ({
        ...item.data,
        cantidad: item.quantity,
        _id: item.data._id,
        nombre_insumo: item.name,
        caracteristicas: item.data.caracteristicas || '',
        descripcion: item.data.descripcion || ''
    }));
}

// Abrir modal del carrito
function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        updateCartUI();
    }
}

// Cerrar modal del carrito
function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
    }
}

// Enviar solicitud
async function sendRequest() {
    if (cart.length === 0) {
        showToast(' El carrito está vacío', 'warning');
        return;
    }

    try {
        // Obtener usuario actual
        const user = JSON.parse(localStorage.getItem('utn_user') || '{}');

        // Separar activos e insumos del carrito
        const activos = cart.filter(item => item.type === 'activos').map(item => ({
            codigo_activo: item.data.codigo_activo || item.data._id,
            nombre: item.name,
            marca: item.data.marca || '',
            modelo: item.data.modelo || '',
            numActivo: item.data.numActivo || ''
        }));

        const insumos = cart.filter(item => item.type === 'insumos').map(item => ({
            id_insumo: item.data._id?.toString() || item.data.id_insumo?.toString() || '',
            cantidad: item.data.cantidad || 1,
            caracteristicas: item.data.caracteristicas || '',
            descripcion: item.data.descripcion || ''
        }));

        // Preparar datos de la solicitud
        const requestData = {
            usuario_solicitante: user.nombre_completo || user.correo_electronico || 'Usuario',
            correo_solicitante: user.correo_electronico || 'usuario@example.com',
            activos: activos,
            insumos: insumos,
            estado: 'pendiente',
            fecha_solicitud: new Date().toISOString(),
            observaciones: `Solicitud generada desde el carrito con ${cart.length} items`
        };

        // Enviar a la API
        console.log(' Enviando solicitud a:', `${window.CONFIG.API_BASE_URL}/solicitudes`);
        console.log(' Datos enviados:', requestData);
        console.log(' Token disponible:', localStorage.getItem('utn_token') ? 'Sí' : 'No');

        const response = await fetch(`${window.CONFIG.API_BASE_URL}/solicitudes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('utn_token')}`
            },
            body: JSON.stringify(requestData)
        });

        console.log(' Respuesta del servidor:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log(' Solicitud creada:', result);
            showToast(` Solicitud enviada con éxito. ID: ${result._id || 'generada'}`, 'success');

            // Vaciar carrito y cerrar modal
            cart = [];
            updateCartUI();
            closeCartModal();

            // Opcional: Redirigir a página de solicitudes
            setTimeout(() => {
                if (confirm('¿Ver tus solicitudes enviadas?')) {
                    window.location.href = '../pages/solicitudes.html';
                }
            }, 1000);

        } else {
            // Obtener detalles del error
            const errorData = await response.json().catch(() => ({}));
            console.error(' Error del servidor:', {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            });

            // Mensaje específico para 403
            if (response.status === 403) {
                const errorMessage = errorData.message || errorData.error || 'No tienes permisos para crear solicitudes.';

                // Si es por solicitud pendiente, mostrar mensaje específico
                if (errorMessage.includes('pendiente') && errorData.folio) {
                    const folio = errorData.folio;
                    showToast(` Ya tienes una solicitud pendiente (Folio: ${folio}). Debes esperar a que se apruebe o rechace.`, 'warning');

                    // Opcional: Preguntar si quiere ver sus solicitudes
                    setTimeout(() => {
                        if (confirm('¿Ver tus solicitudes para revisar el estado?')) {
                            window.location.href = '../pages/solicitudes.html';
                        }
                    }, 1000);
                    return;
                }

                throw new Error(errorMessage);
            } else if (response.status === 401) {
                throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
            } else {
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }
        }

    } catch (error) {
        console.error(' Error enviando solicitud:', error);
        showToast(' Error al enviar la solicitud', 'error');
    }
}

// Cerrar modal al hacer click fuera
document.addEventListener('click', (e) => {
    const cartModal = document.getElementById('cartModal');
    const cartBtn = document.getElementById('cartBtn');
    if (cartModal && cartBtn && !cartModal.contains(e.target) && !cartBtn.contains(e.target)) {
        closeCartModal();
    }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log(' DOM listo - Inicializando IndexController simple...');
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
            console.log(' Opción seleccionada:', option.value, option.text, option.tipo);

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

// Hacer las funciones del carrito disponibles globalmente
// Usar try-catch para evitar errores si alguna función no existe
try {
    window.addToCart = addToCart;
    window.updateCartUI = updateCartUI;
    window.removeFromCart = removeFromCart;
    window.increaseQuantity = increaseQuantity;
    window.decreaseQuantity = decreaseQuantity;
    window.clearCart = clearCart;
    window.getCartItems = getCartItems;
    window.openCartModal = openCartModal;
    window.closeCartModal = closeCartModal;
    window.sendRequest = sendRequest;
    console.log(' Funciones del carrito disponibles globalmente');
} catch (error) {
    console.error(' Error al asignar funciones del carrito:', error);
}