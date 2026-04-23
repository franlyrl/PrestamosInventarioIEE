/**
 * Gestor de vistas por rol de usuario
 * Muestra diferentes interfaces según el rol del usuario
 */

class RolManager {
    constructor() {
        this.vistaEstudiante = document.getElementById('vistaEstudiante');
        this.vistaAdmin = document.getElementById('vistaAdmin');
        this.currentUser = null;
    }

    /**
     * Inicializa el gestor y determina qué vista mostrar
     */
    inicializar(usuario) {
        this.currentUser = usuario;

        if (!usuario) {
            console.error(' RolManager - No hay usuario');
            return;
        }

        const rol = (usuario.rol || usuario.tipo_rol || '').toLowerCase();

        // Limpiar vistas
        this.ocultarTodasLasVistas();

        // Mostrar vista correspondiente
        if (rol === 'estudiante' || rol === 'docente') {
            this.mostrarVistaEstudiante();
        } else if (rol === 'administrativo' || rol === 'admin') {
            this.mostrarVistaAdmin();
        } else {
            // Por defecto, mostrar vista estudiante
            this.mostrarVistaEstudiante();
        }

        // Cargar estadísticas para vista admin
        if (rol === 'administrativo' || rol === 'admin') {
            this.cargarEstadisticas();
        }
    }

    /**
     * Oculta todas las vistas
     */
    ocultarTodasLasVistas() {
        if (this.vistaEstudiante) {
            this.vistaEstudiante.classList.add('hidden');
        }
        if (this.vistaAdmin) {
            this.vistaAdmin.classList.add('hidden');
        }
    }

    /**
     * Muestra vista para estudiantes y docentes
     */
    mostrarVistaEstudiante() {
        if (this.vistaEstudiante) {
            this.vistaEstudiante.classList.remove('hidden');
        }

        // Cargar insumos para que los estudiantes puedan solicitar
        this.cargarInsumosParaEstudiantes();

        // Inicializar funcionalidad de estudiantes
        if (window.StudentDashboard) {
            window.StudentDashboard.inicializar();
        }
    }

    /**
     * Carga insumos para estudiantes
     */
    async cargarInsumosParaEstudiantes() {
        try {

            const response = await fetch(`${window.CONFIG.API_BASE_URL}/insumos`);
            const data = await response.json();

            if (response.ok) {
                this.mostrarInsumosEstudiantes(data);
            } else {
                console.error(' Error cargando insumos para estudiantes:', data);
            }
        } catch (error) {
            console.error(' Error en cargarInsumosParaEstudiantes:', error);
        }
    }

    /**
     * Muestra insumos para estudiantes en el grid
     */
    mostrarInsumosEstudiantes(insumos) {
        const itemsGrid = document.getElementById('itemsGrid');

        if (!itemsGrid) {
            console.error(' itemsGrid no encontrado');
            return;
        }

        itemsGrid.innerHTML = '';

        if (insumos.length === 0) {
            itemsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-slate-400">
                        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4m16 0l-4 4m0 0l4-4m0 0z"/>
                        </svg>
                        <p class="text-lg font-medium">No hay insumos disponibles</p>
                        <p class="text-sm">Los insumos se mostrarán aquí cuando estén disponibles</p>
                    </div>
                </div>
            `;
            return;
        }

        insumos.forEach(insumo => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border border-slate-100';

            // Determinar estado del stock
            let stockClass = 'text-green-600';
            let stockText = 'Disponible';
            if (insumo.stock_actual <= insumo.stock_minimo) {
                stockClass = 'text-red-600';
                stockText = 'Stock Bajo';
            }

            card.innerHTML = `
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <span class="text-2xl"></span>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-slate-800">${insumo.nombre_insumo}</h3>
                            <p class="text-sm text-slate-600">${insumo.categoria}</p>
                        </div>
                    </div>

                    <div class="space-y-2 mb-4">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Código:</span>
                            <span class="font-medium">${insumo.codigo_insumo}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Stock:</span>
                            <span class="font-medium ${stockClass}">${insumo.stock_actual} (${stockText})</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500">Ubicación:</span>
                            <span class="font-medium">${insumo.ubicacion || 'No especificada'}</span>
                        </div>
                    </div>

                    <button onclick="window.RolManager.solicitarInsumo('${insumo._id}')" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                            ${insumo.stock_actual <= 0 ? 'disabled' : ''}>
                        ${insumo.stock_actual <= 0 ? 'No disponible' : 'Solicitar'}
                    </button>
                </div>
            `;

            itemsGrid.appendChild(card);
        });
    }

    /**
     * Solicita un insumo para estudiantes
     */
    solicitarInsumo(insumoId) {

        // Aquí puedes agregar la lógica para solicitar el insumo
        // Por ahora, mostramos un mensaje
        this.mostrarToast(' Función de solicitud en desarrollo', 'info');
    }

    /**
     * Muestra vista para administrativos y admin
     */
    mostrarVistaAdmin() {
        if (this.vistaAdmin) {
            this.vistaAdmin.classList.remove('hidden');
        }

        // Inicializar funcionalidad de admin
        if (window.AdminDashboard) {
            window.AdminDashboard.inicializar();
        }
    }

    /**
     * Carga estadísticas para la vista admin
     */
    async cargarEstadisticas() {
        try {

            // Cargar totales
            const response = await fetch(`${window.CONFIG.API_BASE_URL}/estadisticas/totales`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('totalActivos').textContent = data.totalActivos || 0;
                document.getElementById('totalInsumos').textContent = data.totalInsumos || 0;
                document.getElementById('totalSolicitudes').textContent = data.totalSolicitudes || 0;
            }
        } catch (error) {
            console.error(' Error cargando estadísticas:', error);
            // Valores por defecto
            document.getElementById('totalActivos').textContent = '0';
            document.getElementById('totalInsumos').textContent = '0';
            document.getElementById('totalSolicitudes').textContent = '0';
        }
    }

    /**
     * Abre el módulo de gestión de activos
     */
    abrirModuloActivos() {
        showToast(' Abriendo gestión de Activos...', 'info');

        // Redirigir a la página de gestión de activos
        setTimeout(() => {
            window.location.href = 'pages/activos.html';
        }, 1000);
    }

    /**
     * Abre el modal para añadir artículos
     */
    abrirModalAgregar() {
        showToast(' Abriendo formulario para añadir artículo...', 'info');

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

                // Actualizar estadísticas si existe la función
                if (typeof this.cargarEstadisticas === 'function') {
                    this.cargarEstadisticas();
                }
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
        showToast(' Abriendo gestión de Insumos...', 'info');

        // Redirigir a la página de gestión de insumos
        setTimeout(() => {
            window.location.href = 'pages/insumos.html';
        }, 1000);
    }
}

// Crear instancia global
window.RolManager = new RolManager();

// Exportar para uso en otros módulos
if(typeof module !== 'undefined' && module.exports) {
    module.exports = RolManager;
}
