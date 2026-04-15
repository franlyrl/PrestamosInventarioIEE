// Controlador móvil para solicitudes
class MobileUserController {
    constructor() {
        this.solicitudes = [];
        this.allSolicitudes = [];
        this.filters = {
            busqueda: '',
            estado: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 5;
    }

    init() {
        console.log('** Inicializando MobileUserController...');
        
        if (window.innerWidth >= 1024) {
            console.log('** No es mobile/tablet, saliendo...');
            return;
        }

        const userData = localStorage.getItem('utn_user');
        if (!userData) {
            console.log('** No hay datos de usuario');
            return;
        }

        const currentUser = JSON.parse(userData);
        const rol = currentUser?.rol || currentUser?.rol_nombre || '';
        const rolText = rol.toLowerCase();
        
        if (rolText.includes('admin') || rolText.includes('administrador')) {
            console.log('** Usuario es administrador, no se inicia controlador mobile');
            return;
        }

        console.log('** Usuario válido, tomando control completo del DOM...');
        
        const tableContainer = document.querySelector('.overflow-x-auto');
        const tbody = document.getElementById('solicitudes-tbody');
        const mobileContainer = document.getElementById('mobile-solicitudes-container');
        
        if (tableContainer) {
            tableContainer.style.display = 'none';
            console.log('** Tabla desktop completamente oculta');
        }
        
        if (tbody) {
            tbody.style.display = 'none';
            console.log('** Tbody desktop oculto');
        }
        
        if (mobileContainer) {
            mobileContainer.style.display = 'block';
            mobileContainer.classList.remove('hidden');
            console.log('** Contenedor mobile visible y activo');
        }         
         
        this.setupEventListeners();
        this.loadUserSolicitudes();
    }

    setupEventListeners() {
        const busquedaInput = document.getElementById('busqueda-input');
        if (busquedaInput) {
            busquedaInput.addEventListener('input', (e) => {
                this.filters.busqueda = e.target.value;
                this.applyFilters();
            });
        }

        const estadoSelect = document.getElementById('estado-filter');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', (e) => {
                this.filters.estado = e.target.value;
                this.applyFilters();
            });
        }

        const limpiarBtn = document.getElementById('clear-filters-btn');
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
        }
    }

    async loadUserSolicitudes() {
        try {
            console.log('** Cargando solicitudes móviles...');
            
            // Verificar si el HTML ya cargó datos
            if (typeof window.solicitudesData !== 'undefined' && window.solicitudesData.length > 0) {
                console.log('** Usando datos del HTML:', window.solicitudesData.length, 'solicitudes');
                this.allSolicitudes = window.solicitudesData;
                this.solicitudes = [...this.allSolicitudes];
                this.renderSolicitudes();
                return;
            }
            
            // Si no hay datos del HTML, cargar desde API
            console.log('** No hay datos del HTML, cargando desde API...');
            
            const userData = localStorage.getItem('utn_user');
            let currentUser = null;
            let token = null;
            
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                } catch (parseError) {
                    console.error('** Error parseando userData:', parseError);
                }
            }
            
            token = currentUser?.token || 
                    localStorage.getItem('utn_token') ||
                    localStorage.getItem('token') || 
                    localStorage.getItem('authToken') ||
                    localStorage.getItem('jwt') ||
                    localStorage.getItem('access_token');
                    
            console.log('** Token encontrado:', token ? 'SÍ' : 'NO');

            if (!token) {
                console.error('** No se encontró token, usando datos de prueba');
                const datosDePrueba = [
                    {
                        _id: 'test001',
                        usuario: { nombre_completo: 'Mathias Jimenez', nombre: 'Mathias' },
                        estado: 'pendiente',
                        createdAt: new Date().toISOString(),
                        insumos: [
                            { nombre: 'Resistor SMD 0805 4.7kOhm', cantidad: 1 },
                            { nombre: 'Capacitor Cerámico 100nF', cantidad: 2 }
                        ]
                    },
                    {
                        _id: 'test002', 
                        usuario: { nombre_completo: 'Ana García', nombre: 'Ana' },
                        estado: 'aprobada',
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        insumos: [
                            { nombre: 'LED Rojo 5mm', cantidad: 10 }
                        ]
                    }
                ];

                this.allSolicitudes = datosDePrueba;
                this.solicitudes = [...this.allSolicitudes];
                this.renderSolicitudes();
                return;
            }

            // Si hay token, usar la API real
            try {
                const apiUrl = 'http://localhost:4000/api/solicitudes';
                console.log('** URL API:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    headers: token ? {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } : {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('** Datos recibidos de API:', data);
                
                this.allSolicitudes = Array.isArray(data) ? data : (data.solicitudes || data.data || []);
                this.solicitudes = [...this.allSolicitudes];
                
                console.log('** Solicitudes cargadas en móvil:', this.solicitudes.length);
                this.renderSolicitudes();
                return;
            } catch (apiError) {
                console.error('** Error en API, usando datos de prueba:', apiError);
                
                const datosDePrueba = [
                    {
                        _id: 'test001',
                        usuario: { nombre_completo: 'Mathias Jimenez', nombre: 'Mathias' },
                        estado: 'pendiente',
                        createdAt: new Date().toISOString(),
                        insumos: [
                            { nombre: 'Resistor SMD 0805 4.7kOhm', cantidad: 1 }
                        ]
                    }
                ];
                this.allSolicitudes = datosDePrueba;
                this.solicitudes = [...this.allSolicitudes];
                this.renderSolicitudes();
            }
            
        } catch (error) {
            console.error('** Error cargando solicitudes móviles:', error);
        }
    }

    renderSolicitudes() {
        console.log('** renderSolicitudes() llamado en móvil...');
        const container = document.getElementById('mobile-solicitudes-container');
        if (!container) {
            console.error('** No se encontró contenedor mobile');
            return;
        }
        
        const solicitudesFiltradas = this.getFilteredSolicitudes();
        console.log('** Solicitudes filtradas para renderizar:', solicitudesFiltradas.length);
        
        if (solicitudesFiltradas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">**</div>
                    <h3 class="text-xl font-semibold text-slate-700 mb-2">No tienes solicitudes</h3>
                    <p class="text-sm text-slate-500">Crea tu primera solicitud para comenzar</p>
                </div>
            `;
            return;
        }

        console.log('** Renderizando solicitudes móviles...');
        
        // Crear tarjetas individuales
        const tarjetasHTML = solicitudesFiltradas.map((solicitud, index) => {
            console.log(`** Creando tarjeta ${index + 1}/${solicitudesFiltradas.length} para solicitud:`, solicitud._id);
            const tarjetaHTML = this.createSolicitudCard(solicitud);
            return tarjetaHTML;
        }).join('');
        
        container.innerHTML = tarjetasHTML;
        console.log('** Tarjetas móviles renderizadas:', solicitudesFiltradas.length);
        
        // Actualizar contador de resultados móviles
        const contadorMobile = document.getElementById('resultados-count-mobile');
        if (contadorMobile) {
            contadorMobile.textContent = solicitudesFiltradas.length;
        }
        
        // Actualizar contador de desktop también si existe
        const contadorDesktop = document.getElementById('resultados-count');
        if (contadorDesktop) {
            contadorDesktop.textContent = solicitudesFiltradas.length;
        }
        
        // Actualizar totales por estado
        this.actualizarTotalesPorEstado();
    }

    createSolicitudCard(solicitud) {
        const usuario = JSON.parse(localStorage.getItem('utn_user'));
        const rol = usuario?.rol || usuario?.rol_nombre || '';
        const rolText = rol.toLowerCase();
        
        const esEstudiante = rolText.includes('estudiante');
        const esDocente = rolText.includes('docente') || rolText.includes('profesor');
        
        let rolColor = '#000000';
        let rolBgGradient = 'linear-gradient(135deg, rgba(229, 220, 220, 0) 0%, rgba(132, 128, 128, 0) 100%)';
        let rolIcono = '??';
        
        if (esDocente) {
            rolColor = '#000000';
            rolBgGradient = 'linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(51, 51, 51, 0) 100%)';
            rolIcono = '??';
        }

        const nombreUsuario = solicitud.usuario?.nombre_completo || solicitud.usuario?.nombre || 'Usuario sin nombre';

        return `
            <div class="bg-white rounded-lg shadow-md border border-slate-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-base sm:text-lg">${rolIcono}</span>
                            <div>
                                <div class="font-bold text-xs sm:text-xs" style="color: #004a8c;">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                                <div class="text-xs sm:text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                            </div>
                        </div>
                        <div class="text-slate-600 font-medium text-sm sm:text-base mt-1">${nombreUsuario}</div>
                        <div class="text-right sm:text-left mt-2 sm:mt-0">
                            <div class="text-slate-500 text-xs sm:text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</div>
                            <div class="mt-1">${this.getEstadoBadge(solicitud.estado)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-2 sm:space-y-3">
                    <div class="text-xs sm:text-sm text-slate-700">
                        ${this.getElementosInfo(solicitud)}
                    </div>
                    
                    <div class="flex justify-end mt-2 sm:mt-3">
                        <div class="relative">
                            <button 
                                id="menu-btn-${solicitud._id}"
                                onclick="window.mobileUserController.toggleMenu('${solicitud._id}')" 
                                class="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                style="background: ${rolBgGradient}; color: black; box-shadow: 0 2px 8px ${rolColor}40;">
                                <span class="text-sm sm:text-base">??</span>
                            </button>
                            <div id="menu-${solicitud._id}" class="hidden absolute right-0 sm:right-4 mt-1 sm:mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-lg border" style="border-color: #000000; z-index: 1000;">
                                <div class="p-1.5 sm:p-2">
                                    ${this.createActionsForRole(solicitud, esEstudiante, esDocente, rolColor)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createActionsForRole(solicitud, esEstudiante, esDocente, rolColor) {
        const estado = solicitud.estado;
        let actions = [];

        actions.push(`
            <button onclick="window.mobileUserController.verDetalles('${solicitud._id}')" 
                class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                style="color: #004a8c; hover: background-color: #004a8c15;">
                <span class="text-xs sm:text-sm">??</span> Ver Detalles
            </button>
        `);

        if (esEstudiante || esDocente) {
            if (estado === 'pendiente') {
                actions.push(`
                    <button onclick="window.mobileUserController.gestionarSolicitud('${solicitud._id}')" 
                        class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                        style="color: #004a8c; hover: background-color: #004a8c15;">
                        <span class="text-xs sm:text-sm">??</span> Editar Solicitud
                    </button>
                `);
            }
            if (estado === 'pendiente' || estado === 'aprobada') {
                actions.push(`
                    <button onclick="window.mobileUserController.eliminarSolicitud('${solicitud._id}')" 
                        class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                        style="color: #004a8c; hover: background-color: #004a8c15;">
                        <span style="opacity: 0.8;">×</span> Cancelar Solicitud
                    </button>
                `);
            }
        }
        
        return actions.join('');
    }

    getElementosInfo(solicitud) {
        let resultado = '';
        
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach((insumo, index) => {
                const nombre = insumo.id_insumo?.NombProducto || insumo.descripcion || 'Insumo';
                const cantidad = insumo.cantidad || 1;
                resultado += `<div class="text-xs sm:text-sm text-slate-600 mb-1">- ${nombre} (x${cantidad})</div>`;
            });
        }
        
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach((activo, index) => {
                const nombre = activo.nombre || activo.descripcion || 'Activo';
                resultado += `<div class="text-xs sm:text-sm text-slate-600 mb-1">- ${nombre}</div>`;
            });
        }
        
        // Agregar información del total en una línea separada
        const totalElementos = solicitud.insumos?.reduce((sum, el) => sum + el.cantidad, 0) || 0;
        const infoTotal = totalElementos > 0 ? `<br><span class="text-slate-500 text-xs">Total: ${totalElementos} elemento${totalElementos > 1 ? 's' : ''}</span>` : '';
        
        return resultado + infoTotal;
    }

    getEstadoBadge(estado) {
        const badges = {
            'pendiente': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">?? Pendiente</span>',
            'aprobada': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">?? Aprobada</span>',
            'rechazada': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">?? Rechazada</span>',
            'entregado': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">?? Entregado</span>',
            'devuelto': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">?? Devuelto</span>',
            'cancelada': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">?? Cancelada</span>'
        };
        return badges[estado] || `<span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${estado}</span>`;
    }

    getFilteredSolicitudes() {
        console.log('** Filtros actuales:', this.filters);
        
        let filtradas = this.solicitudes;

        if (this.filters.estado !== 'todos') {
            filtradas = filtradas.filter(s => s.estado === this.filters.estado);
            console.log(`** Filtrando por estado "${this.filters.estado}":`, filtradas.length);
        }

        if (this.filters.busqueda) {
            filtradas = filtradas.filter(s => {
                const textoFila = `${s.usuario?.nombre_completo || ''} ${s._id || ''} ${this.getElementosInfo(s) || ''}`.toLowerCase();
                return textoFila.includes(this.filters.busqueda.toLowerCase());
            });
        }

        console.log('** Solicitudes finales para mostrar:', filtradas.length);
        return filtradas;
    }

    applyFilters() {
        console.log('** Aplicando filtros en móvil...');
        this.renderSolicitudes();
        
        const solicitudesFiltradas = this.getFilteredSolicitudes();
        const contadorMobile = document.getElementById('resultados-count-mobile');
        if (contadorMobile) {
            contadorMobile.textContent = solicitudesFiltradas.length;
        }
        
        const contadorDesktop = document.getElementById('resultados-count');
        if (contadorDesktop) {
            contadorDesktop.textContent = solicitudesFiltradas.length;
        }
        
        this.actualizarTotalesPorEstado();
    }

    limpiarFiltros() {
        this.filters = {
            busqueda: '',
            estado: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };
        
        const estadoFilter = document.getElementById('estado-filter');
        if (estadoFilter) estadoFilter.value = 'todos';
        
        this.renderSolicitudes();
    }

    actualizarTotalesPorEstado() {
        console.log('** Actualizando totales por estado...');
        
        const stats = {
            pendientes: this.solicitudes.filter(s => s.estado === 'pendiente').length,
            aprobadas: this.solicitudes.filter(s => s.estado === 'aprobada').length,
            rechazadas: this.solicitudes.filter(s => s.estado === 'rechazada').length,
            entregadas: this.solicitudes.filter(s => s.estado === 'entregado').length,
            devueltas: this.solicitudes.filter(s => s.estado === 'devuelto').length,
            canceladas: this.solicitudes.filter(s => s.estado === 'cancelada').length
        };

        console.log('** Estadísticas calculadas:', stats);

        // Actualizar contadores desktop
        const pendientesCount = document.getElementById('pendientes-count');
        const aprobadasCount = document.getElementById('aprobadas-count');
        const rechazadasCount = document.getElementById('rechazadas-count');
        const entregadasCount = document.getElementById('entregadas-count');
        const devueltasCount = document.getElementById('devueltas-count');
        const canceladasCount = document.getElementById('canceladas-count');

        if (pendientesCount) pendientesCount.textContent = stats.pendientes;
        if (aprobadasCount) aprobadasCount.textContent = stats.aprobadas;
        if (rechazadasCount) rechazadasCount.textContent = stats.rechazadas;
        if (entregadasCount) entregadasCount.textContent = stats.entregadas;
        if (devueltasCount) devueltasCount.textContent = stats.devueltas;
        if (canceladasCount) canceladasCount.textContent = stats.canceladas;

        console.log('** Estadísticas actualizadas correctamente');
    }

    toggleMenu(solicitudId) {
        console.log('** TOGGLE MENU INICIADO para solicitud:', solicitudId);
        
        const menu = document.getElementById(`menu-${solicitudId}`);
        console.log('** Menú encontrado:', !!menu, menu?.id);
        
        const allMenus = document.querySelectorAll('[id^="menu-"]');
        console.log('** Total menús encontrados:', allMenus.length);
        
        // Verificar estado de los botones ANTES de hacer nada
        const allButtonsBefore = document.querySelectorAll('#mobile-solicitudes-container button[id^="menu-btn-"]');
        console.log('** BOTONES ANTES - Total:', allButtonsBefore.length);
        
        allMenus.forEach(m => {
            if (m.id !== `menu-${solicitudId}`) {
                console.log('** Cerrando menú:', m.id);
                m.classList.add('hidden');
            }
        });

        const wasHidden = menu.classList.contains('hidden');
        console.log('** Menú estaba hidden antes?', wasHidden);
        
        menu.classList.toggle('hidden');
        const isHiddenNow = menu.classList.contains('hidden');
        console.log('** Menú está hidden después?', isHiddenNow);
        
        // Verificar estado de los botones DESPUÉS del toggle
        setTimeout(() => {
            const allButtonsAfter = document.querySelectorAll('#mobile-solicitudes-container button[id^="menu-btn-"]');
            console.log('** BOTONES DESPUÉS - Total:', allButtonsAfter.length);
            allButtonsAfter.forEach((btn, index) => {
                console.log(`** Botón ${index + 1} DESPUÉS:`, {
                    id: btn.id,
                    visible: window.getComputedStyle(btn).visibility,
                    opacity: window.getComputedStyle(btn).opacity,
                    display: window.getComputedStyle(btn).display,
                    pointerEvents: window.getComputedStyle(btn).pointerEvents,
                    zIndex: window.getComputedStyle(btn).zIndex,
                    classes: btn.className
                });
                
                // CORRECCIÓN MEJORADA: Forzar que los botones siempre sean visibles
                if (btn.classList.contains('hidden')) {
                    console.log('** REMOVIENDO CLASE HIDDEN DEL BOTÓN:', btn.id);
                    btn.classList.remove('hidden');
                    btn.classList.remove('invisible');
                }
                
                // Forzar display correcto de múltiples maneras
                btn.style.display = 'block';
                btn.style.setProperty('display', 'block', 'important');
                btn.style.visibility = 'visible';
                btn.style.setProperty('visibility', 'visible', 'important');
                
                console.log('** BOTÓN CORREGIDO -', btn.id, ':', {
                    display: btn.style.display,
                    visibility: btn.style.visibility,
                    classes: btn.className
                });
            });
        }, 100);
        
        console.log('** TOGGLE MENU COMPLETADO para solicitud:', solicitudId);
    }

    // MODALES - Funciones agregadas del commit
    verDetalles(solicitudId) {
        console.log('** Ver detalles mobile:', solicitudId);
        
        // Buscar la solicitud completa
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            console.error('** Solicitud no encontrada:', solicitudId);
            return;
        }
        
        console.log('** Solicitud encontrada para detalles:', solicitud);
        
        // Cerrar el menú de acciones
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Crear modal de detalles dinámicamente
        const modalDetalles = this.crearModalDetalles(solicitud);
        if (modalDetalles) {
            // Agregar el modal al body
            document.body.appendChild(modalDetalles);
            
            // Mostrar el modal
            modalDetalles.classList.remove('hidden');
            modalDetalles.style.display = 'flex';
            
            // Bloquear scroll del body
            document.body.style.overflow = 'hidden';
            
            console.log('** Modal de detalles abierto exitosamente');
        } else {
            console.error('** No se pudo crear modal de detalles');
            alert('No se pudo mostrar los detalles de la solicitud');
        }
    }
    
    crearModalDetalles(solicitud) {
        console.log('** Creando modal de detalles para solicitud:', solicitud._id);
        try {
            // Crear el contenedor principal del modal
            const modalContainer = document.createElement('div');
            modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
            modalContainer.id = `modal-detalles-${solicitud._id}`;
            
            // Crear el contenido del modal
            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto';
            
            // Header del modal
            const modalHeader = document.createElement('div');
            modalHeader.className = 'flex items-center justify-between p-4 border-b bg-gray-50';
            modalHeader.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Detalles de Solicitud</h3>
                        <p class="text-sm text-gray-500">ID: ${solicitud._id}</p>
                    </div>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            
            // Body del modal
            const modalBody = document.createElement('div');
            modalBody.className = 'p-6 space-y-6';
            
            // Información general
            const infoGeneral = document.createElement('div');
            infoGeneral.className = 'space-y-4';
            infoGeneral.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <div class="flex items-center space-x-2">
                            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span class="text-sm font-medium text-gray-600">${(solicitud.usuario?.nombre_completo || 'N/A').charAt(0).toUpperCase()}</span>
                            </div>
                            <span class="text-sm font-medium text-gray-900">${solicitud.usuario?.nombre_completo || 'N/A'}</span>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getEstadoColor(solicitud.estado)}">
                            ${solicitud.estado || 'N/A'}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
                        <p class="text-sm text-gray-900">${new Date(solicitud.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                        <p class="text-sm text-gray-900">${new Date(solicitud.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            `;
            
            // Elementos solicitados
            const elementosSection = document.createElement('div');
            elementosSection.className = 'space-y-3';
            elementosSection.innerHTML = `
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Elementos Solicitados</h4>
                    <div class="space-y-2">
                        ${this.getElementosInfoModal(solicitud)}
                    </div>
                </div>
            `;
            
            // Ensamblar el modal
            modalBody.appendChild(infoGeneral);
            modalBody.appendChild(elementosSection);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContainer.appendChild(modalContent);
            
            console.log('** Modal de detalles creado exitosamente');
            return modalContainer;
            
        } catch (error) {
            console.error('** Error creando modal de detalles:', error);
            return null;
        }
    }
    
    getElementosInfoModal(solicitud) {
        const elementos = [];
        
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach((insumo, index) => {
                const nombre = insumo.id_insumo?.NombProducto || insumo.descripcion || 'Insumo sin nombre';
                const cantidad = insumo.cantidad || 1;
                elementos.push(`
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <span class="text-blue-600">1</span>
                            <span class="text-sm font-medium text-gray-900">${nombre}</span>
                        </div>
                        <span class="text-sm text-gray-500">Cantidad: ${cantidad}</span>
                    </div>
                `);
            });
        }
        
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach((activo, index) => {
                const nombre = activo.nombre || activo.descripcion || 'Activo sin nombre';
                elementos.push(`
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <span class="text-green-600">2</span>
                            <span class="text-sm font-medium text-gray-900">${nombre}</span>
                        </div>
                        <span class="text-sm text-gray-500">Activo</span>
                    </div>
                `);
            });
        }
        
        if (elementos.length === 0) {
            return '<p class="text-sm text-gray-500 italic">No hay elementos solicitados</p>';
        }
        
        return elementos.join('');
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

    gestionarSolicitud(solicitudId) {
        console.log('** Editar solicitud mobile:', solicitudId);
        
        // Buscar la solicitud completa
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            console.error('** Solicitud no encontrada:', solicitudId);
            return;
        }
        
        console.log('** Solicitud encontrada para editar:', solicitud);
        
        // Cerrar el menú de acciones
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Crear modal de edición dinámicamente
        const modalEdicion = this.crearModalEdicionDinamico(solicitud);
        if (modalEdicion) {
            // Agregar el modal al body
            document.body.appendChild(modalEdicion);
            
            // Mostrar el modal
            modalEdicion.classList.remove('hidden');
            modalEdicion.style.display = 'flex';
            
            // Bloquear scroll del body
            document.body.style.overflow = 'hidden';
            
            console.log('** Modal de edición abierto exitosamente');
        } else {
            console.error('** No se pudo crear modal de edición');
            alert('No se pudo mostrar el editor de la solicitud');
        }
    }
    
    crearModalEdicionDinamico(solicitud) {
        console.log('** Creando modal de edición para solicitud:', solicitud._id);
        try {
            // Crear el contenedor principal del modal
            const modalContainer = document.createElement('div');
            modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
            modalContainer.id = `modal-edicion-dinamico-${solicitud._id}`;
            
            // Crear el contenido del modal
            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto';
            
            // Header del modal
            const modalHeader = document.createElement('div');
            modalHeader.className = 'flex items-center justify-between p-4 border-b';
            modalHeader.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-900">Editar Solicitud #${solicitud._id.slice(-6)}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            
            // Body del modal
            const modalBody = document.createElement('div');
            modalBody.className = 'p-4';
            modalBody.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input type="text" id="usuario-nombre" value="${solicitud.usuario?.nombre_completo || ''}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" readonly>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <input type="text" value="${solicitud.estado}" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md" readonly>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Insumos (${solicitud.insumos?.length || 0})</label>
                        <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                            ${solicitud.insumos?.map((insumo, index) => `
                                <div class="flex items-center justify-between py-1 px-2 border-b border-gray-100">
                                    <span class="text-sm">${insumo.id_insumo?.NombProducto || 'Sin nombre'}</span>
                                    <span class="text-sm text-gray-500">x${insumo.cantidad || 1}</span>
                                </div>
                            `).join('') || '<p class="text-gray-500">No hay insumos</p>'}
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-2 pt-4">
                        <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
                            Cancelar
                        </button>
                        <button onclick="window.mobileUserController.guardarCambiosSolicitud('${solicitud._id}')" 
                            class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md">
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            `;
            
            // Ensamblar el modal
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContainer.appendChild(modalContent);
            
            console.log('** Modal dinámico creado exitosamente');
            return modalContainer;
            
        } catch (error) {
            console.error('** Error creando modal dinámico:', error);
            return null;
        }
    }
    
    guardarCambiosSolicitud(solicitudId) {
        console.log('** Guardando cambios para solicitud:', solicitudId);
        
        // Cerrar el modal
        const modal = document.querySelector(`#modal-edicion-dinamico-${solicitudId}`);
        if (modal) {
            modal.remove();
        }
        
        // Restaurar scroll
        document.body.style.overflow = '';
        
        alert('Función de guardar cambios en desarrollo. Los cambios se guardarán en una futura versión.');
        console.log('** Cambios guardados (simulado)');
        
        // Recargar los datos para reflejar cambios
        this.recargarDatos();
    }
    
    async recargarDatos() {
        console.log('** Recargando datos para reflejar cambios...');
        
        // Limpiar datos actuales
        this.allSolicitudes = [];
        this.solicitudes = [];
        
        // Recargar desde el principio
        await this.loadUserSolicitudes();
        
        console.log('** Datos recargados exitosamente');
    }

    async eliminarSolicitud(solicitudId) {
        console.log('** Cancelando solicitud:', solicitudId);
        
        // Confirmar con el usuario
        const confirmacion = confirm('¿Estás seguro que deseas cancelar esta solicitud? Esta acción no se puede deshacer.');
        if (!confirmacion) {
            console.log('** Cancelación cancelada por el usuario');
            return;
        }
        
        try {
            // Buscar la solicitud
            const solicitud = this.solicitudes.find(s => s._id === solicitudId);
            if (!solicitud) {
                console.error('** Solicitud no encontrada:', solicitudId);
                alert('Solicitud no encontrada');
                return;
            }
            
            console.log('** Solicitud encontrada para cancelar:', solicitud);
            
            // Cambiar el estado a "cancelada" localmente
            solicitud.estado = 'cancelada';
            
            // Recargar para mostrar los cambios
            this.renderSolicitudes();
            this.actualizarTotalesPorEstado();
            
            console.log('** Solicitud cancelada exitosamente');
            alert('Solicitud cancelada correctamente');
            
        } catch (error) {
            console.error('** Error cancelando solicitud:', error);
            alert('Error al cancelar la solicitud. Por favor, inténtalo de nuevo.');
        }
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('** DOM listo - Inicializando MobileUserController directamente...');
    
    const userData = localStorage.getItem('utn_user');
    console.log('** Datos de usuario encontrados:', !!userData);
    
    if (!userData) {
        console.log('** No hay datos de usuario, saliendo');
        return;
    }
    
    const currentUser = JSON.parse(userData);
    const rol = currentUser?.rol || currentUser?.rol_nombre || '';
    const rolText = rol.toLowerCase();
        
    const esAdmin = rolText.includes('admin') || rolText.includes('administrador');
    console.log('** Es administrador:', esAdmin);
    
    if (esAdmin) {
        console.log('** Usuario es administrador, no se inicia controlador mobile');
        return;
    }
    
    console.log('** Todas las condiciones cumplidas, creando e iniciando controlador mobile...');
    
    // Crear el controlador global PRIMERO
    window.mobileUserController = new MobileUserController();
    console.log('** MobileUserController creado:', window.mobileUserController);
    
    // Luego inicializarlo
    window.mobileUserController.init();
});

// Estilos para el contenedor de solicitudes
const style = document.createElement('style');
style.textContent = `
    @media (max-width: 1023px) {
        #mobile-solicitudes-container {
            min-height: calc(100vh - 200px) !important;
            max-height: calc(100vh - 200px) !important;
            overflow-y: auto !important;
        }
        
        /* Asegurar que los botones de acciones estén siempre visibles */
        #mobile-solicitudes-container button[id^="menu-btn-"] {
            position: relative !important;
            z-index: 1000 !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
        
        /* Menús desplegables */
        #mobile-solicitudes-container [id^="menu-"] {
            position: absolute !important;
            z-index: 1001 !important;
        }
        
        /* Asegurar que los botones no se oculten nunca */
        #mobile-solicitudes-container button[id^="menu-btn-"]:hover {
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* Centrar modal de edición */
        #modals-component > div:first-child {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
        }
        
        /* Alinear modal de detalles a la derecha */
        .modal-detalles {
            position: fixed !important;
            top: 50% !important;
            right: 1rem !important;
            left: auto !important;
            transform: translateY(-50%) !important;
            margin: 0 !important;
            max-width: 95vw !important;
            width: 45rem !important;
        }
        
        /* Asegurar que el contenedor del modal esté centrado */
        #modals-component {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
    }
`;
document.head.appendChild(style);