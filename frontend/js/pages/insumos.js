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
            exportarBtn.addEventListener('click', () => this.exportarExcelProfesional());
        }
    }

    async exportarExcelProfesional() {
        if (!this.insumos || this.insumos.length === 0) {
            Utils.showToast('No hay datos para exportar', 'error');
            return;
        }

        const fecha = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
        const totalInsumos = this.insumos.length;
        const totalUnidades = this.insumos.reduce((sum, i) => sum + (i.cantidad || 0), 0);
        const categorias = [...new Set(this.insumos.map(i => i.categoria))];
        const criticos = this.insumos.filter(i => (i.cantidad || 0) === 0);
        const bajoStock = this.insumos.filter(i => (i.cantidad || 0) > 0 && (i.cantidad || 0) <= 5);
        const conStock = this.insumos.filter(i => (i.cantidad || 0) > 5);

        const resumenPorCategoria = categorias.map(cat => {
            const itemsCat = this.insumos.filter(i => i.categoria === cat);
            return {
                categoria: cat,
                cantidad: itemsCat.length,
                unidades: itemsCat.reduce((sum, i) => sum + (i.cantidad || 0), 0),
                criticos: itemsCat.filter(i => (i.cantidad || 0) === 0).length
            };
        });

        // Contenido HTML Profesional para Excel
        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Calibri', sans-serif; }
                    .header { background: #00447c; color: white; text-align: center; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #00447c; color: white; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 10px; border: 1px solid #ddd; }
                    .stat-card { background: #f8fafc; border-left: 5px solid #00447c; padding: 15px; margin: 10px; }
                    .stat-value { font-size: 20px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>REPORTE DE INSUMOS UTN</h1>
                    <p>Fecha: ${fecha}</p>
                </div>
                <div style="display: flex; gap: 20px;">
                    <div class="stat-card"><h3>Total Items</h3><div class="value">${totalInsumos}</div></div>
                    <div class="stat-card"><h3>Total Unidades</h3><div class="value">${totalUnidades}</div></div>
                    <div class="stat-card"><h3>Críticos</h3><div class="value">${criticos.length}</div></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Cantidad</th>
                            <th>Características</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.insumos.map(i => `
                            <tr>
                                <td>${i.NombProducto}</td>
                                <td>${i.categoria}</td>
                                <td>${i.cantidad}</td>
                                <td>${i.caracteristicas || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Insumos_UTN_${new Date().toISOString().split('T')[0]}.xls`;
        link.click();
        Utils.showToast('Reporte generado correctamente', 'success');
    }

    async showAgregarMasivo() {
        const modal = document.getElementById('modalAgregarMasivo');
        if (modal) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100');
            this.mostrarTabMasivo('archivo');
        }
    }

    mostrarTabMasivo(tab) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.remove('text-utn-blue', 'border-b-2', 'border-blue-600'));
        
        document.getElementById(`contenido-${tab}`)?.classList.remove('hidden');
        document.getElementById(`tab-${tab}`)?.classList.add('text-utn-blue', 'border-b-2', 'border-blue-600');
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
                return cantidad > 0 && cantidad <= 5; // Cambiado de 10 a 5
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
                             class="insumo-imagen cursor-pointer hover:opacity-80 transition-opacity" 
                             onclick="event.stopPropagation(); window.verImagenCompleta(this.src, '${(insumo.NombProducto || 'Insumo').replace(/'/g, "\\'")}')"
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
                        ️ Ver
                    </button>
                    <button class="btn btn-secondary" onclick="insumosController.editarInsumo('${insumo._id}')">
                        ️ Editar
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

        if (categoria.includes('analógico') || nombre.includes('diodo')) return '';
        if (categoria.includes('analógico') || nombre.includes('resistencia')) return '';
        if (categoria.includes('digital') || nombre.includes('microcontrolador')) return '';
        if (categoria.includes('consumible') || nombre.includes('estaño')) return '';
        if (categoria.includes('consumible') || nombre.includes('pasta')) return '';
        if (categoria.includes('herramienta')) return '';

        return '';
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

// Función global para auto-asignar imágenes
window.autoAsignarImagenesMasivas = async function(modulo) {
    Swal.fire({
        title: 'Asignación Inteligente',
        html: `
            <div class="mb-4">
                <div class="animate-spin w-12 h-12 border-4 border-slate-200 border-t-[#002D62] rounded-full mx-auto mb-4"></div>
                <p class="text-sm font-bold text-slate-700">Conectando con Wikimedia Commons...</p>
                <p class="text-xs text-slate-500 mt-2">Buscando y vinculando imágenes automáticamente para los artículos sin foto. Esto puede tomar unos segundos.</p>
            </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false
    });

    try {
        const token = localStorage.getItem('utn_token');
        const apiBaseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
        
        const response = await fetch(`${apiBaseUrl}/${modulo}/auto-imagenes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Proceso Completado!',
                text: `${data.message} Se actualizaron ${data.actualizados} imágenes de ${data.procesados} posibles.`,
                confirmButtonColor: '#002D62'
            }).then(() => {
                if (modulo === 'insumos' && window.insumosController) {
                    window.insumosController.recargarInsumos();
                } else {
                    window.location.reload();
                }
            });
        } else {
            throw new Error(data.message || 'Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('Error auto-asignando imágenes:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Asignación',
            text: 'Hubo un problema al buscar las imágenes en internet. ' + error.message,
            confirmButtonColor: '#002D62'
        });
    }
};
