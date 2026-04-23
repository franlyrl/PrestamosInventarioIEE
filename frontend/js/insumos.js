/**
 * Módulo de gestión de insumos
 * Maneja todas las operaciones CRUD para insumos del laboratorio
 */

class InsumosManager {
    constructor() {
        this.insumos = [];
        this.filtroActual = '';
    }

    /**
     * Cargar todos los insumos desde el backend
     */
    async cargarInsumos() {
        try {
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/insumos`);
            const data = await response.json();
            
            if (response.ok) {
                this.insumos = data;
                this.mostrarInsumos();
            } else {
                console.error(' Error cargando insumos:', data);
                this.mostrarError('Error al cargar insumos');
            }
        } catch (error) {
            console.error(' Error en cargarInsumos:', error);
            this.mostrarError('Error de conexión al cargar insumos');
        }
    }

    /**
     * Mostrar insumos en la tabla
     */
    mostrarInsumos(insumos = null) {
        const tbody = document.getElementById('tablaInsumos');
        const totalSpan = document.getElementById('totalInsumos');
        
        if (insumos) {
            this.insumos = insumos;
        }
        
        tbody.innerHTML = '';
        
        this.insumos.forEach(insumo => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 transition-colors';
            
            // Determinar clase de stock
            let stockClass = 'text-green-600';
            let stockText = 'Disponible';
            if (insumo.stock_actual <= insumo.stock_minimo) {
                stockClass = 'text-red-600';
                stockText = 'Stock Bajo';
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-slate-900">${insumo.codigo_insumo}</td>
                <td class="px-6 py-4 text-sm">${insumo.nombre_insumo}</td>
                <td class="px-6 py-4 text-sm">${insumo.categoria}</td>
                <td class="px-6 py-4 text-sm font-medium ${stockClass}">${insumo.stock_actual}</td>
                <td class="px-6 py-4 text-sm">${stockText}</td>
                <td class="px-6 py-4 text-sm">
                    <button onclick="window.InsumosManager.editarInsumo('${insumo._id}')" class="text-blue-600 hover:text-blue-800 font-medium">️ Editar</button>
                    <button onclick="window.InsumosManager.eliminarInsumo('${insumo._id}')" class="text-red-600 hover:text-red-800 font-medium">️ Eliminar</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        totalSpan.textContent = `Total: ${this.insumos.length} insumos`;
    }

    /**
     * Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        const tbody = document.getElementById('tablaInsumos');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-slate-600">
                    <div class="flex flex-col items-center">
                        <svg class="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 0h6m0 0v6h12m0 0l-4 4m0 0z"/>
                        </svg>
                        <p class="font-medium">${mensaje}</p>
                        <button onclick="window.InsumosManager.cargarInsumos()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Reintentar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Guardar un nuevo insumo
     */
    async guardarInsumo() {
        try {
            const formData = {
                codigo_insumo: document.getElementById('codigoInsumo').value,
                nombre_insumo: document.getElementById('nombreInsumo').value,
                categoria: document.getElementById('categoriaInsumo').value,
                stock_inicial: parseInt(document.getElementById('stockInsumo').value),
                stock_minimo: parseInt(document.getElementById('stockMinimo').value),
                ubicacion: document.getElementById('ubicacionInsumo').value,
                descripcion: document.getElementById('descripcionInsumo').value
            };
            
            
            const id = document.getElementById('idInsumo').value;
            const url = id ? 
                `${window.CONFIG.API_BASE_URL}/insumos/${id}` : 
                `${window.CONFIG.API_BASE_URL}/insumos`;
            
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.mostrarToast(' Insumo guardado exitosamente', 'success');
                this.cerrarModal();
                this.cargarInsumos();
            } else {
                console.error(' Error guardando insumo:', data);
                this.mostrarToast(' Error al guardar insumo', 'error');
            }
        } catch (error) {
            console.error(' Error en guardarInsumo:', error);
            this.mostrarToast(' Error de conexión', 'error');
        }
    }

    /**
     * Editar un insumo existente
     */
    async editarInsumo(id) {
        try {
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/insumos/${id}`);
            const insumo = await response.json();
            
            if (response.ok) {
                document.getElementById('tituloModalInsumo').textContent = 'Editar Insumo';
                document.getElementById('idInsumo').value = insumo._id;
                document.getElementById('codigoInsumo').value = insumo.codigo_insumo;
                document.getElementById('nombreInsumo').value = insumo.nombre_insumo;
                document.getElementById('categoriaInsumo').value = insumo.categoria;
                document.getElementById('stockInsumo').value = insumo.stock_inicial;
                document.getElementById('stockMinimo').value = insumo.stock_minimo;
                document.getElementById('ubicacionInsumo').value = insumo.ubicacion;
                document.getElementById('descripcionInsumo').value = insumo.descripcion;
                
                this.abrirModal();
                this.mostrarToast(' Modo edición activado', 'info');
            } else {
                console.error(' Error cargando insumo para editar:', data);
                this.mostrarToast(' Error al cargar insumo', 'error');
            }
        } catch (error) {
            console.error(' Error en editarInsumo:', error);
            this.mostrarToast(' Error de conexión', 'error');
        }
    }

    /**
     * Eliminar un insumo
     */
    async eliminarInsumo(id) {
        if (confirm('¿Estás seguro de eliminar este insumo? Esta acción no se puede deshacer.')) {
            try {
                
                const response = await fetch(`${window.CONFIG.API_BASE_URL}/insumos/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    this.mostrarToast(' Insumo eliminado exitosamente', 'success');
                    this.cargarInsumos();
                } else {
                    console.error(' Error eliminando insumo:', data);
                    this.mostrarToast(' Error al eliminar insumo', 'error');
                }
            } catch (error) {
                console.error(' Error en eliminarInsumo:', error);
                this.mostrarToast(' Error de conexión', 'error');
            }
        }
    }

    /**
     * Abrir el modal para agregar/editar
     */
    abrirModal() {
        document.getElementById('modalInsumo').classList.remove('opacity-0', 'pointer-events-none');
    }

    /**
     * Cerrar el modal
     */
    cerrarModal() {
        document.getElementById('modalInsumo').classList.add('opacity-0', 'pointer-events-none');
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
        this.cargarInsumos();
        
        // Configurar eventos
        document.getElementById('busquedaInsumo')?.addEventListener('input', (e) => {
            this.filtrarInsumos(e.target.value);
        });
    }

    /**
     * Filtrar insumos por término de búsqueda
     */
    filtrarInsumos(termino) {
        this.filtroActual = termino.toLowerCase();
        const filas = document.querySelectorAll('#tablaInsumos tr');
        
        filas.forEach(fila => {
            const texto = fila.textContent.toLowerCase();
            if (termino === '' || texto.includes(this.filtroActual)) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    }
}

// Crear instancia global
window.InsumosManager = new InsumosManager();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.InsumosManager.inicializar();
});
