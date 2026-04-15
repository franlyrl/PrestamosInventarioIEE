// Controlador móvil para administradores
class MobileAdminController {
    constructor() {
        this.solicitudes = [];
        this.allSolicitudes = [];
        this.filtros = {
            busqueda: '',
            estado: 'todos',
            tipo: 'todos', // activos, insumos, todos
            usuario: 'todos', // filtro por usuario específico
            fechaDesde: '',
            fechaHasta: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    init() {
        console.log('** Inicializando MobileAdminController...');
        console.log('** Ancho de pantalla:', window.innerWidth);
        
        // Para admin, permitir funcionamiento en desktop también
        // Solo salir si no es admin y no es móvil
        const userData = localStorage.getItem('utn_user');
        if (!userData) {
            console.log('** No hay datos de usuario');
            return;
        }

        const currentUser = JSON.parse(userData);
        const rol = currentUser?.tipo_rol || currentUser?.rol || currentUser?.rol_nombre || '';
        const rolText = rol.toLowerCase();
        const esAdmin = rolText.includes('admin') || rolText.includes('administrador') || rolText.includes('estudiante');
        
        if (!esAdmin && window.innerWidth >= 1024) {
            console.log('** No es administrador y es desktop, saliendo...');
            return;
        }

        console.log('** Usuario administrador válido, tomando control completo del DOM...');
        
        const tableContainer = document.querySelector('.overflow-x-auto');
        const tbody = document.getElementById('solicitudes-tbody');
        const mobileContainer = document.getElementById('mobile-solicitudes-container');
        
        if (window.innerWidth >= 1024) {
            // En desktop: Usar la tabla existente pero con control del admin
            console.log('** Modo desktop - usando tabla existente');
            if (mobileContainer) {
                mobileContainer.style.display = 'none';
                console.log('** Contenedor móvil oculto en desktop');
            }
            if (tableContainer) {
                tableContainer.style.display = 'block';
                console.log('** Tabla desktop visible en modo admin');
            }
        } else {
            // En móvil: Usar el contenedor móvil
            console.log('** Modo móvil - usando contenedor móvil');
            if (tableContainer) {
                tableContainer.style.display = 'none';
                console.log('** Tabla desktop oculta en móvil');
            }
            if (mobileContainer) {
                mobileContainer.style.display = 'block';
                console.log('** Contenedor móvil visible en modo admin');
            }
        }         
         
        this.setupEventListeners();
        this.loadSolicitudes();
    }

    setupEventListeners() {
        const busquedaInput = document.getElementById('busqueda-input');
        if (busquedaInput) {
            busquedaInput.addEventListener('input', (e) => {
                this.filtros.busqueda = e.target.value;
                this.applyFilters();
            });
        }

        const estadoSelect = document.getElementById('estado-filter');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', (e) => {
                this.filtros.estado = e.target.value;
                this.applyFilters();
            });
        }

        const tipoSelect = document.getElementById('tipo-filter');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', (e) => {
                this.filtros.tipo = e.target.value;
                this.applyFilters();
            });
        }

        const usuarioSelect = document.getElementById('usuario-filter');
        if (usuarioSelect) {
            usuarioSelect.addEventListener('change', (e) => {
                this.filtros.usuario = e.target.value;
                this.applyFilters();
            });
        }

        const limpiarBtn = document.getElementById('clear-filters-btn');
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
        }

        // Fechas
        const fechaDesde = document.getElementById('fecha-desde');
        const fechaHasta = document.getElementById('fecha-hasta');

        if (fechaDesde) {
            fechaDesde.addEventListener('change', (e) => {
                this.filtros.fechaDesde = e.target.value;
                this.applyFilters();
            });
        }

        if (fechaHasta) {
            fechaHasta.addEventListener('change', (e) => {
                this.filtros.fechaHasta = e.target.value;
                this.applyFilters();
            });
        }
    }

    async loadSolicitudes() {
        try {
            console.log('** Recargando solicitudes para admin móvil...');

            // Obtener token de autenticación
            const token = localStorage.getItem('utn_token');
            if (!token) {
                console.error('** No hay token de autenticación');
                alert('Error: No tienes sesión activa');
                return;
            }

            // Cargar TODAS las solicitudes del sistema (para administradores)
            const response = await fetch('http://localhost:4000/api/solicitudes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('** Response status loadSolicitudes:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('** Error cargando solicitudes:', errorText);
                alert('Error al cargar solicitudes');
                return;
            }

            const data = await response.json();
            console.log('** Datos recibidos del backend:', data);
            console.log('** Estructura de datos:', JSON.stringify(data, null, 2));
            
            // Verificar la estructura de los datos
            this.solicitudes = data.data || data;
            this.allSolicitudes = [...this.solicitudes];
            
            // Logging detallado de cada solicitud
            console.log('** Solicitudes actualizadas:', this.solicitudes.length);
            this.solicitudes.forEach((solicitud, index) => {
                console.log(`** Solicitud ${index + 1}:`, {
                    id: solicitud._id,
                    estado: solicitud.estado,
                    usuario: solicitud.usuario?.nombre_completo,
                    objetoCompleto: solicitud
                });
            });

            // Renderizar solicitudes con datos actualizados
            this.renderSolicitudes();
            this.updateEstadisticas();
            this.populateUsuarioFilter();

            console.log('** Admin mobile controller recargó y renderizó correctamente');

        } catch (error) {
            console.error('** Error recargando solicitudes:', error);
            alert('Error al recargar solicitudes: ' + error.message);
        }
    }

    renderSolicitudes() {
        console.log('** renderSolicitudes() llamado en admin móvil...');
        
        const isDesktop = window.innerWidth >= 1024;
        console.log('** Modo de renderización:', isDesktop ? 'desktop' : 'móvil');
        
        if (isDesktop) {
            // En desktop: renderizar en la tabla
            this.renderDesktopTable();
        } else {
            // En móvil: renderizar tarjetas
            this.renderMobileCards();
        }
    }

    renderDesktopTable() {
        console.log('** Renderizando tabla desktop para admin...');
        const tbody = document.getElementById('solicitudes-tbody-desktop');
        
        if (!tbody) {
            console.error('** No se encontró tbody de tabla desktop');
            return;
        }
        
        const solicitudesFiltradas = this.getFilteredSolicitudes();
        console.log('** Solicitudes filtradas para tabla:', solicitudesFiltradas.length);
        
        if (solicitudesFiltradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-slate-500">
                        <div class="text-6xl mb-4"></div>
                        <h3 class="text-xl font-semibold text-slate-700 mb-2">No hay solicitudes</h3>
                        <p class="text-sm text-slate-500">No se encontraron solicitudes con los filtros actuales</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        const rowsHTML = solicitudesFiltradas.map((solicitud, index) => {
            console.log(`** Creando fila ${index + 1}/${solicitudesFiltradas.length} para solicitud:`, solicitud._id);
            return this.createDesktopRow(solicitud);
        }).join('');
        
        tbody.innerHTML = rowsHTML;
        console.log('** Tabla desktop renderizada:', solicitudesFiltradas.length);
        this.updateEstadisticas();
    }

    renderMobileCards() {
        console.log('** Renderizando tarjetas móviles para admin...');
        const container = document.getElementById('mobile-solicitudes-container');
        
        if (!container) {
            console.error('** No se encontró contenedor mobile');
            return;
        }
        
        console.log('** Contenedor encontrado:', container);
        console.log('** Contenedor visible?:', window.getComputedStyle(container).display !== 'none');
        console.log('** Contenedor HTML antes:', container.innerHTML.substring(0, 200) + '...');
        
        const solicitudesFiltradas = this.getFilteredSolicitudes();
        console.log('** Solicitudes filtradas para renderizar:', solicitudesFiltradas.length);
        
        if (solicitudesFiltradas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4"></div>
                    <h3 class="text-xl font-semibold text-slate-700 mb-2">No hay solicitudes</h3>
                    <p class="text-sm text-slate-500">No se encontraron solicitudes con los filtros actuales</p>
                </div>
            `;
            return;
        }

        console.log('** Renderizando solicitudes móviles para admin...');
        
        // Crear tarjetas individuales
        const tarjetasHTML = solicitudesFiltradas.map((solicitud, index) => {
            console.log(`** Creando tarjeta ${index + 1}/${solicitudesFiltradas.length} para solicitud:`, solicitud._id);
            const tarjetaHTML = this.createSolicitudCardV2(solicitud);
            return tarjetaHTML;
        }).join('');
        
        console.log('** HTML generado (primeros 200 chars):', tarjetasHTML.substring(0, 200) + '...');
        console.log('** Longitud total del HTML:', tarjetasHTML.length);
        
        container.innerHTML = tarjetasHTML;
        console.log('** Tarjetas móviles admin renderizadas:', solicitudesFiltradas.length);
        console.log('** Contenedor HTML después:', container.innerHTML.substring(0, 200) + '...');
        
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
        this.updateEstadisticas();
    }

    createDesktopRow(solicitud) {
        const estadoBadge = this.getEstadoBadge(solicitud.estado);
        const nombreUsuario = solicitud.usuario?.nombre_completo || 'Usuario desconocido';
        const elementosInfo = this.getElementosInfo(solicitud);
        const fecha = new Date(solicitud.createdAt).toLocaleDateString();
        
        return `
            <tr class="hover:bg-slate-50 relative">
                <td class="px-4 py-3 text-sm">${solicitud._id?.slice(-6) || 'N/A'}</td>
                <td class="px-4 py-3 text-sm font-medium">${nombreUsuario}</td>
                <td class="px-4 py-3 text-sm">${elementosInfo}</td>
                <td class="px-4 py-3 text-sm">${fecha}</td>
                <td class="px-4 py-3 text-sm">${estadoBadge}</td>
                <td class="px-4 py-3 text-sm">${solicitud.observaciones || '-'}</td>
                <td class="px-4 py-3 text-sm relative">
                    <button 
                        onclick="window.mobileAdminController.toggleMenu('${solicitud._id}')" 
                        class="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                        ️
                    </button>
                    
                    <!-- Menú desplegable de acciones -->
                    <div id="menu-${solicitud._id}" class="hidden absolute right-0 top-12 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-48">
                        <div class="p-2 space-y-1">
                            ${solicitud.estado === 'pendiente' ? `
                                <button 
                                    onclick="window.mobileAdminController.aprobarSolicitud('${solicitud._id}')" 
                                    class="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded flex items-center gap-2">
                                     Aprobar
                                </button>
                                <button 
                                    onclick="window.mobileAdminController.rechazarSolicitud('${solicitud._id}')" 
                                    class="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-2">
                                     Rechazar
                                </button>
                            ` : ''}
                            
                            ${solicitud.estado === 'aprobada' ? `
                                <button 
                                    onclick="window.mobileAdminController.entregarSolicitud('${solicitud._id}')" 
                                    class="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center gap-2">
                                     Entregar
                                </button>
                            ` : ''}
                            
                            ${solicitud.estado === 'entregado' ? `
                                <button 
                                    onclick="window.mobileAdminController.devolverSolicitud('${solicitud._id}')" 
                                    class="w-full text-left px-3 py-2 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 rounded flex items-center gap-2">
                                     Devolver
                                </button>
                            ` : ''}
                            
                            <button 
                                onclick="window.mobileAdminController.verDetalles('${solicitud._id}')" 
                                class="w-full text-left px-3 py-2 text-sm bg-slate-50 text-slate-700 hover:bg-slate-100 rounded flex items-center gap-2">
                                ️ Ver detalles
                            </button>
                            
                            <button 
                                onclick="window.mobileAdminController.eliminarSolicitud('${solicitud._id}')" 
                                class="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-2">
                                ️ Eliminar
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    createSolicitudCardV2(solicitud) {
        console.log('** createSolicitudCardV2 llamado con solicitud:', {
            id: solicitud._id,
            estado: solicitud.estado,
            tipoEstado: typeof solicitud.estado,
            usuario: solicitud.usuario?.nombre_completo,
            objetoCompleto: solicitud
        });
        
        const usuario = solicitud.usuario || {};
        const nombreUsuario = usuario.nombre_completo || usuario.nombre || 'Usuario sin nombre';
        const rolUsuario = usuario.rol || usuario.rol_nombre || '';
        const rolText = rolUsuario.toLowerCase();
        
        const esEstudiante = rolText.includes('estudiante');
        const esDocente = rolText.includes('docente') || rolText.includes('profesor');
        
        let rolColor = '#10b981'; // Verde para estudiantes
        let rolBgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        let rolIcono = '‍';
        
        if (esDocente) {
            rolColor = '#f59e0b'; // Naranja para docentes
            rolBgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            rolIcono = '‍';
        }

        return `
            <div class="bg-white rounded-lg shadow-md border border-slate-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-base sm:text-lg">${rolIcono}</span>
                            <div>
                                <div class="font-bold text-xs sm:text-xs" style="color: ${rolColor};">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                                <div class="text-xs sm:text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                            </div>
                        </div>
                        <div class="text-slate-600 font-medium text-sm sm:text-base mt-1">${nombreUsuario}</div>
                    </div>
                    <div class="text-right sm:text-left mt-2 sm:mt-0">
                        <div class="text-slate-500 text-xs sm:text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</div>
                        <div class="mt-1">${this.getEstadoBadge(solicitud.estado)}</div>
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
                                onclick="window.mobileAdminController.toggleMenu('${solicitud._id}')" 
                                class="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                style="background: ${rolBgGradient}; color: white; box-shadow: 0 2px 8px ${rolColor}40;">
                                <span class="text-sm sm:text-base">️</span>
                            </button>
                            <div id="menu-${solicitud._id}" class="hidden absolute right-0 sm:right-4 mt-1 sm:mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border-2" style="border-color: ${rolColor}; z-index: 1000;">
                                <div class="menu-header" style="background: ${rolBgGradient}; color: white; padding: 12px; border-radius: 8px 8px 0 0;">
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg">${rolIcono}</span>
                                        <div>
                                            <div class="font-bold text-xs">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                                            <div class="text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-2">
                                    ${this.createAdminActions(solicitud)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminActions(solicitud) {
        const estado = solicitud.estado;
        let actions = [];

        // Acciones básicas (siempre disponibles)
        actions.push(`
            <button onclick="window.mobileAdminController.verDetalles('${solicitud._id}')" 
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600">
                <span>️</span> Ver Detalles
            </button>
        `);

        actions.push(`
            <button onclick="window.mobileAdminController.editarSolicitud('${solicitud._id}')" 
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-green-50 hover:text-green-600">
                <span>️</span> Editar
            </button>
        `);

        // Acciones según estado
        if (estado === 'pendiente') {
            actions.push(`
                <div class="border-t border-slate-200 my-1"></div>
                <button onclick="window.mobileAdminController.aprobarSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-green-50 hover:text-green-600">
                    <span></span> Aprobar
                </button>
                <button onclick="window.mobileAdminController.rechazarSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-red-50 hover:text-red-600">
                    <span></span> Rechazar
                </button>
            `);
        }

        if (estado === 'aprobada') {
            actions.push(`
                <div class="border-t border-slate-200 my-1"></div>
                <button onclick="window.mobileAdminController.entregarSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600">
                    <span></span> Entregar
                </button>
            `);
        }

        if (estado === 'entregado') {
            actions.push(`
                <div class="border-t border-slate-200 my-1"></div>
                <button onclick="window.mobileAdminController.devolverSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600">
                    <span></span> Devolver
                </button>
            `);
        }

        // Botón eliminar (siempre disponible para admin)
        actions.push(`
            <div class="border-t border-slate-200 my-1"></div>
            <button onclick="window.mobileAdminController.eliminarSolicitud('${solicitud._id}')" 
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-red-50 text-red-600">
                <span>️</span> Eliminar
            </button>
        `);
        
        return actions.join('');
    }

    getElementosInfo(solicitud) {
        const elementos = [];
        let totalCantidad = 0;
        
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach(insumo => {
                const nombre = insumo.id_insumo?.NombProducto || insumo.descripcion || 'Insumo';
                const cantidad = insumo.cantidad || 1;
                elementos.push(`${nombre} (${cantidad})`);
                totalCantidad += cantidad;
            });
        }
        
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach(activo => {
                elementos.push(`${activo.nombre || 'Activo'}`);
                totalCantidad += 1;
            });
        }
        
        if (elementos.length === 0) {
            return '<span class="text-slate-400 italic">Sin elementos</span>';
        }
        
        // Formato profesional: lista con total al final
        const elementosHtml = elementos.map((elemento, index) => {
            const esUltimo = index === elementos.length - 1;
            return `<span class="text-slate-700">${elemento}${esUltimo ? '' : ', '}</span>`;
        }).join('');
        
        return `
            <div class="space-y-1">
                <div class="text-sm">${elementosHtml}</div>
                <div class="text-xs text-slate-500 font-medium">
                    Total: ${totalCantidad} ${totalCantidad === 1 ? 'elemento' : 'elementos'}
                </div>
            </div>
        `;
    }

    getEstadoBadge(estado) {
        console.log('** getEstadoBadge llamado con estado:', estado, 'tipo:', typeof estado);
        
        // Manejar casos específicos del backend
        if (!estado || estado === null || estado === undefined || estado === 'No field') {
            console.log('** Estado inválido detectado:', estado);
            return '<span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">️ Sin Estado</span>';
        }
        
        const badges = {
            'pendiente': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">?? Pendiente</span>',
            'pendiente_devolucion': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">?? Pendiente Devolución</span>',
            'aprobada': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">?? Aprobada</span>',
            'rechazada': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">?? Rechazada</span>',
            'entregado': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">?? Entregado</span>',
            'devuelto': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">?? Devuelto</span>',
            'cancelada': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">?? Cancelada</span>'
        };
        
        // Siempre mostrar el estado real, sin fallback
        const badge = badges[estado] || `<span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Estado: ${estado}</span>`;
        console.log('** Badge generado para estado real:', badge);
        
        return badge;
    }

    getFilteredSolicitudes() {
        console.log('** Filtros actuales:', this.filtros);
        
        let filtradas = this.solicitudes;

        if (this.filtros.estado !== 'todos') {
            filtradas = filtradas.filter(s => s.estado === this.filtros.estado);
            console.log(`** Filtrando por estado "${this.filtros.estado}":`, filtradas.length);
        }

        if (this.filtros.tipo !== 'todos') {
            filtradas = filtradas.filter(s => {
                if (this.filtros.tipo === 'activos') {
                    return s.activos && s.activos.length > 0;
                } else if (this.filtros.tipo === 'insumos') {
                    return s.insumos && s.insumos.length > 0;
                }
                return true;
            });
            console.log(`** Filtrando por tipo "${this.filtros.tipo}":`, filtradas.length);
        }

        // Filtrar por usuario específico
        if (this.filtros.usuario !== 'todos') {
            filtradas = filtradas.filter(s => {
                const usuarioId = s.usuario?._id || s.usuario?.id;
                return usuarioId === this.filtros.usuario;
            });
            console.log(`** Filtrando por usuario "${this.filtros.usuario}":`, filtradas.length);
        }

        if (this.filtros.busqueda) {
            const searchText = this.filtros.busqueda.toLowerCase().trim();
            filtradas = filtradas.filter(s => {
                const folioStr = s.folio ? String(s.folio).padStart(3, '0') : '';
                const textoFila = `${s.usuario?.nombre_completo || ''} ${s.usuario?.correo_electronico || ''} ${s.usuario?.cedula || ''} ${s._id || ''} ${folioStr} ${this.getElementosInfo(s) || ''}`.toLowerCase();
                return textoFila.includes(searchText) ||
                       (s.usuario?.nombre_completo || '').toLowerCase().includes(searchText) ||
                       (s.usuario?.correo_electronico || '').toLowerCase().includes(searchText) ||
                       (s.usuario?.cedula || '').toLowerCase().includes(searchText) ||
                       (s._id || '').toLowerCase().includes(searchText) ||
                       folioStr.includes(searchText.replace('#', '')) ||
                       String(s.folio || '').includes(searchText);
            });
        }

        // Filtrar por fechas
        if (this.filtros.fechaDesde || this.filtros.fechaHasta) {
            filtradas = filtradas.filter(solicitud => {
                const solicitudDate = new Date(solicitud.createdAt);
                const fechaDesde = this.filtros.fechaDesde ? new Date(this.filtros.fechaDesde) : null;
                const fechaHasta = this.filtros.fechaHasta ? new Date(this.filtros.fechaHasta) : null;

                if (fechaDesde && solicitudDate < fechaDesde) return false;
                if (fechaHasta && solicitudDate > new Date(fechaHasta.getTime() + 24 * 60 * 60 * 1000)) return false;

                return true;
            });
        }

        console.log('** Solicitudes finales para mostrar:', filtradas.length);
        return filtradas;
    }

    applyFilters() {
        console.log('** Aplicando filtros en admin móvil...');
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
        
        this.updateEstadisticas();
    }

    limpiarFiltros() {
        this.filtros = {
            busqueda: '',
            estado: 'todos',
            tipo: 'todos',
            usuario: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };
        
        const estadoFilter = document.getElementById('estado-filter');
        const tipoFilter = document.getElementById('tipo-filter');
        const usuarioFilter = document.getElementById('usuario-filter');
        const busquedaInput = document.getElementById('busqueda-input');
        const fechaDesde = document.getElementById('fecha-desde');
        const fechaHasta = document.getElementById('fecha-hasta');
        
        if (estadoFilter) estadoFilter.value = 'todos';
        if (tipoFilter) tipoFilter.value = 'todos';
        if (usuarioFilter) usuarioFilter.value = 'todos';
        if (busquedaInput) busquedaInput.value = '';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        
        this.renderSolicitudes();
    }

    populateUsuarioFilter() {
        const usuarioSelect = document.getElementById('usuario-filter');
        if (!usuarioSelect) return;

        // Obtener usuarios únicos de las solicitudes
        const usuariosUnicos = new Map();
        
        this.solicitudes.forEach(solicitud => {
            if (solicitud.usuario) {
                const usuarioId = solicitud.usuario._id || solicitud.usuario.id;
                const nombreCompleto = solicitud.usuario.nombre_completo || 'Usuario desconocido';
                
                if (usuarioId && !usuariosUnicos.has(usuarioId)) {
                    usuariosUnicos.set(usuarioId, nombreCompleto);
                }
            }
        });

        // Crear opciones del select
        const options = [
            '<option value="todos">Todos los usuarios</option>'
        ];

        // Ordenar usuarios alfabéticamente
        const usuariosOrdenados = Array.from(usuariosUnicos.entries()).sort((a, b) => 
            a[1].localeCompare(b[1])
        );

        usuariosOrdenados.forEach(([id, nombre]) => {
            options.push(`<option value="${id}">${nombre}</option>`);
        });

        usuarioSelect.innerHTML = options.join('');
        console.log(`** Filtro de usuarios poblado con ${usuariosOrdenados.length} usuarios únicos`);
    }

    updateEstadisticas() {
        console.log('** Actualizando estadísticas admin móvil...');
        
        const stats = {
            pendientes: this.solicitudes.filter(s => s.estado === 'pendiente').length,
            pendientesDevolucion: this.solicitudes.filter(s => s.estado === 'pendiente_devolucion').length,
            aprobadas: this.solicitudes.filter(s => s.estado === 'aprobada').length,
            rechazadas: this.solicitudes.filter(s => s.estado === 'rechazada').length,
            entregadas: this.solicitudes.filter(s => s.estado === 'entregado').length,
            devueltas: this.solicitudes.filter(s => s.estado === 'devuelto').length,
            canceladas: this.solicitudes.filter(s => s.estado === 'cancelada').length
        };

        console.log('** Estadísticas admin móviles calculadas:', stats);

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

        console.log('** Estadísticas admin móviles actualizadas correctamente');
    }

    toggleMenu(solicitudId) {
        console.log('** TOGGLE MENU ADMIN INICIADO para solicitud:', solicitudId);
        
        const menu = document.getElementById(`menu-${solicitudId}`);
        console.log('** Menú admin encontrado:', !!menu, menu?.id);
        
        if (!menu) {
            console.error('** ERROR: No se encontró el menú para la solicitud:', solicitudId);
            return;
        }
        
        const allMenus = document.querySelectorAll('[id^="menu-"]');
        console.log('** Total menús encontrados:', allMenus.length);
        
        // Cerrar todos los demás menús primero
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
        
        console.log('** TOGGLE MENU ADMIN COMPLETADO para solicitud:', solicitudId);
    }

    // Acciones administrativas
    verDetalles(solicitudId) {
        console.log('** Admin ver detalles:', solicitudId);
        
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            console.error('** Solicitud no encontrada:', solicitudId);
            return;
        }
        
        // Cerrar el menú
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Crear modal de detalles
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-800"> Detalles de Solicitud (Admin)</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700">ID Solicitud</label>
                            <p class="text-slate-900 font-mono">#${solicitud._id?.slice(-6) || 'N/A'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Estado</label>
                            <div class="mt-1">
                                ${this.getEstadoBadge(solicitud.estado)}
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Fecha</label>
                            <p class="text-slate-900">${new Date(solicitud.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Usuario</label>
                            <p class="text-slate-900">${solicitud.usuario?.nombre_completo || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                        <p class="text-slate-700 bg-slate-50 p-3 rounded">${solicitud.observaciones || 'Sin observaciones'}</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Artículos Solicitados</label>
                        <div class="space-y-2">
                            ${this.getElementosInfo(solicitud)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    editarSolicitud(solicitudId) {
        console.log('** Admin editar solicitud:', solicitudId);
        alert('Función de edición en desarrollo');
    }

    async aprobarSolicitud(solicitudId) {
        console.log('** Admin aprobar solicitud:', solicitudId);
        
        if (!confirm('¿Estás seguro de aprobar esta solicitud?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`http://localhost:4000/api/solicitudes/admin-gestion/${solicitudId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nuevoEstadoAdmin: 'aprobada',
                    observaciones: 'Aprobada por administrador'
                })
            });
            
            if (response.ok) {
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a aprobada:', solicitudId);
                    solicitudLocal.estado = 'aprobada';
                    solicitudLocal.observacion = 'Aprobada por administrador';
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'aprobada';
                        solicitudAll.observacion = 'Aprobada por administrador';
                    }
                    
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    console.log('** Interfaz actualizada inmediatamente');
                }
                
                alert('Solicitud aprobada exitosamente');
                
                // Recargar datos frescos del backend (en background)
                setTimeout(() => {
                    this.loadSolicitudes();
                }, 1000);
            } else {
                alert('Error al aprobar solicitud');
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            alert('Error al aprobar solicitud');
        }
    }

    async rechazarSolicitud(solicitudId) {
        console.log('** Admin rechazar solicitud:', solicitudId);
        
        const motivo = prompt('Motivo del rechazo:');
        if (!motivo) {
            console.log('** Rechazo cancelado - no se proporcionó motivo');
            return;
        }
        
        console.log('** Motivo proporcionado:', motivo);
        
        try {
            const token = localStorage.getItem('utn_token');
            console.log('** Token encontrado:', !!token);
            
            if (!token) {
                console.error('** No hay token de autenticación');
                alert('Error: No tienes sesión activa');
                return;
            }
            
            const url = `http://localhost:4000/api/solicitudes/admin-gestion/${solicitudId}`;
            console.log('** URL de la API:', url);
            
            const requestBody = {
                nuevoEstadoAdmin: 'rechazada',
                observaciones: motivo
            };
            console.log('** Body de la petición:', requestBody);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('** Response status:', response.status);
            console.log('** Response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('** Error en respuesta:', errorText);
                alert(`Error al rechazar solicitud: ${response.status} ${response.statusText}`);
                return;
            }
            
            const responseData = await response.json();
            console.log('** Respuesta exitosa:', responseData);
            
            // Actualizar el estado local inmediatamente
            const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
            if (solicitudLocal) {
                console.log('** Actualizando estado local de solicitud:', solicitudId);
                console.log('** Estado anterior:', solicitudLocal.estado);
                solicitudLocal.estado = 'rechazada';
                solicitudLocal.observacion = motivo;
                console.log('** Estado nuevo:', solicitudLocal.estado);
                
                // Actualizar también en allSolicitudes
                const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                if (solicitudAll) {
                    solicitudAll.estado = 'rechazada';
                    solicitudAll.observacion = motivo;
                }
                
                // Renderizar inmediatamente con los datos actualizados
                this.renderSolicitudes();
                this.updateEstadisticas();
                console.log('** Interfaz actualizada inmediatamente');
            }
            
            alert('Solicitud rechazada exitosamente');
            
            // Recargar datos frescos del backend (en background)
            setTimeout(() => {
                this.loadSolicitudes();
            }, 1000);
            
        } catch (error) {
            console.error('** Error rechazando solicitud:', error);
            console.error('** Stack trace:', error.stack);
            alert('Error al rechazar solicitud: ' + error.message);
        }
    }

    async entregarSolicitud(solicitudId) {
        console.log('** Admin entregar solicitud:', solicitudId);
        
        if (!confirm('¿Estás seguro de marcar como entregada esta solicitud?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`http://localhost:4000/api/solicitudes/admin-gestion/${solicitudId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nuevoEstadoAdmin: 'entregado',
                    observaciones: 'Entregada por administrador'
                })
            });
            
            if (response.ok) {
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a entregado:', solicitudId);
                    solicitudLocal.estado = 'entregado';
                    solicitudLocal.observacion = 'Entregada por administrador';
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'entregado';
                        solicitudAll.observacion = 'Entregada por administrador';
                    }
                    
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    console.log('** Interfaz actualizada inmediatamente');
                }
                
                alert('Solicitud marcada como entregada');
                
                // Recargar datos frescos del backend (en background)
                setTimeout(() => {
                    this.loadSolicitudes();
                }, 1000);
            } else {
                alert('Error al marcar como entregada');
            }
        } catch (error) {
            console.error('Error entregando solicitud:', error);
            alert('Error al marcar como entregada');
        }
    }

    async devolverSolicitud(solicitudId) {
        console.log('** Admin devolver solicitud:', solicitudId);
        
        if (!confirm('¿Estás seguro de marcar como devuelta esta solicitud?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`http://localhost:4000/api/solicitudes/admin-gestion/${solicitudId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nuevoEstadoAdmin: 'devuelto',
                    observaciones: 'Devuelta por administrador'
                })
            });
            
            if (response.ok) {
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a devuelto:', solicitudId);
                    solicitudLocal.estado = 'devuelto';
                    solicitudLocal.observacion = 'Devuelta por administrador';
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'devuelto';
                        solicitudAll.observacion = 'Devuelta por administrador';
                    }
                    
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    console.log('** Interfaz actualizada inmediatamente');
                }
                
                alert('Solicitud marcada como devuelta');
                
                // Recargar datos frescos del backend (en background)
                setTimeout(() => {
                    this.loadSolicitudes();
                }, 1000);
            } else {
                alert('Error al marcar como devuelta');
            }
        } catch (error) {
            console.error('Error devolviendo solicitud:', error);
            alert('Error al marcar como devuelta');
        }
    }

    async eliminarSolicitud(solicitudId) {
        console.log('** Admin eliminar solicitud:', solicitudId);
        
        if (!confirm('¿Estás seguro de eliminar esta solicitud? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`http://localhost:4000/api/solicitudes/${solicitudId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                alert('Solicitud eliminada exitosamente');
                await this.loadSolicitudes();
            } else {
                alert('Error al eliminar solicitud');
            }
        } catch (error) {
            console.error('Error eliminando solicitud:', error);
            alert('Error al eliminar solicitud');
        }
    }

    // Funciones para filtros móviles
    filtrarPorEstado(estado) {
        console.log('** Filtrando por estado móvil:', estado);
        this.filtros.estado = estado;
        this.applyFilters();
        
        // Actualizar botones activos
        document.querySelectorAll('[id^="mobile-"][id$="-btn"]').forEach(btn => {
            btn.classList.remove('bg-white', 'bg-opacity-30');
        });
        
        const activeBtn = document.getElementById(`mobile-${estado}-btn`);
        if (activeBtn) {
            activeBtn.classList.add('bg-white', 'bg-opacity-30');
        }
    }

    limpiarFiltroEstado() {
        console.log('** Limpiando filtro de estado móvil');
        this.filtros.estado = 'todos';
        this.applyFilters();
        
        // Quitar selección activa de todos los botones
        document.querySelectorAll('[id^="mobile-"][id$="-btn"]').forEach(btn => {
            btn.classList.remove('bg-white', 'bg-opacity-30');
        });
    }

    limpiarFiltros() {
        console.log('** Limpiando todos los filtros móviles');
        this.filtros = {
            busqueda: '',
            estado: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };
        
        // Limpiar campos del formulario
        const busquedaInput = document.getElementById('busqueda');
        const estadoSelect = document.getElementById('estado-filter');
        const fechaDesde = document.getElementById('fecha-desde');
        const fechaHasta = document.getElementById('fecha-hasta');
        
        if (busquedaInput) busquedaInput.value = '';
        if (estadoSelect) estadoSelect.value = 'todos';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        
        // Limpiar botones activos
        document.querySelectorAll('[id^="mobile-"][id$="-btn"]').forEach(btn => {
            btn.classList.remove('bg-white', 'bg-opacity-30');
        });
        
        this.applyFilters();
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('** DOM listo - Inicializando MobileAdminController...');
    
    const userData = localStorage.getItem('utn_user');
    console.log('** Datos de usuario encontrados:', !!userData);
    
    if (!userData) {
        console.log('** No hay datos de usuario, saliendo');
        return;
    }
    
    const currentUser = JSON.parse(userData);
    const rol = currentUser?.tipo_rol || currentUser?.rol || currentUser?.rol_nombre || '';
    const rolText = rol.toLowerCase();
        
    const esAdmin = rolText.includes('admin') || rolText.includes('administrador') || rolText.includes('estudiante');
    console.log('** Es administrador (temporal incluye estudiantes):', esAdmin);
    
    if (!esAdmin) {
        console.log('** Usuario no es administrador, no se inicia controlador mobile admin');
        return;
    }
    
    console.log('** Todas las condiciones cumplidas, creando e iniciando controlador mobile admin...');
    
    // Crear el controlador global PRIMERO
    window.mobileAdminController = new MobileAdminController();
    console.log('** MobileAdminController creado:', window.mobileAdminController);
    
    // Luego inicializarlo
    window.mobileAdminController.init();
});

// Funciones globales para filtros móviles (wrapper para llamar al controlador)
function filtrarPorEstado(estado) {
    if (window.mobileAdminController) {
        window.mobileAdminController.filtrarPorEstado(estado);
    }
}

function limpiarFiltroEstado() {
    if (window.mobileAdminController) {
        window.mobileAdminController.limpiarFiltroEstado();
    }
}

function limpiarFiltros() {
    if (window.mobileAdminController) {
        window.mobileAdminController.limpiarFiltros();
    }
}