// Controlador del Dashboard Principal

// Helper para corregir codificación de caracteres especiales
function fixEncoding(text) {
    if (!text || typeof text !== 'string') return text || '';
    // Reemplazar secuencias comunes de codificación incorrecta (UTF-8 mal interpretado como Latin-1)
    return text
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã/g, 'Á')
        .replace(/Ã‰/g, 'É')
        .replace(/Ã/g, 'Í')
        .replace(/Ã“/g, 'Ó')
        .replace(/Ãš/g, 'Ú')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã‘/g, 'Ñ')
        .replace(/Ã¼/g, 'ü')
        .replace(/Ãœ/g, 'Ü')
        .replace(/Ã§/g, 'ç')
        .replace(/Ã‡/g, 'Ç')
        .replace(/Ã¢/g, 'â')
        .replace(/Ãª/g, 'ê')
        .replace(/Ã®/g, 'î')
        .replace(/Ã´/g, 'ô')
        .replace(/Ã»/g, 'û')
        .replace(/Ã€/g, 'À')
        .replace(/Ãˆ/g, 'È')
        .replace(/ÃŒ/g, 'Ì')
        .replace(/Ã’/g, 'Ò')
        .replace(/Ã™/g, 'Ù')
        .replace(/Ã£/g, 'ã')
        .replace(/Ãµ/g, 'õ')
        .replace(/Ã/g, 'Á');
}

class DashboardController {
    constructor() {
        this.currentType = 'activos';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tabs de navegación
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchTab(type);
            });
        });

        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.authController?.logout();
            });
        }

        // Botón de refresh
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadInitialData();
            });
        }
    }

    async loadInitialData() {
        try {
            this.showLoading(true);

            // Cargar datos en paralelo
            const [activosResponse, insumosResponse] = await Promise.all([
                ApiService.getActivos(),
                ApiService.getInsumos()
            ]);

            appState.data.activos = activosResponse.data || activosResponse;
            appState.data.insumos = insumosResponse.data || insumosResponse;

            // Renderizar vista actual
            this.renderGrid();

            Utils.showToast('Datos cargados exitosamente', 'success');
        } catch (error) {
            console.error('Error cargando datos:', error);
            Utils.showToast('Error al cargar los datos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    switchTab(type) {
        this.currentType = type;
        appState.currentType = type;

        // Actualizar tabs
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            if (tab.dataset.type === type) {
                tab.classList.add('utn-blue', 'text-white');
                tab.classList.remove('text-slate-600');
            } else {
                tab.classList.remove('utn-blue', 'text-white');
                tab.classList.add('text-slate-600');
            }
        });

        // Renderizar grid
        this.renderGrid();
    }

    renderGrid() {
        const grid = document.getElementById('itemsGrid');
        if (!grid) return;

        const items = appState.data[this.currentType] || [];

        // Asegurarse que items sea un array
        const itemsArray = Array.isArray(items) ? items : [];

        grid.innerHTML = '';

        if (itemsArray.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4"></div>
                    <h3 class="text-xl font-bold text-slate-700 mb-2">No hay ${this.currentType} disponibles</h3>
                    <p class="text-slate-400">Intente recargar los datos o contacte al administrador</p>
                </div>
            `;
            return;
        }

        itemsArray.forEach((item, index) => {
            const isAvailable = this.checkAvailability(item);
            const card = this.createItemCard(item, isAvailable, index);
            grid.appendChild(card);
        });
    }

    createItemCard(item, isAvailable, index) {
        const card = document.createElement('div');
        card.className = 'card p-5 hover:border-blue-400 transition-all group fade-in';
        card.style.animationDelay = `${index * 50}ms`;

        const stockBadge = isAvailable
            ? `<span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Stock: ${item.cantidad || item.stock || 0}</span>`
            : `<span class="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Agotado</span>`;

        const icon = this.getItemIcon(item);
        const code = item.numActivo || item.id_insumo || item.cod || 'N/A';
        const name = fixEncoding(item.NombProducto || item.nombre || item.name || 'Sin nombre');
        const category = fixEncoding(item.categoria || item.cat || 'Sin categoría');
        const caracteristicas = fixEncoding(item.caracteristicas || '');

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-50 transition-colors">
                    ${icon}
                </div>
                <div class="text-right">
                    <span class="text-[9px] font-black uppercase tracking-tighter text-slate-300">#${code}</span>
                    ${stockBadge}
                </div>
            </div>
            
            <div class="mb-4">
                <h3 class="font-bold text-slate-800 mb-1 line-clamp-2">${name}</h3>
                <p class="text-xs text-slate-500">${category}</p>
            </div>
            
            ${caracteristicas ? `
                <div class="text-xs text-slate-400 mb-4 line-clamp-2">
                    ${caracteristicas}
                </div>
            ` : ''}
            
            ${item.imagenUrl ? `
                <div class="mb-4">
                    <img src="${item.imagenUrl}" alt="${name}" class="w-full h-32 object-cover rounded-lg" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400" style="display: none;">
                        <span class="text-3xl">${icon}</span>
                    </div>
                </div>
            ` : ''}
            
            <button 
                onclick="dashboardController.selectItem('${item._id || item.id}')"
                class="w-full py-2.5 rounded-xl font-bold text-xs transition-all ${isAvailable
                ? 'utn-blue text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }"
                ${!isAvailable ? 'disabled' : ''}
            >
                ${isAvailable ? 'Solicitar' : 'No disponible'}
            </button>
        `;

        return card;
    }

    checkAvailability(item) {
        const stock = item.cantidad || item.stock || 0;
        const estado = item.estadoActivo || item.estado;

        // Para activos, verificar estado
        if (this.currentType === 'activos') {
            return estado === 'disponible' || estado === 'Disponible';
        }

        // Para insumos, verificar stock
        return stock > 0;
    }

    getItemIcon(item) {
        const category = (item.categoria || item.cat || '').toLowerCase();
        const name = (item.NombProducto || item.nombre || item.name || '').toLowerCase();

        // Iconos por categoría
        if (category.includes('medición') || name.includes('multímetro')) return '';
        if (category.includes('medición') || name.includes('osciloscopio')) return '';
        if (category.includes('herramienta') || name.includes('soldador')) return '';
        if (category.includes('electrónica') || name.includes('diodo')) return '';
        if (category.includes('electrónica') || name.includes('resistencia')) return '';
        if (category.includes('consumible') || name.includes('estaño')) return '';
        if (category.includes('consumible') || name.includes('pasta')) return '';

        // Iconos por defecto
        return this.currentType === 'activos' ? '' : '';
    }

    selectItem(itemId) {
        const item = this.findItemById(itemId);
        if (!item) return;

        if (!this.checkAvailability(item)) {
            Utils.showToast('Este elemento no está disponible', 'error');
            return;
        }

        appState.selectedItem = item;
        this.showModal(item);
    }

    findItemById(itemId) {
        const items = appState.data[this.currentType] || [];
        return items.find(item =>
            (item._id && item._id === itemId) ||
            (item.id && item.id === itemId)
        );
    }

    showModal(item) {
        const modal = document.getElementById('confirmModal');
        const modalIcon = document.getElementById('modalIcon');
        const itemName = document.getElementById('itemName');
        const itemCat = document.getElementById('itemCat');

        if (modal && modalIcon && itemName && itemCat) {
            modalIcon.textContent = this.getItemIcon(item);
            itemName.textContent = fixEncoding(item.NombProducto || item.nombre || item.name || 'Sin nombre');
            itemCat.textContent = fixEncoding(item.categoria || item.cat || 'Sin categoría');

            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }
}

// Crear instancia global
window.dashboardController = new DashboardController();
