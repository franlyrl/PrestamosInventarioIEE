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
        
        // DEBUG: Mostrar todas las solicitudes y sus estados en modo desktop
        console.log('** DEBUG DESKTOP: Todas las solicitudes y sus estados:');
        this.solicitudes.forEach((solicitud, index) => {
            console.log(`  ${index + 1}. ID: ${solicitud._id}, Estado: "${solicitud.estado}", Usuario: ${solicitud.usuario?.nombre || solicitud.usuario?.id_usuario || 'Unknown'}`);
        });
        
        // Contar estados manualmente en desktop
        const conteoManualDesktop = {
            pendiente: 0,
            aprobada: 0,
            rechazada: 0,
            entregado: 0,
            devuelto: 0,
            cancelada: 0,
            otros: 0
        };
        
        this.solicitudes.forEach(solicitud => {
            // Corregir estados undefined
            if (solicitud.estado === undefined || solicitud.estado === null || solicitud.estado === 'undefined') {
                solicitud.estado = 'pendiente';
                console.log('** Corrigiendo solicitud con estado undefined a pendiente:', solicitud._id);
            }
            
            switch(solicitud.estado) {
                case 'pendiente': conteoManualDesktop.pendiente++; break;
                case 'aprobada': conteoManualDesktop.aprobada++; break;
                case 'rechazada': conteoManualDesktop.rechazada++; break;
                case 'entregado': conteoManualDesktop.entregado++; break;
                case 'devuelto': conteoManualDesktop.devuelto++; break;
                case 'cancelada': conteoManualDesktop.cancelada++; break;
                default: conteoManualDesktop.otros++; break;
            }
        });
        
        console.log('** DEBUG DESKTOP: Conteo manual de estados:', conteoManualDesktop);
        console.log('** DEBUG DESKTOP: Total manual:', Object.values(conteoManualDesktop).reduce((a, b) => a + b, 0));
        
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
                    <div class="text-6xl mb-4">??</div>
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
        
        // Debug: Mostrar todas las solicitudes y sus estados
        console.log('** DEBUG: Todas las solicitudes y sus estados:');
        this.solicitudes.forEach((solicitud, index) => {
            console.log(`  ${index + 1}. ID: ${solicitud._id}, Estado: "${solicitud.estado}", Usuario: ${solicitud.usuario?.nombre || solicitud.usuario?.id_usuario || 'Unknown'}`);
        });
        
        // Contar estados manualmente
        const conteoManual = {
            pendiente: 0,
            aprobada: 0,
            rechazada: 0,
            entregado: 0,
            devuelto: 0,
            cancelada: 0,
            otros: 0
        };
        
        this.solicitudes.forEach(solicitud => {
            // Corregir estados undefined
            if (solicitud.estado === undefined || solicitud.estado === null || solicitud.estado === 'undefined') {
                solicitud.estado = 'pendiente';
                console.log('** Corrigiendo solicitud con estado undefined a pendiente (móvil):', solicitud._id);
            }
            
            switch(solicitud.estado) {
                case 'pendiente': conteoManual.pendiente++; break;
                case 'aprobada': conteoManual.aprobada++; break;
                case 'rechazada': conteoManual.rechazada++; break;
                case 'entregado': conteoManual.entregado++; break;
                case 'devuelto': conteoManual.devuelto++; break;
                case 'cancelada': conteoManual.cancelada++; break;
                default: conteoManual.otros++; break;
            }
        });
        
        console.log('** DEBUG: Conteo manual de estados:', conteoManual);
        console.log('** DEBUG: Total manual:', Object.values(conteoManual).reduce((a, b) => a + b, 0));
        
        // Actualizar totales por estado
        this.updateEstadisticas();
    }

    createDesktopRow(solicitud) {
        const estadoBadge = this.getEstadoBadge(solicitud.estado);
        const nombreUsuario = solicitud.usuario?.nombre_completo || 'Usuario desconocido';
        const elementosInfo = this.getElementosInfo(solicitud);
        
        // Determinar la fecha más importante a mostrar
        let fechaPrincipal = new Date(solicitud.createdAt).toLocaleDateString();
        let infoAdicional = '';
        
        if (solicitud.estado === 'aprobada') {
            // Para aprobadas, mostrar fecha de recogida
            fechaPrincipal = solicitud.fecha_recogida || new Date(solicitud.createdAt).toLocaleDateString();
            infoAdicional = '<div class="text-xs space-y-1 mt-1">' +
                (solicitud.fecha_recogida ? 
                    '<div class="text-green-600 font-medium">?? Recoger: ' + solicitud.fecha_recogida + '</div>' : '') +
                (solicitud.dias_disponibles ? 
                    '<div class="text-blue-600 font-medium">?? Días: ' + solicitud.dias_disponibles + '</div>' : '') +
            '</div>';
        } else if (solicitud.estado === 'entregado') {
            // Para entregadas, mostrar fecha de entrega y fecha límite de devolución
            // Priorizar fechas asignadas sobre cualquier otra cosa
            fechaPrincipal = solicitud.fecha_entrega || solicitud.fecha_limite_devolucion || solicitud.fecha_devolucion || new Date(solicitud.createdAt).toLocaleDateString();
            infoAdicional = '<div class="text-xs space-y-1 mt-1">' +
                (solicitud.fecha_entrega ? 
                    '<div class="text-orange-600 font-medium">?? Recogida: ' + solicitud.fecha_entrega + '</div>' : '') +
                (solicitud.horario_recogida ? 
                    '<div class="text-orange-600 font-medium">?? Horario: ' + solicitud.horario_recogida + '</div>' : '') +
                (solicitud.fecha_devolucion ? 
                    '<div class="text-red-600 font-medium">?? Devolver antes: ' + solicitud.fecha_devolucion + '</div>' : '') +
                (solicitud.fecha_limite_devolucion ? 
                    '<div class="text-red-600 font-medium">?? Devolver antes: ' + solicitud.fecha_limite_devolucion + '</div>' : '') +
                (!solicitud.fecha_entrega && !solicitud.fecha_devolucion && !solicitud.fecha_limite_devolucion ? 
                    '<div class="text-orange-600 font-medium">?? Entregado (sin fechas asignadas)</div>' : '') +
            '</div>';
        } else if (solicitud.estado === 'devuelto') {
            // Para devueltas, mostrar fecha límite de devolución
            if (!solicitud.fecha_devolucion && !solicitud.fecha_limite_devolucion) {
                fechaPrincipal = new Date(solicitud.createdAt).toLocaleDateString();
                infoAdicional = '<div class="text-xs space-y-1 mt-1">' +
                    '<div class="text-purple-600 font-medium">?? Devuelto (sin fechas asignadas)</div>' +
                    '<div class="text-red-600 font-medium">?? Asignar fechas de devolución</div>' +
                '</div>';
            } else {
                fechaPrincipal = solicitud.fecha_devolucion || solicitud.fecha_limite_devolucion || new Date(solicitud.createdAt).toLocaleDateString();
                infoAdicional = '<div class="text-xs space-y-1 mt-1">' +
                    (solicitud.fecha_devolucion ? 
                        '<div class="text-red-600 font-medium">?? Debía devolver antes: ' + solicitud.fecha_devolucion + '</div>' : '') +
                    (solicitud.fecha_limite_devolucion ? 
                        '<div class="text-red-600 font-medium">?? Debía devolver antes: ' + solicitud.fecha_limite_devolucion + '</div>' : '') +
                    '<div class="text-purple-600 font-medium">?? Devuelto: ' + fechaPrincipal + '</div>' +
                '</div>';
            }
        }
        
        return '<tr class="hover:bg-slate-50 relative">' +
            '<td class="px-4 py-3 text-sm">' + (solicitud._id?.slice(-6) || 'N/A') + '</td>' +
            '<td class="px-4 py-3 text-sm font-medium">' + nombreUsuario + '</td>' +
            '<td class="px-4 py-3 text-sm">' + elementosInfo + infoAdicional + '</td>' +
            '<td class="px-4 py-3 text-sm">' + fechaPrincipal + '</td>' +
            '<td class="px-4 py-3 text-sm">' + estadoBadge + '</td>' +
            '<td class="px-4 py-3 text-sm">' + (solicitud.observaciones || '-') + '</td>' +
            '<td class="px-4 py-3 text-sm relative">' +
                '<button ' +
                    'onclick="window.mobileAdminController.toggleMenu(\'' + solicitud._id + '\')" ' +
                    'class="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">' +
                    '??' +
                '</button>' +
                '<div id="menu-' + solicitud._id + '" class="hidden absolute right-0 top-12 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-48">' +
                    '<div class="p-2 space-y-1">' +
                        (solicitud.estado === 'pendiente' ? 
                            '<button ' +
                                'onclick="window.mobileAdminController.aprobarSolicitud(\'' + solicitud._id + '\')" ' +
                                'class="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded flex items-center gap-2">' +
                                '?? Aprobar' +
                            '</button>' +
                            '<button ' +
                                'onclick="window.mobileAdminController.rechazarSolicitud(\'' + solicitud._id + '\')" ' +
                                'class="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-2">' +
                                '?? Rechazar' +
                            '</button>' : '') +
                        (solicitud.estado === 'aprobada' ? 
                            '<button ' +
                                'onclick="window.mobileAdminController.entregarSolicitud(\'' + solicitud._id + '\')" ' +
                                'class="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center gap-2">' +
                                '?? Asignar Fecha' +
                            '</button>' : '') +
                        (solicitud.estado === 'entregado' ? 
                            '<button ' +
                                'onclick="window.mobileAdminController.devolverSolicitud(\'' + solicitud._id + '\')" ' +
                                'class="w-full text-left px-3 py-2 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 rounded flex items-center gap-2">' +
                                '?? Devolver' +
                            '</button>' : '') +
                        '<button ' +
                            'onclick="window.mobileAdminController.verDetalles(\'' + solicitud._id + '\')" ' +
                            'class="w-full text-left px-3 py-2 text-sm bg-slate-50 text-slate-700 hover:bg-slate-100 rounded flex items-center gap-2">' +
                            '?? Ver detalles' +
                        '</button>' +
                        '<button ' +
                            'onclick="window.mobileAdminController.eliminarSolicitud(\'' + solicitud._id + '\')" ' +
                            'class="w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-2">' +
                            '?? Eliminar' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</td>' +
        '</tr>';
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
        let rolIcono = '??';
        
        if (esDocente) {
            rolColor = '#f59e0b'; // Naranja para docentes
            rolBgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            rolIcono = '??';
        }
        
        // Determinar la fecha más importante a mostrar
        let fechaPrincipal = new Date(solicitud.createdAt).toLocaleDateString();
        let fechaInfo = '';
        
        console.log('** Procesando solicitud para tarjeta:', {
            _id: solicitud._id,
            estado: solicitud.estado,
            estado_tipo: typeof solicitud.estado,
            estado_comparacion: solicitud.estado === 'aprobada',
            estado_comparacion2: solicitud.estado === 'entregado',
            estado_comparacion3: solicitud.estado === 'devuelto'
        });
        
        if (solicitud.estado === 'aprobada') {
            // Para aprobadas, verificar si tiene fechas asignadas
            console.log('** Solicitud aprobada - Todos los campos:', {
                _id: solicitud._id,
                estado: solicitud.estado,
                fecha_recogida: solicitud.fecha_recogida,
                fecha_entrega: solicitud.fecha_entrega,
                horario_recogida: solicitud.horario_recogida,
                fecha_devolucion: solicitud.fecha_devolucion,
                fecha_limite_devolucion: solicitud.fecha_limite_devolucion,
                dias_disponibles: solicitud.dias_disponibles,
                observaciones: solicitud.observaciones,
                createdAt: solicitud.createdAt
            });
            
            const tieneFechasAsignadas = solicitud.fecha_entrega || solicitud.fecha_limite_devolucion || solicitud.fecha_devolucion || solicitud.horario_recogida;
            
            if (tieneFechasAsignadas) {
                // Mostrar todas las fechas si existen
                fechaPrincipal = solicitud.fecha_entrega || solicitud.fecha_limite_devolucion || solicitud.fecha_devolucion || new Date(solicitud.createdAt).toLocaleDateString();
                fechaInfo = '<div class="text-xs space-y-1">';
                
                if (solicitud.fecha_entrega) {
                    fechaInfo += '<div class="text-green-600 font-medium">?? Recoger: ' + solicitud.fecha_entrega + '</div>';
                }
                if (solicitud.horario_recogida) {
                    fechaInfo += '<div class="text-green-600 font-medium">?? Horario: ' + solicitud.horario_recogida + '</div>';
                }
                if (solicitud.fecha_limite_devolucion) {
                    fechaInfo += '<div class="text-red-600 font-medium">?? Límite de Devolución: ' + solicitud.fecha_limite_devolucion + '</div>';
                }
                if (solicitud.fecha_devolucion) {
                    fechaInfo += '<div class="text-red-600 font-medium">?? Devolver antes: ' + solicitud.fecha_devolucion + '</div>';
                }
                
                fechaInfo += '</div>';
                console.log('** Mostrando fechas para solicitud aprobada:', {
                    fechaPrincipal: fechaPrincipal,
                    tieneFechasAsignadas: tieneFechasAsignadas,
                    fechaInfo: fechaInfo
                });
            } else {
                // Mostrar fecha de creación si no hay fechas asignadas
                fechaPrincipal = solicitud.fecha_recogida || new Date(solicitud.createdAt).toLocaleDateString();
                fechaInfo = '<div class="text-xs text-green-600 font-medium">?? Recoger: ' + fechaPrincipal + '</div>';
                console.log('** Solicitud aprobada sin fechas asignadas, mostrando fecha de creación:', fechaPrincipal);
            }
        } else if (solicitud.estado === 'entregado') {
            // Para entregadas, mostrar todas las fechas relevantes
            console.log('** Solicitud entregada - Campos de fecha:', {
                fecha_entrega: solicitud.fecha_entrega,
                fecha_limite_devolucion: solicitud.fecha_limite_devolucion,
                fecha_devolucion: solicitud.fecha_devolucion,
                horario_recogida: solicitud.horario_recogida
            });
            
            // Verificar si hay fechas asignadas
            const tieneFechasAsignadas = solicitud.fecha_entrega || solicitud.fecha_limite_devolucion || solicitud.fecha_devolucion || solicitud.horario_recogida;
            
            if (tieneFechasAsignadas) {
                // Mostrar fechas si existen
                fechaPrincipal = solicitud.fecha_entrega || solicitud.fecha_limite_devolucion || solicitud.fecha_devolucion || new Date(solicitud.createdAt).toLocaleDateString();
                fechaInfo = '<div class="text-xs space-y-1">';
                
                if (solicitud.fecha_entrega) {
                    fechaInfo += '<div class="text-orange-600 font-medium">?? Recogida: ' + solicitud.fecha_entrega + '</div>';
                }
                if (solicitud.horario_recogida) {
                    fechaInfo += '<div class="text-orange-600 font-medium">?? Horario: ' + solicitud.horario_recogida + '</div>';
                }
                if (solicitud.fecha_limite_devolucion) {
                    fechaInfo += '<div class="text-red-600 font-medium">?? Límite de Devolución: ' + solicitud.fecha_limite_devolucion + '</div>';
                }
                if (solicitud.fecha_devolucion) {
                    fechaInfo += '<div class="text-red-600 font-medium">?? Devolver antes: ' + solicitud.fecha_devolucion + '</div>';
                }
                
                fechaInfo += '</div>';
            } else {
                // Mostrar mensaje si no hay fechas asignadas
                fechaPrincipal = new Date(solicitud.createdAt).toLocaleDateString();
                fechaInfo = '<div class="text-xs space-y-1">' +
                    '<div class="text-orange-600 font-medium">?? Entregado (sin fechas asignadas)</div>' +
                    '<div class="text-red-600 font-medium">?? Usar "Asignar Fecha" para agregar fechas</div>' +
                '</div>';
            }
        } else if (solicitud.estado === 'devuelto') {
            // Para devueltas, mostrar fecha de devolución
            fechaPrincipal = solicitud.fecha_devolucion || new Date(solicitud.createdAt).toLocaleDateString();
            fechaInfo = '<div class="text-xs text-purple-600 font-medium">?? Devuelto: ' + fechaPrincipal + '</div>';
        }

        return '<div class="bg-white rounded-lg shadow-md border border-slate-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">' +
            '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">' +
                '<div class="flex-1">' +
                    '<div class="flex items-center gap-2 mb-1">' +
                        '<span class="text-base sm:text-lg">' + rolIcono + '</span>' +
                        '<div>' +
                            '<div class="font-bold text-xs sm:text-xs" style="color: ' + rolColor + ';">' + (esEstudiante ? 'ESTUDIANTE' : 'DOCENTE') + '</div>' +
                            '<div class="text-xs sm:text-xs opacity-90">Solicitud #' + (solicitud._id?.slice(-6) || 'N/A') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="text-slate-600 font-medium text-sm sm:text-base mt-1">' + nombreUsuario + '</div>' +
                '</div>' +
                '<div class="text-right sm:text-left mt-2 sm:mt-0">' +
                    '<div class="text-slate-500 text-xs sm:text-sm">' + fechaPrincipal + '</div>' +
                    fechaInfo +
                    '<div class="mt-1">' + this.getEstadoBadge(solicitud.estado) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="space-y-2 sm:space-y-3">' +
                '<div class="text-xs sm:text-sm text-slate-700">' +
                    this.getElementosInfo(solicitud) +
                '</div>' +
                (solicitud.estado === 'aprobada' && (solicitud.fecha_recogida || solicitud.dias_disponibles) ? 
                    '<div class="bg-green-50 border border-green-200 rounded-lg p-2 space-y-1">' +
                        (solicitud.fecha_recogida ? 
                            '<div class="text-xs font-medium text-green-700">?? <span class="font-semibold">Fecha de recogida:</span> ' + solicitud.fecha_recogida + '</div>' : '') +
                        (solicitud.dias_disponibles ? 
                            '<div class="text-xs font-medium text-blue-700">?? <span class="font-semibold">Días disponibles:</span> ' + solicitud.dias_disponibles + '</div>' : '') +
                    '</div>' : '') +
                (solicitud.estado === 'entregado' && (solicitud.fecha_entrega || solicitud.fecha_recogida) ? 
                    '<div class="bg-orange-50 border border-orange-200 rounded-lg p-2 space-y-1">' +
                        (solicitud.fecha_entrega ? 
                            '<div class="text-xs font-medium text-orange-700">?? <span class="font-semibold">Fecha de entrega:</span> ' + solicitud.fecha_entrega + '</div>' : '') +
                        (solicitud.fecha_recogida ? 
                            '<div class="text-xs font-medium text-green-600">?? <span class="font-semibold">Fecha de recogida:</span> ' + solicitud.fecha_recogida + '</div>' : '') +
                    '</div>' : '') +
                '<div class="flex justify-end mt-2 sm:mt-3">' +
                    '<div class="relative">' +
                        '<button ' +
                            'id="menu-btn-' + solicitud._id + '" ' +
                            'onclick="window.mobileAdminController.toggleMenu(\'' + solicitud._id + '\')" ' +
                            'class="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110" ' +
                            'style="background: ' + rolBgGradient + '; color: white; box-shadow: 0 2px 8px ' + rolColor + '40;">' +
                            '<span class="text-sm sm:text-base">??</span>' +
                        '</button>' +
                        '<div id="menu-' + solicitud._id + '" class="hidden absolute right-0 sm:right-4 mt-1 sm:mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border-2" style="border-color: ' + rolColor + '; z-index: 1000;">' +
                            '<div class="menu-header" style="background: ' + rolBgGradient + '; color: white; padding: 12px; border-radius: 8px 8px 0 0;">' +
                                '<div class="flex items-center gap-2">' +
                                    '<span class="text-lg">' + rolIcono + '</span>' +
                                    '<div>' +
                                        '<div class="font-bold text-xs">' + (esEstudiante ? 'ESTUDIANTE' : 'DOCENTE') + '</div>' +
                                        '<div class="text-xs opacity-90">Solicitud #' + (solicitud._id?.slice(-6) || 'N/A') + '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="p-2">' +
                                this.createAdminActions(solicitud) +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    createAdminActions(solicitud) {
        const estado = solicitud.estado;
        let actions = [];

        // Acciones básicas (siempre disponibles)
        actions.push(
            '<button onclick="window.mobileAdminController.verDetalles(\'' + solicitud._id + '\')" ' +
            'class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600">' +
            '<span>??</span> Ver Detalles' +
            '</button>'
        );

        // Botón para enviar correo al estudiante (solo para administradores)
        if (solicitud.usuario && solicitud.usuario.correo_electronico) {
            actions.push(
                '<button onclick="window.mobileAdminController.enviarCorreoEstudiante(\'' + solicitud.usuario.correo_electronico + '\', \'' + solicitud._id + '\')" ' +
                'class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600">' +
                '<span>??</span> Enviar Correo' +
                '</button>'
            );
        } else {
            actions.push(
                '<div class="text-xs text-gray-500 px-3 py-2">No hay correo disponible</div>'
            );
        }

        // Acciones según estado
        if (estado === 'pendiente') {
            actions.push(
                '<div class="border-t border-slate-200 my-1"></div>' +
                '<button onclick="window.mobileAdminController.aprobarSolicitud(\'' + solicitud._id + '\')" ' +
                'class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-green-50 hover:text-green-600">' +
                '<span>??</span> Aprobar' +
                '</button>' +
                '<button onclick="window.mobileAdminController.rechazarSolicitud(\'' + solicitud._id + '\')" ' +
                'class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-red-50 hover:text-red-600">' +
                '<span>??</span> Rechazar' +
                '</button>'
            );
        }

        if (estado === 'aprobada') {
            actions.push(
                '<div class="border-t border-slate-200 my-1"></div>' +
                '<button onclick="window.mobileAdminController.entregarSolicitud(\'' + solicitud._id + '\')" ' +
                'class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600">' +
                '<span>??</span> Asignar Fecha' +
                '</button>'
            );
        }

        if (estado === 'entregado') {
            actions.push(
                '<div class="border-t border-slate-200 my-1"></div>' +
                '<button onclick="window.mobileAdminController.devolverSolicitud(\'' + solicitud._id + '\')" ' +
                'class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600">' +
                '<span>??</span> Devolver' +
                '</button>'
            );
        }

        // Botón eliminar (siempre disponible para admin)
        actions.push(
            '<div class="border-t border-slate-200 my-1"></div>' +
            '<button onclick="window.mobileAdminController.eliminarSolicitud(\'' + solicitud._id + '\')" ' +
            'class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 hover:bg-red-50 text-red-600">' +
            '<span>??</span> Eliminar' +
            '</button>'
        );
        
        return actions.join('');
    }

    getElementosInfo(solicitud) {
        // Verificar si hay elementos usando la estructura correcta
        const elementos = solicitud.elementos || [];
        let totalCantidad = 0;
        const elementosLista = [];
        
        if (elementos.length > 0) {
            elementos.forEach(elemento => {
                const nombre = elemento.nombre || elemento.descripcion || elemento.id_insumo?.NombProducto || 'Elemento';
                const cantidad = elemento.cantidad || 1;
                elementosLista.push(nombre + ' (' + cantidad + ')');
                totalCantidad += cantidad;
            });
        } else {
            // Fallback para estructuras antiguas
            if (solicitud.insumos && solicitud.insumos.length > 0) {
                solicitud.insumos.forEach(insumo => {
                    const nombre = insumo.id_insumo?.NombProducto || insumo.descripcion || 'Insumo';
                    const cantidad = insumo.cantidad || 1;
                    elementosLista.push(nombre + ' (' + cantidad + ')');
                    totalCantidad += cantidad;
                });
            }
            
            if (solicitud.activos && solicitud.activos.length > 0) {
                solicitud.activos.forEach(activo => {
                    elementosLista.push(activo.nombre || 'Activo');
                    totalCantidad += 1;
                });
            }
        }
        
        if (elementosLista.length === 0) {
            return '<span class="text-slate-400 italic">Sin elementos</span>';
        }
        
        // Formato profesional: lista con total al final
        const elementosHtml = elementosLista.map((elemento, index) => {
            const esUltimo = index === elementosLista.length - 1;
            return '<span class="text-slate-700">' + elemento + (esUltimo ? '' : ', ') + '</span>';
        }).join('');
        
        return '<div class="space-y-1">' +
            '<div class="text-sm">' + elementosHtml + '</div>' +
            '<div class="text-xs text-slate-500 font-semibold bg-slate-50 inline-block px-2 py-1 rounded">' +
                'Total: ' + totalCantidad + ' ' + (totalCantidad === 1 ? 'elemento' : 'elementos') +
            '</div>' +
        '</div>';
    }

    getEstadoBadge(estado) {
        // Manejar casos específicos del backend
        if (!estado || estado === null || estado === undefined || estado === 'No field') {
            return '<span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">?? Sin Estado</span>';
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
        
        return badges[estado] || '<span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Estado: ' + estado + '</span>';
    }

    getFilteredSolicitudes() {
        console.log('** Filtros actuales:', this.filtros);
        
        let filtradas = this.solicitudes;

        if (this.filtros.estado !== 'todos') {
            filtradas = filtradas.filter(s => s.estado === this.filtros.estado);
            console.log('** Filtrando por estado "' + this.filtros.estado + '":', filtradas.length);
        }

        if (this.filtros.busqueda) {
            filtradas = filtradas.filter(s => {
                const textoFila = (s.usuario?.nombre_completo || '') + ' ' + (s._id || '') + ' ' + (this.getElementosInfo(s) || '');
                return textoFila.toLowerCase().includes(this.filtros.busqueda.toLowerCase());
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
        console.log('** Solicitudes cargadas correctamente:', this.solicitudes.length);
        console.log('** Total solicitudes:', this.solicitudes.length);
        const stats = {
            pendientes: this.solicitudes.filter(s => s.estado === 'pendiente').length,
            aprobadas: this.solicitudes.filter(s => s.estado === 'aprobada').length,
            rechazadas: this.solicitudes.filter(s => s.estado === 'rechazada').length,
            entregadas: this.solicitudes.filter(s => s.estado === 'entregado').length,
            devueltas: this.solicitudes.filter(s => s.estado === 'devuelto').length,
            canceladas: this.solicitudes.filter(s => s.estado === 'cancelada').length
        };
        
        // Buscar específicamente la solicitud pendiente mencionada en el error
        const solicitudPendienteBuscada = this.solicitudes.find(s => s._id === '69da77c367dda5d9e3ac4e36');
        console.log('** Búsqueda de solicitud pendiente 69da77c367dda5d9e3ac4e36:', !!solicitudPendienteBuscada);
        if (solicitudPendienteBuscada) {
            console.log('** Solicitud encontrada:', solicitudPendienteBuscada);
        } else {
            console.log('** Solicitudes pendientes encontradas:', this.solicitudes.filter(s => s.estado === 'pendiente'));
        }

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
        const menu = document.getElementById('menu-' + solicitudId);
        
        if (!menu) {
            console.error('** ERROR: No se encontró el menú para la solicitud:', solicitudId);
            return;
        }
        
        // Cerrar solo los menús visibles, excluyendo los botones
        const visibleMenus = document.querySelectorAll('[id^="menu-"]:not([id^="menu-btn-"])');
        visibleMenus.forEach(m => {
            if (m.id !== 'menu-' + solicitudId && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
            }
        });

        menu.classList.toggle('hidden');
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
        const menu = document.getElementById('menu-' + solicitudId);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Crear modal de detalles
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = '<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">' +
            '<div class="flex justify-between items-center mb-4">' +
                '<h3 class="text-xl font-bold text-slate-800">?? Detalles de Solicitud (Admin)</h3>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="text-slate-400 hover:text-slate-600">' +
                    '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
            '<div class="space-y-4">' +
                '<div class="grid grid-cols-2 gap-4">' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700">ID Solicitud</label>' +
                        '<p class="text-slate-900 font-mono">#' + (solicitud._id?.slice(-6) || 'N/A') + '</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700">Estado</label>' +
                        '<div class="mt-1">' + this.getEstadoBadge(solicitud.estado) + '</div>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700">Fecha de Solicitud</label>' +
                        '<p class="text-slate-900">' + new Date(solicitud.createdAt).toLocaleDateString() + '</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700">Usuario</label>' +
                        '<p class="text-slate-900">' + (solicitud.usuario?.nombre_completo || 'N/A') + '</p>' +
                    '</div>' +
                    (solicitud.fecha_recogida ? 
                        '<div>' +
                            '<label class="block text-sm font-medium text-slate-700">?? Fecha de Recogida</label>' +
                            '<p class="text-slate-900 bg-green-50 p-2 rounded border border-green-200">' + solicitud.fecha_recogida + '</p>' +
                        '</div>' : '') +
                    (solicitud.dias_disponibles ? 
                        '<div>' +
                            '<label class="block text-sm font-medium text-slate-700">?? Días Disponibles</label>' +
                            '<p class="text-slate-900 bg-blue-50 p-2 rounded border border-blue-200">' + solicitud.dias_disponibles + '</p>' +
                        '</div>' : '') +
                    (solicitud.fecha_entrega ? 
                        '<div>' +
                            '<label class="block text-sm font-medium text-slate-700">?? Fecha Asignada para Recogida</label>' +
                            '<p class="text-slate-900 bg-orange-50 p-2 rounded border border-orange-200">' + solicitud.fecha_entrega + '</p>' +
                        '</div>' : '') +
                    (solicitud.horario_recogida ? 
                        '<div>' +
                            '<label class="block text-sm font-medium text-slate-700">?? Horario de Recogida</label>' +
                            '<p class="text-slate-900 bg-orange-50 p-2 rounded border border-orange-200">' + solicitud.horario_recogida + '</p>' +
                        '</div>' : '') +
                    (solicitud.fecha_devolucion ? 
                        '<div>' +
                            '<label class="block text-sm font-medium text-slate-700">?? Fecha Máxima de Devolución</label>' +
                            '<p class="text-slate-900 bg-red-50 p-2 rounded border border-red-200">' + solicitud.fecha_devolucion + '</p>' +
                        '</div>' : '') +
                '</div>' +
                '<div>' +
                    '<label class="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>' +
                    '<p class="text-slate-700 bg-slate-50 p-3 rounded">' + (solicitud.observacion || solicitud.observaciones || 'Sin observaciones') + '</p>' +
                '</div>' +
                '<div>' +
                    '<label class="block text-sm font-medium text-slate-700 mb-2">Artículos Solicitados</label>' +
                    '<div class="space-y-2">' + this.getElementosInfo(solicitud) + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
    }

    async enviarCorreoEstudiante(correo, solicitudId) {
        console.log('** Enviando correo a estudiante:', correo, 'solicitud:', solicitudId);
        
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            console.error('** Solicitud no encontrada:', solicitudId);
            return;
        }
        
        // Cerrar el menú
        const menu = document.getElementById('menu-' + solicitudId);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Crear modal para enviar correo
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = '<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">' +
            '<div class="flex justify-between items-center mb-4">' +
                '<h3 class="text-xl font-bold text-slate-800">?? Enviar Correo al Estudiante</h3>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="text-slate-400 hover:text-slate-600">' +
                    '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
            '<form onsubmit="window.mobileAdminController.procesarEnvioCorreo(event, \'' + correo + '\', \'' + solicitudId + '\')">' +
                '<div class="space-y-4">' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">Para:</label>' +
                        '<input type="email" value="' + correo + '" readonly class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">Asunto:</label>' +
                        '<input type="text" id="correo-asunto" value="Información sobre tu solicitud #' + (solicitud._id?.slice(-6) || 'N/A') + '" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">Mensaje:</label>' +
                        '<textarea id="correo-mensaje" rows="6" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">Estimado(a) ' + (solicitud.usuario?.nombre_completo || 'estudiante') + ',\n\nTe escribimos para informarte sobre el estado de tu solicitud.\n\nEstado actual: ' + solicitud.estado + '\n\nSaludos cordiales.</textarea>' +
                    '</div>' +
                    '<div class="flex justify-end gap-3">' +
                        '<button type="button" onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>' +
                        '<button type="submit" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">Enviar Correo</button>' +
                    '</div>' +
                '</div>' +
            '</form>' +
        '</div>';
        
        document.body.appendChild(modal);
    }

    async procesarEnvioCorreo(event, correo, solicitudId) {
        event.preventDefault();
        
        const asunto = document.getElementById('correo-asunto').value;
        const mensaje = document.getElementById('correo-mensaje').value;
        
        if (!asunto || !mensaje) {
            alert('Por favor completa todos los campos');
            return;
        }
        
        // Cerrar el modal original
        document.querySelector('.fixed').remove();
        
        // Intentar enviar al servidor primero
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch('http://localhost:4000/api/correo/enviar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    para: correo,
                    asunto: asunto,
                    mensaje: mensaje,
                    solicitudId: solicitudId
                })
            });
            
            if (response.ok) {
                console.log('** Correo enviado exitosamente');
                alert('Correo enviado exitosamente');
                return;
            }
        } catch (error) {
            console.log('** API de correo no disponible, redirigiendo a cliente de correo');
        }
        
        // Si el servidor no funciona, redirigir directamente al cliente de correo
        window.open('mailto:' + correo + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(mensaje), '_blank');
    }

    async aprobarSolicitud(solicitudId) {
        console.log('** Admin aprobar solicitud:', solicitudId);
        
        // Cerrar el menú
        const menu = document.getElementById('menu-' + solicitudId);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Crear modal para aprobación con fecha informativa
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = '<div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4">' +
            '<div class="flex justify-between items-center mb-4">' +
                '<h3 class="text-xl font-bold text-slate-800">?? Aprobar y Asignar Fechas</h3>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="text-slate-400 hover:text-slate-600">' +
                    '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
            '<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">' +
                '<p class="text-blue-800 text-sm font-medium">?? Información para el estudiante:</p>' +
                '<p class="text-blue-700 text-sm mt-1">Las fechas que indiques aquí serán visibles para que el estudiante sepa cuándo recoger y devolver los artículos.</p>' +
            '</div>' +
            '<form onsubmit="window.mobileAdminController.procesarAprobacion(event, \'' + solicitudId + '\')">' +
                '<div class="space-y-4">' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">?? Fecha para recoger los artículos:</label>' +
                        '<input type="date" id="fecha-recogida" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">' +
                        '<p class="text-xs text-slate-500 mt-1">Esta fecha será visible para el estudiante</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">?? Horario de recogida:</label>' +
                        '<input type="text" id="horario-recogida-aprobacion" placeholder="Ej: 10:00 AM - 12:00 PM" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">' +
                        '<p class="text-xs text-slate-500 mt-1">Indica el horario específico</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">?? Fecha máxima de devolución:</label>' +
                        '<input type="date" id="fecha-devolucion-aprobacion" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">' +
                        '<p class="text-xs text-slate-500 mt-1">Fecha límite para devolver los artículos</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">?? Días disponibles para recoger:</label>' +
                        '<input type="text" id="dias-disponibles" placeholder="Ej: Lunes, Miércoles, Viernes de 8am a 4pm" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">' +
                        '<p class="text-xs text-slate-500 mt-1">Indica los días y horarios disponibles</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">Observaciones:</label>' +
                        '<textarea id="observaciones-aprobacion" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">Solicitud aprobada con fechas asignadas</textarea>' +
                    '</div>' +
                    '<div class="flex justify-end gap-3">' +
                        '<button type="button" onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>' +
                        '<button type="submit" class="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors">Aprobar y Asignar Fechas</button>' +
                    '</div>' +
                '</div>' +
            '</form>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        // Establecer fecha mínima como hoy
        const fechaInput = document.getElementById('fecha-recogida');
        const fechaDevolucionInput = document.getElementById('fecha-devolucion-aprobacion');
        
        if (fechaInput) {
            const hoy = new Date().toISOString().split('T')[0];
            fechaInput.min = hoy;
            fechaInput.value = hoy;
            
            // Establecer fecha mínima de devolución (después de la fecha de recogida)
            if (fechaDevolucionInput) {
                const fechaRecogida = new Date(hoy);
                fechaRecogida.setDate(fechaRecogida.getDate() + 1); // Mínimo 1 día después
                const fechaMinDevolucion = fechaRecogida.toISOString().split('T')[0];
                fechaDevolucionInput.min = fechaMinDevolucion;
                
                // Establecer valor por defecto (7 días después)
                const fechaDefectoDevolucion = new Date(hoy);
                fechaDefectoDevolucion.setDate(fechaDefectoDevolucion.getDate() + 7);
                fechaDevolucionInput.value = fechaDefectoDevolucion.toISOString().split('T')[0];
                
                // Agregar evento para actualizar la fecha mínima de devolución cuando cambie la fecha de recogida
                fechaInput.addEventListener('change', function() {
                    const nuevaFechaRecogida = new Date(this.value);
                    nuevaFechaRecogida.setDate(nuevaFechaRecogida.getDate() + 1); // Mínimo 1 día después
                    const nuevaFechaMin = nuevaFechaRecogida.toISOString().split('T')[0];
                    fechaDevolucionInput.min = nuevaFechaMin;
                    
                    // Si la fecha de devolución actual es menor que la nueva mínima, actualizarla
                    if (fechaDevolucionInput.value < nuevaFechaMin) {
                        fechaDevolucionInput.value = nuevaFechaMin;
                    }
                });
            }
        }
    }

    async procesarAprobacion(event, solicitudId) {
        event.preventDefault();
        
        const fechaRecogida = document.getElementById('fecha-recogida').value;
        const horarioRecogida = document.getElementById('horario-recogida-aprobacion').value;
        const fechaDevolucion = document.getElementById('fecha-devolucion-aprobacion').value;
        const diasDisponibles = document.getElementById('dias-disponibles').value;
        const observaciones = document.getElementById('observaciones-aprobacion').value;
        
        if (!fechaRecogida || !horarioRecogida || !fechaDevolucion || !diasDisponibles) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }
        
        try {
            const token = localStorage.getItem('utn_token');
            
            const requestBody = {
                nuevoEstadoAdmin: 'aprobada',
                fecha_recogida: fechaRecogida,
                horario_recogida: horarioRecogida,
                fecha_entrega: fechaRecogida,
                fecha_devolucion: fechaDevolucion,
                fecha_limite_devolucion: fechaDevolucion,
                dias_disponibles: diasDisponibles,
                observaciones: observaciones
            };
            
            console.log('** Enviando aprobación con fechas:');
            console.log('** URL:', 'http://localhost:4000/api/solicitudes/admin-gestion/' + solicitudId);
            console.log('** Body completo:', requestBody);
            console.log('** Campos específicos:');
            console.log('  - nuevoEstadoAdmin:', requestBody.nuevoEstadoAdmin);
            console.log('  - fecha_recogida:', requestBody.fecha_recogida);
            console.log('  - horario_recogida:', requestBody.horario_recogida);
            console.log('  - fecha_entrega:', requestBody.fecha_entrega);
            console.log('  - fecha_devolucion:', requestBody.fecha_devolucion);
            console.log('  - fecha_limite_devolucion:', requestBody.fecha_limite_devolucion);
            console.log('  - dias_disponibles:', requestBody.dias_disponibles);
            console.log('  - observaciones:', requestBody.observaciones);
            
            const response = await fetch('http://localhost:4000/api/solicitudes/admin-gestion/' + solicitudId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a aprobada:', solicitudId);
                    solicitudLocal.estado = 'aprobada';
                    solicitudLocal.fecha_recogida = fechaRecogida;
                    solicitudLocal.dias_disponibles = diasDisponibles;
                    solicitudLocal.observacion = observaciones;
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'aprobada';
                        solicitudAll.fecha_recogida = fechaRecogida;
                        solicitudAll.dias_disponibles = diasDisponibles;
                        solicitudAll.observacion = observaciones;
                    }
                    
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    console.log('** Interfaz actualizada inmediatamente');
                }
                
                alert('Solicitud aprobada exitosamente');
                document.querySelector('.fixed').remove();
                
                // Recargar datos frescos del backend (en background)
                setTimeout(() => {
                    this.loadSolicitudes();
                }, 1000);
            } else {
                const errorText = await response.text();
                console.error('** Error al aprobar solicitud - Status:', response.status);
                console.error('** Error response:', errorText);
                console.error('** Datos enviados:', {
                    nuevoEstadoAdmin: 'aprobada',
                    fecha_recogida: fechaRecogida,
                    dias_disponibles: diasDisponibles,
                    observaciones: observaciones
                });
                alert('Error al aprobar solicitud: ' + response.status + ' - ' + errorText);
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            console.error('** Stack trace:', error.stack);
            alert('Error al aprobar solicitud: ' + error.message);
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
            
            const url = 'http://localhost:4000/api/solicitudes/admin-gestion/' + solicitudId;
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
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('** Response status:', response.status);
            console.log('** Response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('** Error en respuesta:', errorText);
                alert('Error al rechazar solicitud: ' + response.status + ' ' + response.statusText);
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
        console.log('** Admin asignar fecha de recogida:', solicitudId);
        
        // Cerrar el menú
        const menu = document.getElementById('menu-' + solicitudId);
        if (menu) {
            menu.classList.add('hidden');
        }
        
        // Buscar la solicitud actual para obtener sus fechas
        const solicitudActual = this.solicitudes.find(s => s._id === solicitudId);
        console.log('** Solicitud actual para modal:', solicitudActual);
        
        // Crear modal para asignar fecha de recogida
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = '<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">' +
            '<div class="flex justify-between items-center mb-4">' +
                '<h3 class="text-xl font-bold text-slate-800">?? Asignar Fechas del Préstamo</h3>' +
                '<button onclick="this.closest(\'.fixed\').remove()" class="text-slate-400 hover:text-slate-600">' +
                    '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
            '<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">' +
                '<p class="text-green-800 text-sm font-medium">?? Información para el estudiante:</p>' +
                '<p class="text-green-700 text-sm mt-1">Las fechas que indiques aquí serán visibles para que el estudiante sepa cuándo recoger y devolver los artículos.</p>' +
            '</div>' +
            '<form onsubmit="window.mobileAdminController.procesarEntrega(event, \'' + solicitudId + '\')">' +
                '<div class="space-y-4">' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">?? Fecha para recoger los artículos:</label>' +
                        '<input type="date" id="fecha-entrega" value="' + (solicitudActual?.fecha_entrega || '') + '" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                        '<p class="text-xs text-slate-500 mt-1">Esta fecha será visible para el estudiante</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">?? Horario de recogida:</label>' +
                        '<input type="text" id="horario-recogida" value="' + (solicitudActual?.horario_recogida || '') + '" placeholder="Ej: 10:00 AM - 12:00 PM" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                        '<p class="text-xs text-slate-500 mt-1">Indica el horario específico</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">?? Fecha máxima de devolución:</label>' +
                        '<input type="date" id="fecha-devolucion" value="' + (solicitudActual?.fecha_devolucion || solicitudActual?.fecha_limite_devolucion || '') + '" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                        '<p class="text-xs text-slate-500 mt-1">Fecha límite para devolver los artículos</p>' +
                    '</div>' +
                    '<div>' +
                        '<label class="block text-sm font-medium text-slate-700 mb-1">Observaciones:</label>' +
                        '<textarea id="observaciones-entrega" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' + (solicitudActual?.observaciones || '') + '</textarea>' +
                    '</div>' +
                    '<div class="flex justify-end gap-3">' +
                        '<button type="button" onclick="this.closest(\'.fixed\').remove()" class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>' +
                        '<button type="submit" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">Asignar Fecha</button>' +
                    '</div>' +
                '</div>' +
            '</form>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        // Establecer fecha actual por defecto
        const fechaInput = document.getElementById('fecha-entrega');
        const fechaDevolucionInput = document.getElementById('fecha-devolucion');
        
        if (fechaInput) {
            const hoy = new Date().toISOString().split('T')[0];
            fechaInput.min = hoy;
            fechaInput.value = hoy;
            
            // Establecer fecha mínima de devolución (después de la fecha de entrega)
            if (fechaDevolucionInput) {
                const fechaEntrega = new Date(hoy);
                fechaEntrega.setDate(fechaEntrega.getDate() + 7); // 7 días después por defecto
                const fechaMinDevolucion = fechaEntrega.toISOString().split('T')[0];
                fechaDevolucionInput.min = fechaMinDevolucion;
                fechaDevolucionInput.value = fechaMinDevolucion;
                
                // Agregar evento para actualizar la fecha mínima de devolución cuando cambie la fecha de entrega
                fechaInput.addEventListener('change', function() {
                    const nuevaFechaEntrega = new Date(this.value);
                    nuevaFechaEntrega.setDate(nuevaFechaEntrega.getDate() + 1); // Mínimo 1 día después
                    const nuevaFechaMin = nuevaFechaEntrega.toISOString().split('T')[0];
                    fechaDevolucionInput.min = nuevaFechaMin;
                    
                    // Si la fecha de devolución actual es menor que la nueva mínima, actualizarla
                    if (fechaDevolucionInput.value < nuevaFechaMin) {
                        fechaDevolucionInput.value = nuevaFechaMin;
                    }
                });
            }
        }
    }

    async procesarEntrega(event, solicitudId) {
        event.preventDefault();
        
        const fechaEntrega = document.getElementById('fecha-entrega').value;
        const horarioRecogida = document.getElementById('horario-recogida').value;
        const fechaDevolucion = document.getElementById('fecha-devolucion').value;
        const observaciones = document.getElementById('observaciones-entrega').value;
        
        if (!fechaEntrega || !horarioRecogida || !fechaDevolucion) {
            alert('Por favor completa la fecha de recogida, horario y fecha de devolución');
            return;
        }
        
        try {
            const token = localStorage.getItem('utn_token');
            
            const requestBody = {
                nuevoEstadoAdmin: 'aprobada',
                fecha_entrega: fechaEntrega,
                horario_recogida: horarioRecogida,
                fecha_devolucion: fechaDevolucion,
                fecha_limite_devolucion: fechaDevolucion,
                observaciones: observaciones
            };
            
            console.log('** Enviando petición de asignación de fechas:');
            console.log('** URL:', 'http://localhost:4000/api/solicitudes/admin-gestion/' + solicitudId);
            console.log('** Body completo:', requestBody);
            console.log('** Campos específicos:');
            console.log('  - nuevoEstadoAdmin:', requestBody.nuevoEstadoAdmin);
            console.log('  - fecha_entrega:', requestBody.fecha_entrega);
            console.log('  - horario_recogida:', requestBody.horario_recogida);
            console.log('  - fecha_devolucion:', requestBody.fecha_devolucion);
            console.log('  - fecha_limite_devolucion:', requestBody.fecha_limite_devolucion);
            console.log('  - observaciones:', requestBody.observaciones);
            
            const response = await fetch('http://localhost:4000/api/solicitudes/admin-gestion/' + solicitudId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                // Verificar qué respondió el servidor
                const responseData = await response.json();
                console.log('** Respuesta del servidor al asignar fechas (procesarEntrega):', responseData);
                console.log('** Estado en respuesta:', responseData.estado);
                console.log('** Fechas en respuesta:', {
                    fecha_entrega: responseData.fecha_entrega,
                    fecha_devolucion: responseData.fecha_devolucion,
                    horario_recogida: responseData.horario_recogida
                });
                
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a aprobada con fechas:', solicitudId);
                    console.log('** Datos a guardar:', {
                        estado: 'aprobada',
                        fecha_recogida: fechaEntrega,
                        horario_recogida: horarioRecogida,
                        fecha_entrega: fechaEntrega,
                        fecha_devolucion: fechaDevolucion,
                        fecha_limite_devolucion: fechaDevolucion,
                        observaciones: observaciones
                    });
                    
                    solicitudLocal.estado = 'aprobada';
                    solicitudLocal.fecha_recogida = fechaEntrega;
                    solicitudLocal.horario_recogida = horarioRecogida;
                    solicitudLocal.fecha_entrega = fechaEntrega;
                    solicitudLocal.fecha_devolucion = fechaDevolucion;
                    solicitudLocal.fecha_limite_devolucion = fechaDevolucion;
                    solicitudLocal.observaciones = observaciones;
                    solicitudLocal.observacion = observaciones;
                    
                    console.log('** Solicitud actualizada localmente:', solicitudLocal);
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'aprobada';
                        solicitudAll.fecha_entrega = fechaEntrega;
                        solicitudAll.horario_recogida = horarioRecogida;
                        solicitudAll.fecha_devolucion = fechaDevolucion;
                        solicitudAll.observacion = observaciones;
                    }
                    
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    
                    // Mostrar mensaje de éxito
                    alert('Solicitud aprobada y fechas asignadas exitosamente');
                    
                    // El servidor ahora devuelve las fechas en la respuesta
                    console.log('** Usando respuesta del servidor con fechas:');
                    console.log('** Respuesta completa:', responseData);
                    
                    // Actualizar solicitud local con los datos del servidor
                    if (responseData.solicitud) {
                        solicitudLocal.fecha_entrega = responseData.solicitud.fecha_entrega;
                        solicitudLocal.fecha_devolucion = responseData.solicitud.fecha_devolucion;
                        solicitudLocal.fecha_limite_devolucion = responseData.solicitud.fecha_limite_devolucion;
                        solicitudLocal.horario_recogida = responseData.solicitud.horario_recogida;
                        solicitudLocal.fecha_recogida = responseData.solicitud.fecha_recogida;
                        solicitudLocal.dias_disponibles = responseData.solicitud.dias_disponibles;
                        
                        // Actualizar también en allSolicitudes si existe
                        const solicitudAllUpdate = this.allSolicitudes.find(s => s._id === solicitudId);
                        if (solicitudAllUpdate) {
                            solicitudAllUpdate.fecha_entrega = responseData.solicitud.fecha_entrega;
                            solicitudAllUpdate.fecha_devolucion = responseData.solicitud.fecha_devolucion;
                            solicitudAllUpdate.fecha_limite_devolucion = responseData.solicitud.fecha_limite_devolucion;
                            solicitudAllUpdate.horario_recogida = responseData.solicitud.horario_recogida;
                            solicitudAllUpdate.fecha_recogida = responseData.solicitud.fecha_recogida;
                            solicitudAllUpdate.dias_disponibles = responseData.solicitud.dias_disponibles;
                        }
                        
                        console.log('** Fechas actualizadas desde servidor:', {
                            fecha_entrega: responseData.solicitud.fecha_entrega,
                            fecha_devolucion: responseData.solicitud.fecha_devolucion,
                            horario_recogida: responseData.solicitud.horario_recogida,
                            fecha_recogida: responseData.solicitud.fecha_recogida,
                            dias_disponibles: responseData.solicitud.dias_disponibles
                        });
                    }
                    
                    // Renderizar inmediatamente para mostrar las fechas
                    this.renderSolicitudes();
                    this.updateEstadisticas();
                    
                    // Recargar solicitudes para sincronizar otros datos
                    console.log('** Recargando solicitudes para sincronización completa...');
                    await this.loadSolicitudes();
                    console.log('** Solicitudes recargadas después de asignar fechas');
                }
            } else {
                const errorText = await response.text();
                console.error('** Error al asignar fechas - Status:', response.status);
                console.error('** Error response:', errorText);
                console.error('** Datos enviados:', requestBody);
                console.error('** NO se actualizó el estado local debido al error del servidor');
                alert('Error al asignar fechas: ' + response.status + ' - ' + errorText);
            }
        } catch (error) {
            console.error('Error asignando fecha de recogida:', error);
            alert('Error al asignar fecha de recogida');
            // Cerrar todos los modales abiertos
            document.querySelectorAll('.fixed').forEach(modal => modal.remove());
        }
    }

    async devolverSolicitud(solicitudId) {
        console.log('** Admin devolver solicitud:', solicitudId);
        
        const motivo = prompt('Motivo de la devolución:');
        if (!motivo) {
            console.log('** Devolución cancelada - no se proporcionó motivo');
            return;
        }
        
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch('http://localhost:4000/api/solicitudes/admin-gestion/' + solicitudId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    nuevoEstadoAdmin: 'devuelto',
                    observaciones: motivo
                })
            });
            
            if (response.ok) {
                // Actualizar el estado local inmediatamente
                const solicitudLocal = this.solicitudes.find(s => s._id === solicitudId);
                if (solicitudLocal) {
                    console.log('** Actualizando estado local a devuelto:', solicitudId);
                    solicitudLocal.estado = 'devuelto';
                    solicitudLocal.observacion = motivo;
                    
                    const solicitudAll = this.allSolicitudes.find(s => s._id === solicitudId);
                    if (solicitudAll) {
                        solicitudAll.estado = 'devuelto';
                        solicitudAll.observacion = motivo;
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
            const response = await fetch('http://localhost:4000/api/solicitudes/' + solicitudId, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
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
        
        const activeBtn = document.getElementById('mobile-' + estado + '-btn');
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
