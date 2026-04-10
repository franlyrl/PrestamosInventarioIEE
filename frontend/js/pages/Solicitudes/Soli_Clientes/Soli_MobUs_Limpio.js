class MobileUserController {
    constructor() {
        this.solicitudes = [];
        this.allSolicitudes = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filtroEstado = 'todos';
        this.init();
    }

    init() {
        console.log('** MobileUserController inicializado');
        this.loadUserSolicitudes();
    }

    async loadUserSolicitudes() {
        try {
            console.log('** Cargando solicitudes móviles...');
            
            // Verificar si el HTML ya cargó datos
            console.log('** Verificando window.solicitudesData...');
            console.log('** typeof window.solicitudesData:', typeof window.solicitudesData);
            console.log('** window.solicitudesData existe:', typeof window.solicitudesData !== 'undefined');
            console.log('** window.solicitudesData length:', window.solicitudesData?.length);
            console.log('** window.solicitudesData contenido:', window.solicitudesData);
            
            if (typeof window.solicitudesData !== 'undefined' && window.solicitudesData.length > 0) {
                console.log('** Usando datos del HTML:', window.solicitudesData.length, 'solicitudes');
                this.allSolicitudes = window.solicitudesData;
                this.solicitudes = [...this.allSolicitudes];
                console.log('** Solicitudes asignadas:', this.solicitudes.length);
                console.log('** IDs de solicitudes:', this.solicitudes.map(s => s._id));
                this.renderSolicitudes();
                return;
            }

            // Si no hay datos del HTML, cargar desde API
            const token = localStorage.getItem('utn_token');
            if (!token) {
                console.log('** No hay token, usando datos de prueba');
                this.usarDatosDePrueba();
                return;
            }

            console.log('** Token encontrado, cargando desde API...');
            const response = await fetch('http://localhost:4000/api/solicitudes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar solicitudes');
            }

            const solicitudes = await response.json();
            console.log('** Solicitudes cargadas desde API:', solicitudes.length);
            
            this.allSolicitudes = Array.isArray(solicitudes) ? solicitudes : [];
            this.solicitudes = [...this.allSolicitudes];
            this.renderSolicitudes();

        } catch (error) {
            console.error('** Error cargando solicitudes móviles:', error);
            this.usarDatosDePrueba();
        }
    }

    usarDatosDePrueba() {
        console.log('** Usando datos de prueba para móvil');
        this.allSolicitudes = [
            {
                _id: 'test-1',
                usuario: { nombre_completo: 'Usuario de Prueba', tipo_rol: 'estudiante' },
                estado: 'pendiente',
                fecha_prestamo: new Date().toISOString(),
                activos: [],
                insumos: [],
                createdAt: new Date().toISOString()
            }
        ];
        this.solicitudes = [...this.allSolicitudes];
        this.renderSolicitudes();
    }

    renderSolicitudes() {
        console.log('** Renderizando solicitudes móviles...');
        const container = document.getElementById('mobile-solicitudes-container');
        if (!container) {
            console.error('** Contenedor móvil no encontrado');
            return;
        }

        // Filtrar solicitudes
        let solicitudesFiltradas = this.solicitudes;
        if (this.filtroEstado !== 'todos') {
            solicitudesFiltradas = this.solicitudes.filter(s => s.estado === this.filtroEstado);
        }

        if (solicitudesFiltradas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">📋</div>
                    <h3 class="text-xl font-semibold text-slate-700 mb-2">No tienes solicitudes</h3>
                    <p class="text-sm text-slate-500">Crea tu primera solicitud para comenzar</p>
                </div>
            `;
            return;
        }

        // Renderizar solicitudes
        container.innerHTML = solicitudesFiltradas.map(solicitud => this.renderSolicitudCard(solicitud)).join('');
        
        console.log('** Solicitudes móviles renderizadas:', solicitudesFiltradas.length);
    }

    renderSolicitudCard(solicitud) {
        const estadoColor = this.getEstadoColor(solicitud.estado);
        const elementosInfo = this.getElementosInfo(solicitud);
        
        return `
            <div class="bg-white rounded-lg shadow-md border border-slate-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-base sm:text-lg">📋</span>
                            <div>
                                <h3 class="font-semibold text-slate-800">Solicitud #${solicitud._id.slice(-6)}</h3>
                                <p class="text-xs sm:text-sm text-slate-500">${new Date(solicitud.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor}">
                                ${solicitud.estado}
                            </span>
                        </div>
                        ${elementosInfo.html ? `
                            <div class="text-sm text-slate-600">
                                <p class="text-xs text-slate-500 mb-1">Items solicitados:</p>
                                <div>${elementosInfo.html}</div>
                                ${elementosInfo.total > 0 ? `<p class="text-xs text-slate-500 mt-1">Total: ${elementosInfo.total} elementos</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-1">
                        <button id="menu-btn-${solicitud._id}" 
                                onclick="window.mobileUserController.toggleMenu('${solicitud._id}')" 
                                class="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Más opciones">
                            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 5l8 4-8 4M4 12l8 4 8 4" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Menú de acciones -->
                <div id="menu-${solicitud._id}" class="hidden absolute right-2 top-12 bg-white rounded-lg shadow-lg border border-slate-200 z-50 min-w-48">
                    ${this.renderMenuAcciones(solicitud)}
                </div>
            </div>
        `;
    }

    renderMenuAcciones(solicitud) {
        const estado = solicitud.estado;
        const esEstudiante = solicitud.usuario?.tipo_rol === 'estudiante';
        const esDocente = solicitud.usuario?.tipo_rol === 'docente';
        
        let actions = [];

        // Ver detalles (siempre disponible)
        actions.push(`
            <button onclick="window.mobileUserController.verDetalles('${solicitud._id}')" 
                class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                style="color: #004a8c; hover: background-color: #004a8c15;">
                <span class="text-xs sm:text-sm">👁️</span> Ver Detalles
            </button>
        `);

        // Editar solicitud (solo si está pendiente y es estudiante/docente)
        if (esEstudiante || esDocente) {
            if (estado === 'pendiente') {
                actions.push(`
                    <button onclick="window.mobileUserController.abrirModalEdicion('${solicitud._id}')" 
                        class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                        style="color: #004a8c; hover: background-color: #004a8c15;">
                        <span class="text-xs sm:text-sm">✏️</span> Editar Solicitud
                    </button>
                `);
            }
            
            // Cancelar solicitud (solo si está pendiente o aprobada)
            if (estado === 'pendiente' || estado === 'aprobada') {
                actions.push(`
                    <button onclick="console.log('*** ONCLICK INICIADO'); console.log('*** ID A ENVIAR:', '${solicitud._id}'); console.log('*** TIPO DE window.eliminarSolicitud:', typeof window.eliminarSolicitud); console.log('*** window.eliminarSolicitud EXISTE:', !!window.eliminarSolicitud); window.eliminarSolicitud('${solicitud._id}'); console.log('*** DESPUÉS DE LLAMAR A eliminarSolicitud');" 
                        class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                        style="color: #dc2626; hover: background-color: #dc262615;">
                        <span class="text-xs sm:text-sm">🗑️</span> Cancelar Solicitud
                    </button>
                `);
            }
        }

        return actions.join('');
    }

    toggleMenu(solicitudId) {
        console.log('** TOGGLE MENU INICIADO para solicitud:', solicitudId);
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (!menu) return;

        const wasHidden = menu.classList.contains('hidden');
        console.log('** Menú estaba hidden antes?', wasHidden);
        
        // Cerrar todos los demás menús
        document.querySelectorAll('[id^="menu-"]').forEach(m => {
            if (m.id !== `menu-${solicitudId}`) {
                m.classList.add('hidden');
            }
        });

        // Toggle del menú actual
        menu.classList.toggle('hidden');
        const isHidden = menu.classList.contains('hidden');
        console.log('** Menú está hidden después?', isHidden);
        
        // Si el menú se está abriendo, enfocar el primer botón
        if (!isHidden) {
            setTimeout(() => {
                const firstButton = menu.querySelector('button');
                if (firstButton) {
                    firstButton.focus();
                }
            }, 100);
        }
        
        console.log('** TOGGLE MENU COMPLETADO para solicitud:', solicitudId);
    }

    abrirModalEdicion(solicitudId) {
        console.log('** Abriendo modal de edición para solicitud:', solicitudId);
        
        // Buscar la solicitud completa
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            console.error('** Solicitud no encontrada:', solicitudId);
            return;
        }
        
        // Cerrar el menú de acciones
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Crear modal de edición
        const modal = this.crearModalEdicionCompleto(solicitud);
        document.body.appendChild(modal);
        
        // Cargar items disponibles
        this.cargarItemsDisponiblesParaEdicion();
        
        console.log('** Modal de edición abierto exitosamente');
    }

    crearModalEdicionCompleto(solicitud) {
        console.log('** Creando modal completo para solicitud:', solicitud._id);
        
        // Crear el contenedor principal del modal
        const modalContainer = document.createElement('div');
        modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modalContainer.id = `modal-edicion-completo-${solicitud._id}`;
        
        // Crear el contenido del modal
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto';
        
        // Header del modal
        const modalHeader = document.createElement('div');
        modalHeader.className = 'flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#004a8c] to-[#0066cc] text-white rounded-t-lg';
        modalHeader.innerHTML = `
            <div>
                <h3 class="text-lg font-semibold">Editar Solicitud #${solicitud._id.slice(-6)}</h3>
                <p class="text-sm opacity-90">Estado: ${solicitud.estado}</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-white/80 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        // Body del modal
        const modalBody = document.createElement('div');
        modalBody.className = 'p-4';
        modalBody.innerHTML = `
            <div class="space-y-6">
                <!-- Items Actuales -->
                <div>
                    <h4 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span class="text-xl">📋</span>
                        Items Actuales
                    </h4>
                    <div id="items-actuales-${solicitud._id}" class="space-y-2 mb-4">
                        <!-- Los items se cargarán aquí -->
                    </div>
                </div>
                
                <!-- Tabs para agregar items -->
                <div>
                    <h4 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span class="text-xl">➕</span>
                        Agregar Items
                    </h4>
                    <div class="flex gap-2 mb-4">
                        <button onclick="window.mobileUserController.mostrarTabEdicion('activos', '${solicitud._id}')" 
                                id="tab-activos-${solicitud._id}"
                                class="px-4 py-2 bg-[#004a8c] text-white rounded-lg transition-colors">
                            Activos
                        </button>
                        <button onclick="window.mobileUserController.mostrarTabEdicion('insumos', '${solicitud._id}')" 
                                id="tab-insumos-${solicitud._id}"
                                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-colors">
                            Insumos
                        </button>
                    </div>
                    
                    <!-- Contenido de Tabs -->
                    <div id="contenido-activos-${solicitud._id}" class="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                        <!-- Activos disponibles se cargarán aquí -->
                    </div>
                    <div id="contenido-insumos-${solicitud._id}" class="hidden space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                        <!-- Insumos disponibles se cargarán aquí -->
                    </div>
                </div>
            </div>
        `;
        
        // Footer del modal
        const modalFooter = document.createElement('div');
        modalFooter.className = 'flex gap-3 p-4 border-t bg-gray-50 rounded-b-lg';
        modalFooter.innerHTML = `
            <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
            </button>
            <button onclick="window.mobileUserController.guardarEdicionSolicitud('${solicitud._id}')" 
                    class="flex-1 py-2 bg-[#004a8c] text-white rounded-lg hover:bg-[#003d73] transition-colors">
                Guardar Cambios
            </button>
        `;
        
        // Ensamblar el modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalContainer.appendChild(modalContent);
        
        // Bloquear scroll del body
        document.body.style.overflow = 'hidden';
        
        return modalContainer;
    }

    mostrarTabEdicion(tab, solicitudId) {
        // Actualizar botones
        const tabActivos = document.getElementById(`tab-activos-${solicitudId}`);
        const tabInsumos = document.getElementById(`tab-insumos-${solicitudId}`);
        
        if (tab === 'activos') {
            tabActivos.className = 'px-4 py-2 bg-[#004a8c] text-white rounded-lg transition-colors';
            tabInsumos.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-colors';
        } else {
            tabActivos.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-colors';
            tabInsumos.className = 'px-4 py-2 bg-[#004a8c] text-white rounded-lg transition-colors';
        }
        
        // Mostrar contenido
        document.getElementById(`contenido-activos-${solicitudId}`).classList.toggle('hidden', tab !== 'activos');
        document.getElementById(`contenido-insumos-${solicitudId}`).classList.toggle('hidden', tab !== 'insumos');
    }

    async cargarItemsDisponiblesParaEdicion() {
        try {
            const token = localStorage.getItem('utn_token');
            
            // Cargar activos disponibles
            const responseActivos = await fetch('http://localhost:4000/api/activos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const activos = await responseActivos.json();
            this.mostrarActivosParaEdicion(activos);
            
            // Cargar insumos disponibles
            const responseInsumos = await fetch('http://localhost:4000/api/insumos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const insumos = await responseInsumos.json();
            this.mostrarInsumosParaEdicion(insumos);
            
        } catch (error) {
            console.error('Error cargando items disponibles:', error);
        }
    }

    mostrarActivosParaEdicion(activos) {
        // Buscar todos los modales de edición
        const modals = document.querySelectorAll('[id^="modal-edicion-completo-"]');
        
        modals.forEach(modal => {
            const solicitudId = modal.id.replace('modal-edicion-completo-', '');
            const container = document.getElementById(`contenido-activos-${solicitudId}`);
            
            if (container) {
                container.innerHTML = '';
                
                activos.forEach(activo => {
                    if (activo.estado === 'disponible') {
                        const div = document.createElement('div');
                        div.className = 'p-2 border rounded hover:bg-gray-100 cursor-pointer transition-colors';
                        div.innerHTML = `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🖥️</span>
                                    <div>
                                        <p class="font-medium text-sm">${activo.marca} ${activo.modelo}</p>
                                        <p class="text-xs text-gray-500">${activo.numActivo}</p>
                                    </div>
                                </div>
                                <button onclick="window.mobileUserController.agregarItemEdicion('${activo._id}', 'activo', '${solicitudId}')" 
                                        class="px-2 py-1 bg-[#004a8c] text-white text-sm rounded hover:bg-[#003d73] transition-colors">
                                    Agregar
                                </button>
                            </div>
                        `;
                        container.appendChild(div);
                    }
                });
            }
        });
    }

    mostrarInsumosParaEdicion(insumos) {
        // Buscar todos los modales de edición
        const modals = document.querySelectorAll('[id^="modal-edicion-completo-"]');
        
        modals.forEach(modal => {
            const solicitudId = modal.id.replace('modal-edicion-completo-', '');
            const container = document.getElementById(`contenido-insumos-${solicitudId}`);
            
            if (container) {
                container.innerHTML = '';
                
                insumos.forEach(insumo => {
                    if (insumo.stock > 0) {
                        const div = document.createElement('div');
                        div.className = 'p-2 border rounded hover:bg-gray-100 cursor-pointer transition-colors';
                        div.innerHTML = `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🧪</span>
                                    <div>
                                        <p class="font-medium text-sm">${insumo.nombre}</p>
                                        <p class="text-xs text-gray-500">Stock: ${insumo.stock}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input type="number" id="cantidad-${insumo._id}-${solicitudId}" 
                                           min="1" max="${insumo.stock}" value="1" 
                                           class="w-16 px-2 py-1 border rounded text-sm">
                                    <button onclick="window.mobileUserController.agregarItemEdicion('${insumo._id}', 'insumo', '${solicitudId}')" 
                                            class="px-2 py-1 bg-[#004a8c] text-white text-sm rounded hover:bg-[#003d73] transition-colors">
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        `;
                        container.appendChild(div);
                    }
                });
            }
        });
    }

    agregarItemEdicion(itemId, tipo, solicitudId) {
        // Buscar la solicitud
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) return;
        
        if (tipo === 'activo') {
            if (!solicitud.activos) solicitud.activos = [];
            if (!solicitud.activos.find(a => a._id === itemId)) {
                solicitud.activos.push({ _id: itemId });
            }
        } else {
            if (!solicitud.insumos) solicitud.insumos = [];
            const cantidad = parseInt(document.getElementById(`cantidad-${itemId}-${solicitudId}`).value) || 1;
            const existente = solicitud.insumos.find(i => i.id_insumo === itemId);
            if (existente) {
                existente.cantidad += cantidad;
            } else {
                solicitud.insumos.push({ id_insumo: itemId, cantidad });
            }
        }
        
        // Actualizar visualización de items actuales
        this.actualizarItemsActualesEdicion(solicitud);
    }

    actualizarItemsActualesEdicion(solicitud) {
        const container = document.getElementById(`items-actuales-${solicitud._id}`);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Mostrar activos
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach(activo => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded';
                itemDiv.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🖥️</span>
                        <div>
                            <p class="font-medium text-sm">Activo</p>
                            <p class="text-xs text-gray-500">${activo._id.slice(-6)}</p>
                        </div>
                    </div>
                    <button onclick="window.mobileUserController.removerItemEdicion('${activo._id}', 'activo', '${solicitud._id}')" 
                            class="text-red-500 hover:text-red-700">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                `;
                container.appendChild(itemDiv);
            });
        }
        
        // Mostrar insumos
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach(insumo => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded';
                itemDiv.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🧪</span>
                        <div>
                            <p class="font-medium text-sm">Insumo</p>
                            <p class="text-xs text-gray-500">x${insumo.cantidad}</p>
                        </div>
                    </div>
                    <button onclick="window.mobileUserController.removerItemEdicion('${insumo.id_insumo}', 'insumo', '${solicitud._id}')" 
                            class="text-red-500 hover:text-red-700">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                `;
                container.appendChild(itemDiv);
            });
        }
        
        if (container.children.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-2">No hay items agregados</p>';
        }
    }

    removerItemEdicion(itemId, tipo, solicitudId) {
        // Buscar la solicitud
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) return;
        
        if (tipo === 'activo') {
            solicitud.activos = solicitud.activos.filter(a => a._id !== itemId);
        } else {
            solicitud.insumos = solicitud.insumos.filter(i => i.id_insumo !== itemId);
        }
        
        // Actualizar visualización
        this.actualizarItemsActualesEdicion(solicitud);
    }

    async guardarEdicionSolicitud(solicitudId) {
        try {
            // Buscar la solicitud
            const solicitud = this.solicitudes.find(s => s._id === solicitudId);
            if (!solicitud) {
                alert('Error: Solicitud no encontrada');
                return;
            }
            
            const token = localStorage.getItem('utn_token');
            
            const response = await fetch(`http://localhost:4000/api/solicitudes/${solicitudId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    activos: solicitud.activos || [],
                    insumos: solicitud.insumos || []
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar la solicitud');
            }
            
            const resultado = await response.json();
            console.log('** Solicitud actualizada:', resultado);
            
            alert('Solicitud actualizada correctamente');
            
            // Cerrar modal
            const modal = document.getElementById(`modal-edicion-completo-${solicitudId}`);
            if (modal) {
                modal.remove();
            }
            
            // Restaurar scroll
            document.body.style.overflow = '';
            
            // Recargar datos
            this.recargarDatos();
            
        } catch (error) {
            console.error('Error guardando edición:', error);
            alert('Error al guardar los cambios: ' + error.message);
        }
    }

    async recargarDatos() {
        this.allSolicitudes = [];
        this.solicitudes = [];
        await this.loadUserSolicitudes();
    }

    verDetalles(solicitudId) {
        console.log('** Ver detalles mobile:', solicitudId);
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) return;
        
        // Cerrar menú y crear modal detalles
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Por ahora, solo mostrar una alerta con los detalles
        const mensaje = `Solicitud #${solicitud._id.slice(-6)}\n` +
                      `Estado: ${solicitud.estado}\n` +
                      `Items: ${(solicitud.activos?.length || 0) + (solicitud.insumos?.length || 0)}\n` +
                      `Fecha: ${new Date(solicitud.createdAt).toLocaleDateString()}`;
        
        alert(mensaje);
    }

    getElementosInfo(solicitud) {
        console.log('** Obteniendo elementos info para solicitud:', solicitud._id);
        
        let elementosHtml = '';
        let totalElementos = 0;
        
        // Procesar activos
        if (solicitud.activos && solicitud.activos.length > 0) {
            console.log('** Activos encontrados:', solicitud.activos.length);
            solicitud.activos.forEach(activo => {
                elementosHtml += `<span class="text-slate-700">🖥️ ${activo.marca || ''} ${activo.modelo || ''} (${activo.numActivo || ''})</span>, `;
                totalElementos++;
            });
        }
        
        // Procesar insumos
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            console.log('** Insumos encontrados:', solicitud.insumos.length);
            solicitud.insumos.forEach(insumo => {
                const cantidad = insumo.cantidad || 0;
                const nombre = insumo.id_insumo?.nombre || 'Insumo desconocido';
                elementosHtml += `<span class="text-slate-700">🧪 ${nombre} (x${cantidad})</span>, `;
                totalElementos += cantidad;
            });
        }
        
        // Limpiar la última coma y espacio
        elementosHtml = elementosHtml.replace(/, $/, '');
        
        console.log('** Elementos procesados:', totalElementos);
        console.log('** HTML generado:', elementosHtml);
        
        return {
            html: elementosHtml,
            total: totalElementos
        };
    }

    getEstadoColor(estado) {
        const colores = {
            'pendiente': 'bg-yellow-100 text-yellow-800',
            'aprobada': 'bg-green-100 text-green-800',
            'rechazada': 'bg-red-100 text-red-800',
            'entregado': 'bg-blue-100 text-blue-800',
            'devuelto': 'bg-purple-100 text-purple-800',
            'cancelada': 'bg-gray-100 text-gray-800'
        };
        return colores[estado] || 'bg-gray-100 text-gray-800';
    }
}

// Inicializar el controlador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('** DOM listo - Inicializando MobileUserController...');
    window.mobileUserController = new MobileUserController();
    console.log('** MobileUserController creado:', window.mobileUserController);
});
