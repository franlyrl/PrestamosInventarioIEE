// Controlador de la página de Reportes
class ReportesController {
    constructor() {
        this.datos = {
            activos: [],
            insumos: [],
            solicitudes: []
        };
        this.charts = {};
        this.initializeEventListeners();
    }

    async initialize() {
        await this.cargarDatos();
        this.renderKPIs();
        this.renderCharts();
        this.renderTablaDatos();
        this.renderTopActivos();
    }

    initializeEventListeners() {
        // Tipo de reporte
        const tipoReporte = document.getElementById('tipo-reporte');
        if (tipoReporte) {
            tipoReporte.addEventListener('change', () => this.actualizarReporte());
        }

        // Período
        const periodo = document.getElementById('periodo');
        if (periodo) {
            periodo.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    document.getElementById('fechas-custom').classList.remove('hidden');
                } else {
                    document.getElementById('fechas-custom').classList.add('hidden');
                }
                this.actualizarReporte();
            });
        }

        // Fechas personalizadas
        const fechaInicio = document.getElementById('fecha-inicio');
        const fechaFin = document.getElementById('fecha-fin');
        
        if (fechaInicio) {
            fechaInicio.addEventListener('change', () => this.actualizarReporte());
        }
        
        if (fechaFin) {
            fechaFin.addEventListener('change', () => this.actualizarReporte());
        }

        // Botones
        const generarReporteBtn = document.getElementById('generar-reporte-btn');
        const exportarBtn = document.getElementById('exportar-btn');

        if (generarReporteBtn) {
            generarReporteBtn.addEventListener('click', () => this.generarReporte());
        }

        if (exportarBtn) {
            exportarBtn.addEventListener('click', () => this.exportarReporte());
        }
    }

    async cargarDatos() {
        try {
            Utils.showLoading(true);
            
            // Cargar datos en paralelo
            const [activosResponse, insumosResponse, solicitudesResponse] = await Promise.all([
                ApiService.getActivos(),
                ApiService.getInsumos(),
                ApiService.getSolicitudes()
            ]);

            this.datos.activos = activosResponse.data || activosResponse;
            this.datos.insumos = insumosResponse.data || insumosResponse;
            this.datos.solicitudes = solicitudesResponse.data || solicitudesResponse;

            Utils.showLoading(false);
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            Utils.showToast('Error al cargar los datos', 'error');
            Utils.showLoading(false);
        }
    }

    renderKPIs() {
        // Total activos
        this.updateKPI('total-activos-kpi', this.datos.activos.length, 12, true);
        
        // Total insumos
        this.updateKPI('total-insumos-kpi', this.datos.insumos.length, -5, false);
        
        // Solicitudes del mes
        const solicitudesMes = this.getSolicitudesDelMes();
        this.updateKPI('solicitudes-mes', solicitudesMes, 8, true);
        
        // Usuarios activos (simulado)
        this.updateKPI('usuarios-activos-kpi', 42, 15, true);
    }

    updateKPI(elementId, valor, tendencia, esPositiva) {
        const elemento = document.getElementById(elementId);
        if (!elemento) return;

        elemento.textContent = valor;

        // Actualizar tendencia
        const tendenciaElement = elemento.nextElementSibling;
        if (tendenciaElement && tendenciaElement.classList.contains('text-xs')) {
            tendenciaElement.textContent = `↑ ${Math.abs(tendencia)}% vs mes anterior`;
            tendenciaElement.className = `text-xs mt-1 ${esPositiva ? 'text-green-600' : 'text-red-600'}`;
        }
    }

    getSolicitudesDelMes() {
        const ahora = new Date();
        const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

        return this.datos.solicitudes.filter(solicitud => {
            const fechaSolicitud = new Date(solicitud.createdAt);
            return fechaSolicitud >= primerDiaMes && fechaSolicitud <= ahora;
        }).length;
    }

    renderCharts() {
        this.renderSolicitudesChart();
        this.renderCategoriasChart();
        this.renderEstadosChart();
        this.renderUsuariosChart();
    }

    renderSolicitudesChart() {
        const ctx = document.getElementById('solicitudes-chart');
        if (!ctx) return;

        // Destruir chart anterior si existe
        if (this.charts.solicitudes) {
            this.charts.solicitudes.destroy();
        }

        // Preparar datos
        const datosMensuales = this.getSolicitudesMensuales();

        this.charts.solicitudes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datosMensuales.labels,
                datasets: [{
                    label: 'Solicitudes',
                    data: datosMensuales.values,
                    borderColor: '#00447c',
                    backgroundColor: 'rgba(0, 68, 124, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getSolicitudesMensuales() {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const valores = meses.map(() => Math.floor(Math.random() * 20) + 5); // Simulado

        return {
            labels: meses,
            values: valores
        };
    }

    renderCategoriasChart() {
        const ctx = document.getElementById('categorias-chart');
        if (!ctx) return;

        // Destruir chart anterior si existe
        if (this.charts.categorias) {
            this.charts.categorias.destroy();
        }

        // Preparar datos
        const datosCategorias = this.getCategoriasData();

        this.charts.categorias = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: datosCategorias.labels,
                datasets: [{
                    data: datosCategorias.values,
                    backgroundColor: [
                        '#3b82f6',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    getCategoriasData() {
        // Agrupar insumos por categoría
        const categorias = {};
        this.datos.insumos.forEach(insumo => {
            const categoria = insumo.categoria || 'Otros';
            categorias[categoria] = (categorias[categoria] || 0) + 1;
        });

        return {
            labels: Object.keys(categorias),
            values: Object.values(categorias)
        };
    }

    renderEstadosChart() {
        const ctx = document.getElementById('estados-chart');
        if (!ctx) return;

        // Destruir chart anterior si existe
        if (this.charts.estados) {
            this.charts.estados.destroy();
        }

        // Preparar datos
        const datosEstados = this.getEstadosData();

        this.charts.estados = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datosEstados.labels,
                datasets: [{
                    label: 'Activos',
                    data: datosEstados.values,
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#6b7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getEstadosData() {
        // Agrupar activos por estado
        const estados = {
            'disponible': 0,
            'prestado': 0,
            'mantenimiento': 0,
            'danado': 0
        };

        this.datos.activos.forEach(activo => {
            const estado = activo.estadoActivo || 'disponible';
            estados[estado] = (estados[estado] || 0) + 1;
        });

        return {
            labels: Object.keys(estados),
            values: Object.values(estados)
        };
    }

    renderUsuariosChart() {
        const ctx = document.getElementById('usuarios-chart');
        if (!ctx) return;

        // Destruir chart anterior si existe
        if (this.charts.usuarios) {
            this.charts.usuarios.destroy();
        }

        // Preparar datos simulados
        const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        const valores = semanas.map(() => Math.floor(Math.random() * 30) + 20);

        this.charts.usuarios = new Chart(ctx, {
            type: 'line',
            data: {
                labels: semanas,
                datasets: [{
                    label: 'Usuarios Activos',
                    data: valores,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderTablaDatos() {
        const tbody = document.getElementById('datos-tbody');
        if (!tbody) return;

        // Agrupar datos por categoría
        const datosPorCategoria = this.getDatosPorCategoria();

        tbody.innerHTML = datosPorCategoria.map(dato => `
            <tr>
                <td class="px-4 py-3">
                    <span class="categoria-badge ${this.getCategoriaClass(dato.categoria)}">
                        ${dato.categoria}
                    </span>
                </td>
                <td class="px-4 py-3 font-medium">${dato.total}</td>
                <td class="px-4 py-3 text-green-600">${dato.disponible}</td>
                <td class="px-4 py-3 text-yellow-600">${dato.enUso}</td>
                <td class="px-4 py-3 text-red-600">${dato.mantenimiento}</td>
                <td class="px-4 py-3">
                    <div class="progreso-bar">
                        <div class="progreso-fill" style="width: ${dato.utilizacion}%"></div>
                    </div>
                    <div class="progreso-texto">${dato.utilización}%</div>
                </td>
            </tr>
        `).join('');
    }

    getDatosPorCategoria() {
        // Simular datos por categoría
        return [
            {
                categoria: 'Instrumentos',
                total: 15,
                disponible: 12,
                enUso: 2,
                mantenimiento: 1,
                utilización: 20
            },
            {
                categoria: 'Herramientas',
                total: 8,
                disponible: 6,
                enUso: 1,
                mantenimiento: 1,
                utilización: 25
            },
            {
                categoria: 'Equipos',
                total: 5,
                disponible: 3,
                enUso: 2,
                mantenimiento: 0,
                utilización: 40
            }
        ];
    }

    getCategoriaClass(categoria) {
        const categoriaMap = {
            'Instrumentos': 'componentes-analogicos',
            'Herramientas': 'herramientas-menores',
            'Equipos': 'componentes-digitales'
        };
        return categoriaMap[categoria] || 'otros';
    }

    renderTopActivos() {
        const topActivos = document.getElementById('top-activos');
        if (!topActivos) return;

        // Simular top activos
        const topData = [
            { rank: 1, nombre: 'Multímetro Digital', solicitudes: 45 },
            { rank: 2, nombre: 'Osciloscopio', solicitudes: 38 },
            { rank: 3, nombre: 'Generador de Funciones', solicitudes: 32 },
            { rank: 4, nombre: 'Soldador Estación', solicitudes: 28 },
            { rank: 5, nombre: 'Fuente de Poder', solicitudes: 25 }
        ];

        topActivos.innerHTML = topData.map(item => `
            <div class="top-activo-item">
                <div class="top-activo-rank">${item.rank}</div>
                <div class="top-activo-info">
                    <div class="top-activo-nombre">${item.nombre}</div>
                    <div class="top-activo-stats">
                        Solicitudes: <span class="top-activo-valor">${item.solicitudes}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async generarReporte() {
        Utils.showLoading(true);
        
        // Simular generación de reporte
        setTimeout(() => {
            Utils.showLoading(false);
            Utils.showToast('Reporte generado exitosamente', 'success');
            
            // Actualizar todos los componentes
            this.renderKPIs();
            this.renderCharts();
            this.renderTablaDatos();
            this.renderTopActivos();
        }, 1500);
    }

    async actualizarReporte() {
        await this.generarReporte();
    }

    exportarReporte() {
        // Crear PDF (simulado)
        Utils.showToast('Exportando reporte...', 'info');
        
        setTimeout(() => {
            Utils.showToast('Reporte exportado exitosamente', 'success');
        }, 2000);
    }
}

// Crear instancia global
window.reportesController = new ReportesController();
