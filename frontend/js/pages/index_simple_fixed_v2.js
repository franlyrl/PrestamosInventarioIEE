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
        console.log('⚙️ Configurando filtros...');
        
        // Esperar un poco a que los elementos estén disponibles
        setTimeout(() => {
            const busquedaInput = document.getElementById('busquedaInput');
            const tipoSelect = document.getElementById('tipoSelect');
            const categoriaSelect = document.getElementById('categoriaSelect');
            const estadoSelect = document.getElementById('estadoSelect');

            if (busquedaInput && tipoSelect && categoriaSelect && estadoSelect) {
                console.log('✅ Todos los filtros encontrados');
                
                // Configurar event listeners
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
            console.log('📡 Cargando items desde la API...');
            const token = localStorage.getItem('utn_token');

            const [activosResponse, insumosResponse] = await Promise.all([
                fetch(`${window.CONFIG.API_BASE_URL}/activos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${window.CONFIG.API_BASE_URL}/insumos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!activosResponse.ok || !insumosResponse.ok) {
                throw new Error('Error al cargar los datos');
            }

            const activos = await activosResponse.json();
            const insumos = await insumosResponse.json();

            console.log('✅ Datos cargados:', { activos: activos.length, insumos: insumos.length });

            // Procesar items
            this.allItems = [
                ...activos.map(activo => ({ ...activo, tipo: 'activo' })),
                ...insumos.map(insumo => ({ ...insumo, tipo: 'insumo' }))
            ];

            this.filteredItems = [...this.allItems];
            this.renderItems();

        } catch (error) {
            console.error('❌ Error cargando items:', error);
            this.cargarItemsEjemplo();
        }
    }

    cargarItemsEjemplo() {
        console.log('📋 Cargando items de ejemplo...');
        this.allItems = [
            {
                _id: '1',
                nombre: 'Multímetro Digital',
                tipo: 'activo',
                categoria: 'equipos',
                stock_actual: 5,
                cantidad: 5,
                imagen: 'https://via.placeholder.com/150'
            },
            {
                _id: '2',
                nombre: 'LED Rojo 5mm',
                tipo: 'insumo',
                categoria: 'componentes',
                stock_actual: 100,
                cantidad: 100,
                imagen: 'https://via.placeholder.com/150'
            }
        ];
        this.filteredItems = [...this.allItems];
        this.renderItems();
    }

    aplicarFiltros() {
        const busqueda = document.getElementById('busquedaInput')?.value.toLowerCase() || '';
        const tipo = document.getElementById('tipoSelect')?.value || '';
        const categoria = document.getElementById('categoriaSelect')?.value || '';
        const estado = document.getElementById('estadoSelect')?.value || '';

        this.filteredItems = this.allItems.filter(item => {
            const coincideBusqueda = item.nombre?.toLowerCase().includes(busqueda);
            const coincideTipo = !tipo || item.tipo === tipo;
            const coincideCategoria = !categoria || item.categoria === categoria;
            const coincideEstado = !estado || this.getEstado(item) === estado;

            return coincideBusqueda && coincideTipo && coincideCategoria && coincideEstado;
        });

        this.renderItems();
    }

    getEstado(item) {
        const stock = item.stock_actual || item.cantidad || 0;
        if (stock === 0) return 'sin_stock';
        if (stock < 5) return 'bajo_stock';
        return 'con_stock';
    }

    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        if (!itemsGrid) return;

        itemsGrid.innerHTML = '';

        this.filteredItems.forEach(item => {
            const itemCard = this.crearItemCard(item);
            itemsGrid.appendChild(itemCard);
        });

        console.log(`🎨 Renderizados ${this.filteredItems.length} items`);
    }

    crearItemCard(item) {
        const stock = item.stock_actual || item.cantidad || 0;
        const stockClass = this.getStockClass(stock);
        const stockText = this.getStockText(stock);

        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow';
        card.innerHTML = `
            <div class="aspect-square bg-slate-100 relative overflow-hidden">
                ${item.imagen ? 
                    `<img src="${item.imagen}" alt="${item.nombre}" class="w-full h-full object-cover">` :
                    `<div class="w-full h-full flex items-center justify-center text-slate-400">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                    </div>`
                }
                <span class="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${stockClass}">
                    ${stockText}
                </span>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-slate-800 mb-1">${item.nombre}</h3>
                <p class="text-sm text-slate-500 mb-3">${item.categoria || 'Sin categoría'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Stock: ${stock}</span>
                    <button 
                        onclick="window.indexController.agregarAlCarrito('${item._id}')"
                        class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                        🛒 Solicitar
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    getStockClass(stock) {
        if (stock === 0) return 'bg-red-100 text-red-700';
        if (stock < 5) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    }

    getStockText(stock) {
        if (stock === 0) return 'SIN STOCK';
        if (stock < 5) return 'BAJO STOCK';
        return 'CON STOCK';
    }

    // Agregar al carrito
    agregarAlCarrito(itemId) {
        console.log('🛒 Agregando al carrito desde index.js:', itemId);
        
        // Encontrar el item en todos los items cargados
        const item = this.allItems.find(item => 
            (item._id === itemId) || (item.id_insumo === itemId)
        );
        
        if (!item) {
            console.log('❌ Item no encontrado:', itemId);
            if (window.Utils) {
                Utils.showToast('❌ Item no encontrado', 'error');
            }
            return;
        }
        
        // Verificar si ya está en el carrito
        const existingItem = cart.find(cartItem => 
            (cartItem.data._id === itemId) || (cartItem.data.id_insumo === itemId)
        );
        
        if (existingItem) {
            console.log('⚠️ El item ya está en el carrito');
            if (window.Utils) {
                Utils.showToast('⚠️ El item ya está en el carrito', 'warning');
            }
            return;
        }
        
        // Agregar al carrito con la estructura correcta
        const cartItem = {
            name: item.nombre || item.NombProducto || 'Sin nombre',
            type: item.tipo || 'insumo',
            data: item,
            quantity: 1
        };
        
        cart.push(cartItem);
        console.log('✅ Item agregado al carrito:', cartItem);
        console.log('📊 Total items en carrito:', cart.length);
        
        // Actualizar UI del carrito
        updateCartUI();
        
        // Mostrar toast
        if (window.Utils) {
            Utils.showToast(`🛒 ${cartItem.name} añadido al carrito`, 'success');
        }
    }
}

// Variables globales del carrito
let cart = [];

// Funciones del carrito
function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.data._id === item.data._id);
    if (existingItem) {
        existingItem.quantity += item.quantity;
    } else {
        cart.push(item);
    }
    updateCartUI();
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.data._id !== itemId);
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems) return;

    cartItems.innerHTML = '';
    let totalItems = 0;

    cart.forEach(item => {
        totalItems += item.quantity;
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between p-3 bg-slate-50 rounded-lg';
        itemElement.innerHTML = `
            <div class="flex-1">
                <h4 class="font-medium text-slate-800">${item.name}</h4>
                <p class="text-sm text-slate-600">Cantidad: ${item.quantity}</p>
            </div>
            <button 
                onclick="removeFromCart('${item.data._id}')"
                class="text-red-500 hover:text-red-700"
            >
                🗑️
            </button>
        `;
        cartItems.appendChild(itemElement);
    });

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = totalItems;
}

function clearCart() {
    cart = [];
    updateCartUI();
}

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

function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        updateCartUI();
    }
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
    }
}

// Enviar solicitud
async function sendRequest() {
    console.log('🔍 === INICIANDO sendRequest() ===');
    console.log('📊 Estado actual del carrito:', cart);
    console.log('📊 Longitud del carrito:', cart.length);
    
    // ALERTA PARA DEBUG
    alert(`🔍 DEBUG:\nCarrito tiene ${cart.length} items\nItems: ${JSON.stringify(cart, null, 2)}`);
    
    if (cart.length === 0) {
        console.log('❌ Carrito vacío - saliendo early');
        if (window.Utils) {
            Utils.showToast('🛒 El carrito está vacío', 'warning');
        }
        return;
    }

    try {
        // Obtener usuario actual
        const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
        console.log('👤 Usuario:', user);

        // Separar activos e insumos del carrito
        console.log('🔍 Filtrando items del carrito...');
        
        const activos = cart.filter(item => {
            console.log('🔍 Item activo check:', item.type, item.name);
            return item.type === 'activo';
        }).map(item => ({
            codigo_activo: item.data.codigo_activo || item.data._id,
            nombre: item.name,
            marca: item.data.marca || '',
            modelo: item.data.modelo || '',
            numActivo: item.data.numActivo || ''
        }));

        const insumos = cart.filter(item => {
            console.log('🔍 Item insumo check:', item.type, item.name);
            return item.type === 'insumo';
        }).map(item => ({
            id_insumo: item.data._id?.toString() || item.data.id_insumo?.toString() || '',
            cantidad: item.data.cantidad || 1,
            caracteristicas: item.data.caracteristicas || '',
            descripcion: item.data.descripcion || ''
        }));

        console.log('✅ Activos filtrados:', activos);
        console.log('✅ Insumos filtrados:', insumos);

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

        console.log('📦 requestData completo:', requestData);
        console.log('📊 requestData.activos:', requestData.activos);
        console.log('📊 requestData.insumos:', requestData.insumos);

        // Enviar a la API
        console.log('📤 Enviando solicitud a:', `${window.CONFIG.API_BASE_URL}/solicitudes`);
        console.log('📦 Datos JSON que se enviarán:', JSON.stringify(requestData, null, 2));
        console.log('🔑 Token disponible:', localStorage.getItem('utn_token') ? 'Sí' : 'No');

        const response = await fetch(`${window.CONFIG.API_BASE_URL}/solicitudes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('utn_token')}`
            },
            body: JSON.stringify(requestData)
        });

        console.log('🌐 Respuesta del servidor:', response.status, response.statusText);
        
        const responseText = await response.text();
        console.log('📄 Respuesta cruda del servidor:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('✅ Respuesta parseada:', result);
        } catch (e) {
            console.log('❌ Error parseando respuesta:', e);
            result = { error: 'Error en respuesta del servidor' };
        }

        if (response.ok) {
            if (window.Utils) {
                Utils.showToast(`📤 Solicitud enviada con éxito. ID: ${result._id || 'generada'}`, 'success');
            }

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
            console.log('❌ Error en respuesta:', response.status, responseText);
            
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText };
            }
            
            if (window.Utils) {
                Utils.showToast(`❌ ${errorData.message || `Error ${response.status}: ${response.statusText}`}`, 'error');
            }
        }
    } catch (error) {
        console.error('❌ Error enviando solicitud:', error);
        if (window.Utils) {
            Utils.showToast('❌ Error al enviar la solicitud', 'error');
        }
    }
}

// Función para mostrar notificaciones
function showToast(message, type = 'success') {
    if (window.Utils && window.Utils.showToast) {
        window.Utils.showToast(message, type);
    } else {
        // Fallback si Utils no está disponible
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        
        toastMsg.textContent = message;
        toast.classList.remove('translate-y-20', 'opacity-0');
        
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
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
    console.log('🚀 DOM listo - Inicializando IndexController simple...');
    window.indexController = new IndexController();
    console.log('✅ IndexController creado y asignado a window.indexController');
});

// Hacer las funciones del carrito disponibles globalmente
try {
    window.addToCart = addToCart;
    window.updateCartUI = updateCartUI;
    window.removeFromCart = removeFromCart;
    window.clearCart = clearCart;
    window.getCartItems = getCartItems;
    window.openCartModal = openCartModal;
    window.closeCartModal = closeCartModal;
    window.sendRequest = sendRequest;
    console.log('✅ Funciones del carrito disponibles globalmente');
} catch (error) {
    console.error('❌ Error al asignar funciones del carrito:', error);
}
