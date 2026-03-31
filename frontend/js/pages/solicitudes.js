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
        const estadoSelect = document.getElementById('estado-select');
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
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            Utils.showToast('Error al cargar solicitudes', 'error');
            Utils.showLoading(false);
        }
    }

    renderSolicitudes() {
        const tbody = document.getElementById('solicitudes-tbody');
        const emptyState = document.getElementById('empty-state');
        const resultadosCount = document.getElementById('resultados-count');

        if (!tbody) return;

        const solicitudesFiltradas = this.filtrarSolicitudes();

        // Actualizar contador
        if (resultadosCount) {
            resultadosCount.textContent = solicitudesFiltradas.length;
        }

        // Mostrar/ocultar empty state
        if (emptyState) {
            emptyState.classList.toggle('hidden', solicitudesFiltradas.length > 0);
        }

        if (solicitudesFiltradas.length === 0) {
            tbody.innerHTML = '';
            return;
        }

        tbody.innerHTML = solicitudesFiltradas.map(solicitud =>
            this.createSolicitudRow(solicitud)
        ).join('');

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
        if (fechaHasta && solicitudDate > fechaHasta.addDays(1)) return false;

        return true;
    }

    createSolicitudRow(solicitud) {
        const estadoClass = this.getEstadoClass(solicitud.estado);
        const elementos = this.getElementosInfo(solicitud);

        // Obtener información del usuario desde la solicitud
        // En MongoDB el campo es nombre_completo
        const usuarioNombre = solicitud.nombre_completo || solicitud.usuario_nombre || 'Usuario';
        const usuarioEmail = solicitud.correo_electronico || solicitud.usuario_correo || '';

        return `
            <tr>
                <td class="px-4 py-3">
                    <span class="font-medium">#${solicitud._id?.slice(-6) || 'N/A'}</span>
                </td>
                <td class="px-4 py-3">
                    <div>
                        <p class="font-medium">${usuarioNombre}</p>
                        <p class="text-xs text-slate-500">${usuarioEmail}</p>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">
                        ${elementos.map(el => `
                            <div class="flex items-center gap-1 mb-1">
                                <span>${el.icono}</span>
                                <span>${el.nombre}</span>
                                <span class="text-xs text-slate-500">x${el.cantidad}</span>
                            </div>
                        `).join('') || '<span class="text-slate-400">Sin elementos</span>'}
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm">${Utils.formatDate(solicitud.createdAt)}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="estado-badge ${estadoClass}">${solicitud.estado || 'pendiente'}</span>
                </td>
            </tr>
        `;
    }

    getElementosInfo(solicitud) {
        const elementos = [];

        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach(activo => {
                elementos.push({
                    icono: '🔧',
                    nombre: activo.nombre || 'Activo',
                    cantidad: 1
                });
            });
        }

        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach(insumo => {
                elementos.push({
                    icono: '📦',
                    nombre: insumo.nombreProducto || 'Insumo',
                    cantidad: insumo.cantidad || 1
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
        const estadoSelect = document.getElementById('estado-select');
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
