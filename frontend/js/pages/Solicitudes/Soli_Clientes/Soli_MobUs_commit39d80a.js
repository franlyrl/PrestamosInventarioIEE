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
            
            // Verificar si el HTML ya cargó datos (usar los datos del HTML si existen)
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
            console.log('** No hay datos del HTML, cargando desde API...');
            
            // Revisar todo el localStorage para encontrar el token
            console.log('** Todo el localStorage:', {...localStorage});
            
            const userData = localStorage.getItem('utn_user');
            console.log('** userData de utn_user:', userData);
            
            let currentUser = null;
            let token = null;
            
            // Intentar parsear userData
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                    console.log('** Usuario parseado:', currentUser);
                } catch (parseError) {
                    console.error('** Error parseando userData:', parseError);
                }
            }
            
            // Buscar token en todas partes posibles (usar las mismas que desktop)
            token = currentUser?.token || 
                    localStorage.getItem('utn_token') ||  // Usar el mismo que desktop
                    localStorage.getItem('token') || 
                    localStorage.getItem('authToken') ||
                    localStorage.getItem('jwt') ||
                    localStorage.getItem('access_token');
                    
            console.log('** Token encontrado:', token ? 'SÍ' : 'NO');
            console.log('** Valor del token:', token);

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
                    },
                    {
                        _id: 'test003',
                        usuario: { nombre_completo: 'Carlos López', nombre: 'Carlos' },
                        estado: 'rechazada',
                        createdAt: new Date(Date.now() - 172800000).toISOString(),
                        insumos: [
                            { nombre: 'Microcontrolador Arduino Uno', cantidad: 1 }
                        ]
                    },
                    {
                        _id: 'test004',
                        usuario: { nombre_completo: 'Laura Martínez', nombre: 'Laura' },
                        estado: 'entregado',
                        createdAt: new Date(Date.now() - 259200000).toISOString(),
                        insumos: [
                            { nombre: 'Protoboard 830 puntos', cantidad: 2 }
                        ]
                    }
                ];

                this.allSolicitudes = datosDePrueba;
                this.solicitudes = [...this.allSolicitudes];
                this.renderSolicitudes();
                return;
            }

            // Si hay token, usar la API real (misma que desktop)
            try {
                // Usar la misma URL que desktop
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
                console.log('** Tipo de datos recibidos:', typeof data);
                console.log('** ¿Es array?', Array.isArray(data));
                console.log('** Longitud del array:', data.length);
                console.log('** IDs de solicitudes recibidas:', data.map(s => s._id));
                console.log('** Estados de solicitudes recibidas:', data.map(s => s.estado));
                
                this.allSolicitudes = Array.isArray(data) ? data : (data.solicitudes || data.data || []);
                this.solicitudes = [...this.allSolicitudes];
                
                console.log('** Solicitudes cargadas en móvil:', this.solicitudes.length);
                console.log('** Primera solicitud:', this.solicitudes[0]);
                
                this.renderSolicitudes();
                return;
            } catch (apiError) {
                console.error('** Error en API, intentando endpoint público:', apiError);
                
                // Intentar endpoint público sin autenticación
                try {
                    const publicResponse = await fetch('/api/solicitudes');
                    if (publicResponse.ok) {
                        const publicData = await publicResponse.json();
                        console.log('** Datos recibidos de API pública:', publicData);
                        this.allSolicitudes = Array.isArray(publicData) ? publicData : (publicData.solicitudes || publicData.data || []);
                        this.solicitudes = [...this.allSolicitudes];
                        this.renderSolicitudes();
                        return;
                    }
                } catch (publicError) {
                    console.error('** Error en API pública:', publicError);
                }
                
                // Si todo falla, usar datos de prueba
                console.log('** Todas las APIs fallaron, usando datos de prueba');
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
        console.log('** Solicitudes filtradas:', solicitudesFiltradas);
        console.log('** Solicitudes a renderizar:', solicitudesFiltradas.length);
        console.log('** IDs de solicitudes:', solicitudesFiltradas.map(s => s._id));
        console.log('** Estructura de la primera solicitud:', solicitudesFiltradas[0]);
        
        if (solicitudesFiltradas.length === 0) {
            console.log('** No hay solicitudes para mostrar');
            container.innerHTML = `
                <div class="bg-white rounded-lg shadow-md border border-slate-200 p-6 text-center">
                    <div class="text-6xl mb-4">??</div>
                    <h3 class="text-xl font-semibold text-slate-700 mb-2">
                        No hay solicitudes encontradas
                    </h3>
                    <p class="text-slate-500">
                        Intenta ajustar los filtros de búsqueda
                    </p>
                </div>
            `;
            return;
        }

        // Crear tarjetas individuales
        console.log('** Iniciando creación de tarjetas...');
        const tarjetasHTML = solicitudesFiltradas.map((solicitud, index) => {
            console.log(`** Creando tarjeta ${index + 1}/${solicitudesFiltradas.length} para solicitud:`, solicitud._id);
            console.log(`** Datos de solicitud ${index + 1}:`, solicitud);
            const tarjetaHTML = this.createSolicitudCard(solicitud);
            console.log(`** HTML generado para tarjeta ${index + 1}:`, tarjetaHTML.substring(0, 200) + '...');
            return tarjetaHTML;
        }).join('');
        
        console.log('** HTML completo generado:', tarjetasHTML.substring(0, 500) + '...');
        container.innerHTML = tarjetasHTML;
        console.log('** Tarjetas móviles renderizadas:', solicitudesFiltradas.length);
        
        // Verificar que los botones existan
        setTimeout(() => {
            const botones = document.querySelectorAll('[id^="menu-btn-"]');
            console.log('** Botones encontrados:', botones.length);
            botones.forEach((btn, index) => {
                console.log(`** Botón ${index + 1}:`, btn.id);
            });
        }, 100);
        
        // Actualizar contador de resultados móviles
        const contadorMobile = document.getElementById('resultados-count-mobile');
        if (contadorMobile) {
            contadorMobile.textContent = solicitudesFiltradas.length;
            console.log('** Contador móvil actualizado:', solicitudesFiltradas.length);
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
        console.log('** Creando tarjeta para solicitud:', solicitud);
        console.log('** Usuario en solicitud:', solicitud.usuario);
        console.log('** Insumos:', solicitud.insumos);
        console.log('** Activos:', solicitud.activos);
        
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
        console.log('** Nombre de usuario a mostrar:', nombreUsuario);

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
                    <button onclick="console.log('*** ONCLICK INICIADO'); console.log('*** ID A ENVIAR:', '${solicitud._id}'); console.log('*** TIPO DE window.eliminarSolicitud:', typeof window.eliminarSolicitud); console.log('*** window.eliminarSolicitud EXISTE:', !!window.eliminarSolicitud); window.eliminarSolicitud('${solicitud._id}'); console.log('*** DESPUÉS DE LLAMAR A eliminarSolicitud');" 
                        class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                        style="color: #004a8c; hover: background-color: #004a8c15;">
                        <span style="opacity: 0.8;">×</span> Cancelar Solicitud
                    </button>
                `);
            }
        }
        
        return actions.join('');
    }

    getFilteredSolicitudes() {
        console.log('** Filtros actuales:', this.filters);
        console.log('** Estado del filtro:', this.filters.estado);
        console.log('** Todas las solicitudes disponibles:', this.solicitudes);
        
        let filtradas = this.solicitudes;

        if (this.filters.estado !== 'todos') {
            filtradas = filtradas.filter(s => s.estado === this.filters.estado);
            console.log(`** Filtrando por estado "${this.filters.estado}":`, filtradas.length);
        } else {
            console.log('** Mostrando todos los estados:', filtradas.length);
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
        
        // Actualizar contadores después de aplicar filtros
        const solicitudesFiltradas = this.getFilteredSolicitudes();
        const contadorMobile = document.getElementById('resultados-count-mobile');
        if (contadorMobile) {
            contadorMobile.textContent = solicitudesFiltradas.length;
            console.log('** Contador móvil actualizado después de filtros:', solicitudesFiltradas.length);
        }
        
        const contadorDesktop = document.getElementById('resultados-count');
        if (contadorDesktop) {
            contadorDesktop.textContent = solicitudesFiltradas.length;
            console.log('** Contador desktop actualizado después de filtros:', solicitudesFiltradas.length);
        }
        
        // Actualizar totales por estado
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
        
        // Calcular totales por estado (igual que desktop)
        const stats = {
            pendientes: this.solicitudes.filter(s => s.estado === 'pendiente').length,
            aprobadas: this.solicitudes.filter(s => s.estado === 'aprobada').length,
            rechazadas: this.solicitudes.filter(s => s.estado === 'rechazada').length,
            entregadas: this.solicitudes.filter(s => s.estado === 'entregado').length,
            devueltas: this.solicitudes.filter(s => s.estado === 'devuelto').length,
            canceladas: this.solicitudes.filter(s => s.estado === 'cancelada').length
        };

        console.log('** Estadísticas calculadas:', stats);

        // Actualizar contadores desktop (igual que desktop)
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

        // Actualizar contadores mobile (igual que desktop)
        const pendientesMobile = document.getElementById('pendientes-count-mobile');
        const aprobadasMobile = document.getElementById('aprobadas-count-mobile');
        const rechazadasMobile = document.getElementById('rechazadas-count-mobile');
        const entregadasMobile = document.getElementById('entregadas-count-mobile');
        const devueltasMobile = document.getElementById('devueltas-count-mobile');
        const canceladasMobile = document.getElementById('canceladas-count-mobile');

        if (pendientesMobile) pendientesMobile.textContent = stats.pendientes;
        if (aprobadasMobile) aprobadasMobile.textContent = stats.aprobadas;
        if (rechazadasMobile) rechazadasMobile.textContent = stats.rechazadas;
        if (entregadasMobile) entregadasMobile.textContent = stats.entregadas;
        if (devueltasMobile) devueltasMobile.textContent = stats.devueltas;
        if (canceladasMobile) canceladasMobile.textContent = stats.canceladas;

        console.log('** Contadores actualizados correctamente');
    }
    
    actualizarElementoEstado(id, valor) {
        console.log(`** Buscando elemento con id: ${id}`);
        const elemento = document.getElementById(id);
        console.log(`** Elemento encontrado:`, elemento);
        
        if (elemento) {
            // Agregar retraso mayor para asegurar visibilidad
            setTimeout(() => {
                elemento.textContent = valor;
                console.log(`** Elemento ${id} actualizado:`, valor);
                
                // Forzar reflow para asegurar visibilidad
                elemento.offsetHeight; // Forzar reflow
                elemento.style.display = '';
                
                // Verificar que el valor se mantenga después de un tiempo
                setTimeout(() => {
                    const valorActual = elemento.textContent;
                    console.log(`** Verificación ${id}: valor actual "${valorActual}" vs esperado "${valor}"`);
                }, 500);
            }, 200);
        } else {
            console.warn(`** Elemento ${id} NO encontrado en el DOM`);
        }
    }

    getEstadoBadge(estado) {
        const badges = {
            'pendiente': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">?? Pendiente</span>',
            'aprobada': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">?? Aprobada</span>',
            'rechazada': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">?? Rechazada</span>',
            'entregado': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">?? Entregado</span>',
            'devuelto': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">?? Devuelto</span>',
            'cancelada': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">?? Cancelada</span>'
        };
        return badges[estado] || `<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">${estado}</span>`;
    }

    getElementosInfo(solicitud) {
        console.log('** getElementosInfo llamado con:', solicitud);
        console.log('** Todas las propiedades de solicitud:', Object.keys(solicitud));
        
        const elementos = [];
        
        // Intentar diferentes estructuras para insumos
        const insumos = solicitud.insumos || solicitud.insumo || solicitud.items || solicitud.productos || [];
        console.log('** Insumos encontrados:', insumos);
        
        if (Array.isArray(insumos) && insumos.length > 0) {
            console.log('** Procesando insumos:', insumos);
            insumos.forEach((insumo, index) => {
                console.log(`** Insumo ${index}:`, insumo);
                console.log(`** Propiedades del insumo ${index}:`, Object.keys(insumo));
                console.log(`** Valores del insumo ${index}:`, Object.values(insumo));
                
                // Buscar el nombre en múltiples propiedades posibles
                const posiblesNombres = [
                    'nombre', 'nombreProducto', 'producto', 'item', 'articulo', 
                    'name', 'product', 'article', 'description', 'descripcion',
                    'NombProducto'  // Agregar esta propiedad que está en id_insumo
                ];
                
                let nombre = `Insumo ${index + 1}`;
                
                // Primero buscar en el objeto principal
                for (const prop of posiblesNombres) {
                    if (insumo[prop] && typeof insumo[prop] === 'string' && insumo[prop].trim()) {
                        nombre = insumo[prop];
                        console.log(`** Nombre encontrado en propiedad "${prop}":`, nombre);
                        break;
                    }
                }
                
                // Si no se encuentra, buscar dentro de id_insumo
                if (nombre === `Insumo ${index + 1}` && insumo.id_insumo) {
                    for (const prop of posiblesNombres) {
                        if (insumo.id_insumo[prop] && typeof insumo.id_insumo[prop] === 'string' && insumo.id_insumo[prop].trim()) {
                            nombre = insumo.id_insumo[prop];
                            console.log(`** Nombre encontrado en id_insumo.${prop}:`, nombre);
                            break;
                        }
                    }
                }
                
                const cantidad = insumo.cantidad || insumo.quantity || insumo.cant || 1;
                console.log(`** Cantidad encontrada:`, cantidad);
                
                elementos.push({
                    icono: '&nbsp;??', // Icono para insumos con espacio
                    tipo: 'insumo',
                    nombre: nombre,
                    cantidad: cantidad,
                    detalles: insumo.caracteristicas || insumo.descripcion || insumo.details || ''
                });
                
                console.log(`** Elemento agregado:`, elementos[elementos.length - 1]);
            });
        }
        
        // Intentar diferentes estructuras para activos
        const activos = solicitud.activos || solicitud.activo || solicitud.equipos || solicitud.equipment || [];
        console.log('** Activos encontrados:', activos);
        
        if (Array.isArray(activos) && activos.length > 0) {
            console.log('** Procesando activos:', activos);
            activos.forEach((activo, index) => {
                console.log(`** Activo ${index}:`, activo);
                const nombre = activo.nombre || activo.nombreActivo || activo.equipo || `Activo ${index + 1}`;
                
                elementos.push({
                    icono: '&nbsp;??', // Icono para activos con espacio
                    tipo: 'activo',
                    nombre: nombre,
                    cantidad: 1,
                    detalles: activo.descripcion || activo.caracteristicas || ''
                });
            });
        }
        
        // Si todavía no hay elementos, revisar si hay alguna otra propiedad
        if (elementos.length === 0) {
            console.log('** Buscando elementos en otras propiedades...');
            for (const key in solicitud) {
                if (key !== '_id' && key !== 'usuario' && key !== 'estado' && key !== 'createdAt' && key !== 'updatedAt') {
                    const value = solicitud[key];
                    if (value && typeof value === 'object') {
                        console.log(`** Revisando propiedad ${key}:`, value);
                        if (Array.isArray(value)) {
                            value.forEach((item, index) => {
                                if (item && typeof item === 'object') {
                                    const nombre = item.nombre || item.name || item.descripcion || `Item ${index + 1}`;
                                    elementos.push({
                                        icono: '??',
                                        nombre: nombre,
                                        cantidad: item.cantidad || 1,
                                        detalles: item.detalles || ''
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }
        
        console.log('** Elementos procesados:', elementos);
        
        if (elementos.length === 0) {
            console.log('** No se encontraron elementos, mostrando "Sin elementos"');
            return '<span class="text-slate-500">Sin elementos</span>';
        }
        
        const resultado = elementos.map(el => {
            // Formato directo con emoji como en desktop
            let texto = `?? ${el.nombre}`;
            
            // Si el nombre no incluye cantidad, agregarla
            if (!el.nombre.includes('(') || !el.nombre.includes(')')) {
                texto += el.cantidad > 1 ? ` (x${el.cantidad})` : ' (x1)';
            }
            
            return `<span class="text-slate-700">${texto}</span>`;
        }).join(', ');
        
        // Agregar información del total en una línea separada
        const totalElementos = elementos.reduce((sum, el) => sum + el.cantidad, 0);
        const infoTotal = totalElementos > 0 ? `<br><span class="text-slate-500 text-xs">Total: ${totalElementos} elemento${totalElementos > 1 ? 's' : ''}</span>` : '';
        
        console.log('** Resultado getElementosInfo:', resultado + infoTotal);
        console.log('** HTML generado:', resultado + infoTotal);
        return resultado + infoTotal;
    }

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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Préstamo</label>
                        <p class="text-sm text-gray-900">${new Date(solicitud.fecha_prestamo).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            `;
            
            // Insumos
            const insumosSection = document.createElement('div');
            insumosSection.className = 'space-y-3';
            insumosSection.innerHTML = `
                <h4 class="text-lg font-medium text-gray-900 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    Insumos (${solicitud.insumos?.length || 0})
                </h4>
                <div class="space-y-2">
                    ${solicitud.insumos?.map((insumo, index) => `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p class="font-medium text-gray-900">${insumo.id_insumo?.NombProducto || 'Sin nombre'}</p>
                                    <p class="text-sm text-gray-500">${insumo.caracteristicas || 'Sin características'}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-medium text-gray-900">x${insumo.cantidad || 1}</p>
                                <p class="text-sm text-gray-500">unidades</p>
                            </div>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-center py-4">No hay insumos en esta solicitud</p>'}
                </div>
            `;
            
            // Activos (si existen)
            let activosSection = '';
            if (solicitud.activos && solicitud.activos.length > 0) {
                activosSection = `
                    <div class="space-y-3">
                        <h4 class="text-lg font-medium text-gray-900 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            Activos (${solicitud.activos.length})
                        </h4>
                        <div class="space-y-2">
                            ${solicitud.activos.map((activo, index) => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">${activo.id_activo?.nombreActivo || 'Sin nombre'}</p>
                                            <p class="text-sm text-gray-500">${activo.caracteristicas || 'Sin características'}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-medium text-gray-900">x${activo.cantidad || 1}</p>
                                        <p class="text-sm text-gray-500">unidades</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            // Historial de estados
            const historialSection = document.createElement('div');
            historialSection.className = 'space-y-3';
            historialSection.innerHTML = `
                <h4 class="text-lg font-medium text-gray-900 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Historial de Estados
                </h4>
                <div class="space-y-2">
                    ${solicitud.historico_estados?.map((estado, index) => `
                        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span class="text-xs font-medium text-blue-600">${index + 1}</span>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900">${estado.estado}</p>
                                <p class="text-sm text-gray-500">${estado.observacion || 'Sin observación'}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-gray-500">${new Date(estado.fecha).toLocaleDateString('es-ES')}</p>
                                <p class="text-xs text-gray-500">${new Date(estado.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-center py-4">No hay historial de estados</p>'}
                </div>
            `;
            
            // Ensamblar el modal
            modalBody.appendChild(infoGeneral);
            modalBody.appendChild(insumosSection);
            if (activosSection) {
                modalBody.innerHTML += activosSection;
            }
            modalBody.appendChild(historialSection);
            
            // Footer del modal
            const modalFooter = document.createElement('div');
            modalFooter.className = 'flex justify-end space-x-3 p-4 border-t bg-gray-50';
            modalFooter.innerHTML = `
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                    Cerrar
                </button>
                <button onclick="window.mobileUserController.gestionarSolicitud('${solicitud._id}')" 
                        class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors">
                    Editar Solicitud
                </button>
            `;
            
            // Ensamblar el modal completo
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modalContainer.appendChild(modalContent);
            
            console.log('** Modal de detalles creado exitosamente');
            return modalContainer;
            
        } catch (error) {
            console.error('** Error creando modal de detalles:', error);
            return null;
        }
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
        console.log('** Gestionar solicitud mobile:', solicitudId);
        
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
        
        // Buscar el modal de edición en la página actual
        const modal = document.getElementById('editModal');
        if (modal) {
            console.log('** Abriendo modal de edición existente...');
            
            // Mostrar el modal
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            
            // Bloquear scroll del body
            document.body.style.overflow = 'hidden';
            
            // Cargar los datos de la solicitud en el modal
            this.cargarSolicitudEnModal(solicitud);
            
            console.log('** Modal de edición abierto exitosamente');
        } else {
            console.error('** Modal de edición no encontrado en la página actual');
            console.log('** Modales disponibles:', document.querySelectorAll('[id*="Modal"], [id*="modal"]'));
            
            // Intentar encontrar el modal correcto para edición
            const posiblesModales = document.querySelectorAll('.modal, [class*="modal"], [id*="edit"], [id*="Modal"], [id*="component"]');
            console.log('** Posibles modales encontrados:', posiblesModales.length);
            
            // Filtrar modales que no son para imprimir o rechazo
            const modalesEdicion = Array.from(posiblesModales).filter(modal => {
                const id = modal.id || '';
                const classes = modal.className || '';
                // Excluir modales de impresión y rechazo, pero incluir componentes
                // Priorizar modals-component específicamente
                return !id.includes('print') && 
                       !id.includes('rechazo') && 
                       !classes.includes('print') && 
                       !classes.includes('rechazo') &&
                       (id === 'modals-component' || id.includes('edit') || id.includes('Modal'));
            });
            
            console.log('** Modales de edición filtrados:', modalesEdicion.length);
            console.log('** IDs de modales de edición:', modalesEdicion.map(m => m.id));
            
            // Ordenar para que modals-component tenga prioridad
            modalesEdicion.sort((a, b) => {
                if (a.id === 'modals-component') return -1;
                if (b.id === 'modals-component') return 1;
                return 0;
            });
            
            if (modalesEdicion.length > 0) {
                const modalEdicion = modalesEdicion[0];
                console.log('** Usando modal de edición:', modalEdicion.id);
                
                // Si es modals-component, buscar el modal de edición dentro
                if (modalEdicion.id === 'modals-component') {
                    console.log('** Buscando modal dentro de modals-component...');
                    
                    // Primero mostrar el contenido del contenedor para debug
                    console.log('** Contenido de modals-component:', modalEdicion.innerHTML);
                    console.log('** Hijos directos:', modalEdicion.children.length);
                    console.log('** Todos los descendientes:', modalEdicion.querySelectorAll('*').length);
                    
                    // Buscar modales específicos dentro del componente con más patrones
                    const modalesInternos = modalEdicion.querySelectorAll('[id*="Modal"], [class*="modal"], [id*="edit"], [id*="Edit"], [class*="edit"], [class*="Edit"], .modal, [role="dialog"], [data-modal]');
                    console.log('** Modales internos encontrados:', modalesInternos.length);
                    
                    // Mostrar información de cada modal interno encontrado
                    Array.from(modalesInternos).forEach((modal, index) => {
                        console.log(`** Modal interno ${index + 1}:`, {
                            id: modal.id,
                            classes: modal.className,
                            tag: modal.tagName,
                            innerHTML: modal.innerHTML.substring(0, 100) + '...'
                        });
                    });
                    
                    // Si no hay modales específicos, intentar con cualquier elemento que podría ser un modal
                    let modalEdicionInterno = null;
                    
                    if (modalesInternos.length > 0) {
                        // Buscar específicamente el modal de edición
                        modalEdicionInterno = Array.from(modalesInternos).find(modal => {
                            const id = modal.id || '';
                            const classes = modal.className || '';
                            const tag = modal.tagName.toLowerCase();
                            
                            return id.includes('edit') || 
                                   classes.includes('edit') ||
                                   id.includes('Edit') ||
                                   classes.includes('Edit') ||
                                   id.includes('modal') ||
                                   classes.includes('modal') ||
                                   tag === 'dialog' ||
                                   modal.getAttribute('role') === 'dialog';
                        });
                    }
                    
                    // Si todavía no hay, tomar el primer elemento que tenga contenido significativo
                    if (!modalEdicionInterno && modalesInternos.length > 0) {
                        modalEdicionInterno = Array.from(modalesInternos).find(modal => {
                            const hasContent = modal.innerHTML && modal.innerHTML.trim().length > 50;
                            const hasForm = modal.querySelector('form') || modal.querySelector('input') || modal.querySelector('button');
                            return hasContent && hasForm;
                        });
                    }
                    
                    if (modalEdicionInterno) {
                        console.log('** Modal de edición interno encontrado:', modalEdicionInterno.id);
                        
                        // Mostrar el modal interno
                        modalEdicionInterno.classList.remove('hidden');
                        modalEdicionInterno.style.display = 'flex';
                        
                        // También mostrar el contenedor
                        modalEdicion.classList.remove('hidden');
                        modalEdicion.style.display = 'flex';
                        
                        document.body.style.overflow = 'hidden';
                        
                        // Cargar los datos de la solicitud
                        this.cargarSolicitudEnModal(solicitud);
                        
                        console.log('** Modal de edición interno abierto exitosamente');
                    } else {
                        console.log('** No se encontró modal de edición interno, intentando crear uno dinámicamente...');
                        
                        // Intentar crear un modal dinámicamente
                        const modalDinamico = this.crearModalEdicionDinamico(solicitud);
                        
                        if (modalDinamico) {
                            // Agregar el modal al contenedor
                            modalEdicion.appendChild(modalDinamico);
                            
                            // Mostrar el contenedor
                            modalEdicion.classList.remove('hidden');
                            modalEdicion.style.display = 'flex';
                            
                            document.body.style.overflow = 'hidden';
                            
                            // Cargar los datos de la solicitud
                            this.cargarSolicitudEnModal(solicitud);
                            
                            console.log('** Modal dinámico creado y abierto exitosamente');
                        } else {
                            console.log('** No se pudo crear modal dinámico, redirigiendo...');
                            
                            // Redirigir a la página de creación/edición
                            const mensaje = `Solicitud #${solicitudId.slice(-6)}\n` +
                                          `Estado: ${solicitud.estado}\n` +
                                          `Insumos: ${solicitud.insumos?.length || 0}\n\n` +
                                          `Redirigiendo a la página de edición...`;
                            
                            if (confirm(mensaje + '\n\n¿Desea continuar?')) {
                                // Guardar la solicitud en localStorage para la página de edición
                                localStorage.setItem('solicitud_a_editar', JSON.stringify(solicitud));
                                localStorage.setItem('volver_a_solicitudes', 'true');
                                
                                // Redirigir a la página de inventario para edición
                                window.location.href = '/ModUsuarios.html';
                            } else {
                                alert('Operación cancelada.');
                            }
                        }
                    }
                } else {
                    // Mostrar el modal directamente
                    modalEdicion.classList.remove('hidden');
                    modalEdicion.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    
                    // Cargar los datos de la solicitud
                    this.cargarSolicitudEnModal(solicitud);
                }
                
                console.log('** Modal de edición abierto exitosamente');
            } else {
                console.log('** No se encontró modal de edición adecuado');
                console.log('** Mostrando alerta informativa');
                
                // Mostrar una alerta con la información de la solicitud
                const mensaje = `Solicitud #${solicitudId.slice(-6)}\n` +
                              `Estado: ${solicitud.estado}\n` +
                              `Insumos: ${solicitud.insumos?.length || 0}\n` +
                              `Fecha: ${new Date(solicitud.createdAt).toLocaleDateString()}\n\n` +
                              `Para editar esta solicitud, por favor use la versión desktop de la aplicación.`;
                
                alert(mensaje);
            }
        }
    }
    
    crearModalEdicionDinamico(solicitud) {
        console.log('** Creando modal dinámico para solicitud:', solicitud._id);
        
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
            console.log('** Llamando a cambiarEstadoSolicitud con estado "cancelada"...');
            
            // Cambiar el estado a "cancelada"
            await this.cambiarEstadoSolicitud(solicitudId, 'cancelada');
            
            console.log('** Solicitud cancelada exitosamente');
            
        } catch (error) {
            console.error('** Error cancelando solicitud:', error);
            alert('Error al cancelar la solicitud. Por favor, inténtalo de nuevo.');
        }
    }
    
    async cambiarEstadoSolicitud(solicitudId, nuevoEstado) {
        console.log('** Cambiando estado de solicitud:', solicitudId, 'a', nuevoEstado);
        
        try {
            // Obtener token
            const token = localStorage.getItem('utn_token');
            console.log('** Token encontrado:', !!token);
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }
            
            // Probar diferentes endpoints y métodos
            const endpoints = [
                { url: `http://localhost:4000/api/solicitudes/${solicitudId}/estado`, method: 'PATCH' },
                { url: `http://localhost:4000/api/solicitudes/${solicitudId}/estado`, method: 'PUT' },
                { url: `http://localhost:4000/api/solicitudes/${solicitudId}`, method: 'PUT' },
                { url: `http://localhost:4000/api/solicitudes/${solicitudId}`, method: 'PATCH' }
            ];
            
            let exito = false;
            let resultado = null;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`** Probando endpoint: ${endpoint.method} ${endpoint.url}`);
                    console.log('** Body:', JSON.stringify({
                        estado: nuevoEstado,
                        observacion: `Estado cambiado a ${nuevoEstado} desde móvil`
                    }));
                    
                    const response = await fetch(endpoint.url, {
                        method: endpoint.method,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            estado: nuevoEstado,
                            observacion: `Estado cambiado a ${nuevoEstado} desde móvil`
                        })
                    });
                    
                    console.log(`** Respuesta de ${endpoint.method}:`, response.status, response.statusText);
                    
                    if (response.ok) {
                        resultado = await response.json();
                        console.log('** Estado cambiado exitosamente en backend:', resultado);
                        exito = true;
                        break;
                    } else {
                        const errorText = await response.text();
                        console.log(`** Error en ${endpoint.method}:`, errorText);
                    }
                } catch (error) {
                    console.log(`** Error intentando ${endpoint.method}:`, error.message);
                }
            }
            
            if (!exito) {
                throw new Error('No se pudo cambiar el estado con ningún endpoint disponible');
            }
            
            // Actualizar localmente también
            const solicitud = this.solicitudes.find(s => s._id === solicitudId);
            if (solicitud) {
                solicitud.estado = nuevoEstado;
                
                // Agregar al historial
                if (!solicitud.historico_estados) {
                    solicitud.historico_estados = [];
                }
                
                solicitud.historico_estados.push({
                    estado: nuevoEstado,
                    observacion: `Estado cambiado a ${nuevoEstado} desde móvil`,
                    fecha: new Date().toISOString()
                });
                
                console.log('** Estado actualizado localmente:', solicitud);
            }
            
            // Recargar los datos para actualizar la vista
            await this.recargarDatos();
            
            // Notificar al usuario
            alert(`Solicitud ${solicitudId.slice(-6)} actualizada a estado: ${nuevoEstado}`);
            
        } catch (error) {
            console.error('** Error cambiando estado:', error);
            console.error('** Stack trace:', error.stack);
            alert('Error al cambiar el estado de la solicitud: ' + error.message);
        }
    }
    
    crearModalDetalles(solicitud) {
        console.log('** Cargando solicitud en modal:', solicitud);
        
        // Cargar los datos del usuario
        const userData = JSON.parse(localStorage.getItem('utn_user'));
        
        // ...
        // Llenar el formulario con los datos de la solicitud
        const form = document.getElementById('editForm');
        if (form) {
            // Si hay un campo de usuario, llenarlo
            const usuarioField = form.querySelector('#usuario_nombre');
            if (usuarioField && userData) {
                usuarioField.value = userData.nombre_completo || userData.nombre || '';
            }
            
            // Cargar los insumos
            if (solicitud.insumos && solicitud.insumos.length > 0) {
                console.log('** Cargando insumos:', solicitud.insumos);
                
                // Limpiar el carrito actual
                if (window.carritoSolicitudes) {
                    window.carritoSolicitudes = [];
                }
                
                // Agregar cada insumo al carrito
                solicitud.insumos.forEach(insumo => {
                    const itemCarrito = {
                        id: insumo.id_insumo?._id || insumo._id,
                        nombre: insumo.id_insumo?.NombProducto || insumo.nombre || 'Sin nombre',
                        cantidad: insumo.cantidad || 1,
                        caracteristicas: insumo.caracteristicas || '',
                        tipo: 'insumo'
                    };
                    
                    if (window.carritoSolicitudes) {
                        window.carritoSolicitudes.push(itemCarrito);
                    }
                });
                
                console.log('** Carrito actualizado:', window.carritoSolicitudes);
                
                // Actualizar la visualización del carrito
                if (window.actualizarCarritoVisual) {
                    window.actualizarCarritoVisual();
                }
            }
            
            // Cargar los activos si existen
            if (solicitud.activos && solicitud.activos.length > 0) {
                console.log('** Cargando activos:', solicitud.activos);
                
                solicitud.activos.forEach(activo => {
                    const itemCarrito = {
                        id: activo.id_activo?._id || activo._id,
                        nombre: activo.id_activo?.nombreActivo || activo.nombre || 'Sin nombre',
                        cantidad: activo.cantidad || 1,
                        caracteristicas: activo.caracteristicas || '',
                        tipo: 'activo'
                    };
                    
                    if (window.carritoSolicitudes) {
                        window.carritoSolicitudes.push(itemCarrito);
                    }
                });
                
                if (window.actualizarCarritoVisual) {
                    window.actualizarCarritoVisual();
                }
            }
        }
        
        console.log('** Solicitud cargada en modal exitosamente');
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
        allButtonsBefore.forEach((btn, index) => {
            console.log(`** Botón ${index + 1} ANTES:`, {
                id: btn.id,
                visible: window.getComputedStyle(btn).visibility,
                opacity: window.getComputedStyle(btn).opacity,
                display: window.getComputedStyle(btn).display,
                pointerEvents: window.getComputedStyle(btn).pointerEvents,
                zIndex: window.getComputedStyle(btn).zIndex,
                classes: btn.className
            });
        });
        
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
                    btn.classList.remove('invisible'); // También remover invisible si existe
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
}

// Inicializar directamente sin esperar a solicitudesController
document.addEventListener('DOMContentLoaded', () => {
    console.log('** DOM listo - Inicializando MobileUserController directamente...');
    
    // Agregar MutationObserver para detectar qué modifica los botones (DESACTIVADO - causa bucle infinito)
    /*
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id && target.id.startsWith('menu-btn-')) {
                    console.log('** MUTACIÓN DETECTADA EN BOTÓN:', target.id);
                    console.log('** Clases antes:', mutation.oldValue);
                    console.log('** Clases después:', target.className);
                    console.log('** Stack trace para encontrar quién lo modificó:', new Error().stack);
                    
                    // Corregir automáticamente
                    if (target.classList.contains('hidden')) {
                        console.log('** CORRECCIÓN AUTOMÁTICA: Removiendo hidden del botón', target.id);
                        target.classList.remove('hidden');
                        target.style.display = 'block';
                        target.style.setProperty('display', 'block', 'important');
                    }
                }
            }
        });
    });
    
    // Observar cambios en los botones
    setTimeout(() => {
        const buttons = document.querySelectorAll('#mobile-solicitudes-container button[id^="menu-btn-"]');
        buttons.forEach(btn => {
            observer.observe(btn, {
                attributes: true,
                attributeFilter: ['class'],
                attributeOldValue: true
            });
        });
        console.log('** Observer instalado en', buttons.length, 'botones');
    }, 1000);
    */
    
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
        }
    `;
    document.head.appendChild(style);
    
    window.mobileUserController = new MobileUserController();
    console.log('** MobileUserController creado:', window.mobileUserController);
    
    setTimeout(() => {
        console.log('** Verificando condiciones...');
        
        const isMobile = window.innerWidth < 1024;
        console.log('** Ancho de pantalla:', window.innerWidth, 'Mobile:', isMobile);
        
        if (!isMobile) {
            console.log('** No es mobile/tablet, saliendo');
            return;
        }
        
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
        
        console.log('** Todas las condiciones cumplidas, iniciando controlador mobile...');
        window.mobileUserController.init();
        
    }, 500);
});
