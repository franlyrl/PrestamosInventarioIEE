// Controlador de la página de Solicitudes
class SolicitudesController {
    constructor() {
        this.solicitudes = [];
        this.filtros = {
            busqueda: '',
            estado: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async initialize() {
        console.log('🚀 Inicializando SolicitudesController...');
        await this.cargarSolicitudes();
        this.setupEventListeners();

        // Renderizar para actualizar contadores
        this.renderSolicitudes();

        console.log('✅ SolicitudesController inicializado completamente');

        // Forzar recarga de datos después de un breve momento
        setTimeout(() => {
            console.log('🔄 Recargando solicitudes por si acaso...');
            this.cargarSolicitudes();
        }, 1000);
    }

    setupEventListeners() {
        // Búsqueda
        const busquedaInput = document.getElementById('busqueda-input');
        if (busquedaInput) {
            busquedaInput.addEventListener('input', (e) => {
                this.filtros.busqueda = e.target.value;
                this.renderSolicitudes();
            });
        }

        // Estado
        const estadoSelect = document.getElementById('estado-filter');
        if (estadoSelect) {
            estadoSelect.addEventListener('change', (e) => {
                this.filtros.estado = e.target.value;
                this.renderSolicitudes();
            });
        }

        // Fechas
        const fechaDesde = document.getElementById('fecha-desde');
        const fechaHasta = document.getElementById('fecha-hasta');

        if (fechaDesde) {
            fechaDesde.addEventListener('change', (e) => {
                this.filtros.fechaDesde = e.target.value;
                this.renderSolicitudes();
            });
        }

        if (fechaHasta) {
            fechaHasta.addEventListener('change', (e) => {
                this.filtros.fechaHasta = e.target.value;
                this.renderSolicitudes();
            });
        }

        // Botones
        const buscarBtn = document.getElementById('buscar-btn');
        const limpiarBtn = document.getElementById('limpiar-btn');
        const exportarBtn = document.getElementById('exportar-btn');
        const imprimirBtn = document.getElementById('imprimir-btn');

        if (buscarBtn) {
            buscarBtn.addEventListener('click', () => this.renderSolicitudes());
        }

        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
        }

        if (exportarBtn) {
            exportarBtn.addEventListener('click', () => this.exportarDatos());
        }

        if (imprimirBtn) {
            imprimirBtn.addEventListener('click', () => this.imprimirDatos());
        }

        // Paginación
        const paginaAnterior = document.getElementById('pagina-anterior');
        const paginaSiguiente = document.getElementById('pagina-siguiente');

        if (paginaAnterior) {
            paginaAnterior.addEventListener('click', () => this.cambiarPagina(-1));
        }

        if (paginaSiguiente) {
            paginaSiguiente.addEventListener('click', () => this.cambiarPagina(1));
        }
    }

    async cargarSolicitudes() {
        try {
            Utils.showLoading(true);
            console.log('🔄 Cargando solicitudes del sistema...');

            // Cargar TODAS las solicitudes del sistema (para administradores)
            const response = await ApiService.getSolicitudes();
            console.log('📡 Respuesta de getSolicitudes:', response);
            this.solicitudes = response.data || response;
            console.log('✅ Solicitudes cargadas:', this.solicitudes.length, 'solicitudes');

            // Ocultar loading
            Utils.showLoading(false);

            // FORZAR SOLO renderSolicitudes() - NO usar sistema HTML antiguo
            console.log('� USANDO ÚNICAMENTE renderSolicitudes() del controller');
            this.renderSolicitudes();
            this.updateEstadisticas();

            console.log('✅ Controller completó todo el renderizado');

        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            Utils.showToast('Error al cargar solicitudes', 'error');
            Utils.showLoading(false);
        }
    }

    renderSolicitudes() {
        console.log('🔄 renderSolicitudes() llamado - RENDERIZADO COMPLETO');

        // Detectar si es móvil o desktop
        const isMobile = window.innerWidth < 1024;
        console.log('📱 Dispositivo detectado:', isMobile ? 'Móvil' : 'Desktop');

        const tbody = document.getElementById('solicitudes-tbody');
        const emptyState = document.getElementById('empty-state');
        const resultadosCount = document.getElementById('resultados-count');

        console.log('🔍 tbody encontrado:', tbody);
        if (!tbody) return;

        const solicitudesFiltradas = this.filtrarSolicitudes();
        console.log('📊 Solicitudes filtradas:', solicitudesFiltradas.length);

        // Actualizar contadores - USAR MÉTODO DEL CONTROLLER
        try {
            this.updateEstadisticas();
            console.log('✅ Contadores actualizados con updateEstadisticas()');
        } catch (error) {
            console.log('⚠️ updateEstadisticas() falló - intentando con actualizarContadores()');
            if (typeof actualizarContadores === 'function') {
                actualizarContadores(solicitudesFiltradas);
                console.log('✅ Contadores actualizados con actualizarContadores()');
            } else {
                console.log('⚠️ actualizarContadores() no disponible - actualizando manualmente');
                // Actualizar contador principal manualmente
                if (resultadosCount) {
                    resultadosCount.textContent = solicitudesFiltradas.length;
                }
            }
        }

        // ACTUALIZACIÓN MANUAL DIRECTA DE CONTADORES MÓVILES
        console.log('🔧 Actualizando contadores móviles directamente...');
        const pendientes = solicitudesFiltradas.filter(s => s.estado === 'pendiente');
        const aprobadas = solicitudesFiltradas.filter(s => s.estado === 'aprobada');
        const entregadas = solicitudesFiltradas.filter(s => s.estado === 'entregado');
        const devueltas = solicitudesFiltradas.filter(s => s.estado === 'devuelto');

        console.log('📊 Contadores móviles:', {
            pendientes: pendientes.length,
            aprobadas: aprobadas.length,
            entregadas: entregadas.length,
            devueltas: devueltas.length
        });

        // ACTUALIZAR CONTADOR DE RESULTADOS MOSTRADOS
        const resultadosCountEl = document.getElementById(isMobile ? 'resultados-count-mobile' : 'resultados-count');
        if (resultadosCountEl) {
            console.log('🔧 Actualizando resultados-count:', solicitudesFiltradas.length, 'para', isMobile ? 'mobile' : 'desktop');
            resultadosCountEl.textContent = solicitudesFiltradas.length;
        } else {
            console.log('🔧 No se encontró el elemento resultados-count para', isMobile ? 'mobile' : 'desktop');
        }

        // VERIFICAR QUE LOS ELEMENTOS EXISTAN (USAR IDS DE MÓVIL)
        const pendientesEl = document.getElementById('pendientes-count-mobile');
        const aprobadasEl = document.getElementById('aprobadas-count-mobile');
        const entregadasEl = document.getElementById('entregadas-count-mobile');
        const devueltasEl = document.getElementById('devueltas-count-mobile');

        console.log('🔍 Elementos móviles encontrados:', {
            'pendientes-count-mobile': !!pendientesEl,
            'aprobadas-count-mobile': !!aprobadasEl,
            'entregadas-count-mobile': !!entregadasEl,
            'devueltas-count-mobile': !!devueltasEl
        });

        // ACTUALIZAR CON VERIFICACIÓN
        if (pendientesEl) {
            pendientesEl.textContent = pendientes.length;
            console.log('✅ pendientes-count-mobile actualizado:', pendientes.length);
        } else {
            console.error('❌ pendientes-count-mobile NO encontrado');
        }

        if (aprobadasEl) {
            aprobadasEl.textContent = aprobadas.length;
            console.log('✅ aprobadas-count-mobile actualizado:', aprobadas.length);
        } else {
            console.error('❌ aprobadas-count-mobile NO encontrado');
        }

        if (entregadasEl) {
            entregadasEl.textContent = entregadas.length;
            console.log('✅ entregadas-count-mobile actualizado:', entregadas.length);
        } else {
            console.error('❌ entregadas-count-mobile NO encontrado');
        }

        if (devueltasEl) {
            devueltasEl.textContent = devueltas.length;
            console.log('✅ devueltas-count-mobile actualizado:', devueltas.length);
        } else {
            console.error('❌ devueltas-count-mobile NO encontrado');
        }

        console.log('✅ Contadores móviles actualizados en el DOM');

        // Limpiar tbody completamente
        tbody.innerHTML = '';

        if (solicitudesFiltradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8">
                        <div class="text-slate-400">
                            <div class="text-4xl mb-2">📋</div>
                            <div class="text-lg font-medium mb-1">
                                ${this.filtros.estado === 'todos'
                    ? 'No hay solicitudes encontradas'
                    : `No hay solicitudes con estado "${this.filtros.estado}"`
                }
                            </div>
                            <div class="text-sm">
                                ${this.filtros.estado === 'todos'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : `No existen solicitudes en estado ${this.filtros.estado}`
                }
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            console.log('✅ Estado vacío mostrado');
            return;
        }

        // Renderizar TODAS las solicitudes con formato responsive
        console.log('🔨 Iniciando renderizado de solicitudes...');

        // Usar innerHTML directo con formato responsive
        const todasLasFilas = solicitudesFiltradas.map((solicitud, index) => {
            const rowHTML = this.createSolicitudRow(solicitud, isMobile);
            console.log(`🔨 Creando fila ${index + 1}:`, solicitud._id?.slice(-6));
            return rowHTML;
        }).join('');

        console.log('📊 Insertando HTML en tbody...');
        tbody.innerHTML = todasLasFilas;

        console.log('✅ HTML insertado, vérificando contenido...');
        console.log('🔍 tbody.innerHTML (primeros 200 chars):', tbody.innerHTML.substring(0, 200));
        console.log('🔍 Número de filas en tbody:', tbody.children.length);

        console.log('✅ TODAS las solicitudes renderizadas con formato responsive:', solicitudesFiltradas.length);
        // Actualizar paginación
        this.updatePaginacion();
    }

    filtrarSolicitudes() {
        return this.solicitudes.filter(solicitud => {
            const coincideBusqueda = !this.filtros.busqueda ||
                (solicitud.usuario?.nombre_completo && solicitud.usuario.nombre_completo.toLowerCase().includes(this.filtros.busqueda.toLowerCase())) ||
                (solicitud.activos && solicitud.activos.some(a => a.nombre?.toLowerCase().includes(this.filtros.busqueda.toLowerCase()))) ||
                (solicitud.insumos && solicitud.insumos.some(i => i.nombreProducto?.toLowerCase().includes(this.filtros.busqueda.toLowerCase())));

            const coincideEstado = this.filtros.estado === 'todos' ||
                solicitud.estado === this.filtros.estado;

            const coincideFecha = this.checkFechaFilter(solicitud);

            return coincideBusqueda && coincideEstado && coincideFecha;
        });
    }

    checkFechaFilter(solicitud) {
        if (!this.filtros.fechaDesde && !this.filtros.fechaHasta) {
            return true;
        }

        const solicitudDate = new Date(solicitud.createdAt);
        const fechaDesde = this.filtros.fechaDesde ? new Date(this.filtros.fechaDesde) : null;
        const fechaHasta = this.filtros.fechaHasta ? new Date(this.filtros.fechaHasta) : null;

        if (fechaDesde && solicitudDate < fechaDesde) return false;
        if (fechaHasta && solicitudDate > new Date(fechaHasta.getTime() + 24 * 60 * 60 * 1000)) return false;

        return true;
    }

    getEstadoIcon(estado) {
        const iconos = {
            'pendiente': '??',
            'aprobada': '??',
            'rechazada': '??',
            'entregado': '??',
            'devuelto': '??',
            'cancelada': '??'
        };
        return iconos[estado] || '??';
    }

    getEstadoMobile(estado) {
        const estados = {
            'pendiente': { text: 'Pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100' },
            'aprobada': { text: 'Aprobada', color: 'text-green-600', bg: 'bg-green-100' },
            'rechazada': { text: 'Rechazada', color: 'text-red-600', bg: 'bg-red-100' },
            'entregado': { text: 'Entregado', color: 'text-blue-600', bg: 'bg-blue-100' },
            'devuelto': { text: 'Devuelto', color: 'text-purple-600', bg: 'bg-purple-100' },
            'cancelada': { text: 'Cancelada', color: 'text-gray-600', bg: 'bg-gray-100' }
        };
        return estados[estado] || { text: estado, color: 'text-gray-600', bg: 'bg-gray-100' };
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
        const elementos = [];
        
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach(insumo => {
                const nombre = insumo.id_insumo?.NombProducto || insumo.descripcion || 'Insumo';
                const cantidad = insumo.cantidad || 1;
                elementos.push({
                    icono: '??',
                    nombre: nombre,
                    cantidad: cantidad,
                    detalles: insumo.caracteristicas || ''
                });
            });
        }
        
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach(activo => {
                elementos.push({
                    icono: '??',
                    nombre: activo.nombre || 'Activo',
                    cantidad: 1,
                    detalles: activo.descripcion || ''
                });
            });
        }
        
        return elementos;
    }

    createSolicitudRow(solicitud) {
        const usuario = JSON.parse(localStorage.getItem('utn_user'));
        const nombreUsuario = usuario?.nombre_completo || usuario?.nombre || 'Usuario';
        const emailUsuario = usuario?.email || usuario?.correo_electronario || usuario?.correo || '';
        const rolUsuario = usuario?.rol || usuario?.rol_nombre || '';
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

        if (isMobile) {
            // Versión móvil
            return `
                <tr class="border-b hover:bg-slate-50">
                    <td class="p-4">
                        <div class="space-y-3">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-lg font-bold text-slate-800">#${solicitud._id?.slice(-6)}</span>
                                        <span class="px-2 py-1 rounded-full text-xs font-medium" style="background: ${rolBgGradient}; color: white;">
                                            ${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}
                                        </span>
                                    </div>
                                    <div class="text-slate-600 font-medium">${solicitud.usuario?.nombre_completo || 'Usuario'}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-slate-500 text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</div>
                                    <div class="mt-1">${this.getEstadoBadge(solicitud.estado)}</div>
                                </div>
                            </div>
                            
                            <div class="space-y-2">
                                <div class="text-sm text-slate-700">
                                    ${this.getElementosInfo(solicitud)}
                                </div>
                                
                                <div class="flex justify-end">
                                    <button 
                                        onclick="window.solicitudesController.toggleMenu('${solicitud._id}')" 
                                        class="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                        style="background: ${rolBgGradient}; color: white; box-shadow: 0 2px 8px ${rolColor}40;">
                                        ?
                                    </button>
                                    <div id="menu-${solicitud._id}" class="hidden absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg border" style="border-color: ${rolColor}; z-index: 1000;">
                                        ${this.createActionsForRole(solicitud, esEstudiante, esDocente, rolColor)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            // Versión desktop
            return `
                <tr class="hover:bg-slate-50 border-b">
                    <td class="px-4 py-3 font-mono text-sm">#${solicitud._id?.slice(-6)}</td>
                    <td class="px-4 py-3 font-medium">${solicitud.usuario?.nombre_completo || 'Usuario'}</td>
                    <td class="px-4 py-3 text-sm">${this.getElementosInfo(solicitud)}</td>
                    <td class="px-4 py-3 text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</td>
                    <td class="px-4 py-3">${this.getEstadoBadge(solicitud.estado)}</td>
                    <td class="px-4 py-3">
                        <div class="relative">
                            <button 
                                onclick="window.solicitudesController.toggleMenu('${solicitud._id}')" 
                                class="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                style="background: ${rolBgGradient}; color: white; box-shadow: 0 2px 8px ${rolColor}40;">
                                ?
                            </button>
                            <div id="menu-${solicitud._id}" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2" style="border-color: ${rolColor}; z-index: 1000;">
                                <!-- Encabezado del menú -->
                                <div class="menu-header" style="background: ${rolBgGradient}; color: white; padding: 12px; border-radius: 8px 8px 0 0;">
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg">${rolIcono}</span>
                                        <div>
                                            <div class="font-bold text-xs">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                                            <div class="text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Acciones según rol y estado -->
                                <div class="p-2">
                                    ${this.createActionsForRole(solicitud, esEstudiante, esDocente, rolColor)}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    if (isMobile) {
        // Versión móvil - ultra compacta
        return `
                <tr>
                    <td class="px-0 py-0.5">
                        <span class="font-medium text-[7px] text-slate-900">#${solicitud._id?.slice(-4) || 'N/A'}</span>
                    </td>
                    <td class="px-0 py-0.5">
                        <div class="text-[6px]">
                            <div class="font-medium text-slate-700 text-[6px]">${usuarioNombre}</div>
                            ${usuarioEmail !== 'N/A' ? `<div class="text-[5px] text-slate-200">${usuarioEmail}</div>` : ''}
                        </div>
                    </td>
                    <td class="px-0 py-0.5">
                        <div class="text-[6px]">
                            <div class="text-center">
                                <span class="bg-green-100 text-green-700 px-1 py-0.5 rounded text-[5px] font-bold">
                                    ${elementos.length} items
                                </span>
                            </div>
                            ${elementos.length > 0 ? `
                                <div class="text-[5px] text-slate-200 mt-1">
                                    Total: ${elementos.reduce((sum, el) => sum + el.cantidad, 0)} und
                                </div>
                            ` : ''}
                        </div>
                    </td>
                    <td class="px-0 py-0.5">
                        <span class="text-[6px] text-slate-500">${new Date(solicitud.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td class="px-0 py-0.5">
                        <div class="text-[6px] text-left">
                            ${this.getEstadoMobile(solicitud.estado)}
                        </div>
                    </td>
                    <td class="px-0 py-0.5 text-[4px] relative">
                        <div class="relative">
                            <button onclick="toggleMenu('${solicitud._id}', event)" class="group relative inline-flex items-left justify-center p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-50">
                                <div class="flex flex-col space-y-0.2">
                                    <div class="w-0.2 h-0.5 rounded-full bg-current"></div>
                                    <div class="w-0.2 h-0.5 rounded-full bg-current"></div>
                                    <div class="w-0.5 h-0.5 rounded-full bg-current"></div>
                                </div>
                            </button>
                            <!-- Dropdown Menu -->
                            <div id="menu-${solicitud._id}" class="hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100" style="z-index: 999999;">
                                <div class="px-0 py-1 border-b border-slate-500 bg-gradient-to-r from-slate-50 to-white">
                                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acciones</p>
                                </div>
                                <div class="py-1">
                                    ${botonesAcciones}
                                </div>
                            </div>
                        </div>
                        <!-- DEBUG: Verificando z-index del menú móvil -->
                        <script>console.log('🔍 Menú móvil creado con z-index: 999999 para solicitud:', '${solicitud._id}');</script>
                    </td>
                </tr>
            `;
    }

    // Lógica de desktop movida a Soli_DeskUs.js
    generarBotonesAcciones(solicitudId, userRol, isMobile = false) {
        // Solo móvil - desktop usa su propio controlador
        if (isMobile) {
            // Versión móvil - botones compactos
            if (esAdmin) {
                // Botones para administradores (versión móvil)
                return `
                    <button onclick="verSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        👁️ Ver
                    </button>
                    <button onclick="editarSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        ✏️ Editar
                    </button>
                    <div class="border-t my-1"></div>
                    <a href="#" onclick="aprobarSolicitud('${solicitudId}'); return false;" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        ✅ Aprobar
                    </a>
                    <button onclick="rechazarSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        ❌ Rechazar
                    </button>
                    <button onclick="entregarSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        📦 Entregar
                    </button>
                    <button onclick="devolverSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        🔄 Devolver
                    </button>
                    <div class="border-t my-1"></div>
                    <button onclick="eliminarSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-red-50 text-red-600 flex items-center gap-1">
                        🗑️ Eliminar
                    </button>
                `;
            } else {
                // Botones para usuarios no administrativos (versión móvil)
                let botonesHTML = `
                    <button onclick="verSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        👁️ Ver
                    </button>
                    <button onclick="devolverSolicitud('${solicitudId}')" class="w-full text-left px-2 py-1 text-xs hover:bg-slate-50 flex items-center gap-1">
                        🔄 Devolver
                    </button>
                `;

                // Añadir botón eliminar solo si es mi solicitud y está en estado permitido
                if (puedeEliminar) {
                    botonesHTML += `
                        <div class="border-t my-1"></div>
                        <button onclick="eliminarSolicitud(&quot;${solicitudId}&quot;)" class="w-full text-left px-2 py-1 text-xs hover:bg-red-50 text-red-600 flex items-center gap-1">
                            🗑️ Eliminar mi solicitud
                        </button>
                    `;
                }

                return botonesHTML;
            }
        } else {
            // Versión desktop - botones normales
            if (esAdmin) {
                // Botones para administradores (todos los botones)
                return `
                    <button onclick="verSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                        👁️ Ver detalles
                    </button>
                    <button onclick="editarSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                        ✏️ Editar
                    </button>
                    <div class="border-t border-slate-200 my-1"></div>
                    <a href="#" onclick="aprobarSolicitud('${solicitudId}'); return false;" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                        ✅ Aprobar
                    </a>
                    <button onclick="rechazarSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2">
                        ❌ Rechazar
                    </button>
                    <button onclick="entregarSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                        📦 Entregar
                    </button>
                    <button onclick="devolverSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-2">
                        🔄 Devolver
                    </button>
                    <div class="border-t border-slate-200 my-1"></div>
                    <button onclick="eliminarSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                        🗑️ Eliminar    
                    </button>
                `;
            } else {
                // Botones para estudiantes y docentes (solo los básicos)
                let botonesHTML = `
                    <button onclick="verSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                        👁️ Ver detalles
                    </button>
                    <button onclick="devolverSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-2">
                        🔄 Devolver
                    </button>
                `;

                // Añadir botón eliminar solo si es mi solicitud y está en estado permitido
                console.log('🔍 Verificando botón eliminar para estudiante:', {
                    puedeEliminar,
                    esMiSolicitud,
                    estado: solicitudActual?.estado,
                    solicitudId
                });
                
                if (puedeEliminar) {
                    console.log('✅ Añadiendo botón eliminar para estudiante');
                    botonesHTML += `
                        <div class="border-t border-slate-200 my-1"></div>
                        <button onclick="eliminarSolicitud(&quot;${solicitudId}&quot;)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                            🗑️ Eliminar mi solicitud
                        </button>
                    `;
                } else {
                    console.log('❌ No se añade botón eliminar:', {
                        puedeEliminar,
                        esMiSolicitud,
                        estado: solicitudActual?.estado
                    });
                }

                return botonesHTML;
            }
        }
    }

    getElementosInfo(solicitud) {
        const elementos = [];

        console.log('🔍 Procesando elementos de solicitud:', solicitud._id);
        console.log('📦 Insumos:', solicitud.insumos);
        console.log('🔧 Activos:', solicitud.activos);

        // Procesar activos
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach((activo, index) => {
                console.log(`🔧 Procesando activo ${index + 1}:`, activo);
                elementos.push({
                    icono: '🔧',
                    nombre: activo.nombre || activo.marca || activo.codigo_activo || 'Activo',
                    cantidad: 1,
                    detalles: activo.modelo || activo.descripcion || ''
                });
            });
        }

        // Procesar insumos con más detalles
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach((insumo, index) => {
                console.log(`📦 Procesando insumo ${index + 1}:`, insumo);
                
                // Intentar obtener el nombre de múltiples formas
                let nombreInsumo = 'Insumo';
                
                if (insumo.id_insumo) {
                    // Si tiene populate
                    nombreInsumo = insumo.id_insumo.NombProducto || 
                                   insumo.id_insumo.nombre || 
                                   insumo.id_insumo.descripcion ||
                                   'Insumo';
                } else {
                    // Si no tiene populate, usar datos directos
                    nombreInsumo = insumo.nombre || 
                                   insumo.descripcion || 
                                   insumo.caracteristicas ||
                                   'Insumo';
                }
                
                console.log(`📝 Nombre final del insumo: ${nombreInsumo}`);

                elementos.push({
                    icono: '📦',
                    nombre: nombreInsumo,
                    cantidad: insumo.cantidad || 1,
                    detalles: insumo.caracteristicas || insumo.descripcion || ''
                });
            });
        }

        console.log('✅ Elementos procesados:', elementos);
        return elementos;
    }

    getEstadoClass(estado) {
        const estadoMap = {
            'pendiente': 'pendiente',
            'aprobada': 'aprobada',
            'rechazada': 'rechazada',
            'entregado': 'entregado',
            'devuelto': 'devuelto'
        };
        return estadoMap[estado] || 'pendiente';
    }

    updateEstadisticas() {
        const pendientes = this.solicitudes.filter(s => s.estado === 'pendiente');
        const aprobadas = this.solicitudes.filter(s => s.estado === 'aprobada');
        const entregadas = this.solicitudes.filter(s => s.estado === 'entregado');
        const devueltas = this.solicitudes.filter(s => s.estado === 'devuelto');

        // Actualizar contadores
        this.updateCounter('pendientes-count', pendientes.length);
        this.updateCounter('aprobadas-count', aprobadas.length);
        this.updateCounter('entregadas-count', entregadas.length);
        this.updateCounter('devueltas-count', devueltas.length);
    }

    updateCounter(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updatePaginacion() {
        const paginaActual = document.getElementById('pagina-actual');
        const totalPaginas = document.getElementById('total-paginas');
        const paginaAnterior = document.getElementById('pagina-anterior');
        const paginaSiguiente = document.getElementById('pagina-siguiente');

        if (paginaActual) {
            paginaActual.textContent = this.currentPage;
        }

        if (totalPaginas) {
            const totalPages = Math.ceil(this.filtrarSolicitudes().length / this.itemsPerPage);
            totalPaginas.textContent = totalPages;
        }

        if (paginaAnterior) {
            paginaAnterior.disabled = this.currentPage === 1;
        }

        if (paginaSiguiente) {
            const totalPages = Math.ceil(this.filtrarSolicitudes().length / this.itemsPerPage);
            paginaSiguiente.disabled = this.currentPage >= totalPages;
        }
    }

    cambiarPagina(direccion) {
        const totalPages = Math.ceil(this.filtrarSolicitudes().length / this.itemsPerPage);
        const nuevaPagina = this.currentPage + direccion;

        if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
            this.currentPage = nuevaPagina;
            this.renderSolicitudes();
        }
    }

    async verDetalles(id) {
        const solicitud = this.solicitudes.find(s => s._id === id);
        if (!solicitud) return;

        // Mostrar modal con detalles
        window.modalController?.showModal('confirmModal', {
            title: 'Detalles de la Solicitud',
            icon: '📋',
            details: `
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">ID:</span>
                        <span class="font-bold text-slate-700">#${solicitud._id?.slice(-6) || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Usuario:</span>
                        <span class="font-bold text-slate-700">${solicitud.usuario?.nombre_completo || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Fecha:</span>
                        <span class="font-bold text-slate-700">${Utils.formatDateTime(solicitud.createdAt)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400 font-bold">Estado:</span>
                        <span class="font-bold text-slate-700">${solicitud.estado || 'pendiente'}</span>
                    </div>
                    <div class="border-t pt-2 mt-2">
                        <span class="text-slate-400 font-bold">Elementos solicitados:</span>
                        <div class="mt-2 space-y-1">
                            ${this.getElementosInfo(solicitud).map(el => `
                                <div class="flex items-center gap-2 text-sm">
                                    <span>${el.icono}</span>
                                    <span>${el.nombre}</span>
                                    <span class="text-slate-500">(x${el.cantidad})</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `
        });
    }

    async gestionarSolicitud(id) {
        const solicitud = this.solicitudes.find(s => s._id === id);
        if (!solicitud) return;

        // Lógica para gestionar solicitud
        console.log('Gestionar solicitud:', solicitud);
        Utils.showToast('Función de gestión en desarrollo', 'info');
    }

    limpiarFiltros() {
        this.filtros = {
            busqueda: '',
            estado: 'todos',
            fechaDesde: '',
            fechaHasta: ''
        };

        // Limpiar inputs
        const busquedaInput = document.getElementById('busqueda-input');
        const estadoSelect = document.getElementById('estado-filter');
        const fechaDesde = document.getElementById('fecha-desde');
        const fechaHasta = document.getElementById('fecha-hasta');

        if (busquedaInput) busquedaInput.value = '';
        if (estadoSelect) estadoSelect.value = 'todos';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';

        this.renderSolicitudes();
    }

    exportarDatos() {
        const solicitudesFiltradas = this.filtrarSolicitudes();

        if (solicitudesFiltradas.length === 0) {
            Utils.showToast('No hay datos para exportar', 'error');
            return;
        }

        // Crear CSV
        const headers = ['ID', 'Usuario', 'Fecha', 'Estado', 'Elementos'];
        const csvContent = [
            headers.join(','),
            ...solicitudesFiltradas.map(solicitud => [
                solicitud._id?.slice(-6) || 'N/A',
                solicitud.usuario?.nombre_completo || 'N/A',
                Utils.formatDate(solicitud.createdAt),
                solicitud.estado || 'pendiente',
                this.getElementosInfo(solicitud).map(el => `${el.nombre} (x${el.cantidad})`).join('; ')
            ].join(','))
        ].join('\n');

        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solicitudes_${Utils.formatDate(new Date())}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        Utils.showToast('Datos exportados exitosamente', 'success');
    }

    imprimirDatos() {
        window.print();
    }

    // Recargar solicitudes
    async recargarSolicitudes() {
        await this.cargarSolicitudes();
        this.renderSolicitudes();
        this.updateEstadisticas();
    }

    getEstadoBadge(estado) {
        const estados = {
            'pendiente': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">?? Pendiente</span>',
            'aprobada': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">?? Aprobada</span>',
            'rechazada': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">?? Rechazada</span>',
            'entregado': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">?? Entregado</span>',
            'devuelto': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">?? Devuelto</span>',
            'cancelada': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">?? Cancelada</span>'
        };
        return estados[estado] || `<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${estado}</span>`;
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
}

// Función para eliminar solicitudes propias
window.eliminarSolicitud = async function(solicitudId) {
    console.log('🗑️ Iniciando eliminación de solicitud:', solicitudId);
    
    // Validar que el ID no sea undefined
    if (!solicitudId || solicitudId === 'undefined') {
        console.error('❌ ID de solicitud es undefined');
        Utils.showToast('Error: ID de solicitud no válido', 'error');
        return;
    }
    
    // Verificación de seguridad
    if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer.')) {
        console.log('❌ Eliminación cancelada por el usuario');
        return;
    }
    
    try {
        // Obtener token de autenticación
        const token = localStorage.getItem('utn_token');
        if (!token) {
            Utils.showToast('No tienes sesión activa', 'error');
            return;
        }
        
        console.log('🔍 Enviando solicitud de eliminación para ID:', solicitudId);
        console.log('🔍 URL completa:', `${CONFIG.API_BASE_URL}/solicitudes/${solicitudId}`);
        
        // Enviar solicitud de eliminación al backend
        const response = await fetch(`${CONFIG.API_BASE_URL}/solicitudes/${solicitudId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error al eliminar:', errorData);
            Utils.showToast(`Error al eliminar: ${response.statusText}`, 'error');
            return;
        }
        
        const result = await response.json();
        console.log('✅ Solicitud eliminada:', result);
        
        // Mostrar mensaje de éxito
        Utils.showToast('Solicitud eliminada correctamente', 'success');
        
        // Recargar la lista de solicitudes
        if (window.solicitudesManager) {
            await window.solicitudesManager.loadSolicitudes();
        } else {
            // Si no está disponible, recargar la página
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Error en eliminación:', error);
        Utils.showToast('Error al eliminar la solicitud', 'error');
    }
};

// Función para toggle del menú de acciones
window.toggleMenu = function(solicitudId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Cerrar todos los demás menús primero
    document.querySelectorAll('[id^="menu-"]').forEach(menu => {
        if (menu.id !== `menu-${solicitudId}`) {
            menu.classList.add('hidden');
        }
    });
    
    // Toggle el menú actual
    const menuActual = document.getElementById(`menu-${solicitudId}`);
    if (menuActual) {
        menuActual.classList.toggle('hidden');
    }
};

// Función para ver detalles de una solicitud
window.verSolicitud = function(solicitudId) {
    console.log('👁️ Ver detalles de solicitud:', solicitudId);
    
    // Buscar la solicitud en los datos cargados
    const solicitud = window.solicitudesController?.solicitudes?.find(s => s._id === solicitudId);
    
    if (!solicitud) {
        Utils.showToast('Solicitud no encontrada', 'error');
        return;
    }
    
    // Crear modal con detalles
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-slate-800">📋 Detalles de Solicitud</h3>
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
                            ${window.formatearEstado ? window.formatearEstado(solicitud.estado) : `<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${solicitud.estado || 'pendiente'}</span>`}
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700">Fecha</label>
                        <p class="text-slate-900">${new Date(solicitud.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700">Usuario</label>
                        <p class="text-slate-900">${solicitud.usuario?.nombre_completo || solicitud.usuario_solicitante || 'N/A'}</p>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                    <p class="text-slate-700 bg-slate-50 p-3 rounded">${solicitud.observaciones || 'Sin observaciones'}</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Artículos Solicitados</label>
                    <div class="space-y-2">
                        ${window.solicitudesController?.getElementosInfo(solicitud).map(el => `
                            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                <span class="text-lg">${el.icono}</span>
                                <div class="flex-1">
                                    <p class="font-medium text-slate-900">${el.nombre}</p>
                                    <p class="text-sm text-slate-600">Cantidad: ${el.cantidad}</p>
                                    ${el.detalles ? `<p class="text-xs text-slate-500">${el.detalles}</p>` : ''}
                                </div>
                            </div>
                        `).join('') || '<p class="text-slate-500">No hay artículos</p>'}
                    </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// Crear instancia global
console.log('🔧 Creando instancia de SolicitudesController...');
window.solicitudesController = new SolicitudesController();
console.log('✅ SolicitudesController creado:', window.solicitudesController);

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM listo - Inicializando SolicitudesController...');
    if (window.solicitudesController) {
        window.solicitudesController.initialize();
        console.log('✅ SolicitudesController inicializado');
    } else {
        console.error('❌ SolicitudesController no encontrado');
    }
});

// También intentar inicializar inmediatamente por si el DOM ya está listo
if (document.readyState === 'loading') {
    console.log('📄 DOM todavía cargando...');
} else {
    console.log('📄 DOM ya listo - Inicializando ahora...');
    if (window.solicitudesController) {
        window.solicitudesController.initialize();
    }
}
