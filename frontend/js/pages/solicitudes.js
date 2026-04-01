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
        // No renderizar aquí porque ya se renderiza en mostrarSolicitudesReales()
        // this.renderSolicitudes();
        // this.updateEstadisticas();
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

            // Llamar a la función global que muestra las solicitudes
            if (typeof mostrarSolicitudesReales === 'function') {
                console.log('📋 Llamando a mostrarSolicitudesReales()...');
                mostrarSolicitudesReales(this.solicitudes);
                // Actualizar estadísticas
                this.updateEstadisticas();
            } else {
                console.log('⚠️ mostrarSolicitudesReales() no disponible, usando renderSolicitudes()');
                this.renderSolicitudes();
                this.updateEstadisticas();
            }

            // Siempre llamar a renderSolicitudes para asegurar que la tabla se muestre
            console.log('🔄 Forzando renderSolicitudes()...');
            this.renderSolicitudes();
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            Utils.showToast('Error al cargar solicitudes', 'error');
            Utils.showLoading(false);
        }
    }

    renderSolicitudes() {
        console.log('🔄 renderSolicitudes() llamado');
        const tbody = document.getElementById('solicitudes-tbody');
        const emptyState = document.getElementById('empty-state');
        const resultadosCount = document.getElementById('resultados-count');

        console.log('🔍 tbody encontrado:', tbody);
        if (!tbody) return;

        const solicitudesFiltradas = this.filtrarSolicitudes();
        console.log('📊 Solicitudes filtradas:', solicitudesFiltradas.length);

        // Actualizar contador
        if (resultadosCount) {
            resultadosCount.textContent = solicitudesFiltradas.length;
        }

        // Mostrar/ocultar empty state
        if (emptyState) {
            emptyState.classList.toggle('hidden', solicitudesFiltradas.length > 0);
        }

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
            return;
        }

        tbody.innerHTML = solicitudesFiltradas.map(solicitud =>
            this.createSolicitudRow(solicitud)
        ).join('');

        // Mostrar insumos detallados también
        if (typeof mostrarInsumosDetallados === 'function') {
            mostrarInsumosDetallados(solicitudesFiltradas);
        }

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

    createSolicitudRow(solicitud) {
        // Usar formatearEstado del HTML para el diseño que te gusta
        const estadoFormateado = typeof formatearEstado === 'function'
            ? formatearEstado(solicitud.estado)
            : `<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${solicitud.estado || 'pendiente'}</span>`;

        const elementos = this.getElementosInfo(solicitud);

        // Obtener información del usuario desde la solicitud
        // Usar los datos del populate del backend
        const usuarioNombre = solicitud.usuario?.nombre_completo ||
            solicitud.nombre_completo ||
            solicitud.usuario_nombre ||
            'Usuario no encontrado';

        const usuarioEmail = solicitud.usuario?.correo_electronico ||
            solicitud.correo_electronico ||
            solicitud.usuario_correo ||
            'N/A';

        const usuarioCedula = solicitud.usuario?.cedula ||
            solicitud.cedula ||
            'N/A';

        const usuarioRol = solicitud.usuario?.tipo_rol ||
            solicitud.tipo_rol ||
            'N/A';

        // Obtener rol del usuario actual para mostrar botones apropiados
        const userData = localStorage.getItem('utn_user');
        const currentUser = userData ? JSON.parse(userData) : null;
        const currentUserRol = currentUser?.rol || currentUser?.tipo_rol || '';

        // Generar botones según el rol
        const botonesAcciones = this.generarBotonesAcciones(solicitud._id, currentUserRol);

        return `
            <tr>
                <td class="px-4 py-3">
                    <span class="font-medium">#${solicitud._id?.slice(-6) || 'N/A'}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">
                        <div class="font-medium text-slate-900">${usuarioNombre}</div>
                        <div class="text-xs text-slate-500">${usuarioEmail}</div>
                        <div class="text-xs text-slate-400 mt-1">
                            <span class="bg-slate-100 px-2 py-0.5 rounded">👤 ${usuarioRol}</span>
                            ${usuarioCedula !== 'N/A' ? `<span class="ml-1 bg-blue-50 px-2 py-0.5 rounded">🆔 ${usuarioCedula}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">
                        ${elementos.map(el => `
                            <div class="flex items-center gap-1 mb-1">
                                <span>${el.icono}</span>
                                <span class="font-medium">${el.nombre}</span>
                                <span class="text-xs text-slate-500">x${el.cantidad}</span>
                                ${el.detalles ? `<span class="text-xs text-slate-400 italic">(${el.detalles})</span>` : ''}
                            </div>
                        `).join('') || '<span class="text-slate-400">Sin elementos</span>'}
                        
                        ${elementos.length > 0 ? `
                            <div class="text-xs text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded">
                                Total: ${elementos.length} elemento(s) - ${elementos.reduce((sum, el) => sum + el.cantidad, 0)} unidades
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</span>
                </td>
                <td class="px-4 py-3">
                    ${estadoFormateado}
                </td>
                <td class="px-4 py-3 text-sm relative">
                    <div class="relative">
                        <button onclick="toggleMenu('${solicitud._id}', event)" class="group relative inline-flex items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all duration-200 shadow-sm hover:shadow-md">
                            <div class="flex flex-col space-y-1">
                                <div class="w-1 h-1 rounded-full bg-current transition-transform group-hover:scale-125"></div>
                                <div class="w-1 h-1 rounded-full bg-current transition-transform group-hover:scale-125"></div>
                                <div class="w-1 h-1 rounded-full bg-current transition-transform group-hover:scale-125"></div>
                            </div>
                        </button>
                        <!-- Dropdown Menu -->
                        <div id="menu-${solicitud._id}" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-100" style="z-index: 999999;">
                            <div class="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</p>
                            </div>
                            <div class="py-2">
                                ${botonesAcciones}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    generarBotonesAcciones(solicitudId, userRol) {
        // Roles administrativos: admin, administrador, administrativo
        const rolesAdmin = ['admin', 'administrador', 'administrativo'];
        const esAdmin = rolesAdmin.includes(userRol.toLowerCase());

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
            return `
                <button onclick="verSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                    👁️ Ver detalles
                </button>
                <button onclick="editarSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                    ✏️ Editar
                </button>
                <button onclick="devolverSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-2">
                    🔄 Devolver
                </button>
                <div class="border-t border-slate-200 my-1"></div>
                <button onclick="eliminarSolicitud('${solicitudId}')" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                    🗑️ Eliminar    
                </button>
            `;
        }
    }

    getElementosInfo(solicitud) {
        const elementos = [];

        // Procesar activos
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach(activo => {
                elementos.push({
                    icono: '🔧',
                    nombre: activo.nombre || activo.marca || 'Activo',
                    cantidad: 1,
                    detalles: activo.modelo || ''
                });
            });
        }

        // Procesar insumos con más detalles
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach(insumo => {
                const nombreInsumo = insumo.id_insumo?.NombProducto ||
                    insumo.descripcion ||
                    insumo.caracteristicas ||
                    'Insumo';

                elementos.push({
                    icono: '',
                    nombre: nombreInsumo,
                    cantidad: insumo.cantidad || 1,
                    detalles: insumo.caracteristicas || ''
                });
            });
        }

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
        a.download = `solicitudes_${new Date().toISOString().split('T')[0]}.csv`;
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
}

// Crear instancia global
window.solicitudesController = new SolicitudesController();
