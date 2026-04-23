// Controlador simple para el dashboard
class IndexController {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        this.init();
    }

    async init() {

        // Esperar a que el DOM esté listo antes de configurar filtros y cargar items
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupFiltros(() => this.cargarItems());
            });
        } else {
            // DOM ya está listo, configurar filtros y cargar items
            setTimeout(() => {
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
            }
        }, 100);
    }

    async cargarItems() {
        try {
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

                const activosArray = Array.isArray(activos) ? activos : (activos?.todosLosActivos || []);
                const insumosArray = Array.isArray(insumos) ? insumos : [];

                const todosLosInsumos = insumosArray;
                const todosLosInsumosConForzados = todosLosInsumos;

                this.allItems = [
                    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
                    ...todosLosInsumosConForzados.map(item => ({ ...item, tipo: item.tipo || 'insumo' }))
                ];


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

                // Event listener para búsqueda con debounce
                const busquedaInput = document.getElementById('busqueda-universal');
                if (busquedaInput) {
                    let debounceTimer;
                    busquedaInput.addEventListener('input', () => {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => this.aplicarFiltros(), 300);
                    });
                }

                // Botones
                const buscarBtn = document.getElementById('buscar-btn');
                const limpiarBtn = document.getElementById('limpiar-busqueda');
                const familiasBtn = document.getElementById('ver-familias-btn');

                if (buscarBtn) buscarBtn.addEventListener('click', () => this.aplicarFiltros());
                if (limpiarBtn) limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
                if (familiasBtn) familiasBtn.addEventListener('click', () => this.mostrarFamilias());

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

            // RECHAZAR ITEMS CON DATOS CORRUPTOS O INCOMPLETOS
            if (!item.NombProducto && !item.nombre && !item.descripcion && !item.marca && !item.modelo) {
                return false;
            }

            // Para activos, requerir al menos nombre o marca+modelo
            if (item.tipo === 'activo' && !item.NombProducto && !item.nombre && (!item.marca || !item.modelo)) {
                return false;
            }

            // Filtro de búsqueda más específico - coincidencia al inicio de palabras
            if (busqueda !== '') {
                const nombre = (item.nombre || item.NombProducto || '').toLowerCase();
                const descripcion = (item.descripcion || item.caracteristicas || '').toLowerCase();
                const busquedaLower = busqueda.toLowerCase();
                
                // Crear regex que busca coincidencia al inicio de cualquier palabra
                const palabrasBusqueda = busquedaLower.split(/\s+/).filter(p => p.length > 0);
                const coincide = palabrasBusqueda.every(palabra => {
                    // Busca la palabra al inicio del string o después de un espacio/guión/slash
                    const regex = new RegExp(`(^|[^a-záéíóúñ0-9])${palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
                    return regex.test(nombre) || regex.test(descripcion) || nombre.includes(palabra) || descripcion.includes(palabra);
                });
                
                if (!coincide) {
                    return false;
                }
            }

            // Filtro de estado
            if (estado !== 'todos') {
                const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                if (estado === 'sin-stock' && cantidad !== 0) return false;
                if (estado === 'con-stock' && cantidad <= 0) return false;
                if (estado === 'bajo-stock' && (cantidad < 1 || cantidad > 5)) return false;
            }

            // Filtro de tipo (activo/insumo)
            if (tipo !== 'todos' && item.tipo !== tipo) {
                return false;
            }

            // Filtro de categoría
            if (categoria !== 'todas') {
                // Para insumos: verificar coincidencia de categoría o aceptar todos si es "insumos"
                if (item.tipo === 'insumo') {
                    const itemCategoria = (item.categoria || '').trim().toLowerCase();
                    const categoriaBuscada = categoria.trim().toLowerCase();

                    // Si busca "insumos", mostrar TODOS los insumos (cualquier categoría)
                    if (categoriaBuscada === 'insumos') {
                        return true;
                    }

                    // Para otras categorías, verificar coincidencia exacta o parcial
                    if (itemCategoria) {
                        const coincide = itemCategoria === categoriaBuscada ||
                            itemCategoria.includes(categoriaBuscada) ||
                            categoriaBuscada.includes(itemCategoria);
                        if (!coincide) return false;
                    } else {
                        // Item sin categoría definida - no coincide con filtro específico
                        return false;
                    }
                } else {
                    // Para activos: verificar coincidencia de categoría
                    const itemCategoria = (item.categoria || '').trim().toLowerCase();
                    const categoriaBuscada = categoria.trim().toLowerCase();
                    if (itemCategoria !== categoriaBuscada) return false;
                }
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

        // Renderizar items usando DocumentFragment para mejor rendimiento
        const fragment = document.createDocumentFragment();

        this.filteredItems.forEach((item, index) => {
            const card = this.crearItemCard(item);
            card.style.animationDelay = `${index < 20 ? index * 30 : 0}ms`;
            fragment.appendChild(card);
        });
        itemsGrid.appendChild(fragment);
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

        // Sistema de auto-asignación de imágenes basado en categoría y tipo
        const getAutoImageUrl = (item, tipo, categoria, id) => {
            // Si tiene imagenUrl válida, usarla
            if (item.imagenUrl && !item.imagenUrl.includes('placeholder')) {
                return item.imagenUrl;
            }
            
            // Mapeo de categorías a seeds de imágenes para picsum
            const categoriaSeeds = {
                'Instrumentos': 'instrumentos-lab',
                'Herramientas': 'herramientas-taller',
                'Componentes Digitales': 'componentes-digital',
                'Componentes Analógicos': 'componentes-analog',
                'Electrónica': 'electronica-general',
                'Consumibles': 'consumibles-lab',
                'Equipos de Medición': 'equipos-medicion',
                'Prototipado': 'prototipado-arduino',
                'Cables y Conectores': 'cables-conectores',
                'Seguridad': 'seguridad-lab',
                'Almacenamiento': 'almacenamiento-digital'
            };
            
            // Obtener seed basado en categoría o usar default
            const categoriaKey = categoria || 'General';
            const baseSeed = categoriaSeeds[categoriaKey] || (tipo === 'activo' ? 'activo-lab' : 'insumo-lab');
            
            // Crear seed única basada en tipo, categoría e ID
            const uniqueSeed = `${baseSeed}-${id}-${tipo}`.replace(/\s+/g, '-').toLowerCase();
            
            return `https://picsum.photos/seed/${uniqueSeed}/400/300.jpg`;
        };
        
        const imgUrl = getAutoImageUrl(item, tipo, categoriaOriginal, id);

        card.innerHTML = `
            <div class="relative h-32 bg-slate-100 overflow-hidden cursor-zoom-in group/img" onclick="event.stopPropagation(); window.verImagenCompleta('${imgUrl}', '${nombre.replace(/'/g, "\\'")}')">
                <img src="${imgUrl}" alt="${nombre}" class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center" style="display:none;">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
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

    mostrarFamilias() {
        // Obtener todas las familias/categorías únicas de los items
        const familiasActivos = new Set();
        const familiasInsumos = new Set();

        this.allItems.forEach(item => {
            if (item.categoria && item.categoria.trim() !== '') {
                if (item.tipo === 'activo') {
                    familiasActivos.add(item.categoria);
                } else if (item.tipo === 'insumo') {
                    familiasInsumos.add(item.categoria);
                }
            }
        });

        const activosArray = Array.from(familiasActivos).sort();
        const insumosArray = Array.from(familiasInsumos).sort();

        // Crear contenido del modal
        let html = `
            <div style="text-align: left; max-height: 60vh; overflow-y: auto;">
                <h3 style="margin-bottom: 15px; color: #002D62; font-weight: bold;">Familias de Activos (${activosArray.length})</h3>
        `;

        if (activosArray.length > 0) {
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 20px;">';
            activosArray.forEach(familia => {
                const count = this.allItems.filter(i => i.tipo === 'activo' && i.categoria === familia).length;
                html += `
                    <div style="background: #f0f9ff; padding: 10px; border-radius: 8px; border-left: 4px solid #002D62;">
                        <strong style="color: #002D62;">${familia}</strong><br>
                        <span style="font-size: 12px; color: #666;">${count} artículos</span>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<p style="color: #666; margin-bottom: 20px;">No hay familias de activos disponibles</p>';
        }

        html += `
                <h3 style="margin-bottom: 15px; color: #16a34a; font-weight: bold;">Familias de Insumos (${insumosArray.length})</h3>
        `;

        if (insumosArray.length > 0) {
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
            insumosArray.forEach(familia => {
                const count = this.allItems.filter(i => i.tipo === 'insumo' && i.categoria === familia).length;
                html += `
                    <div style="background: #f0fdf4; padding: 10px; border-radius: 8px; border-left: 4px solid #16a34a;">
                        <strong style="color: #16a34a;">${familia}</strong><br>
                        <span style="font-size: 12px; color: #666;">${count} artículos</span>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<p style="color: #666;">No hay familias de insumos disponibles</p>';
        }

        html += '</div>';

        // Mostrar con SweetAlert2
        Swal.fire({
            title: 'Familias/Categorías Disponibles',
            html: html,
            width: '700px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#002D62',
            showCloseButton: true,
            showCancelButton: false,
            focusConfirm: false
        });
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
    // Límite de 2 artículos por solicitud
    if (cart.length >= 2) {
        showToast('Máximo 2 artículos permitidos por solicitud', 'warning');
        return;
    }

    // Siempre añadir como nuevo item (sin verificar duplicados)
    cart.push({
        name: itemName,
        type: itemType,
        data: itemData,
        quantity: 1
    });

    updateCartUI();
    showToast(` ${itemName} añadido al carrito`, 'success');
}

// Actualizar UI del carrito
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartCount || !cartItems || !cartTotal) {
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

        // Validar datos antes de enviar

        if (activos.length === 0 && insumos.length === 0) {
            showToast('El carrito está vacío', 'warning');
            return;
        }

        // Enviar a la API

        const response = await fetch(`${window.CONFIG.API_BASE_URL}/solicitudes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('utn_token')}`
            },
            body: JSON.stringify(requestData)
        });


        if (response.ok) {
            const result = await response.json();
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
        { value: 'Digitales', text: 'Digitales', tipo: 'insumo' },
        { value: 'Analógicos', text: 'Analógicos', tipo: 'insumo' }
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
} catch (error) {
    console.error(' Error al asignar funciones del carrito:', error);
}