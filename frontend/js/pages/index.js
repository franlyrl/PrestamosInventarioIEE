// Controlador del Dashboard (Página Principal)
class IndexController {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Botones de acciones rápidas
        const nuevaSolicitudBtn = document.querySelector('button:has-text("Nueva Solicitud")');
        if (nuevaSolicitudBtn) {
            nuevaSolicitudBtn.addEventListener('click', () => {
                window.location.href = 'pages/solicitudes.html';
            });
        }
    }

    async loadDashboardData() {
        try {
            Utils.showLoading(true);
            
            // Cargar datos en paralelo
            const [activosResponse, insumosResponse, solicitudesResponse] = await Promise.all([
                ApiService.getActivos(),
                ApiService.getInsumos(),
                ApiService.getSolicitudes()
            ]);

            // Procesar datos
            const activos = activosResponse.data || activosResponse;
            const insumos = insumosResponse.data || insumosResponse;
            const solicitudes = solicitudesResponse.data || solicitudesResponse;

            // Actualizar estadísticas
            this.updateStatistics(activos, insumos, solicitudes);
            
            // Actualizar actividad reciente
            this.updateRecentActivity(solicitudes);
            
            Utils.showLoading(false);
            
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            Utils.showToast('Error al cargar los datos', 'error');
            Utils.showLoading(false);
        }
    }

    updateStatistics(activos, insumos, solicitudes) {
        // Total de activos
        const totalActivosElement = document.getElementById('totalActivos');
        if (totalActivosElement) {
            totalActivosElement.textContent = activos.length;
        }

        // Total de insumos
        const totalInsumosElement = document.getElementById('totalInsumos');
        if (totalInsumosElement) {
            totalInsumosElement.textContent = insumos.length;
        }

        // Solicitudes pendientes
        const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
        const solicitudesPendientesElement = document.getElementById('solicitudesPendientes');
        if (solicitudesPendientesElement) {
            solicitudesPendientesElement.textContent = solicitudesPendientes.length;
        }

        // Usuarios activos (simulado - en producción vendría de API)
        const usuariosActivosElement = document.getElementById('usuariosActivos');
        if (usuariosActivosElement) {
            usuariosActivosElement.textContent = '42'; // Valor simulado
        }
    }

    updateRecentActivity(solicitudes) {
        const actividadElement = document.getElementById('actividadReciente');
        if (!actividadElement) return;

        // Obtener las últimas 5 solicitudes
        const solicitudesRecientes = solicitudes
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (solicitudesRecientes.length === 0) {
            actividadElement.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-2">📋</div>
                    <p class="text-slate-500">No hay actividad reciente</p>
                </div>
            `;
            return;
        }

        actividadElement.innerHTML = solicitudesRecientes.map(solicitud => {
            const fecha = Utils.formatDateTime(solicitud.createdAt);
            const icono = this.getActivityIcon(solicitud);
            const descripcion = this.getActivityDescription(solicitud);
            
            return `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${icono}</span>
                        <div>
                            <p class="font-medium">${descripcion}</p>
                            <p class="text-sm text-slate-600">Solicitado por ${solicitud.usuario?.nombre_completo || 'Usuario'}</p>
                        </div>
                    </div>
                    <span class="text-sm text-slate-500">${this.getTimeAgo(solicitud.createdAt)}</span>
                </div>
            `;
        }).join('');
    }

    getActivityIcon(solicitud) {
        if (solicitud.activos && solicitud.activos.length > 0) {
            return '🔧';
        } else if (solicitud.insumos && solicitud.insumos.length > 0) {
            return '📦';
        }
        return '📋';
    }

    getActivityDescription(solicitud) {
        if (solicitud.activos && solicitud.activos.length > 0) {
            const activo = solicitud.activos[0];
            return activo.nombre || 'Activo';
        } else if (solicitud.insumos && solicitud.insumos.length > 0) {
            const insumo = solicitud.insumos[0];
            return insumo.nombreProducto || 'Insumo';
        }
        return 'Solicitud';
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `Hace ${diffMins} min`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} horas`;
        } else {
            return `Hace ${diffDays} días`;
        }
    }

    // Inicializar dashboard
    async initialize() {
        // Verificar autenticación
        const isAuth = window.authController?.checkAuthStatus();
        
        if (!isAuth) {
            return;
        }

        // Cargar datos
        await this.loadDashboardData();
    }
}

// Crear instancia global
window.indexController = new IndexController();
