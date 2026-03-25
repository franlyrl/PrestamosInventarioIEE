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
        console.log('🚀 Inicializando ActivosController...');
        await this.cargarActivos();
        this.setupEventListeners();
        this.renderActivos();
        console.log('✅ ActivosController inicializado correctamente');
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Botones
        const buscarBtn = document.getElementById('buscar-btn');
        const limpiarBtn = document.getElementById('limpiar-btn');
        const agregarBtn = document.getElementById('agregar-btn');
        const agregarMasivoBtn = document.getElementById('agregar-masivo-btn');
        const exportarBtn = document.getElementById('exportar-btn');

        console.log('🔍 Botones encontrados:', {
            buscarBtn: !!buscarBtn,
            limpiarBtn: !!limpiarBtn,
            agregarBtn: !!agregarBtn,
            agregarMasivoBtn: !!agregarMasivoBtn,
            exportarBtn: !!exportarBtn
        });

        const canManageActivos = this.userHasActivosPermission();
        console.log('👤 ¿Puede gestionar activos?', canManageActivos);

        if (agregarMasivoBtn) {
            if (!canManageActivos) {
                agregarMasivoBtn.classList.add('hidden');
            } else {
                agregarMasivoBtn.addEventListener('click', () => {
                    console.log('📦 Click en botón agregar masivo');
                    if (typeof window.abrirModalMasivo === 'function') {
                        window.abrirModalMasivo();
                    } else {
                        console.error('❌ Función abrirModalMasivo no disponible');
                    }
                });
            }
        }

        if (exportarBtn) {
            exportarBtn.addEventListener('click', () => this.exportarDatos());
        }
    }

    userHasActivosPermission() {
        const userData = localStorage.getItem('utn_user');
        if (!userData) return false;

        const user = JSON.parse(userData);
        const rol = (user.rol || user.role || user.tipo_rol || '').toLowerCase();
        return ['admin', 'administrador', 'administrativo'].includes(rol);
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
                (activo.marca && activo.marca.toLowerCase().includes(this.filtros.busqueda.toLowerCase())) ||
                (activo.modelo && activo.modelo.toLowerCase().includes(this.filtros.busqueda.toLowerCase())) ||
                (activo.caracteristicas && activo.caracteristicas.toLowerCase().includes(this.filtros.busqueda.toLowerCase()));

            const coincideCategoria = this.filtros.categoria === 'todas' ||
                activo.categoria === this.filtros.categoria;

            const coincideEstado = this.filtros.estado === 'todos' ||
                activo.estado_activo === this.filtros.estado;

            return coincideBusqueda && coincideCategoria && coincideEstado;
        });
    }

    createActivoCard(activo, index) {
        const statusStyles = {
            'disponible': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'prestado': 'bg-amber-100 text-amber-700 border-amber-200',
            'mantenimiento': 'bg-red-100 text-red-700 border-red-200',
            'extraviado': 'bg-slate-200 text-slate-700 border-slate-300'
        };

        const estado_activo = (activo.estado || 'disponible').toLowerCase();
        const statusClass = statusStyles[estado_activo] || statusStyles['disponible'];
        const isAvailable = estado_activo === 'disponible';
        const nombreDisplay = activo.modelo_activo || `${activo.marca || ''} ${activo.modelo || ''}`.trim() || "Activo sin identificación";

        return `
        <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full group" 
             style="animation: fadeIn 0.5s ease forwards; animation-delay: ${index * 50}ms">
            
            <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusClass}">
                    ${activo.estado_activo || 'Disponible'}
                </span>
                <span class="text-[10px] font-bold text-slate-300 uppercase">
                    ID: ${activo.codigo_activo || 'N/A'}
                </span>
            </div>

            <div class="relative aspect-video mb-5 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-50">
                ${activo.imagen_activo ?
                `<img src="${activo.imagen_activo}" 
                          alt="${nombreDisplay}"
                          class="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                          onerror="this.src='https://via.placeholder.com/150?text=Sin+Imagen'">` :
                `<span class="text-4xl opacity-40">${getIconByCategory(activo.categoria)}</span>`
            }
            </div>

            <div class="flex-grow">
                <h3 class="font-bold text-slate-800 leading-tight mb-1 group-hover:text-blue-600 transition-colors uppercase text-sm">
                    ${nombreDisplay}
                </h3>
                <p class="text-[11px] font-medium text-slate-400 mb-3">
                    Categoría: ${activo.categoria || 'General'}
                </p>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">SERIE</span>
                        <span class="text-[11px] text-slate-600 font-mono">${activo.codigo_activo || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="pt-4 border-t border-slate-50 flex gap-2">
                <button onclick="window.activosController.verDetalles('${activo._id}')" 
                    class="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-3 rounded-xl transition-colors uppercase">
                    Detalles
                </button>
                
                <button onclick="window.activosController.solicitarPrestamo('${activo._id}')" 
                    ${!isAvailable ? 'disabled' : ''}
                    class="flex-[1.5] ${isAvailable ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-slate-200 cursor-not-allowed'} 
                           text-white text-[10px] font-bold py-3 rounded-xl shadow-lg transition-all uppercase">
                    ${isAvailable ? 'Solicitar' : 'No disponible'}
                </button>
            </div>
        </div>
        `;
    }

    async verDetalles(id) {
        const activo = this.activos.find(a => a._id === id);
        if (!activo) return;
        console.log('Ver detalles del activo:', activo);
        Utils.showToast('Función de detalles en desarrollo', 'info');
    }

    async solicitarPrestamo(id) {
        const activo = this.activos.find(a => a._id === id);
        if (!activo) return;

        const isAvailable = activo.estado_activo === 'disponible';
        if (!isAvailable) {
            Utils.showToast('Este activo no está disponible', 'error');
            return;
        }

        console.log('Solicitando préstamo de activo:', activo);
        Utils.showToast('Función de préstamo en desarrollo', 'info');
    }

    exportarDatos() {
        const activosFiltrados = this.filtrarActivos();

        if (activosFiltrados.length === 0) {
            Utils.showToast('No hay datos para exportar', 'error');
            return;
        }

        const headers = ['Nombre', 'Código', 'Marca', 'Modelo', 'Categoría', 'Estado'];
        const csvContent = [
            headers.join(','),
            ...activosFiltrados.map(activo => [
                activo.nombre || '',
                activo.codigo_activo || '',
                activo.marca || '',
                activo.modelo || '',
                activo.categoria || '',
                activo.estado_activo || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        Utils.showToast('Datos exportados exitosamente', 'success');
    }
}

function getIconByCategory(categoria) {
    const cat = (categoria || '').toLowerCase();
    if (cat.includes('instrumento')) return '📟';
    if (cat.includes('herramienta')) return '🛠️';
    if (cat.includes('comput')) return '💻';
    if (cat.includes('red')) return '🌐';
    return '📦';
}

// Crear instancia global
window.activosController = new ActivosController();
console.log('✅ ActivosController creado y asignado a window');
