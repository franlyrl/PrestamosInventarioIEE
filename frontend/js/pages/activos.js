/**
 * ActivosController
 * Gestiona la lógica de la página de Activos
 */
class ActivosController {
    constructor() {
        this.activos = [];
        this.filtros = {
            busqueda: '',
            categoria: 'todas',
            estado: 'todos'
        };
        this.isLoaded = false;
    }

    /**
     * Inicializa la página
     */
    async initialize() {
        console.log('ActivosController: Inicializando...');
        try {
            await this.cargarActivos();
            this.setupEventListeners();
            this.renderActivos();
            this.isLoaded = true;
            console.log('ActivosController: Inicialización completada');
        } catch (error) {
            console.error('ActivosController Error:', error);
            window.Utils?.showToast('Error al inicializar la página de activos', 'error');
        }
    }

    /**
     * Carga los activos desde la API
     */
    async cargarActivos() {
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`${window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api'}/activos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al cargar activos');
            
            const data = await response.json();
            this.activos = Array.isArray(data) ? data : (data.todosLosActivos || []);
            console.log(`ActivosController: ${this.activos.length} activos cargados`);
        } catch (error) {
            console.error('Error cargando activos:', error);
            throw error;
        }
    }

    /**
     * Configura los eventos del DOM
     */
    setupEventListeners() {
        // Búsqueda en tiempo real
        const busquedaInput = document.getElementById('busqueda-input');
        if (busquedaInput) {
            busquedaInput.addEventListener('input', (e) => {
                this.filtros.busqueda = e.target.value.toLowerCase();
                this.renderActivos();
            });
        }

        // Filtro de categoría
        const categoriaSelect = document.getElementById('categoria-select');
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', (e) => {
                this.filtros.categoria = e.target.value;
                this.renderActivos();
            });
        }

        // Filtro de estado
        const estadoSelect = document.getElementById('estado-select');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', (e) => {
                this.filtros.estado = e.target.value;
                this.renderActivos();
            });
        }

        // Botón Limpiar
        const limpiarBtn = document.getElementById('limpiar-btn');
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
        }

        // Botón Agregar Masivo
        const agregarMasivoBtn = document.getElementById('agregar-masivo-btn');
        if (agregarMasivoBtn) {
            agregarMasivoBtn.addEventListener('click', () => this.abrirModalMasivo());
        }
    }

    /**
     * Filtra la lista de activos según los criterios actuales
     */
    getActivosFiltrados() {
        return this.activos.filter(activo => {
            const matchBusqueda = !this.filtros.busqueda || 
                activo.modelo?.toLowerCase().includes(this.filtros.busqueda) ||
                activo.numSerie?.toLowerCase().includes(this.filtros.busqueda) ||
                activo.marca?.toLowerCase().includes(this.filtros.busqueda);

            const matchCategoria = this.filtros.categoria === 'todas' || 
                activo.categoria === this.filtros.categoria;

            const matchEstado = this.filtros.estado === 'todos' || 
                activo.estadoActivo === this.filtros.estado;

            return matchBusqueda && matchCategoria && matchEstado;
        });
    }

    /**
     * Renderiza las tarjetas de activos
     */
    renderActivos() {
        const grid = document.getElementById('activos-grid');
        const emptyState = document.getElementById('empty-state');
        const countSpan = document.getElementById('resultados-count');
        
        if (!grid) return;

        const filtrados = this.getActivosFiltrados();
        
        // Actualizar contador
        if (countSpan) countSpan.textContent = filtrados.length;

        // Mostrar u ocultar estado vacío
        if (filtrados.length === 0) {
            grid.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');
        
        grid.innerHTML = filtrados.map(activo => `
            <div class="card overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fade-in" data-id="${activo._id}">
                ${activo.imagenUrl && !activo.imagenUrl.includes('placeholder') ? `
                    <div class="h-40 w-full overflow-hidden bg-white border-b border-slate-100 flex items-center justify-center p-2 cursor-pointer group/img" onclick="event.stopPropagation(); window.verImagenCompleta('${activo.imagenUrl}', '${(activo.modelo || activo.marca || 'Activo').replace(/'/g, "\\'")}')">
                        <img src="${activo.imagenUrl}" alt="${activo.modelo}" class="max-h-full object-contain group-hover/img:scale-110 transition-transform duration-500">
                    </div>
                ` : `
                    <div class="h-2 bg-gradient-to-r ${this.getEstadoGradient(activo.estadoActivo)}"></div>
                `}
                <div class="p-5">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-500">
                            ${activo.categoria}
                        </span>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${this.getEstadoBadgeClass(activo.estadoActivo)}">
                            ${activo.estadoActivo}
                        </span>
                    </div>
                    
                    <h3 class="font-bold text-slate-800 text-lg mb-1 group-hover:text-utn-blue transition-colors">
                        ${activo.modelo || 'Sin Modelo'}
                    </h3>
                    <p class="text-slate-500 text-xs mb-4 flex items-center gap-2">
                        <span class="font-bold text-slate-400">S/N:</span> ${activo.numSerie || 'N/A'}
                    </p>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-slate-50 p-2 rounded-lg">
                            <span class="text-[10px] text-slate-400 block uppercase font-bold">Marca</span>
                            <span class="text-sm font-semibold text-slate-700">${activo.marca || 'Genérico'}</span>
                        </div>
                        <div class="bg-slate-50 p-2 rounded-lg">
                            <span class="text-[10px] text-slate-400 block uppercase font-bold">Código</span>
                            <span class="text-sm font-semibold text-slate-700">${activo.numActivo || 'N/A'}</span>
                        </div>
                    </div>

                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        <button onclick="window.activosController.editarActivo('${activo._id}')" class="flex-1 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-utn-blue hover:text-white transition">
                            Editar
                        </button>
                        <button onclick="window.activosController.eliminarActivo('${activo._id}')" class="p-2 text-xs font-bold bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Estilos CSS para el estado
     */
    getEstadoBadgeClass(estado) {
        const classes = {
            'disponible': 'bg-green-100 text-green-700',
            'prestado': 'bg-blue-100 text-blue-700',
            'mantenimiento': 'bg-yellow-100 text-yellow-700',
            'deteriorado': 'bg-orange-100 text-orange-700',
            'dañado': 'bg-red-100 text-red-700'
        };
        return classes[estado?.toLowerCase()] || 'bg-slate-100 text-slate-700';
    }

    getEstadoGradient(estado) {
        const gradients = {
            'disponible': 'from-green-400 to-green-600',
            'prestado': 'from-blue-400 to-blue-600',
            'mantenimiento': 'from-yellow-400 to-yellow-600',
            'deteriorado': 'from-orange-400 to-orange-600',
            'dañado': 'from-red-400 to-red-600'
        };
        return gradients[estado?.toLowerCase()] || 'from-slate-400 to-slate-600';
    }

    /**
     * Limpia filtros
     */
    limpiarFiltros() {
        this.filtros = { busqueda: '', categoria: 'todas', estado: 'todos' };
        
        const b = document.getElementById('busqueda-input');
        const c = document.getElementById('categoria-select');
        const e = document.getElementById('estado-select');
        
        if (b) b.value = '';
        if (c) c.value = 'todas';
        if (e) e.value = 'todos';
        
        this.renderActivos();
        window.Utils?.showToast('Filtros limpiados', 'success');
    }

    /**
     * Funciones de Modal
     */
    abrirModalMasivo() {
        const modal = document.getElementById('modalAgregarMasivo');
        if (modal) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100');
            this.mostrarTabMasivo('archivo');
            this.limpiarTabla();
            this.agregarFilaTabla();
        }
    }

    cerrarModalMasivo() {
        const modal = document.getElementById('modalAgregarMasivo');
        if (modal) {
            modal.classList.remove('opacity-100');
            modal.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    mostrarTabMasivo(tab) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('[id^="tab-"]').forEach(t => {
            t.classList.remove('text-utn-blue', 'border-b-2', 'border-blue-600');
            t.classList.add('text-slate-600');
        });
        
        document.getElementById(`contenido-${tab}`)?.classList.remove('hidden');
        const activeTab = document.getElementById(`tab-${tab}`);
        if (activeTab) {
            activeTab.classList.remove('text-slate-600');
            activeTab.classList.add('text-utn-blue', 'border-b-2', 'border-blue-600');
        }
    }

    limpiarTabla() {
        const tbody = document.getElementById('tabla-activos-masivos');
        if (tbody) tbody.innerHTML = '';
    }

    agregarFilaTabla() {
        const tbody = document.getElementById('tabla-activos-masivos');
        if (!tbody) return;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border border-slate-200 px-2 py-1"><input type="text" class="w-full px-2 py-1 border border-slate-300 rounded" placeholder="Nombre" data-field="nombre"></td>
            <td class="border border-slate-200 px-2 py-1"><input type="text" class="w-full px-2 py-1 border border-slate-300 rounded" placeholder="Código" data-field="codigo"></td>
            <td class="border border-slate-200 px-2 py-1"><input type="text" class="w-full px-2 py-1 border border-slate-300 rounded" placeholder="Marca" data-field="marca"></td>
            <td class="border border-slate-200 px-2 py-1"><input type="text" class="w-full px-2 py-1 border border-slate-300 rounded" placeholder="Modelo" data-field="modelo"></td>
            <td class="border border-slate-200 px-2 py-1">
                <select class="w-full px-2 py-1 border border-slate-300 rounded" data-field="categoria">
                    <option value="Instrumentos">Instrumentos</option>
                    <option value="Herramientas">Herramientas</option>
                </select>
            </td>
            <td class="border border-slate-200 px-2 py-1">
                <select class="w-full px-2 py-1 border border-slate-300 rounded" data-field="estado">
                    <option value="disponible">Disponible</option>
                    <option value="prestado">Prestado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                </select>
            </td>
            <td class="border border-slate-200 px-2 py-1 text-center">
                <button onclick="this.closest('tr').remove()" class="text-red-500 hover:text-red-700">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    async procesarArchivo(file) {
        if (!file) return;
        const fileName = file.name.toLowerCase();
        
        try {
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, {type: 'array'});
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, {header: 1});
                this.procesarJSON(json);
            } else if (fileName.endsWith('.csv')) {
                const text = await file.text();
                this.procesarCSV(text);
            } else {
                window.Utils?.showToast('Formato no soportado', 'error');
            }
        } catch (error) {
            console.error('Error procesando archivo:', error);
            window.Utils?.showToast('Error al procesar archivo', 'error');
        }
    }

    procesarCSV(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const data = lines.map(l => l.split(','));
        this.procesarJSON(data);
    }

    procesarJSON(rows) {
        // Ignorar encabezados si parecen serlo
        if (rows.length > 0 && (rows[0][0]?.toLowerCase().includes('nombre') || rows[0][0]?.toLowerCase().includes('codigo'))) {
            rows.shift();
        }

        const activos = rows.map(row => ({
            numActivo: row[1] || `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            numSerie: row[1] || '',
            marca: row[2] || 'Genérico',
            modelo: row[0] || 'Nuevo Activo',
            categoria: row[4] || 'Instrumentos',
            estadoActivo: row[5]?.toLowerCase() || 'disponible',
            caracteristicas: `Importado desde archivo el ${new Date().toLocaleDateString()}`
        })).filter(a => a.modelo && a.numActivo);

        if (activos.length > 0) {
            this.enviarMasivo(activos);
        } else {
            window.Utils?.showToast('No se encontraron datos válidos', 'error');
        }
    }

    async enviarMasivo(activos) {
        try {
            window.Utils?.showLoading(true);
            const token = localStorage.getItem('utn_token');
            let exitos = 0;

            for (const activo of activos) {
                const response = await fetch(`${window.CONFIG?.API_BASE_URL}/activos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(activo)
                });
                if (response.ok) exitos++;
            }

            window.Utils?.showLoading(false);
            window.Utils?.showToast(`${exitos} activos agregados correctamente`, 'success');
            this.cerrarModalMasivo();
            await this.cargarActivos();
            this.renderActivos();
        } catch (error) {
            console.error('Error en envío masivo:', error);
            window.Utils?.showLoading(false);
            window.Utils?.showToast('Error en el proceso masivo', 'error');
        }
    }

    async procesarAgregadoMasivo() {
        const tabActivo = document.querySelector('[id^="tab-"].text-utn-blue')?.id.replace('tab-', '');
        
        if (tabName === 'tabla') {
            const activos = [];
            document.querySelectorAll('#tabla-activos-masivos tr').forEach(tr => {
                const inputs = tr.querySelectorAll('input, select');
                if (inputs[0].value) {
                    activos.push({
                        modelo: inputs[3].value || inputs[0].value,
                        numActivo: inputs[1].value,
                        numSerie: inputs[1].value,
                        marca: inputs[2].value,
                        categoria: inputs[4].value,
                        estadoActivo: inputs[5].value,
                        caracteristicas: 'Ingreso manual masivo'
                    });
                }
            });
            if (activos.length > 0) await this.enviarMasivo(activos);
        } else if (tabName === 'manual') {
            const nombres = document.getElementById('nombres-manual')?.value.split('\n').filter(n => n.trim());
            const categoria = document.getElementById('categoria-manual')?.value;
            const estado = document.getElementById('estado-manual')?.value;
            const marca = document.getElementById('marca-manual')?.value;
            
            if (!nombres || nombres.length === 0) return;

            const activos = nombres.map(n => ({
                modelo: n,
                numActivo: `ACT-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                numSerie: 'N/A',
                marca: marca || 'Genérico',
                categoria: categoria || 'Instrumentos',
                estadoActivo: estado || 'disponible',
                caracteristicas: 'Ingreso manual rápido'
            }));
            await this.enviarMasivo(activos);
        }
    }

    descargarPlantilla() {
        const csv = "Nombre,Codigo,Marca,Modelo,Categoria,Estado\nOsciloscopio,OSC-001,Tektronix,TBS1052,Instrumentos,disponible";
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_activos.csv';
        a.click();
    }

    editarActivo(id) {
        console.log('Editar activo:', id);
        window.Utils?.showToast('Edición en desarrollo', 'info');
    }

    async eliminarActivo(id) {
        const ans = await window.SwalUTN.confirm('¿Eliminar activo?', '¿Estás seguro de que deseas eliminar este activo de forma permanente?');
        if (!ans.isConfirmed) return;
        
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`${window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api'}/activos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                window.Utils?.showToast('Activo eliminado', 'success');
                await this.cargarActivos();
                this.renderActivos();
            }
        } catch (error) {
            console.error('Error eliminando activo:', error);
            window.Utils?.showToast('Error al eliminar activo', 'error');
        }
    }
}

// Hacer el controlador global
window.activosController = new ActivosController();

// Inicializar cuando el DOM esté listo, pero esperar a main.js
document.addEventListener('DOMContentLoaded', () => {
    // Si main.js ya cargó, inicializar. Si no, esperar se maneja por el MutationObserver de main.js o carga secuencial.
    console.log('Activos Page Script Loaded');
    setTimeout(() => {
        if (!window.activosController.isLoaded) {
            window.activosController.initialize();
        }
    }, 500);
});
