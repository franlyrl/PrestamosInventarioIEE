// Controlador de la página de Activos
class ActivosController {
    constructor() {
        this.activos = [];
        this.filtros = {
            busqueda: '',
            categoria: 'todas',
            estado: 'todos'
        };
        this.currentPage = 1;
        this.itemsPerPage = 12;
    }

    async initialize() {
        await this.cargarActivos();
        this.setupEventListeners();
        this.renderActivos();
    }

    setupEventListeners() {
        // Búsqueda
        const busquedaInput = document.getElementById('busqueda-input');
        if (busquedaInput) {
            busquedaInput.addEventListener('input', (e) => {
                this.filtros.busqueda = e.target.value;
                this.renderActivos();
            });
        }

        // Categoría
        const categoriaSelect = document.getElementById('categoria-select');
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', (e) => {
                this.filtros.categoria = e.target.value;
                this.renderActivos();
            });
        }

        // Estado
        const estadoSelect = document.getElementById('estado-select');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', (e) => {
                this.filtros.estado = e.target.value;
                this.renderActivos();
            });
        }

        // Botones
        const buscarBtn = document.getElementById('buscar-btn');
        const limpiarBtn = document.getElementById('limpiar-btn');
        const agregarBtn = document.getElementById('agregar-btn');
        const exportarBtn = document.getElementById('exportar-btn');

        if (buscarBtn) {
            buscarBtn.addEventListener('click', () => this.renderActivos());
        }

        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
        }

        if (agregarBtn) {
            agregarBtn.addEventListener('click', () => {
                window.modalController?.showAgregarActivo();
            });
        }

        if (exportarBtn) {
            exportarBtn.addEventListener('click', () => this.exportarDatos());
        }
    }

    async cargarActivos() {
        try {
            Utils.showLoading(true);
            const response = await ApiService.getActivos();
            this.activos = response.data || response;
            Utils.showLoading(false);
        } catch (error) {
            console.error('Error cargando activos:', error);
            Utils.showToast('Error al cargar activos', 'error');
            Utils.showLoading(false);
        }
    }

    renderActivos() {
        const grid = document.getElementById('activos-grid');
        const emptyState = document.getElementById('empty-state');
        const resultadosCount = document.getElementById('resultados-count');

        if (!grid) return;

        const activosFiltrados = this.filtrarActivos();
        
        // Actualizar contador
        if (resultadosCount) {
            resultadosCount.textContent = activosFiltrados.length;
        }

        // Mostrar/ocultar empty state
        if (emptyState) {
            emptyState.classList.toggle('hidden', activosFiltrados.length > 0);
        }

        if (activosFiltrados.length === 0) {
            grid.innerHTML = '';
            return;
        }

        grid.innerHTML = activosFiltrados.map((activo, index) => 
            this.createActivoCard(activo, index)
        ).join('');
    }

    filtrarActivos() {
        return this.activos.filter(activo => {
            const coincideBusqueda = !this.filtros.busqueda || 
                (activo.nombre && activo.nombre.toLowerCase().includes(this.filtros.busqueda.toLowerCase())) ||
                (activo.marca && activo.marca.toLowerCase().includes(this.filtros.busqueda.toLowerCase())) ||
                (activo.modelo && activo.modelo.toLowerCase().includes(this.filtros.busqueda.toLowerCase()));

            const coincideCategoria = this.filtros.categoria === 'todas' || 
                activo.categoria === this.filtros.categoria;

            const coincideEstado = this.filtros.estado === 'todos' || 
                activo.estadoActivo === this.filtros.estado;

            return coincideBusqueda && coincideCategoria && coincideEstado;
        });
    }

    createActivoCard(activo, index) {
        const statusClass = this.getStatusClass(activo.estadoActivo);
        const isAvailable = this.checkAvailability(activo);
        
        return `
            <div class="activo-card card p-5 fade-in" style="animation-delay: ${index * 50}ms">
                <div class="activo-status ${statusClass}">
                    ${activo.estadoActivo || 'disponible'}
                </div>
                
                <div class="mb-4">
                    ${activo.imagenUrl ? `
                        <img src="${activo.imagenUrl}" alt="${activo.nombre || 'Activo'}" 
                             class="activo-imagen" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="activo-imagen-placeholder" style="display: none;">
                            ${this.getActivoIcon(activo)}
                        </div>
                    ` : `
                        <div class="activo-imagen-placeholder">
                            ${this.getActivoIcon(activo)}
                        </div>
                    `}
                </div>
                
                <div class="activo-info">
                    <h3>${activo.nombre || 'Sin nombre'}</h3>
                    <p>${activo.marca || ''} ${activo.modelo || ''}</p>
                    <p class="text-xs text-slate-500">Código: ${activo.numActivo || 'N/A'}</p>
                </div>
                
                ${activo.caracteristicas ? `
                    <div class="activo-caracteristicas">
                        ${activo.caracteristicas}
                    </div>
                ` : ''}
                
                <div class="activo-acciones">
                    <button class="btn btn-primary" onclick="activosController.verDetalles('${activo._id}')">
                        👁️ Ver
                    </button>
                    <button class="btn btn-secondary" onclick="activosController.editarActivo('${activo._id}')" 
                            ${!isAvailable ? 'disabled' : ''}>
                        ✏️ Editar
                    </button>
                </div>
            </div>
        `;
    }

    getStatusClass(estado) {
        const statusMap = {
            'disponible': 'disponible',
            'prestado': 'prestado',
            'mantenimiento': 'mantenimiento',
            'danado': 'danado'
        };
        return statusMap[estado] || 'disponible';
    }

    checkAvailability(activo) {
        return activo.estadoActivo === 'disponible';
    }

    getActivoIcon(activo) {
        const categoria = (activo.categoria || '').toLowerCase();
        const nombre = (activo.nombre || '').toLowerCase();
        
        if (categoria.includes('medición') || nombre.includes('multímetro')) return '🔬';
        if (categoria.includes('medición') || nombre.includes('osciloscopio')) return '📊';
        if (categoria.includes('herramienta') || nombre.includes('soldador')) return '🔥';
        if (categoria.includes('instrumento')) return '⚡';
        if (categoria.includes('equipo')) return '🖥️';
        
        return '🔧';
    }

    async verDetalles(id) {
        const activo = this.activos.find(a => a._id === id);
        if (!activo) return;

        // Mostrar modal con detalles
        window.modalController?.showModal('confirmModal', {
            title: 'Detalles del Activo',
            icon: this.getActivoIcon(activo),
            details: `
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Nombre:</span>
                        <span class="font-bold text-slate-700">${activo.nombre || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Código:</span>
                        <span class="font-bold text-slate-700">${activo.numActivo || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Marca:</span>
                        <span class="font-bold text-slate-700">${activo.marca || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Modelo:</span>
                        <span class="font-bold text-slate-700">${activo.modelo || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Estado:</span>
                        <span class="font-bold text-slate-700">${activo.estadoActivo || 'N/A'}</span>
                    </div>
                    ${activo.caracteristicas ? `
                        <div class="border-t pt-2 mt-2">
                            <span class="text-slate-400 font-bold">Características:</span>
                            <p class="text-slate-700 mt-1">${activo.caracteristicas}</p>
                        </div>
                    ` : ''}
                </div>
            `
        });
    }

    async editarActivo(id) {
        const activo = this.activos.find(a => a._id === id);
        if (!activo) return;

        // Lógica para editar activo
        console.log('Editar activo:', activo);
        Utils.showToast('Función de edición en desarrollo', 'info');
    }

    limpiarFiltros() {
        this.filtros = {
            busqueda: '',
            categoria: 'todas',
            estado: 'todos'
        };

        // Limpiar inputs
        const busquedaInput = document.getElementById('busqueda-input');
        const categoriaSelect = document.getElementById('categoria-select');
        const estadoSelect = document.getElementById('estado-select');

        if (busquedaInput) busquedaInput.value = '';
        if (categoriaSelect) categoriaSelect.value = 'todas';
        if (estadoSelect) estadoSelect.value = 'todos';

        this.renderActivos();
    }

    exportarDatos() {
        const activosFiltrados = this.filtrarActivos();
        
        if (activosFiltrados.length === 0) {
            Utils.showToast('No hay datos para exportar', 'error');
            return;
        }

        // Crear CSV
        const headers = ['Nombre', 'Código', 'Marca', 'Modelo', 'Categoría', 'Estado'];
        const csvContent = [
            headers.join(','),
            ...activosFiltrados.map(activo => [
                activo.nombre || '',
                activo.numActivo || '',
                activo.marca || '',
                activo.modelo || '',
                activo.categoria || '',
                activo.estadoActivo || ''
            ].join(','))
        ].join('\n');

        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        Utils.showToast('Datos exportados exitosamente', 'success');
    }

    // Recargar activos
    async recargarActivos() {
        await this.cargarActivos();
        this.renderActivos();
    }
}

// Crear instancia global
window.activosController = new ActivosController();
