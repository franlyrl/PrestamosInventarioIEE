/**
 * Módulo de gestión de activos
 * Maneja todas las operaciones CRUD para activos del laboratorio
 */

class ActivosManager {
    constructor() {
        this.activos = [];
        this.filtroActual = '';
    }

    /**
     * Cargar todos los activos desde el backend
     */
    async cargarActivos() {
        try {
            console.log('🔧 Cargando activos...');
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/activos`);
            const data = await response.json();
            
            if (response.ok) {
                // Extraer el array de activos de la respuesta
                this.activos = data.todosLosActivos || data.activos || [];
                console.log('✅ Activos cargados:', this.activos);
                this.mostrarActivos();
            } else {
                console.error('❌ Error cargando activos:', data);
                this.mostrarError('Error al cargar activos');
            }
        } catch (error) {
            console.error('❌ Error en cargarActivos:', error);
            this.mostrarError('Error de conexión al cargar activos');
        }
    }

    /**
     * Mostrar activos en el grid
     */
    mostrarActivos(activos = null) {
        const grid = document.getElementById('activos-grid');
        const totalSpan = document.getElementById('resultados-count');
        
        if (activos) {
            this.activos = activos;
        }
        
        grid.innerHTML = '';
        
        if (this.activos.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">🔧</div>
                    <h3 class="text-xl font-bold text-slate-700 mb-2">No hay activos registrados</h3>
                    <p class="text-slate-500 mb-4">Agrega tu primer activo usando el botón "Agregar Activo"</p>
                </div>
            `;
        } else {
            this.activos.forEach(activo => {
                const card = this.crearActivoCard(activo);
                grid.appendChild(card);
            });
        }
        
        if (totalSpan) {
            totalSpan.textContent = this.activos.length;
        }
    }

    /**
     * Crear card para un activo
     */
    crearActivoCard(activo) {
        const card = document.createElement('div');
        card.className = 'activo-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-slate-100';
        card.dataset.categoria = activo.categoria || '';
        card.dataset.estado = activo.estadoActivo || activo.estado || '';
        
        const categoriaIcon = {
            'Instrumentos': '🔧',
            'Herramientas': '🔨',
            'Equipos': '⚡',
            'Medición': '📊'
        }[activo.categoria] || '📦';
        
        const estadoColor = {
            'disponible': 'bg-green-100 text-green-700',
            'prestado': 'bg-yellow-100 text-yellow-700',
            'deteriorado': 'bg-red-100 text-red-700',
            'dañado': 'bg-red-100 text-red-700'
        }[activo.estadoActivo || activo.estado] || 'bg-gray-100 text-gray-700';
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                    ${categoriaIcon}
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${estadoColor}">
                    ${activo.estadoActivo || activo.estado || 'disponible'}
                </span>
            </div>
            <h3 class="font-bold text-slate-800 mb-2 line-clamp-2">
                ${activo.modelo || 'Sin nombre'}
            </h3>
            <div class="space-y-1 text-sm text-slate-600">
                <p><strong>Número:</strong> ${activo.numActivo || 'N/A'}</p>
                <p><strong>Serie:</strong> ${activo.numSerie || 'N/A'}</p>
                <p><strong>Marca:</strong> ${activo.marca || 'N/A'}</p>
                <p><strong>Modelo:</strong> ${activo.modelo || 'N/A'}</p>
                <p><strong>Categoría:</strong> ${activo.categoria || 'N/A'}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span class="text-xs text-slate-500">ID: ${activo._id || activo.id || 'N/A'}</span>
                <div class="flex gap-2">
                    <button onclick="window.ActivosManager.editarActivo('${activo._id}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        ✏️ Editar
                    </button>
                    <button onclick="window.ActivosManager.eliminarActivo('${activo._id}')" class="text-red-600 hover:text-red-700 text-sm font-medium">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        const grid = document.getElementById('activos-grid');
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 0h6m0 0v6h12m0 0l-4 4m0 0z"/>
                    </svg>
                    <p class="font-medium text-slate-600">${mensaje}</p>
                    <button onclick="window.ActivosManager.cargarActivos()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Guardar un nuevo activo
     */
    async guardarActivo() {
        try {
            const formData = {
                numActivo: Date.now(), // ID único temporal
                numSerie: document.getElementById('codigoBarras').value,
                estadoActivo: document.getElementById('estadoActivo').value.toLowerCase(),
                marca: document.getElementById('marcaActivo').value || 'Generica',
                modelo: document.getElementById('nombreActivo').value,
                categoria: document.getElementById('categoriaActivo').value,
                caracteristicas: document.getElementById('descripcionActivo').value || 'Sin características específicas',
                observaciones: document.getElementById('ubicacionActivo').value || 'Sin observaciones particulares'
            };
            
            console.log('💾 Guardando activo:', formData);
            
            const id = document.getElementById('idActivo').value;
            const url = id ? 
                `${window.CONFIG.API_BASE_URL}/activos/${id}` : 
                `${window.CONFIG.API_BASE_URL}/activos`;
            
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('utn_token')}`
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Activo guardado:', data);
                this.mostrarToast('✅ Activo guardado exitosamente', 'success');
                this.cerrarModal();
                this.cargarActivos();
            } else {
                console.error('❌ Error guardando activo:', data);
                this.mostrarToast('❌ Error al guardar activo', 'error');
            }
        } catch (error) {
            console.error('❌ Error en guardarActivo:', error);
            this.mostrarToast('❌ Error de conexión', 'error');
        }
    }

    /**
     * Editar un activo existente
     */
    async editarActivo(id) {
        try {
            console.log('📝 Editando activo:', id);
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/activos/${id}`);
            const activo = await response.json();
            
            if (response.ok) {
                document.getElementById('tituloModalActivo').textContent = 'Editar Activo';
                document.getElementById('idActivo').value = activo._id;
                document.getElementById('nombreActivo').value = activo.modelo || '';
                document.getElementById('codigoBarras').value = activo.numSerie || '';
                document.getElementById('marcaActivo').value = activo.marca || '';
                document.getElementById('categoriaActivo').value = activo.categoria || '';
                document.getElementById('estadoActivo').value = activo.estadoActivo || '';
                document.getElementById('descripcionActivo').value = activo.caracteristicas || '';
                document.getElementById('ubicacionActivo').value = activo.observaciones || '';
                
                this.abrirModal();
                this.mostrarToast('📝 Modo edición activado', 'info');
            } else {
                console.error('❌ Error cargando activo para editar:', data);
                this.mostrarToast('❌ Error al cargar activo', 'error');
            }
        } catch (error) {
            console.error('❌ Error en editarActivo:', error);
            this.mostrarToast('❌ Error de conexión', 'error');
        }
    }

    /**
     * Eliminar un activo
     */
    async eliminarActivo(id) {
        if (confirm('¿Estás seguro de eliminar este activo? Esta acción no se puede deshacer.')) {
            try {
                console.log('🗑️ Eliminando activo:', id);
                
                const response = await fetch(`${window.CONFIG.API_BASE_URL}/activos/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('utn_token')}`
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    console.log('✅ Activo eliminado:', data);
                    this.mostrarToast('✅ Activo eliminado exitosamente', 'success');
                    this.cargarActivos();
                } else {
                    console.error('❌ Error eliminando activo:', data);
                    this.mostrarToast('❌ Error al eliminar activo', 'error');
                }
            } catch (error) {
                console.error('❌ Error en eliminarActivo:', error);
                this.mostrarToast('❌ Error de conexión', 'error');
            }
        }
    }

    /**
     * Abrir el modal para agregar/editar
     */
    abrirModal() {
        document.getElementById('modalAgregarActivo').classList.remove('opacity-0', 'pointer-events-none');
    }

    /**
     * Cerrar el modal
     */
    cerrarModal() {
        document.getElementById('modalAgregarActivo').classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('formAgregarActivo').reset();
    }

    /**
     * Mostrar notificaciones toast
     */
    mostrarToast(mensaje, tipo = 'success') {
        // Crear toast si no existe
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 translate-y-20 opacity-0 transition-all duration-500 pointer-events-none z-[200] bg-slate-900 text-white text-[10px] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 uppercase tracking-widest font-bold';
            toast.innerHTML = `<span id="toastMsg">${mensaje}</span>`;
            document.body.appendChild(toast);
        }
        
        const toastMsg = document.getElementById('toastMsg');
        toastMsg.textContent = mensaje;
        toast.classList.remove('translate-y-20', 'opacity-0');
        
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }

    /**
     * Inicializar el módulo
     */
    inicializar() {
        console.log('🧩 Inicializando módulo de Activos');
        this.cargarActivos();
        
        // Configurar eventos
        document.getElementById('busquedaActivo')?.addEventListener('input', (e) => {
            this.filtrarActivos(e.target.value);
        });
    }

    /**
     * Filtrar activos por término de búsqueda
     */
    filtrarActivos(termino) {
        this.filtroActual = termino.toLowerCase();
        const cards = document.querySelectorAll('.activo-card');
        
        cards.forEach(card => {
            const texto = card.textContent.toLowerCase();
            if (termino === '' || texto.includes(this.filtroActual)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Crear instancia global
window.ActivosManager = new ActivosManager();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.ActivosManager.inicializar();
});
