// Controlador móvil para administradores
class MobileAdminController {
    constructor() {
        this.solicitudes = [];
        this.allSolicitudes = [];
        this.filtros = {
            busqueda: '',
            estado: 'todos',
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
                        <div class="text-6xl mb-4">📋</div>
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
                    <div class="text-6xl mb-4">📋</div>
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
                        <div class="text-6xl mb-4">??</div>
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

createDesktopRow(solicitud) {
    console.log('** [DESKTOP] createDesktopRow llamado para:', solicitud._id);
    console.log('** [DESKTOP] Datos de usuario:', solicitud.usuario);
    
    const estadoBadge = this.getEstadoBadge(solicitud.estado);
    const nombreUsuario = solicitud.usuario?.nombre_completo || 'Usuario desconocido';
    const elementosInfo = this.getElementosInfo(solicitud);
    const fecha = new Date(solicitud.createdAt).toLocaleDateString();
    
    // Información adicional para solicitudes aprobadas y entregadas
    let infoAdicional = '';
    
    if (solicitud.estado === 'aprobada') {
        infoAdicional = `
            <div class="text-xs space-y-1 mt-1">
                ${solicitud.fecha_recogida ? `
                    <div class="text-green-600 font-medium">
                        ?? Recoger: ${solicitud.fecha_recogida}
                    </div>
                ` : ''}
                ${solicitud.dias_disponibles ? `
                    <div class="text-blue-600 font-medium">
                        ?? Días: ${solicitud.dias_disponibles}
                    </div>
                ` : ''}
            </div>
        `;
    } else if (solicitud.estado === 'entregado') {
        infoAdicional = `
            <div class="text-xs space-y-1 mt-1">
                ${solicitud.fecha_entrega ? `
                    <div class="text-orange-600 font-medium">
                        ?? Entregado: ${solicitud.fecha_entrega}
                    </div>
                ` : ''}
                ${solicitud.fecha_recogida ? `
                    <div class="text-green-600 font-medium">
                        ?? Recoger: ${solicitud.fecha_recogida}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return `
        <tr class="hover:bg-slate-50 relative">
            <td class="px-4 py-3 text-sm">${solicitud._id?.slice(-6) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm font-medium">${nombreUsuario}</td>
            <td class="px-4 py-3 text-sm">
                ${elementosInfo}
                ${infoAdicional}
            </td>
            <td class="px-4 py-3 text-sm">${fecha}</td>
            <td class="px-4 py-3 text-sm">${estadoBadge}</td>
            <td class="px-4 py-3 text-sm">${solicitud.observaciones || '-'}</td>
            <td class="px-4 py-3 text-sm relative">
                <button 
                    onclick="window.mobileAdminController.toggleMenu('${solicitud._id}')" 
                    class="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                    <span style="opacity: 0.8;">?</span> Enviar Correo
                </button>
                
                <!-- Menú desplegable de acciones -->
                <div id="menu-${solicitud._id}" class="hidden absolute right-0 top-12 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div class="p-2 space-y-1">
                        <button 
                            onclick="window.mobileAdminController.enviarCorreoEstudiante('${solicitud.usuario?.correo_electronico || ''}', '${solicitud._id}')" 
                            class="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 rounded flex items-center gap-2">
                            <span style="opacity: 0.8;">?</span> Enviar Correo
                        </button>
                        
                        ${solicitud.estado === 'pendiente' ? `
                            <button 
                                onclick="window.mobileAdminController.aprobarSolicitud('${solicitud._id}')" 
                                class="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded flex items-center gap-2">
                                <span style="opacity: 0.8;">?</span> Aprobar
                            </button>
                            <button 
                                onclick="window.mobileAdminController.rechazarSolicitud('${solicitud._id}')" 
                                class="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-2">
                                🗑️ Eliminar
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
                <span>?</span> Ver Detalles
            </button>
        `);

        // Botón para enviar correo al estudiante (solo para administradores)
        console.log('** [MÓVIL] Verificando correo para solicitud:', solicitud._id);
        console.log('** [MÓVIL] Usuario:', solicitud.usuario);
        console.log('** [MÓVIL] Correo disponible:', !!solicitud.usuario?.correo_electronico);
        console.log('** [MÓVIL] Correo valor:', solicitud.usuario?.correo_electronico);
        
        if (solicitud.usuario && solicitud.usuario.correo_electronico) {
            actions.push(`
                <button onclick="window.mobileAdminController.enviarCorreoEstudiante('${solicitud.usuario.correo_electronico}', '${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600">
                    <span>?</span> Enviar Correo
                </button>
            `);
        } else {
            actions.push(`
                <div class="text-xs text-gray-500 px-3 py-2">No hay correo disponible</div>
            `);
        }

        actions.push(`
            <button onclick="window.mobileAdminController.editarSolicitud('${solicitud._id}')" 
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-green-50 hover:text-green-600">
                <span>?</span> Editar
            </button>
        `);

        // Acciones según estado
        if (estado === 'pendiente') {
            actions.push(`
                <div class="border-t border-slate-200 my-1"></div>
                <button onclick="window.mobileAdminController.aprobarSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-green-50 hover:text-green-600">
                    <span>✅</span> Aprobar
                </button>
                <button onclick="window.mobileAdminController.rechazarSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-red-50 hover:text-red-600">
                    <span>❌</span> Rechazar
                </button>
            `);
        }

        if (estado === 'aprobada') {
            actions.push(`
                <div class="border-t border-slate-200 my-1"></div>
                <button onclick="window.mobileAdminController.entregarSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600">
                    <span>📦</span> Entregar
                </button>
            `);
        }

        if (estado === 'entregado') {
            actions.push(`
                <div class="border-t border-slate-200 my-1"></div>
                <button onclick="window.mobileAdminController.devolverSolicitud('${solicitud._id}')" 
                    class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600">
                    <span>🔄</span> Devolver
                </button>
            `);
        }

        // Botón eliminar (siempre disponible para admin)
        actions.push(`
            <div class="border-t border-slate-200 my-1"></div>
            <button onclick="window.mobileAdminController.eliminarSolicitud('${solicitud._id}')" 
                class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-red-50 text-red-600">
                <span>🗑️</span> Eliminar
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
            return '<span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⚠️ Sin Estado</span>';
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

        if (this.filtros.busqueda) {
            filtradas = filtradas.filter(s => {
                const textoFila = `${s.usuario?.nombre_completo || ''} ${s._id || ''} ${this.getElementosInfo(s) || ''}`.toLowerCase();
                return textoFila.includes(this.filtros.busqueda.toLowerCase());
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
            fechaDesde: '',
            fechaHasta: ''
        };
        
        const estadoFilter = document.getElementById('estado-filter');
        const busquedaInput = document.getElementById('busqueda-input');
        const fechaDesde = document.getElementById('fecha-desde');
        const fechaHasta = document.getElementById('fecha-hasta');
        
        if (estadoFilter) estadoFilter.value = 'todos';
        if (busquedaInput) busquedaInput.value = '';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        
        this.renderSolicitudes();
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

    mostrarModalAprobacion(solicitudId) {
        console.log('** Mostrando modal de aprobación para:', solicitudId);
        
        // Cerrar menú primero
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (menu) {
            console.log('** Cerrando menú antes de mostrar modal');
            menu.classList.add('hidden');
        }
        
        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.style.zIndex = '9999';
        console.log('** Modal creado:', modal);
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-800">✅ Aprobar Solicitud</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="form-aprobacion" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            📅 Fecha de Recogida
                        </label>
                        <input 
                            type="date" 
                            id="fecha-recogida"
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                        <p class="text-xs text-slate-500 mt-1">Formato: DD/MM/YYYY</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            📅 Días Disponibles
                        </label>
                        <textarea 
                            id="dias-disponibles"
                            rows="3"
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ejemplos:
• Lunes, Miércoles, Viernes
• Martes a Jueves
• Todos los días laborables"
                            required
                        ></textarea>
                        <p class="text-xs text-slate-500 mt-1">
                            Días: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado
                        </p>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onclick="this.closest('.fixed').remove()"
                            class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Aprobar Solicitud
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Agregar al DOM
        console.log('** Agregando modal al DOM...');
        document.body.appendChild(modal);
        console.log('** Modal agregado al DOM. Visible:', modal.style.display !== 'none');
        console.log('** Modal en body:', document.body.contains(modal));
        
        // Forzar visibilidad
        setTimeout(() => {
            console.log('** Modal visible después de timeout:', window.getComputedStyle(modal).display);
        }, 100);
        
        // Configurar evento del formulario
        const form = document.getElementById('form-aprobacion');
        const fechaInput = document.getElementById('fecha-recogida');
        const diasTextarea = document.getElementById('dias-disponibles');
        
        // Establecer fecha por defecto (hoy)
        const hoy = new Date();
        fechaInput.value = hoy.toISOString().split('T')[0];
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fechaRecogida = fechaInput.value;
            const diasDisponibles = diasTextarea.value.trim();
            
            // Validar fecha
            if (!fechaRecogida) {
                Utils.showToast('Debe seleccionar una fecha de recogida', 'error');
                return;
            }
            
            // Validar días
            if (!diasDisponibles) {
                Utils.showToast('Debe ingresar los días disponibles', 'error');
                return;
            }
            
            // Convertir fecha a formato DD/MM/YYYY
            const fecha = new Date(fechaRecogida + 'T00:00:00');
            const fechaFormateada = fecha.toLocaleDateString('es-CR');
            
            // Confirmar aprobación
            if (!confirm(`¿Aprobar solicitud con estos datos?\n\n📅 Fecha: ${fechaFormateada}\n📅 Días: ${diasDisponibles}`)) {
                return;
            }
            
            // Cerrar modal y aprobar
            modal.remove();
            this.procesarAprobacion(solicitudId, fechaFormateada, diasDisponibles);
        });
    }

    async procesarAprobacion(solicitudId, fechaRecogida, diasDisponibles) {
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
                    observaciones: `Aprobada por administrador. Fecha de recogida: ${fechaRecogida}. Días disponibles: ${diasDisponibles}`,
                    fecha_recogida: fechaRecogida,
                    dias_disponibles: diasDisponibles
                })
            });
            
            if (response.ok) {
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a aprobada:', solicitudId);
                    solicitudLocal.estado = 'aprobada';
                    solicitudLocal.observacion = `Aprobada por administrador. Fecha de recogida: ${fechaRecogida}. Días disponibles: ${diasDisponibles}`;
                    solicitudLocal.fecha_recogida = fechaRecogida;
                    solicitudLocal.dias_disponibles = diasDisponibles;
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'aprobada';
                        solicitudAll.observacion = `Aprobada por administrador. Fecha de recogida: ${fechaRecogida}. Días disponibles: ${diasDisponibles}`;
                        solicitudAll.fecha_recogida = fechaRecogida;
                        solicitudAll.dias_disponibles = diasDisponibles;
                    }
                    
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    console.log('** Interfaz actualizada inmediatamente');
                }
                
                Utils.showToast(`Solicitud aprobada. Fecha: ${fechaRecogida} | Días: ${diasDisponibles}`, 'success');
                
                // Recargar datos frescos del backend (en background)
                setTimeout(() => {
                    this.loadSolicitudes();
                }, 1000);
            } else {
                Utils.showToast('Error al aprobar solicitud', 'error');
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            Utils.showToast('Error al aprobar solicitud', 'error');
        }
    }

    async enviarCorreoEstudiante(correoEstudiante, solicitudId) {
        try {
            console.log('** Enviando correo al estudiante:', correoEstudiante);
            console.log('** ID de solicitud:', solicitudId);
            
            // Cerrar el menú
            const menu = document.getElementById(`menu-${solicitudId}`);
            if (menu) {
                menu.classList.add('hidden');
            }
            
            // Validar si hay correo
            if (!correoEstudiante || correoEstudiante === '') {
                Utils.showToast('El estudiante no tiene correo electrónico registrado', 'error');
                return;
            }
            
            // Crear el enlace mailto con el correo del estudiante
            const asunto = encodeURIComponent(`Información sobre solicitud #${solicitudId?.slice(-6) || 'N/A'}`);
            const cuerpo = encodeURIComponent(`
Estimado estudiante,

Le escribimos respecto a su solicitud #${solicitudId?.slice(-6) || 'N/A'}.

Por favor, revise el estado de su solicitud en el sistema o acérquese al laboratorio para más información.

Saludos cordiales,
Departamento de Electrónica - UTN
            `.trim());
            
            // Abrir el cliente de correo del usuario
            window.location.href = `mailto:${correoEstudiante}?subject=${asunto}&body=${cuerpo}`;
            
            // Mostrar mensaje de confirmación
            Utils.showToast('Abriendo cliente de correo para contactar al estudiante', 'success');
            
        } catch (error) {
            console.error('** Error al enviar correo:', error);
            Utils.showToast('Error al abrir el cliente de correo', 'error');
        }
    }

    toggleMenu(solicitudId) {
        console.log('** TOGGLE MENU ADMIN INICIADO para solicitud:', solicitudId);
        
        const menu = document.getElementById(`menu-${solicitudId}`);
        console.log('** Menú admin encontrado:', !!menu, menu?.id);
        
        if (!menu) {
            console.error('** ERROR: No se encontró el menú para la solicitud:', solicitudId);
            return;
        }
        
        const allMenus = document.querySelectorAll('[id^="menu-"]:not([id^="menu-btn-"])');
        console.log('** Total menús encontrados:', allMenus.length);
        console.log('** IDs encontrados:', Array.from(allMenus).map(m => m.id));
        
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
                    <h3 class="text-xl font-bold text-slate-800">📋 Detalles de Solicitud (Admin)</h3>
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
                        ${solicitud.fecha_recogida ? `
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Fecha de Recogida</label>
                            <p class="text-slate-900 font-semibold text-green-600">${solicitud.fecha_recogida}</p>
                        </div>
                        ` : ''}
                        ${solicitud.dias_disponibles ? `
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Días Disponibles</label>
                            <p class="text-slate-900 font-semibold text-blue-600">${solicitud.dias_disponibles}</p>
                        </div>
                        ` : ''}
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

    aprobarSolicitud(solicitudId) {
        console.log('** Admin aprobar solicitud:', solicitudId);
        
        // Mostrar modal de aprobación
        this.mostrarModalAprobacion(solicitudId);
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

    entregarSolicitud(solicitudId) {
        console.log('** Admin entregar solicitud:', solicitudId);
        
        // Mostrar modal de entrega
        this.mostrarModalEntrega(solicitudId);
    }

    mostrarModalEntrega(solicitudId) {
        console.log('** Mostrando modal de entrega para:', solicitudId);
        
        // Cerrar menú primero
        const menu = document.getElementById(`menu-${solicitudId}`);
        if (menu) {
            console.log('** Cerrando menú antes de mostrar modal de entrega');
            menu.classList.add('hidden');
        }
        
        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.style.zIndex = '9999';
        console.log('** Modal de entrega creado:', modal);
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-800">?? Entregar Artículos</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="form-entrega" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            ?? Fecha de Entrega Real
                        </label>
                        <input 
                            type="date" 
                            id="fecha-entrega"
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                        <p class="text-xs text-slate-500 mt-1">Fecha en que se entregaron los artículos</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                            ?? Observaciones de Entrega
                        </label>
                        <textarea 
                            id="observaciones-entrega"
                            rows="3"
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Notas sobre la entrega:
Artículos en buen estado
Faltó: Cable USB
El estudiante firmó recibido"
                        ></textarea>
                        <p class="text-xs text-slate-500 mt-1">
                            Detalles importantes de la entrega (opcional)
                        </p>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onclick="this.closest('.fixed').remove()"
                            class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Confirmar Entrega
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Agregar al DOM
        console.log('** Agregando modal de entrega al DOM...');
        document.body.appendChild(modal);
        console.log('** Modal de entrega agregado al DOM');
        
        // Configurar evento del formulario
        const form = document.getElementById('form-entrega');
        const fechaInput = document.getElementById('fecha-entrega');
        const observacionesTextarea = document.getElementById('observaciones-entrega');
        
        // Establecer fecha por defecto (hoy)
        const hoy = new Date();
        fechaInput.value = hoy.toISOString().split('T')[0];
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fechaEntrega = fechaInput.value;
            const observacionesEntrega = observacionesTextarea.value.trim();
            
            // Validar fecha
            if (!fechaEntrega) {
                Utils.showToast('Debe seleccionar una fecha de entrega', 'error');
                return;
            }
            
            // Convertir fecha a formato DD/MM/YYYY
            const fecha = new Date(fechaEntrega + 'T00:00:00');
            const fechaFormateada = fecha.toLocaleDateString('es-CR');
            
            // Confirmar entrega
            const mensajeConfirmacion = `¿Confirmar entrega con estos datos?\n\n?? Fecha: ${fechaEntrega}`;
            if (!confirm(mensajeConfirmacion)) {
                return;
            }
            
            // Cerrar modal y procesar entrega
            modal.remove();
            this.procesarEntrega(solicitudId, fechaFormateada, observacionesEntrega);
        });
    }

    async procesarEntrega(solicitudId, fechaEntrega, observacionesEntrega) {
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
                    observaciones: observacionesEntrega ? `Entregada por administrador. Fecha: ${fechaEntrega}. ${observacionesEntrega}` : `Entregada por administrador. Fecha: ${fechaEntrega}`,
                    fecha_entrega: fechaEntrega,
                    observaciones_entrega: observacionesEntrega
                })
            });
            
            if (response.ok) {
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a entregado:', solicitudId);
                    solicitudLocal.estado = 'entregado';
                    solicitudLocal.observacion = observacionesEntrega ? `Entregada por administrador. Fecha: ${fechaEntrega}. ${observacionesEntrega}` : `Entregada por administrador. Fecha: ${fechaEntrega}`;
                    solicitudLocal.fecha_entrega = fechaEntrega;
                    solicitudLocal.observaciones_entrega = observacionesEntrega;
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'entregado';
                        solicitudAll.observacion = solicitudLocal.observacion;
                        solicitudAll.fecha_entrega = fechaEntrega;
                        solicitudAll.observaciones_entrega = observacionesEntrega;
                    }
                    
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    console.log('** Interfaz actualizada inmediatamente');
                }
                
                Utils.showToast(`Artículos entregados. Fecha: ${fechaEntrega}`, 'success');
                
                // Recargar datos frescos del backend (en background)
                setTimeout(() => {
                    this.loadSolicitudes();
                }, 1000);
            } else {
                Utils.showToast('Error al marcar como entregada', 'error');
            }
        } catch (error) {
            console.error('Error entregando solicitud:', error);
            Utils.showToast('Error al marcar como entregada', 'error');
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