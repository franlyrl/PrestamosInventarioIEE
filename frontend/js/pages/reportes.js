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
            const [activosResponse, insumosResponse, solicitudesResponse, usuariosResponse, listaEsperaResponse] = await Promise.all([
                ApiService.getActivos(),
                ApiService.getInsumos(),
                ApiService.getSolicitudes(),
                ApiService.getUsuarios ? ApiService.getUsuarios() : Promise.resolve({ data: [] }),
                ApiService.getListaEspera ? ApiService.getListaEspera() : Promise.resolve({ data: [] })
            ]);

            this.datos.activos = activosResponse.data || activosResponse || [];
            this.datos.insumos = insumosResponse.data || insumosResponse || [];
            this.datos.solicitudes = solicitudesResponse.data || solicitudesResponse || [];
            this.datos.usuarios = usuariosResponse.data || usuariosResponse || [];
            this.datos.listaEspera = listaEsperaResponse.data || listaEsperaResponse || [];

            Utils.showLoading(false);
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            Utils.showToast('Error al cargar los datos', 'error');
            Utils.showLoading(false);
        }
    }

    renderKPIs() {
        // Total activos (reales)
        const totalActivos = this.datos.activos?.length || 0;
        this.updateKPIReal('total-activos-kpi', totalActivos, 'Activos');
        
        // Total insumos (reales)
        const totalInsumos = this.datos.insumos?.length || 0;
        this.updateKPIReal('total-insumos-kpi', totalInsumos, 'Insumos');
        
        // Solicitudes del mes (reales)
        const solicitudesMes = this.getSolicitudesDelMes();
        this.updateKPIReal('solicitudes-mes', solicitudesMes, 'Solicitudes');
        
        // Usuarios activos (reales)
        const usuariosActivos = this.datos.usuarios?.filter(u => u.estado === 'activo' || u.activo !== false)?.length || 0;
        this.updateKPIReal('usuarios-activos-kpi', usuariosActivos, 'Usuarios');

        // Módulo Reportes de Inventario - datos reales
        this.renderReportesInventario();
    }

    renderReportesInventario() {
        // Debug: verificar datos
        console.log('📊 Datos insumos:', this.datos.insumos?.length || 0, 'items');
        console.log('📊 Datos activos:', this.datos.activos?.length || 0, 'items');
        
        const primerInsumo = this.datos.insumos?.[0];
        const primerActivo = this.datos.activos?.[0];
        
        console.log('📊 Primer insumo:', primerInsumo);
        console.log('📊 Primer activo:', primerActivo);
        console.log('📊 Campos insumo:', Object.keys(primerInsumo || {}));
        console.log('📊 Campos activo:', Object.keys(primerActivo || {}));

        // Stock Bajo: insumos con cantidad > 0 y <= 5
        const insumosConStock = this.datos.insumos?.filter(i => {
            const cantidad = i.cantidad || i.stock || i.stock_actual || 0;
            return cantidad > 0 && cantidad <= 5;
        }) || [];
        const stockBajo = insumosConStock.length;
        console.log('⚠️ Stock bajo encontrado:', stockBajo, 'insumos');

        const alertasStockEl = document.getElementById('alertas-stock');
        if (alertasStockEl) {
            alertasStockEl.textContent = stockBajo;
            // Si hay stock bajo, hacer el badge más visible
            if (stockBajo > 0) {
                alertasStockEl.classList.add('animate-pulse');
            }
        }

        // Movimientos Hoy: solicitudes del día actual
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        console.log('📅 Fecha hoy:', hoy);
        console.log('📋 Total solicitudes:', this.datos.solicitudes?.length || 0);
        console.log('📋 Primera solicitud:', this.datos.solicitudes?.[0]);
        const movimientosHoy = this.datos.solicitudes?.filter(s => {
            const fecha = new Date(s.createdAt || s.fecha);
            console.log('🔍 Solicitud fecha:', s.createdAt || s.fecha, '->', fecha, '>= hoy?', fecha >= hoy);
            return fecha >= hoy;
        })?.length || 0;
        console.log('📊 Movimientos hoy:', movimientosHoy);
        const movimientosEl = document.getElementById('movimientos-hoy');
        if (movimientosEl) movimientosEl.textContent = movimientosHoy;

        // Items Críticos: activos fuera de servicio (mantenimiento, dañado, eliminado)
        const estadosCriticos = ['mantenimiento', 'danado', 'eliminado', 'fuera de servicio'];
        const itemsCriticos = this.datos.activos?.filter(a => 
            estadosCriticos.includes(a.estadoActivo?.toLowerCase())
        )?.length || 0;
        const itemsCriticosEl = document.getElementById('items-criticos');
        if (itemsCriticosEl) itemsCriticosEl.textContent = itemsCriticos;
    }

    updateKPIReal(elementId, valor, label) {
        const elemento = document.getElementById(elementId);
        if (!elemento) return;

        elemento.textContent = valor;

        // Actualizar subtítulo para mostrar que son datos actuales
        const tendenciaElement = elemento.nextElementSibling;
        if (tendenciaElement && tendenciaElement.classList.contains('text-xs')) {
            // Ocultar tendencias falsas - mostrar texto neutral
            tendenciaElement.style.display = 'none';
        }
        
        // Agregar indicador de datos reales
        const card = elemento.closest('.card');
        if (card && valor > 0) {
            card.classList.add('border-opacity-100');
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
                    <div class="progreso-texto">${dato.utilizacion}%</div>
                </td>
            </tr>
        `).join('');
    }

    getDatosPorCategoria() {
        // Calcular datos reales por categoría desde los activos
        const categorias = {};
        
        this.datos.activos?.forEach(a => {
            const cat = a.categoria || 'Sin categoría';
            if (!categorias[cat]) {
                categorias[cat] = { total: 0, disponible: 0, enUso: 0, mantenimiento: 0 };
            }
            categorias[cat].total++;
            if (a.estadoActivo === 'disponible') categorias[cat].disponible++;
            if (a.estadoActivo === 'prestado') categorias[cat].enUso++;
            if (['mantenimiento', 'danado', 'fuera de servicio'].includes(a.estadoActivo)) categorias[cat].mantenimiento++;
        });
        
        return Object.keys(categorias).map(cat => ({
            categoria: cat,
            total: categorias[cat].total,
            disponible: categorias[cat].disponible,
            enUso: categorias[cat].enUso,
            mantenimiento: categorias[cat].mantenimiento,
            utilizacion: Math.round((categorias[cat].enUso / categorias[cat].total) * 100) || 0
        }));
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
        Utils.showToast('Generando reporte con diseño SPIEE...', 'info');
        
        const fecha = new Date().toISOString().split('T')[0];
        const hora = new Date().toLocaleTimeString('es-ES');
        const tipoReporte = document.getElementById('tipo-reporte')?.value || 'general';
        
        // Crear HTML para el reporte con diseño SPIEE
        let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte SPIEE - ${tipoReporte.toUpperCase()}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #f8fafc; padding: 40px; }
        .header { background: linear-gradient(135deg, #002D62 0%, #004a8f 100%); color: white; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 10px 40px rgba(0,45,98,0.2); }
        .header h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .header p { opacity: 0.9; font-size: 14px; }
        .header .badge { display: inline-block; background: #F2A900; color: #002D62; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 10px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: white; padding: 24px; border-radius: 12px; border-left: 4px solid #002D62; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .kpi-card.insumos { border-left-color: #10b981; }
        .kpi-card.solicitudes { border-left-color: #F2A900; }
        .kpi-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .kpi-value { font-size: 32px; font-weight: 800; color: #002D62; }
        .kpi-card.insumos .kpi-value { color: #10b981; }
        .kpi-card.solicitudes .kpi-value { color: #F2A900; }
        .section { background: white; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .section-title { font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .section-title::before { content: ''; width: 4px; height: 20px; background: #F2A900; border-radius: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead { background: #f1f5f9; }
        th { padding: 14px 16px; text-align: left; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #334155; }
        tr:hover { background: #f8fafc; }
        .estado { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .estado.disponible { background: #d1fae5; color: #065f46; }
        .estado.prestado { background: #dbeafe; color: #1e40af; }
        .estado.espera { background: #fef3c7; color: #92400e; }
        .estado.mantenimiento { background: #fee2e2; color: #991b1b; }
        .estado.fuera { background: #e2e8f0; color: #475569; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .footer strong { color: #002D62; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte SPIEE</h1>
        <p>Generado el ${fecha} a las ${hora}</p>
        <span class="badge">${tipoReporte.toUpperCase()}</span>
    </div>
    
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Total Activos</div>
            <div class="kpi-value">${this.datos.activos?.length || 0}</div>
        </div>
        <div class="kpi-card insumos">
            <div class="kpi-label">Total Insumos</div>
            <div class="kpi-value">${this.datos.insumos?.length || 0}</div>
        </div>
        <div class="kpi-card solicitudes">
            <div class="kpi-label">Solicitudes del Mes</div>
            <div class="kpi-value">${this.getSolicitudesDelMes()}</div>
        </div>
    </div>`;

        // Activos
        if ((tipoReporte === 'general' || tipoReporte === 'activos') && this.datos.activos?.length > 0) {
            htmlContent += `
    <div class="section">
        <div class="section-title">Inventario de Activos</div>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>`;
            console.log('📊 Exportando activos:', this.datos.activos.length);
            this.datos.activos.forEach((a, index) => {
                if (index < 3) console.log('📊 Activo', index, ':', a);
                const estadoClass = this.getEstadoClass(a.estadoActivo);
                const codigo = a.numActivo || a.codigo || a.placa || '-';
                const nombre = (a.marca && a.modelo) ? `${a.marca} ${a.modelo}` : (a.nombre || a.NombProducto || 'Sin nombre');
                htmlContent += `
                <tr>
                    <td><strong>${codigo}</strong></td>
                    <td>${nombre}</td>
                    <td>${a.categoria || '-'}</td>
                    <td><span class="estado ${estadoClass}">${a.estadoActivo || '-'}</span></td>
                </tr>`;
            });
            htmlContent += `
            </tbody>
        </table>
    </div>`;
        }

        // Insumos
        console.log('📦 Exportando insumos:', this.datos.insumos?.length || 0);
        console.log('📦 Tipo reporte:', tipoReporte);
        console.log('📦 Insumos data:', this.datos.insumos);
        const mostrarInsumos = (tipoReporte === 'general' || tipoReporte === 'insumos') && (this.datos.insumos?.length > 0);
        console.log('📦 Mostrar insumos?:', mostrarInsumos);
        if (mostrarInsumos) {
            htmlContent += `
    <div class="section">
        <div class="section-title">Inventario de Insumos</div>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>`;
            console.log('📦 Renderizando', this.datos.insumos.length, 'insumos');
            this.datos.insumos.forEach((i, index) => {
                if (index < 3) console.log('📦 Insumo', index, ':', i);
                const estadoClass = this.getEstadoClass(i.estado);
                const codigo = i.codigo || i.id_insumo || i._id || '-';
                const nombre = i.NombProducto || i.nombre || i.descripcion || 'Sin nombre';
                const cantidad = i.cantidad || i.stock || i.stock_actual || 0;
                htmlContent += `
                <tr>
                    <td><strong>${codigo}</strong></td>
                    <td>${nombre}</td>
                    <td>${i.categoria || '-'}</td>
                    <td>${cantidad}</td>
                    <td><span class="estado ${estadoClass}">${i.estado || '-'}</span></td>
                </tr>`;
            });
            console.log('📦 HTML insumos generado');
            htmlContent += `
            </tbody>
        </table>
    </div>`;
        }

        // Usuarios
        // Resumen de Solicitudes por Estado
        if (this.datos.solicitudes?.length > 0) {
            const resumenEstados = {};
            this.datos.solicitudes.forEach(s => {
                const estado = s.estado || 'pendiente';
                resumenEstados[estado] = (resumenEstados[estado] || 0) + 1;
            });
            
            htmlContent += `
    <div class="section">
        <div class="section-title">Resumen de Solicitudes por Estado</div>
        <table>
            <thead>
                <tr>
                    <th>Estado</th>
                    <th>Cantidad</th>
                    <th>Porcentaje</th>
                </tr>
            </thead>
            <tbody>`;
            const totalSolicitudes = this.datos.solicitudes.length;
            Object.entries(resumenEstados).forEach(([estado, cantidad]) => {
                const estadoClass = this.getEstadoClass(estado);
                const porcentaje = ((cantidad / totalSolicitudes) * 100).toFixed(1);
                htmlContent += `
                <tr>
                    <td><span class="estado ${estadoClass}">${estado.toUpperCase()}</span></td>
                    <td><strong>${cantidad}</strong></td>
                    <td>${porcentaje}%</td>
                </tr>`;
            });
            htmlContent += `
                <tr style="background:#f1f5f9; font-weight:bold;">
                    <td>TOTAL</td>
                    <td>${totalSolicitudes}</td>
                    <td>100%</td>
                </tr>
            </tbody>
        </table>
    </div>`;

            // Detalle de cada Solicitud con Insumos
            htmlContent += `
    <div class="section">
        <div class="section-title">Detalle de Solicitudes</div>`;
            
            this.datos.solicitudes.forEach((s, index) => {
                const estadoClass = this.getEstadoClass(s.estado);
                const fecha = s.fecha_prestamo || s.createdAt ? new Date(s.fecha_prestamo || s.createdAt).toLocaleDateString('es-ES') : '-';
                const usuario = s.usuario;
                const usuarioNombre = usuario?.nombre_completo || usuario?.nombre || usuario?.email || usuario?.correo_electronico || 'N/A';
                const totalItems = (s.activos?.length || 0) + (s.insumos?.length || 0);
                
                htmlContent += `
        <div style="margin-bottom:20px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <div style="background:#f8fafc; padding:12px; border-bottom:1px solid #e2e8f0;">
                <strong>Solicitud #${s._id?.toString().slice(-6) || s.id || '-'}</strong> | 
                <span class="estado ${estadoClass}">${s.estado || '-'}</span> | 
                ${fecha} | 
                <strong>${usuarioNombre}</strong>
            </div>
            <div style="padding:12px;">
                <p><strong>Total Items:</strong> ${totalItems}</p>`;
                
                // Activos en la solicitud
                if (s.activos?.length > 0) {
                    htmlContent += `<p><strong>Activos:</strong></p><ul>`;
                    s.activos.forEach(a => {
                        const activoNombre = a.marca && a.modelo ? `${a.marca} ${a.modelo}` : (a.nombre || a.numActivo || 'Activo');
                        htmlContent += `<li>${activoNombre} (${a.numActivo || a.codigo || '-'})</li>`;
                    });
                    htmlContent += `</ul>`;
                }
                
                // Insumos en la solicitud con cantidades
                if (s.insumos?.length > 0) {
                    htmlContent += `<p><strong>Insumos Solicitados:</strong></p>
                <table style="width:100%; margin-top:8px;">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>`;
                    s.insumos.forEach(i => {
                        const insumoNombre = i.NombProducto || i.nombre || i.id_insumo?.NombProducto || 'Insumo';
                        const cantidad = i.cantidad || 1;
                        htmlContent += `
                        <tr>
                            <td>${insumoNombre}</td>
                            <td>${cantidad}</td>
                        </tr>`;
                    });
                    htmlContent += `</tbody></table>`;
                }
                
                htmlContent += `
            </div>
        </div>`;
            });
            
            htmlContent += `
    </div>`;

            // Detalle de Penalizaciones
            const solicitudesPenalizadas = this.datos.solicitudes.filter(s => s.estado === 'penalizada');
            const solicitudesConRetraso = this.datos.solicitudes.filter(s => {
                if (s.fecha_entrega_esperada && s.fecha_devolucion_real) {
                    const fechaEsperada = new Date(s.fecha_entrega_esperada);
                    const fechaReal = new Date(s.fecha_devolucion_real);
                    return fechaReal > fechaEsperada;
                }
                return false;
            });
            
            if (solicitudesPenalizadas.length > 0 || solicitudesConRetraso.length > 0) {
                htmlContent += `
    <div class="section">
        <div class="section-title" style="background:#dc2626; color:white;">DETALLE DE PENALIZACIONES</div>
        <div style="background:#fef2f2; padding:16px; border-radius:8px; margin-bottom:16px; border:2px solid #dc2626;">
            <h3 style="margin:0; color:#dc2626; font-size:24px;">
                ${solicitudesPenalizadas.length} solicitudes penalizadas | 
                ${solicitudesConRetraso.length} con retraso en devolución
            </h3>
        </div>`;
                
                // Mostrar solicitudes penalizadas o con retraso
                const todasPenalizaciones = [...new Set([...solicitudesPenalizadas, ...solicitudesConRetraso])];
                
                todasPenalizaciones.forEach(s => {
                    const estadoClass = this.getEstadoClass('penalizada');
                    const usuario = s.usuario;
                    const usuarioNombre = usuario?.nombre_completo || usuario?.nombre || usuario?.email || usuario?.correo_electronico || 'N/A';
                    
                    // Calcular días de retraso
                    let diasRetraso = 0;
                    if (s.fecha_entrega_esperada && s.fecha_devolucion_real) {
                        const fechaEsperada = new Date(s.fecha_entrega_esperada);
                        const fechaReal = new Date(s.fecha_devolucion_real);
                        const diffTime = fechaReal - fechaEsperada;
                        diasRetraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                    
                    const fechaPrestamo = s.fecha_prestamo ? new Date(s.fecha_prestamo).toLocaleDateString('es-ES') : '-';
                    const fechaEsperada = s.fecha_entrega_esperada ? new Date(s.fecha_entrega_esperada).toLocaleDateString('es-ES') : '-';
                    const fechaReal = s.fecha_devolucion_real ? new Date(s.fecha_devolucion_real).toLocaleDateString('es-ES') : '-';
                    
                    htmlContent += `
        <div style="margin-bottom:20px; border:2px solid #dc2626; border-radius:8px; overflow:hidden;">
            <div style="background:#fef2f2; padding:12px; border-bottom:2px solid #dc2626;">
                <strong>Solicitud #${s._id?.toString().slice(-6) || s.id || '-'}</strong> | 
                <span class="estado ${estadoClass}" style="font-weight:bold;">PENALIZADA</span> | 
                <strong>${usuarioNombre}</strong>
            </div>
            <div style="padding:12px;">
                <table style="width:100%; margin-bottom:12px;">
                    <tr>
                        <td style="padding:8px; background:#f8fafc; font-weight:bold;">Fecha Préstamo:</td>
                        <td style="padding:8px;">${fechaPrestamo}</td>
                        <td style="padding:8px; background:#f8fafc; font-weight:bold;">Entrega Esperada:</td>
                        <td style="padding:8px;">${fechaEsperada}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; background:#f8fafc; font-weight:bold;">Devolución Real:</td>
                        <td style="padding:8px;">${fechaReal}</td>
                        <td style="padding:8px; background:#f8fafc; font-weight:bold; color:#dc2626;">Días de Retraso:</td>
                        <td style="padding:8px; color:#dc2626; font-weight:bold;">${diasRetraso > 0 ? diasRetraso + ' días' : 'N/A'}</td>
                    </tr>
                </table>`;
                    
                    if (s.observaciones && s.observaciones !== 'Sin observaciones') {
                        htmlContent += `
                <div style="background:#fff7ed; padding:12px; border-radius:6px; border-left:4px solid #f97316;">
                    <strong>Motivo de Penalización:</strong><br>
                    ${s.observaciones}
                </div>`;
                    }
                    
                    // Insumos penalizados
                    if (s.insumos?.length > 0) {
                        htmlContent += `
                <p style="margin-top:12px;"><strong>Insumos Afectados:</strong></p>
                <table style="width:100%; margin-top:8px;">
                    <thead>
                        <tr style="background:#fee2e2;">
                            <th>Insumo</th>
                            <th>Cantidad Solicitada</th>
                        </tr>
                    </thead>
                    <tbody>`;
                        s.insumos.forEach(i => {
                            const insumoNombre = i.NombProducto || i.nombre || i.id_insumo?.NombProducto || 'Insumo';
                            const cantidad = i.cantidad || 1;
                            htmlContent += `
                        <tr>
                            <td>${insumoNombre}</td>
                            <td>${cantidad}</td>
                        </tr>`;
                        });
                        htmlContent += `</tbody></table>`;
                    }
                    
                    // Activos penalizados
                    if (s.activos?.length > 0) {
                        htmlContent += `
                <p style="margin-top:12px;"><strong>Activos Afectados:</strong></p>
                <ul>`;
                        s.activos.forEach(a => {
                            const activoNombre = a.marca && a.modelo ? `${a.marca} ${a.modelo}` : (a.nombre || a.numActivo || 'Activo');
                            htmlContent += `<li>${activoNombre} (${a.numActivo || a.codigo || '-'})</li>`;
                        });
                        htmlContent += `</ul>`;
                    }
                    
                    htmlContent += `
            </div>
        </div>`;
                });
                
                htmlContent += `
    </div>`;
            }
        }

        // Lista de Espera con Resumen
        if (this.datos.listaEspera?.length > 0) {
            const totalListaEspera = this.datos.listaEspera.length;
            
            htmlContent += `
    <div class="section">
        <div class="section-title">Lista de Espera - Resumen</div>
        <div style="background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:16px; border:2px solid #002D62;">
            <h3 style="margin:0; color:#002D62; font-size:24px;">${totalListaEspera} usuarios en espera</h3>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Usuario</th>
                    <th>Prioridad</th>
                    <th>Fecha Solicitud</th>
                </tr>
            </thead>
            <tbody>`;
            this.datos.listaEspera.forEach(l => {
                const fecha = l.fechaSolicitud ? new Date(l.fechaSolicitud).toLocaleDateString('es-ES') : '-';
                const prioridad = l.prioridad || 'Normal';
                let prioridadColor = '';
                if (prioridad === 'Alta') prioridadColor = 'background:#fee2e2; color:#dc2626; padding:4px 8px; border-radius:4px;';
                if (prioridad === 'Urgente') prioridadColor = 'background:#fef3c7; color:#d97706; padding:4px 8px; border-radius:4px;';
                
                htmlContent += `
                <tr>
                    <td><strong>${l.nombreProducto || l.insumoNombProducto || l.insumo?.NombProducto || '-'}</strong></td>
                    <td>${l.usuario?.nombre || l.usuario?.email || l.usuarioId || '-'}</td>
                    <td><span style="${prioridadColor}">${prioridad}</span></td>
                    <td>${fecha}</td>
                </tr>`;
            });
            htmlContent += `
                <tr style="background:#f1f5f9; font-weight:bold;">
                    <td colspan="4" style="text-align:center;">Total: ${totalListaEspera} solicitudes en lista de espera</td>
                </tr>
            </tbody>
        </table>
    </div>`;
        }

        htmlContent += `
    <div class="footer">
        <strong>SPIEE</strong> - Sistema de Préstamos e Inventario de Equipos Electrónicos<br>
        Universidad Técnica Nacional
    </div>
</body>
</html>`;

        // Descargar como HTML
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte-spiee-${tipoReporte}-${fecha}.html`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Utils.showToast('Reporte HTML descargado exitosamente', 'success');
    }

    getEstadoClass(estado) {
        if (!estado) return 'fuera';
        const e = estado.toLowerCase();
        if (e.includes('disponible')) return 'disponible';
        if (e.includes('prestado')) return 'prestado';
        if (e.includes('espera')) return 'espera';
        if (e.includes('mantenimiento') || e.includes('danado')) return 'mantenimiento';
        return 'fuera';
    }
}

// Crear instancia global
window.reportesController = new ReportesController();
