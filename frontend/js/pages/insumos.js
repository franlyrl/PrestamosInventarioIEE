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
                return cantidad > 0 && cantidad <= 10;
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
                    ${insumo.imagenUrl ? `
                        <img src="${insumo.imagenUrl}" alt="${insumo.NombProducto || 'Insumo'}" 
                             class="insumo-imagen" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="insumo-imagen-placeholder" style="display: none;">
                            ${this.getInsumoIcon(insumo)}
                        </div>
                    ` : `
                        <div class="insumo-imagen-placeholder">
                            ${this.getInsumoIcon(insumo)}
                        </div>
                    `}
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
                    <button class="btn btn-primary" onclick="insumosController.verDetalles('${insumo._id}')">
                        👁️ Ver
                    </button>
                    <button class="btn btn-secondary" onclick="insumosController.editarInsumo('${insumo._id}')">
                        ✏️ Editar
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

    getInsumoIcon(insumo) {
        const categoria = (insumo.categoria || '').toLowerCase();
        const nombre = (insumo.NombProducto || '').toLowerCase();
        
        if (categoria.includes('analógico') || nombre.includes('diodo')) return '💊';
        if (categoria.includes('analógico') || nombre.includes('resistencia')) return '📏';
        if (categoria.includes('digital') || nombre.includes('microcontrolador')) return '🔲';
        if (categoria.includes('consumible') || nombre.includes('estaño')) return '🧵';
        if (categoria.includes('consumible') || nombre.includes('pasta')) return '🍯';
        if (categoria.includes('herramienta')) return '🔧';
        
        return '📦';
    }

    async verDetalles(id) {
        const insumo = this.insumos.find(i => i._id === id);
        if (!insumo) return;

        // Mostrar modal con detalles
        window.modalController?.showModal('confirmModal', {
            title: 'Detalles del Insumo',
            icon: this.getInsumoIcon(insumo),
            details: `
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Nombre:</span>
                        <span class="font-bold text-slate-700">${insumo.NombProducto || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">ID:</span>
                        <span class="font-bold text-slate-700">${insumo.id_insumo || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Cantidad:</span>
                        <span class="font-bold text-slate-700">${insumo.cantidad || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Categoría:</span>
                        <span class="font-bold text-slate-700">${insumo.categoria || 'N/A'}</span>
                    </div>
                    ${insumo.caracteristicas ? `
                        <div class="border-t pt-2 mt-2">
                            <span class="text-slate-400 font-bold">Características:</span>
                            <p class="text-slate-700 mt-1">${insumo.caracteristicas}</p>
                        </div>
                    ` : ''}
                </div>
            `
        });
    }

    async editarInsumo(id) {
        const insumo = this.insumos.find(i => i._id === id);
        if (!insumo) return;

        // Lógica para editar insumo
        console.log('Editar insumo:', insumo);
        Utils.showToast('Función de edición en desarrollo', 'info');
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
