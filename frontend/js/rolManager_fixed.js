/**
 * @file rolManager.js
 * @description Gestión de vistas según rol de usuario
 */

class RolManager {
    constructor() {
        this.vistaEstudiante = null;
        this.vistaAdmin = null;
        this.usuarioActual = null;
    }

    /**
     * Inicializa el gestor de roles
     */
    inicializar(usuario) {
        
        this.usuarioActual = usuario;
        
        // Obtener elementos del DOM
        this.vistaEstudiante = document.getElementById('vistaEstudiante');
        this.vistaAdmin = document.getElementById('vistaAdmin');
        
        // Ocultar todas las vistas primero
        if (this.vistaEstudiante) this.vistaEstudiante.classList.add('hidden');
        if (this.vistaAdmin) this.vistaAdmin.classList.add('hidden');
        
        // Mostrar vista según rol
        if (this.esRolEstudiante(usuario)) {
            this.mostrarVistaEstudiante();
        } else if (this.esRolAdmin(usuario)) {
            this.mostrarVistaAdmin();
        }
    }

    /**
     * Verifica si el rol es de estudiante/docente
     */
    esRolEstudiante(usuario) {
        const rol = (usuario.rol || '').toLowerCase();
        return ['estudiante', 'docente'].includes(rol);
    }

    /**
     * Verifica si el rol es de administrativo/admin
     */
    esRolAdmin(usuario) {
        const rol = (usuario.rol || '').toLowerCase();
        return ['administrativo', 'admin'].includes(rol);
    }

    /**
     * Muestra vista para estudiantes y docentes
     */
    mostrarVistaEstudiante() {
        if (this.vistaEstudiante) {
            this.vistaEstudiante.classList.remove('hidden');
        }
    }

    /**
     * Muestra vista para administrativos y admin
     */
    mostrarVistaAdmin() {
        if (this.vistaAdmin) {
            this.vistaAdmin.classList.remove('hidden');
        }
    }

    /**
     * Abre el módulo de gestión de activos
     */
    abrirModuloActivos() {
        this.mostrarToast(' Abriendo gestión de Activos...', 'info');
        
        // Redirigir a la página de gestión de activos
        setTimeout(() => {
            window.location.href = 'pages/activos.html';
        }, 1000);
    }

    /**
     * Abre el modal para añadir artículos
     */
    abrirModalAgregar() {
        this.mostrarToast(' Abriendo formulario para añadir artículo...', 'info');
        
        // Crear y mostrar modal de agregar artículo
        this.crearModalAgregarArticulo();
    }

    /**
     * Crea el modal para agregar artículos
     */
    crearModalAgregarArticulo() {
        // Verificar si ya existe el modal
        let modal = document.getElementById('modalAgregarArticulo');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalAgregarArticulo';
            modal.className = 'fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity';
            modal.innerHTML = `
                <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 fade-in">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-bold text-slate-800"> Añadir Nuevo Artículo</h3>
                            <button onclick="window.RolManager.cerrarModalAgregar()" class="text-slate-400 hover:text-slate-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        <form id="formAgregarArticulo" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Código del Artículo</label>
                                    <input type="text" id="codigoArticulo" required
                                           class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                           placeholder="Ej: ART-001">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Nombre del Artículo</label>
                                    <input type="text" id="nombreArticulo" required
                                           class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                           placeholder="Ej: Resistencias 10k">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                <select id="categoriaArticulo" required
                                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                    <option value="">Seleccionar categoría</option>
                                    <option value="electronicos">Electrónicos</option>
                                    <option value="herramientas">Herramientas</option>
                                    <option value="materiales">Materiales</option>
                                    <option value="consumibles">Consumibles</option>
                                    <option value="seguridad">Seguridad</option>
                                </select>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Cantidad Inicial</label>
                                    <input type="number" id="cantidadArticulo" required min="0"
                                           class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                           placeholder="Cantidad inicial">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
                                    <input type="number" id="stockMinimoArticulo" required min="0"
                                           class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                           placeholder="0">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                                <input type="text" id="ubicacionArticulo"
                                       class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                       placeholder="Ej: Laboratorio 101">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                <textarea id="descripcionArticulo" rows="3"
                                          class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                          placeholder="Descripción detallada del artículo"></textarea>
                            </div>
                        </form>
                        
                        <div class="flex gap-3 pt-4">
                            <button onclick="window.RolManager.cerrarModalAgregar()" class="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                                Cancelar
                            </button>
                            <button onclick="window.RolManager.guardarArticulo()" class="flex-1 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                                Guardar Artículo
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Agregar animación de entrada
            setTimeout(() => {
                modal.classList.remove('opacity-0', 'pointer-events-none');
            }, 100);
        }
    }

    /**
     * Cierra el modal de agregar artículo
     */
    cerrarModalAgregar() {
        const modal = document.getElementById('modalAgregarArticulo');
        if (modal) {
            modal.classList.add('opacity-0', 'pointer-events-none');
            
            // Eliminar del DOM después de la animación
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    /**
     * Guarda el artículo en la base de datos
     */
    async guardarArticulo() {
        try {
            const formData = {
                codigo_insumo: document.getElementById('codigoArticulo').value,
                nombre_insumo: document.getElementById('nombreArticulo').value,
                categoria: document.getElementById('categoriaArticulo').value,
                stock_inicial: parseInt(document.getElementById('cantidadArticulo').value),
                stock_minimo: parseInt(document.getElementById('stockMinimoArticulo').value),
                stock_actual: parseInt(document.getElementById('cantidadArticulo').value),
                ubicacion: document.getElementById('ubicacionArticulo').value,
                descripcion: document.getElementById('descripcionArticulo').value
            };
            
            
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/insumos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('utn_token')}`
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.mostrarToast(' Artículo guardado exitosamente', 'success');
                this.cerrarModalAgregar();
            } else {
                console.error(' Error guardando artículo:', data);
                this.mostrarToast(' Error al guardar artículo', 'error');
            }
        } catch (error) {
            console.error(' Error en guardarArticulo:', error);
            this.mostrarToast(' Error de conexión', 'error');
        }
    }

    /**
     * Abre el módulo de gestión de insumos
     */
    abrirModuloInsumos() {
        this.mostrarToast(' Abriendo gestión de Insumos...', 'info');
        
        // Redirigir a la página de gestión de insumos
        setTimeout(() => {
            window.location.href = 'pages/insumos.html';
        }, 1000);
    }

    /**
     * Muestra notificaciones toast
     */
    mostrarToast(mensaje, tipo = 'success') {
        // Usar la función global de toast si está disponible
        if (typeof showToast === 'function') {
            showToast(mensaje, tipo);
        } else {
        }
    }
}

// Crear instancia global
window.RolManager = new RolManager();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RolManager;
}
