/**
* Controlador Mobile para Usuarios (Docentes y Estudiantes)
* Maneja la lógica específica para usuarios no administradores en dispositivos móviles
* Depende de solicitudes.js para funciones compartidas
*/

class MobileUserController {
    constructor() {
        this.solicitudes = [];
        this.filters = {
            busqueda: '',
            estado: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.init();
    }

    init() {
        console.log('** Inicializando MobileUserController...');
        
        // Verificar si estamos en mobile/tablet
        if (window.innerWidth >= 1024) {
            console.log('** No es mobile/tablet, saliendo...');
            return;
        }

        // Verificar usuario
        const userData = localStorage.getItem('utn_user');
        if (!userData) {
            console.log('** No hay datos de usuario');
            return;
        }

        const currentUser = JSON.parse(userData);
        const rol = currentUser?.rol || currentUser?.rol_nombre || '';
        const rolText = rol.toLowerCase();
        
        // Verificar si es administrador
        if (rolText.includes('admin') || rolText.includes('administrador')) {
            console.log('** Usuario es administrador, no se inicia controlador mobile');
            return;
        }

        console.log('** Usuario válido, tomando control completo del DOM...');
        
        // Ocultar completamente la tabla desktop
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
        
        // También ocultar headers desktop si existen
        const desktopHeaders = document.querySelectorAll('.hidden.lg\\:block');
        desktopHeaders.forEach(header => {
            header.style.display = 'none';
        });
        
        this.setupEventListeners();
        this.loadUserSolicitudes();
    }

    setupEventListeners() {
        // Búsqueda
        const busquedaInput = document.getElementById('busqueda-input');
        if (busquedaInput) {
            busquedaInput.addEventListener('input', (e) => {
                this.filters.busqueda = e.target.value;
                this.applyFilters();
            });
        }

        // Estado
        const estadoSelect = document.getElementById('estado-filter');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', (e) => {
                this.filters.estado = e.target.value;
                this.applyFilters();
            });
        }

        // Botón limpiar filtros
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        console.log(' Event listeners configurados');
    }

    async loadUserSolicitudes() {
        try {
            console.log(' Cargando solicitudes del usuario...');
            
            const userData = localStorage.getItem('utn_user');
            const currentUser = JSON.parse(userData);
            
            const token = localStorage.getItem('utn_token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            // Cargar todas las solicitudes (como lo hace solicitudes.html)
            const response = await fetch('http://localhost:4000/api/solicitudes', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            let todasLasSolicitudes = Array.isArray(data) ? data : (data.solicitudes || data.data || []);
            
            // Filtrar por usuario actual
            const nombreUsuario = currentUser.nombre_completo || currentUser.nombre || '';
            const emailUsuario = currentUser.email || currentUser.correo_electronico || currentUser.correo || '';
            
            this.solicitudes = todasLasSolicitudes.filter(solicitud => {
                const solicitudUsuario = solicitud.usuario?.nombre_completo || solicitud.usuario?.nombre || '';
                const solicitudEmail = solicitud.usuario?.email || solicitud.usuario?.correo_electronico || solicitud.usuario?.correo || '';
                return solicitudUsuario === nombreUsuario || solicitudEmail === emailUsuario;
            });

            console.log(` Se encontraron ${this.solicitudes.length} solicitudes para este usuario`);
            this.renderSolicitudes();
            this.updateStatistics();
            
        } catch (error) {
            console.error(' Error cargando solicitudes:', error);
            this.showError('Error al cargar las solicitudes: ' + error.message);
        }
    }

    renderSolicitudes() {
        const container = document.getElementById('mobile-solicitudes-container');
        if (!container) {
            console.error('Error: No se encontró el contenedor mobile');
            return;
        }

        console.log(`Renderizando ${this.solicitudes.length} solicitudes...`);
        
        // Ajustar altura del contenedor para que no se corte
        container.style.minHeight = 'calc(100vh - 200px)';
        container.style.maxHeight = 'calc(100vh - 120px)';
        container.style.overflowY = 'auto';
        
        // Limpiar contenedor
        container.innerHTML = '';

        if (this.solicitudes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 sm:py-8 px-4">
                    <div class="flex flex-col items-center gap-3 sm:gap-4">
                        <span class="text-3xl sm:text-4xl"></span>
                        <p class="text-base sm:text-lg font-medium text-slate-700">No tienes solicitudes</p>
                        <p class="text-sm sm:text-base text-slate-500">Crea tu primera solicitud para comenzar</p>
                    </div>
                </div>
            `;
            return;
        }

        // Renderizar solicitudes
        const solicitudesFiltradas = this.filtrarSolicitudes();
        solicitudesFiltradas.forEach((solicitud, index) => {
            const cardHTML = this.createSolicitudCard(solicitud, index);
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

        console.log('Renderizado completado');
    }

    createSolicitudCard(solicitud, index) {
        const usuario = JSON.parse(localStorage.getItem('utn_user'));
        const rol = usuario?.rol || usuario?.rol_nombre || 'estudiante';
        const rolText = rol.toLowerCase();
        const esEstudiante = rolText.includes('estudiante');
        const esDocente = rolText.includes('docente') || rolText.includes('profesor');
        
        // Determinar colores según rol
        let rolColor = '#000000'; // Negro para todos
        let rolBgGradient = 'linear-gradient(135deg, rgba(229, 220, 220, 0) 0%, rgba(132, 128, 128, 0) 100%)';
        let rolIcono = '';
        
        if (esDocente) {
            rolColor = '#000000'; // Negro también para docentes
            rolBgGradient = 'linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(51, 51, 51, 0) 100%)';
            rolIcono = '‍';
        }

        return `
            <div class="bg-white rounded-lg shadow-md border border-slate-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">
                <!-- Header de la tarjeta -->
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-base sm:text-lg">${rolIcono}</span>
                            <div>
                                <div class="font-bold text-xs sm:text-xs" style="color: #004a8c;">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                                <div class="text-xs sm:text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                            </div>
                        </div>
                        <div class="text-right sm:text-left mt-2 sm:mt-0">
                            <div class="text-slate-500 text-xs sm:text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</div>
                            <div class="mt-1">${this.getEstadoBadge(solicitud.estado)}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Contenido principal -->
                <div class="space-y-2 sm:space-y-3">
                    <div class="text-xs sm:text-sm text-slate-700">
                        ${this.getElementosInfo(solicitud)}
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="flex justify-end mt-2 sm:mt-3">
                        <div class="relative">
                            <button 
                                onclick="window.mobileUserController.toggleMenu('${solicitud._id}')" 
                                class="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                style="background: ${rolBgGradient}; color: black; box-shadow: 0 2px 8px ${rolColor}40;">
                                <span class="text-sm sm:text-base">⋮</span>
                            </button>
                            <div id="menu-${solicitud._id}" class="hidden absolute right-0 sm:right-4 mt-1 sm:mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-lg border" style="border-color: #000000; z-index: 1000;">
                                <!-- Acciones según rol y estado -->
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

        // Acción Ver (siempre disponible)
        actions.push(`
            <button onclick="window.mobileUserController.verDetalles('${solicitud._id}')" 
                class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                style="color: #004a8c; hover: background-color: #004a8c15;">
                <span class="text-xs sm:text-sm">️</span> Ver Detalles
            </button>
        `);

        // Acciones según rol y estado
        if (esEstudiante || esDocente) {
            if (estado === 'pendiente') {
                actions.push(`
                    <button onclick="window.mobileUserController.gestionarSolicitud('${solicitud._id}')" 
                        class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                        style="color: #004a8c; hover: background-color: #004a8c15;">
                        <span class="text-xs sm:text-sm">️</span> Editar Solicitud
                    </button>
                `);
            }
            if (estado === 'pendiente' || estado === 'aprobada') {
                actions.push(`
                    <button onclick="window.eliminarSolicitud('${solicitud._id}')" 
                        class="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                        style="color: #004a8c; hover: background-color: #004a8c15;">
                        <span class="text-xs sm:text-sm opacity-80">×</span> Cancelar Solicitud
                    </button>
                `);
            }
        }
        
        return actions.join('');
    }

    updateStatistics() {
        const stats = {
            pendientes: this.solicitudes.filter(s => s.estado === 'pendiente').length,
            aprobadas: this.solicitudes.filter(s => s.estado === 'aprobada').length,
            entregadas: this.solicitudes.filter(s => s.estado === 'entregado').length,
            devueltas: this.solicitudes.filter(s => s.estado === 'devuelto').length
        };

        // Actualizar contadores mobile
        const pendientesMobile = document.getElementById('pendientes-count-mobile');
        const aprobadasMobile = document.getElementById('aprobadas-count-mobile');
        const entregadasMobile = document.getElementById('entregadas-count-mobile');
        const devueltasMobile = document.getElementById('devueltas-count-mobile');

        if (pendientesMobile) pendientesMobile.textContent = stats.pendientes;
    }

    return `
        <div class="bg-white rounded-lg shadow-md border border-slate-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">
            <!-- Header de la tarjeta -->
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-base sm:text-lg">${rolIcono}</span>
                        <div>
                            <div class="font-bold text-xs sm:text-xs" style="color: #004a8c;">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                            <div class="text-xs sm:text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                        </div>
                    </div>
                    <div class="text-right sm:text-left mt-2 sm:mt-0">
                        <div class="text-slate-500 text-xs sm:text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</div>
                        <div class="mt-1">${this.getEstadoBadge(solicitud.estado)}</div>
                    </div>
                </div>
            </div>

            <!-- Contenido principal -->
            <div class="space-y-2 sm:space-y-3">
                <div class="text-xs sm:text-sm text-slate-700">
                    ${this.getElementosInfo(solicitud)}
                </div>

                <!-- Botones de acción -->
                <div class="flex justify-end mt-2 sm:mt-3">
                    <div class="relative">
                        <button 
                            onclick="window.mobileUserController.toggleMenu('${solicitud._id}')" 
                            class="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                            style="background: ${rolBgGradient}; color: black; box-shadow: 0 2px 8px ${rolColor}40;">
                            <span class="text-sm sm:text-base">⋮</span>
                        </button>
                        <div id="menu-${solicitud._id}" class="hidden absolute right-0 sm:right-4 mt-1 sm:mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-lg border" style="border-color: #000000; z-index: 1000;">
                            <!-- Acciones según rol y estado -->
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
                const textoFila = `${solicitud.usuario?.nombre_completo || ''} ${solicitud._id || ''} ${this.getElementosInfo(solicitud) || ''}`.toLowerCase();
                return textoFila.includes(this.filters.busqueda.toLowerCase());
            });
        }

        return filtradas;
    }

    applyFilters() {
        this.renderSolicitudes();
    }

    clearFilters() {
        this.filters = {
            busqueda: '',
            estado: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };

        const estadoFilter = document.getElementById('estado-filter');
        if (estadoFilter) estadoFilter.value = 'todos';

        this.applyFilters();
        this.showToast(' Filtros limpiados', 'success');
    }

    toggleMenu(solicitudId) {
        const menu = document.getElementById(`menu-${solicitudId}`);
        const allMenus = document.querySelectorAll('[id^="menu-"]');

        // Cerrar otros menús
        allMenus.forEach(m => {
            if (m.id !== `menu-${solicitudId}`) {
                m.classList.add('hidden');
            }
        });

        // Toggle menú actual
        menu.classList.toggle('hidden');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Usar showToast de solicitudes.js si está disponible
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
        } else if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // Fallback propio
            console.log(`Toast (${type}): ${message}`);
            const toast = document.getElementById('toast');
            if (toast) {
                const toastMsg = document.getElementById('toastMsg');
                if (toastMsg) toastMsg.textContent = message;
                toast.classList.remove('opacity-0', 'translate-y-20');
                toast.classList.add('opacity-100', 'translate-y-0');
                setTimeout(() => {
                    toast.classList.add('opacity-0', 'translate-y-20');
                    toast.classList.remove('opacity-100', 'translate-y-0');
                }, 3000);
            }
        }
    }
}

// No crear instancia inmediatamente, esperar a que el DOM esté listo
window.mobileUserController = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log(' DOM listo - Inicializando MobileUserController...');
    
    // Esperar a que solicitudesController esté disponible
    const waitForSolicitudesController = () => {
        if (window.solicitudesController) {
            console.log(' SolicitudesController disponible, creando MobileUserController...');
            
            // Agregar estilos CSS para asegurar altura completa
            const style = document.createElement('style');
            style.textContent = `
                #mobile-solicitudes-container {
                    min-height: calc(100vh - 180px) !important;
                    max-height: calc(100vh - 100px) !important;
                    overflow-y: auto !important;
                    padding-bottom: 20px !important;
                }
                
                @media (max-width: 640px) {
                    #mobile-solicitudes-container {
                        min-height: calc(100vh - 160px) !important;
                    }
                }
            }
        }
    `;
    document.head.appendChild(style);
    
    // Agregar estilos CSS para asegurar altura completa
    const style2 = document.createElement('style');
    style2.textContent = `
        @media (max-width: 1023px) {
            #mobile-solicitudes-container {
                min-height: calc(100vh - 200px) !important;
                max-height: calc(100vh - 200px) !important;
                overflow-y: auto !important;
            }
        }
    `;
    document.head.appendChild(style2);
    
    // Crear instancia del controlador móvil
    window.mobileUserController = new MobileUserController();
    console.log('** MobileUserController creado:', window.mobileUserController);
    
    // Inicializar directamente si es mobile/tablet
    setTimeout(() => {
        console.log('** Verificando condiciones...');
        
        // Verificar ancho de pantalla
        const isMobile = window.innerWidth < 1024;
        console.log('** Ancho de pantalla:', window.innerWidth, 'Mobile:', isMobile);
        
        if (!isMobile) {
            console.log('** No es mobile/tablet, saliendo');
            return;
        }
        
        // Verificar usuario
        const userData = localStorage.getItem('utn_user');
        console.log('** Datos de usuario encontrados:', !!userData);
        
        if (!userData) {
            console.log('** No hay datos de usuario, saliendo');
            return;
        }
        
        const currentUser = JSON.parse(userData);
        const rol = currentUser?.rol || currentUser?.rol_nombre || '';
        const rolText = rol.toLowerCase();
        
        // Verificar si es administrador
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