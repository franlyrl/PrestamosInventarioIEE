/**
 * SolicitudesController — Mejorado para Rol Estudiante
 * - Estudiantes ven SOLO sus propias solicitudes
 * - Pueden cancelar solicitudes pendientes
 * - Modal de detalle con historial de estados
 * - Alertas de devolución vencida
 */
class SolicitudesController {
    constructor() {
        this.solicitudes = [];
        this.listaEspera = [];
        this.filtros = { busqueda: '', estado: 'todos', desde: '', hasta: '', cedula: '', usuario: 'todos' };
        this.currentUser = JSON.parse(localStorage.getItem('utn_user')) || {};
        this.token = localStorage.getItem('utn_token') || '';
        this.apiBase = window.CONFIG?.API_BASE_URL || '/api';
        this.isAdmin = ['admin', 'administrador', 'administrativo'].some(r =>
            (this.currentUser.rol || '').toLowerCase().includes(r)
        );
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.currentTab = 'solicitudes'; // 'solicitudes' o 'lista-espera'
        this.listaEsperaPage = 1;
        this.listaEsperaPerPage = 3; // 3 productos por página

    }

    get headers() {
        return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };
    }

    // ─── Inicialización ──────────────────────────────────────────────────────────
    async initialize() {
        try {
            this._showLoading(true);
            await this.cargarSolicitudes();
            if (this.isAdmin) {
                await this.cargarListaEspera();
            }
            this.setupEventListeners();
            this.setupRoleBasedVisibility();
            this.setupTabs();

            // Si es admin y hay lista de espera, mostrar esa tab por defecto
            if (this.isAdmin && this.listaEspera.length > 0) {
                this.switchTab('lista-espera');
            } else {
                this.switchTab('solicitudes');
            }
        } catch (error) {
            this._toast('Error al cargar solicitudes', 'error');
        } finally {
            this._showLoading(false);
        }
    }

    // ─── Carga de Solicitudes ────────────────────────────────────────────────────
    async cargarSolicitudes() {
        const resp = await fetch(`${this.apiBase}/solicitudes`, { headers: this.headers });
        if (!resp.ok) throw new Error(`API error ${resp.status}`);
        const data = await resp.json();

        const todas = Array.isArray(data) ? data : [];
        if (this.isAdmin) {
            this.solicitudes = todas;
        } else {
            const uid = this.currentUser._id || this.currentUser.id;
            this.solicitudes = todas.filter(s => {
                // Verificar todas las posibles formas en que viene el ID
                const sUserId = s.usuario?._id || s.usuario?.id || s.usuario;
                return sUserId === uid || sUserId?.toString() === uid?.toString();
            });
            // Si por alguna razón el filtro frontal falla pero el backend ya filtró, usar todas
            if (this.solicitudes.length === 0 && todas.length > 0) {
                this.solicitudes = todas;
            }
        }
        
        // Poblar dropdown de usuarios (solo para admins)
        this.poblaDdUsuarios();
    }

    // ─── Carga de Lista de Espera ────────────────────────────────────────────────
    async cargarListaEspera() {
        if (!this.isAdmin) return;
        const resp = await fetch(`${this.apiBase}/listaEspera`, { headers: this.headers });
        if (!resp.ok) throw new Error(`API error ${resp.status}`);
        const data = await resp.json();
        this.listaEspera = Array.isArray(data) ? data : (data.data || []);
    }

    // ─── Población del Dropdown de Usuarios ──────────────────────────────────────
    poblaDdUsuarios() {
        const ddUsuarios = document.getElementById('usuario-filter');
        if (!ddUsuarios || !this.isAdmin) return;

        // Obtener usuarios únicos
        const usuariosSet = new Map();
        this.solicitudes.forEach(s => {
            const uid = s.usuario?._id || s.usuario?.id || s.usuario;
            const nombre = s.usuario?.nombre_completo || 'Desconocido';
            if (uid && !usuariosSet.has(uid?.toString())) {
                usuariosSet.set(uid?.toString(), nombre);
            }
        });

        // Construir opciones
        let opciones = '<option value="todos">Todos los usuarios</option>';
        usuariosSet.forEach((nombre, uid) => {
            opciones += `<option value="${uid}">${nombre}</option>`;
        });
        
        ddUsuarios.innerHTML = opciones;
    }

    // ─── Eventos ─────────────────────────────────────────────────────────────────
    setupEventListeners() {
        document.getElementById('busqueda')?.addEventListener('input', e => {
            this.filtros.busqueda = e.target.value.toLowerCase();
            this.currentPage = 1;
            this.render();
        });
        document.getElementById('estado-filter')?.addEventListener('change', e => {
            this.filtros.estado = e.target.value;
            this.currentPage = 1;
            this.render();
        });
        document.getElementById('fecha-desde')?.addEventListener('change', e => {
            this.filtros.desde = e.target.value;
            this.currentPage = 1;
            this.render();
        });
        document.getElementById('fecha-hasta')?.addEventListener('change', e => {
            this.filtros.hasta = e.target.value;
            this.currentPage = 1;
            this.render();
        });
        document.getElementById('cedula-filter')?.addEventListener('input', e => {
            this.filtros.cedula = e.target.value.trim();
            this.currentPage = 1;
            this.render();
        });
        document.getElementById('usuario-filter')?.addEventListener('change', e => {
            this.filtros.usuario = e.target.value;
            this.currentPage = 1;
            this.render();
        });
        document.getElementById('btn-refrescar')?.addEventListener('click', () => this.initialize());
    }

    // ─── Configuración de Visibilidad Basada en Rol ──────────────────────────────
    setupRoleBasedVisibility() {
        if (!this.isAdmin) {
            // Ocultar filtros solo para administradores
            document.getElementById('filtro-cedula-wrapper')?.classList.add('hidden');
            document.getElementById('filtro-usuario-wrapper')?.classList.add('hidden');
        }
    }

    // ─── Configuración de Tabs ──────────────────────────────────────────────────
    setupTabs() {
        if (!this.isAdmin) {
            document.getElementById('tabs-container')?.classList.add('hidden');
            return;
        }

        // Mostrar tabs
        document.getElementById('tabs-container')?.classList.remove('hidden');

        // Event listeners para tabs
        document.getElementById('tab-solicitudes')?.addEventListener('click', () => this.switchTab('solicitudes'));
        document.getElementById('tab-lista-espera')?.addEventListener('click', () => this.switchTab('lista-espera'));

        // Verificar URL params
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab === 'lista-espera') {
            this.switchTab('lista-espera');
        }
    }

    // ─── Cambiar Tab ───────────────────────────────────────────────────────────
    switchTab(tab) {
        this.currentTab = tab;
        this.currentPage = 1;

        // Actualizar URL sin recargar
        const url = new URL(window.location);
        if (tab === 'lista-espera') {
            url.searchParams.set('tab', 'lista-espera');
        } else {
            url.searchParams.delete('tab');
        }
        window.history.replaceState({}, '', url);

        // Actualizar UI de tabs
        document.getElementById('tab-solicitudes')?.classList.toggle('tab-active', tab === 'solicitudes');
        document.getElementById('tab-lista-espera')?.classList.toggle('tab-active', tab === 'lista-espera');

        // Mostrar/ocultar contenedores
        const solicitudesContainer = document.getElementById('solicitudes-tbody-desktop')?.parentElement?.parentElement;
        const listaEsperaContainer = document.getElementById('lista-espera-container');
        const mobileSolicitudes = document.getElementById('mobile-solicitudes-container');
        const mobileListaEspera = document.getElementById('mobile-lista-espera-container');
        const paginacionSolicitudes = document.getElementById('paginacion-solicitudes');
        const paginacionListaEspera = document.getElementById('paginacion-lista-espera');

        if (tab === 'solicitudes') {
            solicitudesContainer?.classList.remove('hidden');
            listaEsperaContainer?.classList.add('hidden');
            mobileSolicitudes?.classList.remove('hidden');
            mobileListaEspera?.classList.add('hidden');
            paginacionSolicitudes?.classList.remove('hidden');
            paginacionListaEspera?.classList.add('hidden');
        } else {
            solicitudesContainer?.classList.add('hidden');
            listaEsperaContainer?.classList.remove('hidden');
            mobileSolicitudes?.classList.add('hidden');
            mobileListaEspera?.classList.remove('hidden');
            paginacionSolicitudes?.classList.add('hidden');
            paginacionListaEspera?.classList.remove('hidden');
        }

        this.render();
    }

    // ─── Filtrado ────────────────────────────────────────────────────────────────
    getFiltered() {
        return this.solicitudes.filter(s => {
            const matchEstado = this.filtros.estado === 'todos' || s.estado === this.filtros.estado;
            
            // Búsqueda por Nombre o Folio (#001) o ID técnico
            const folioStr = s.folio ? String(s.folio).padStart(3, '0') : '';
            const searchText = this.filtros.busqueda.toLowerCase();
            const matchBusqueda = !this.filtros.busqueda ||
                (s.usuario?.nombre_completo || '').toLowerCase().includes(searchText) ||
                folioStr.includes(searchText.replace('#', '')) ||
                s._id.toLowerCase().includes(searchText);

            // Filtro específico por cédula
            const matchCedula = !this.filtros.cedula ||
                (s.usuario?.cedula || '').includes(this.filtros.cedula);

            // Filtro por usuario
            const sUserId = s.usuario?._id || s.usuario?.id || s.usuario;
            const matchUsuario = this.filtros.usuario === 'todos' || sUserId?.toString() === this.filtros.usuario?.toString();

            // Filtro por rango de fechas
            let matchFecha = true;
            if (this.filtros.desde) {
                const f = new Date(s.createdAt);
                const d = new Date(this.filtros.desde + 'T00:00:00');
                if (f < d) matchFecha = false;
            }
            if (this.filtros.hasta && matchFecha) {
                const f = new Date(s.createdAt);
                const h = new Date(this.filtros.hasta + 'T23:59:59');
                if (f > h) matchFecha = false;
            }

            return matchEstado && matchBusqueda && matchCedula && matchUsuario && matchFecha;
        });
    }

    // ─── Render General ─────────────────────────────────────────────────────────
    render() {
        if (this.currentTab === 'solicitudes') {
            const filtered = this.getFiltered();
            this.updateStats(filtered);
            const totalPags = Math.ceil(filtered.length / this.itemsPerPage);
            if (this.currentPage > totalPags) this.currentPage = Math.max(1, totalPags);
            const inicio = (this.currentPage - 1) * this.itemsPerPage;
            const pagData = filtered.slice(inicio, inicio + this.itemsPerPage);
            this.renderDesktop(pagData);
            this.renderMobile(pagData);
            this.renderPaginacion(filtered.length, 'paginacion-solicitudes');
        } else if (this.currentTab === 'lista-espera') {
            this.renderListaEspera();
        }
    }

    // ─── Paginación ──────────────────────────────────────────────────────────────
    renderPaginacion(total, containerId = 'paginacion-solicitudes') {
        const totalPags = Math.ceil(total / this.itemsPerPage);
        const contenedor = document.getElementById(containerId);
        if (!contenedor) return;
        if (totalPags <= 1) { contenedor.innerHTML = ''; return; }

        const inicio = (this.currentPage - 1) * this.itemsPerPage + 1;
        const fin    = Math.min(this.currentPage * this.itemsPerPage, total);

        const btnBase   = 'w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all';
        const btnActive = 'bg-[#002D62] text-white shadow-md';
        const btnNormal = 'bg-white border border-slate-200 text-slate-600 hover:border-[#002D62] hover:text-[#002D62]';
        const btnDis    = 'bg-white border border-slate-100 text-slate-300 cursor-not-allowed';

        let pages = [];
        for (let i = 1; i <= totalPags; i++) {
            if (i === 1 || i === totalPags || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) pages.push(i);
            else if (i === this.currentPage - 2 || i === this.currentPage + 2) pages.push('...');
        }
        pages = pages.filter((p, idx) => !(p === '...' && pages[idx-1] === '...'));

        const pgBtns = pages.map(p => {
            if (p === '...') return `<span class="${btnBase} text-slate-400 text-sm">…</span>`;
            return `<button class="${btnBase} ${p === this.currentPage ? btnActive : btnNormal}" onclick="window.solicitudesController.irPagina(${p})">${p}</button>`;
        }).join('');

        contenedor.innerHTML = `
            <div class="flex items-center justify-between gap-4 flex-wrap py-4 px-1 border-t border-slate-100 mt-2">
                <span class="text-xs text-slate-500 font-medium">
                    Mostrando <strong class="text-slate-700">${inicio}–${fin}</strong> de <strong class="text-slate-700">${total}</strong> solicitudes
                </span>
                <div class="flex items-center gap-1.5">
                    <button class="${btnBase} ${this.currentPage === 1 ? btnDis : btnNormal}" onclick="window.solicitudesController.irPagina(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    ${pgBtns}
                    <button class="${btnBase} ${this.currentPage === totalPags ? btnDis : btnNormal}" onclick="window.solicitudesController.irPagina(${this.currentPage + 1})" ${this.currentPage === totalPags ? 'disabled' : ''}>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </div>`;
    }

    irPagina(p) {
        const totalPags = Math.ceil(this.getFiltered().length / this.itemsPerPage);
        this.currentPage = Math.max(1, Math.min(Number(p), totalPags));
        this.render();
        document.querySelector('.overflow-x-auto, #mobile-solicitudes-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ─── Paginación Lista de Espera ────────────────────────────────────────────
    renderPaginacionListaEspera(totalGrupos, totalItems) {
        console.log('📄 [renderPaginacionListaEspera] Llamada con:', { totalGrupos, totalItems, perPage: this.listaEsperaPerPage });
        const totalPags = Math.ceil(totalGrupos / this.listaEsperaPerPage);
        const contenedor = document.getElementById('paginacion-lista-espera');
        console.log('📄 [renderPaginacionListaEspera] Contenedor:', contenedor);
        if (!contenedor) {
            console.error('❌ [renderPaginacionListaEspera] No se encontró el contenedor paginacion-lista-espera');
            return;
        }

        console.log('📄 [renderPaginacionListaEspera] totalPags:', totalPags);
        if (totalPags <= 1) {
            console.log('📄 [renderPaginacionListaEspera] Solo 1 página, mostrando total');
            contenedor.innerHTML = `<p class="text-center text-sm text-slate-500 mt-4">Total: ${totalItems} usuarios en ${totalGrupos} producto(s)</p>`;
            return;
        }

        console.log('📄 [renderPaginacionListaEspera] Renderizando paginación con', totalPags, 'páginas');
        const btnBase = 'w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition';
        const btnNormal = 'text-slate-600 hover:bg-slate-100';
        const btnActive = 'bg-[#002D62] text-white';
        const btnDis = 'text-slate-300 cursor-not-allowed';

        // Generar rango de páginas
        let pages = [];
        for (let i = 1; i <= totalPags; i++) {
            if (i === 1 || i === totalPags || (i >= this.listaEsperaPage - 1 && i <= this.listaEsperaPage + 1)) pages.push(i);
            else if (i === this.listaEsperaPage - 2 || i === this.listaEsperaPage + 2) pages.push('...');
        }
        pages = pages.filter((p, idx) => !(p === '...' && pages[idx-1] === '...'));

        const pgBtns = pages.map(p => {
            if (p === '...') return `<span class="${btnBase} text-slate-400 text-sm">…</span>`;
            return `<button class="${btnBase} ${p === this.listaEsperaPage ? btnActive : btnNormal}" onclick="window.solicitudesController.irPaginaListaEspera(${p})">${p}</button>`;
        }).join('');

        const inicio = (this.listaEsperaPage - 1) * this.listaEsperaPerPage + 1;
        const fin = Math.min(inicio + this.listaEsperaPerPage - 1, totalGrupos);

        contenedor.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-4">
                <span class="text-xs text-slate-500 font-medium">
                    Mostrando <strong class="text-slate-700">${inicio}–${fin}</strong> de <strong class="text-slate-700">${totalGrupos}</strong> productos
                </span>
                <div class="flex items-center gap-1.5">
                    <button class="${btnBase} ${this.listaEsperaPage === 1 ? btnDis : btnNormal}" onclick="window.solicitudesController.irPaginaListaEspera(${this.listaEsperaPage - 1})" ${this.listaEsperaPage === 1 ? 'disabled' : ''}>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    ${pgBtns}
                    <button class="${btnBase} ${this.listaEsperaPage === totalPags ? btnDis : btnNormal}" onclick="window.solicitudesController.irPaginaListaEspera(${this.listaEsperaPage + 1})" ${this.listaEsperaPage === totalPags ? 'disabled' : ''}>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </div>`;
        console.log('✅ [renderPaginacionListaEspera] HTML insertado en contenedor');
    }

    irPaginaListaEspera(p) {
        const grupos = this.agruparListaEspera();
        const totalGrupos = Object.keys(grupos).length;
        const totalPags = Math.ceil(totalGrupos / this.listaEsperaPerPage);
        this.listaEsperaPage = Math.max(1, Math.min(Number(p), totalPags));
        this.renderListaEspera();
        document.getElementById('lista-espera-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Helper para agrupar lista de espera
    agruparListaEspera() {
        return this.listaEspera.reduce((acc, espera) => {
            const articuloNombre = espera.nombreProducto || espera.insumo?.NombProducto || espera.insumo?.nombre_insumo || 'Producto desconocido';
            const numeroSerie = espera.insumo?.numero_serie || espera.insumo?.serie || '';
            const grupoKey = numeroSerie ? `${articuloNombre} (Serie: ${numeroSerie})` : articuloNombre;

            if (!acc[grupoKey]) {
                acc[grupoKey] = { nombre: grupoKey, items: [] };
            }
            acc[grupoKey].items.push(espera);
            return acc;
        }, {});
    }

    // ─── Render Lista de Espera ─────────────────────────────────────────────────
    renderListaEspera() {
        console.log('🔍 [Solicitudes] Lista de espera:', this.listaEspera);
        console.log('🔍 [Solicitudes] Primer registro:', this.listaEspera[0]);
        
        // Agrupar por nombre de producto + número de serie
        const grupos = this.listaEspera.reduce((acc, espera) => {
            // Obtener nombre del producto
            const articuloNombre = espera.nombreProducto || espera.insumo?.NombProducto || espera.insumo?.nombre_insumo || 'Producto desconocido';
            // Obtener número de serie (si existe)
            const numeroSerie = espera.insumo?.numero_serie || espera.insumo?.serie || '';
            // Crear clave única: nombre + número de serie
            const grupoKey = numeroSerie ? `${articuloNombre} (Serie: ${numeroSerie})` : articuloNombre;

            console.log('🔍 [Agrupar] Espera ID:', espera._id, '| Key:', grupoKey, '| nombre:', articuloNombre, '| serie:', numeroSerie);

            if (!acc[grupoKey]) {
                acc[grupoKey] = {
                    nombre: grupoKey,
                    items: []
                };
                console.log('🔍 [Agrupar] Nuevo grupo creado para:', grupoKey);
            }
            acc[grupoKey].items.push(espera);
            return acc;
        }, {});

        console.log('🔍 [Grupos] Total grupos:', Object.keys(grupos).length);
        console.log('🔍 [Grupos] Keys:', Object.keys(grupos));

        // Ordenar items dentro de cada grupo por prioridad y fecha
        Object.values(grupos).forEach(grupo => {
            grupo.items.sort((a, b) => {
                if (a.prioridad !== b.prioridad) return b.prioridad - a.prioridad;
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
        });

        // Colores alternados: azul y oro
        const coloresHeader = ['bg-[#002D62]', 'bg-amber-500'];

        // Convertir grupos a array para paginación
        const gruposArray = Object.entries(grupos);
        const totalGrupos = gruposArray.length;
        const totalPags = Math.ceil(totalGrupos / this.listaEsperaPerPage);
        
        // Ajustar página si está fuera de rango
        if (this.listaEsperaPage > totalPags) this.listaEsperaPage = Math.max(1, totalPags);
        
        // Calcular grupos a mostrar
        const inicio = (this.listaEsperaPage - 1) * this.listaEsperaPerPage;
        const gruposPagina = gruposArray.slice(inicio, inicio + this.listaEsperaPerPage);

        // Render desktop - contenedor de tarjetas por producto
        const desktopContainer = document.getElementById('lista-espera-container');
        if (desktopContainer) {
            desktopContainer.innerHTML = gruposPagina.map(([grupoKey, grupo], index) => {
                const colorHeader = coloresHeader[(inicio + index) % coloresHeader.length];
                return `
                    <div class="card mb-6 overflow-hidden border-l-4 border-${colorHeader.replace('bg-', '')}">
                        <div class="${colorHeader} text-white px-6 py-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">
                                    ${grupo.items.length}
                                </div>
                                <div>
                                    <h2 class="text-lg font-bold">${grupo.nombre}</h2>
                                    <p class="text-xs text-white/80">${grupo.items.length} usuario(s) en espera</p>
                                </div>
                            </div>
                        </div>
                        <div class="p-4">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pos</th>
                                        <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                        <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad</th>
                                        <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Solicitud</th>
                                        <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Llegada Estimada</th>
                                        <th class="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                        <th class="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    ${grupo.items.map((espera, idx) => {
                                        const usuario = espera.usuario?.nombre_completo || 'Desconocido';
                                        const fecha = new Date(espera.createdAt).toLocaleString('es-CR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                        const fechaEstimada = espera.fecha_estimada 
                                            ? new Date(espera.fecha_estimada).toLocaleString('es-CR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : '<span class="text-slate-400 text-xs">Sin definir</span>';
                                        const estado = espera.estado || 'esperando';
                                        const estadoClass = {
                                            esperando: 'text-amber-600',
                                            notificado: 'text-blue-600',
                                            entregado: 'text-green-600',
                                            cancelado: 'text-red-600'
                                        }[estado] || 'text-slate-600';

                                        return `
                                            <tr class="hover:bg-slate-50">
                                                <td class="px-4 py-3 text-sm font-bold text-[#002D62]">${idx + 1}</td>
                                                <td class="px-4 py-3 text-sm text-slate-700">${usuario}</td>
                                                <td class="px-4 py-3 text-sm text-slate-700">${espera.cantidad_solicitada || 1}</td>
                                                <td class="px-4 py-3 text-sm text-slate-700">${fecha}</td>
                                                <td class="px-4 py-3 text-sm font-bold text-green-600">${fechaEstimada}</td>
                                                <td class="px-4 py-3 text-sm ${estadoClass} font-medium">${estado.charAt(0).toUpperCase() + estado.slice(1)}</td>
                                                <td class="px-4 py-3 text-sm text-center">
                                                    <button onclick="window.editarEspera('${espera._id}')" class="text-blue-600 hover:text-blue-800 mr-2">Asignar fecha</button>
                                                    <button onclick="window.marcarProcesando('${espera._id}')" class="text-green-600 hover:text-green-800">Procesar</button>
                                                </td>
                                            </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>`;
            }).join('');
        }

        // Render paginación
        const total = Object.values(grupos).reduce((sum, g) => sum + g.items.length, 0);
        console.log('📄 [Paginación] totalGrupos:', totalGrupos, 'totalItems:', total, 'container:', document.getElementById('paginacion-lista-espera'));
        this.renderPaginacionListaEspera(totalGrupos, total);

        // Ocultar tabla antigua si existe
        const oldTable = document.getElementById('lista-espera-table');
        if (oldTable) oldTable.classList.add('hidden');
    }

    updateStats(data) {
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('total-solicitudes', data.length);
        set('pendientes-count', data.filter(s => s.estado === 'pendiente').length);
        set('aprobadas-count', data.filter(s => s.estado === 'aprobada').length);
        set('rechazadas-count', data.filter(s => s.estado === 'rechazada').length);
        set('entregadas-count', data.filter(s => s.estado === 'entregado').length);
        set('canceladas-count', data.filter(s => s.estado === 'cancelada').length);
    }

    // ─── Renderizar tabla Desktop ───────────────────────────────────────────────
    renderDesktop(data) {
        const tbody = document.getElementById('solicitudes-tbody-desktop');
        if (!tbody) return;
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-10 text-center text-slate-400 text-sm">No se encontraron solicitudes</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(s => {
            const ahora = new Date();
            const vencida = s.estado === 'entregado' && s.fecha_entrega_esperada && new Date(s.fecha_entrega_esperada) < ahora;
            const rowClass = vencida ? 'bg-red-50/50' : 'hover:bg-slate-50';
            const fechaDev = s.fecha_entrega_esperada
                ? `<br><span class="text-[9px] ${vencida ? 'text-red-600 font-black' : 'text-slate-400'}">Dev: ${new Date(s.fecha_entrega_esperada).toLocaleDateString()}</span>`
                : '';
            // E: Correo directo al estudiante (para administradores)
            const correoEstudiante = s.usuario?.correo_electronico || '';
            const cedulaEstudiante = s.usuario?.cedula || '';
            const btnCorreoEstudiante = correoEstudiante ? `
            <a href="mailto:${correoEstudiante}?subject=Solicitud%20de%20Pr%C3%A9stamo%20%23${String(s.folio || 0).padStart(3, '0')}&body=Estimado(a)%20${encodeURIComponent(s.usuario?.nombre_completo || '')}%2C%0A%0A" 
               title="Enviar correo a ${correoEstudiante}" target="_blank"
               onclick="event.stopPropagation()"
               class="p-2 hover:bg-yellow-50 rounded-lg transition text-yellow-600" style="display:inline-flex">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </a>` : '';
            
            // E: Correo directo al administrador (para estudiantes y docentes)
            const btnCorreoAdministrador = !this.isAdmin ? `
            <a href="mailto:hmoram@utn.ac.cr?subject=Contacto%20de%20Estudiante%20-%20Solicitud%20%23${s.folio ? String(s.folio).padStart(3, '0') : '---'}&body=Estudiante:%20${encodeURIComponent(s.usuario?.nombre_completo || '')}%2C%0A%0ACorreo:%20${encodeURIComponent(s.usuario?.correo_electronico || '')}%2C%0A%0AC%C3%A9dula:%20${encodeURIComponent(s.usuario?.cedula || '')}%2C%0A%0ASolicitud:%20%23${s.folio ? String(s.folio).padStart(3, '0') : '---'}%2C%0A%0AMotivo:%20Deseo%20contactar%20al%20administrador%20respecto%20a%20mi%20solicitud%20%23${s.folio ? String(s.folio).padStart(3, '0') : '---'}%2C%0A%0APor%20favor,%20comun%C3%ADquese%20conmigo%20a%20la%20brevedad%20posible.%2C%0A%0A%0ADatos%20de%20contacto:%2C%0A%0A-%20Tel%C3%A9fono:%20[agregar%20si%20aplica]%2C%0A-%20Horario%20disponible:%20[agregar%20si%20aplica]%2C%0A%0AGracias.%2C%0A%0A%0A${encodeURIComponent(s.usuario?.nombre_completo || '')}" 
               title="Contactar Administrador" target="_blank"
               onclick="event.stopPropagation()"
               class="p-2 hover:bg-blue-50 rounded-lg transition text-slate-400 hover:text-blue-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        </a>` : '';
            
            // Determinar qué botón mostrar según el rol
            const btnCorreo = this.isAdmin ? btnCorreoEstudiante : btnCorreoAdministrador;
            return `
            <tr class="${rowClass} transition-colors cursor-pointer" onclick="window.solicitudesController.verDetalles('${s._id}')">
                <td class="p-4 font-mono text-xs text-slate-400">#${String(s.folio || 0).padStart(3, '0')}</td>
                <td class="p-4 font-bold text-slate-700 text-sm">
                    ${s.usuario?.nombre_completo || this.currentUser.nombre_completo || 'N/A'}
                    ${this.isAdmin && s.usuario?.correo_electronico ? `<br><span class="text-[9px] text-slate-400">${s.usuario?.correo_electronico}</span>` : ''}
                    ${cedulaEstudiante ? `<br><span class="text-[9px] text-slate-400">C.I: ${cedulaEstudiante}</span>` : ''}
                    ${fechaDev}
                </td>
                <td class="p-4 text-xs text-slate-500">${this.formatItems(s)}</td>
                <td class="p-4 text-xs text-slate-500">${new Date(s.createdAt).toLocaleString('es-CR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td class="p-4 text-center">
                    <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${this.getStatusClass(s.estado)}">${this.getStatusLabel(s.estado)}</span>
                </td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                        ${btnCorreo}
                        <button title="Ver detalle" onclick="event.stopPropagation(); window.solicitudesController.verDetalles('${s._id}')" class="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-utn-blue">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        ${s.estado === 'pendiente' ? `
                        <button title="Cancelar solicitud" onclick="event.stopPropagation(); window.solicitudesController.cancelar('${s._id}')" class="p-2 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        ` : ''}
                        ${this.isAdmin && s.estado === 'pendiente' ? `
                        <button title="Aprobar" onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'aprobada')" class="p-2 hover:bg-green-50 rounded-lg transition text-green-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        </button>` : ''}
                        ${this.isAdmin && s.estado === 'aprobada' ? `
                        <button title="Marcar Entregado" onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'entregado')" class="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        </button>` : ''}
                        ${this.isAdmin && s.estado === 'entregado' ? `
                        <button title="Marcar Devuelto" onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'devuelto')" class="p-2 hover:bg-indigo-50 rounded-lg transition text-indigo-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2m-2 2v10a8 8 0 018 8M3 12l2-2m-2-2v10a1 1 0 001 1h3m-6 0h6"/></svg>
                        </button>` : ''}
                        ${this.isAdmin && s.estado === 'entregado' ? `
                        <button title="Penalizar usuario" onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'penalizado')" class="p-2 hover:bg-orange-50 rounded-lg transition text-orange-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                        </button>` : ''}
                        ${this.isAdmin && s.estado === 'penalizado' ? `
                        <button title="Quitar sanción" onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'entregado')" class="p-2 hover:bg-emerald-50 rounded-lg transition text-emerald-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </button>
                        <button title="Poner fuera de servicio" onclick="event.stopPropagation(); window.solicitudesController.ponerFueraDeServicio('${s._id}')" class="p-2 hover:bg-red-50 rounded-lg transition text-red-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </button>` : ''}
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // ─── Renderizar tarjetas Mobile ──────────────────────────────────────────────
    renderMobile(data) {
        const container = document.getElementById('mobile-solicitudes-container');
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400 text-sm">Sin solicitudes encontradas</div>';
            return;
        }
        const ahora = new Date();
        container.innerHTML = data.map(s => {
            const vencida = s.estado === 'entregado' && s.fecha_entrega_esperada && new Date(s.fecha_entrega_esperada) < ahora;
            const diasRestantes = s.fecha_entrega_esperada
                ? Math.ceil((new Date(s.fecha_entrega_esperada) - ahora) / (1000*60*60*24))
                : null;
            const alertaDev = diasRestantes !== null && s.estado === 'entregado'
                ? `<div class="${vencida ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'} flex items-center gap-1.5 text-[10px] font-black px-2 py-1.5 rounded-lg mt-2">
                    ${vencida ? `<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg> Vencida hace ${Math.abs(diasRestantes)} días` : `<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Devolver en ${diasRestantes} día(s) — ${new Date(s.fecha_entrega_esperada).toLocaleDateString()}`}
                  </div>`
                : '';
            return `
            <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm border-l-4 ${this.getStatusBorder(s.estado)} ${vencida ? 'ring-1 ring-red-200' : ''} cursor-pointer" onclick="window.solicitudesController.verDetalles('${s._id}')">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-mono text-slate-400">#${String(s.folio || 0).padStart(3, '0')}</span>
                    <span class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide ${this.getStatusClass(s.estado)}">${this.getStatusLabel(s.estado)}</span>
                </div>
                <p class="font-black text-slate-800 text-sm">${s.usuario?.nombre_completo || this.currentUser.nombre_completo || 'N/A'}</p>
                ${this.isAdmin ? `
                <p class="text-xs text-slate-500 mt-1 truncate">${s.usuario?.correo_electronico || 'N/A'}</p>
                ${s.usuario?.cedula ? `<p class="text-[9px] text-slate-400 mt-0.5">C.I: ${s.usuario?.cedula}</p>` : ''}
                ` : ''}
                <p class="text-xs text-slate-500 mt-1 truncate">${this.formatItems(s)}</p>
                <p class="text-[10px] text-slate-400 mt-1">${new Date(s.createdAt).toLocaleString('es-CR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                ${alertaDev}
                <div class="flex gap-2 mt-3">
                    <button onclick="event.stopPropagation(); window.solicitudesController.verDetalles('${s._id}')" class="flex-1 py-2 text-xs font-bold text-utn-blue bg-blue-50 rounded-xl hover:bg-blue-100 transition">Ver Detalle</button>
                    ${s.estado === 'pendiente' && !this.isAdmin ? `<button onclick="event.stopPropagation(); window.solicitudesController.cancelar('${s._id}')" class="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition">Cancelar</button>` : ''}
                    
                    <!-- E: Botón de correo según rol (igual que desktop) -->
                    ${this.isAdmin && s.usuario?.correo_electronico ? `
                    <a href="mailto:${s.usuario?.correo_electronico}?subject=Solicitud%20de%20Pr%C3%A9stamo%20%23${String(s.folio || 0).padStart(3, '0')}&body=Estimado(a)%20${encodeURIComponent(s.usuario?.nombre_completo || '')}%2C%0A%0A" 
                       onclick="event.stopPropagation()"
                       title="Enviar correo a ${s.usuario?.correo_electronico}"
                       target="_blank"
                       class="px-3 py-2 text-xs font-bold text-yellow-600 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition inline-flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                       Email
                    </a>` : ''}
                    
                    ${!this.isAdmin ? `
                    <a href="mailto:hmoram@utn.ac.cr?subject=Contacto%20de%20Estudiante%20-%20Solicitud%20%23${s.folio ? String(s.folio).padStart(3, '0') : '---'}&body=Estudiante:%20${encodeURIComponent(s.usuario?.nombre_completo || '')}%2C%0A%0ACorreo:%20${encodeURIComponent(s.usuario?.correo_electronico || '')}%2C%0A%0AC%C3%A9dula:%20${encodeURIComponent(s.usuario?.cedula || '')}%2C%0A%0ASolicitud:%20%23${s.folio ? String(s.folio).padStart(3, '0') : '---'}%2C%0A%0AMotivo:%20Deseo%20contactar%20al%20administrador%20respecto%20a%20mi%20solicitud%20%23${s.folio ? String(s.folio).padStart(3, '0') : '---'}%2C%0A%0APor%20favor,%20comun%C3%ADquese%20conmigo%20a%20la%20brevedad%20posible.%2C%0A%0A%0ADatos%20de%20contacto:%2C%0A%0A-%20Tel%C3%A9fono:%20[agregar%20si%20aplica]%2C%0A-%20Horario%20disponible:%20[agregar%20si%20aplica]%2C%0A%0AGracias.%2C%0A%0A%0A${encodeURIComponent(s.usuario?.nombre_completo || '')}" 
                       onclick="event.stopPropagation()"
                       title="Contactar Administrador" target="_blank"
                       class="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition inline-flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                       Contactar Admin
                    </a>` : ''}
                    ${this.isAdmin && s.estado === 'pendiente' ? `<button onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'aprobada')" class="px-3 py-2 text-xs font-bold text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition">Aprobar</button>` : ''}
                    ${this.isAdmin && s.estado === 'aprobada' ? `<button onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'entregado')" class="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition">Entregar</button>` : ''}
                    ${this.isAdmin && s.estado === 'entregado' ? `<button onclick="event.stopPropagation(); window.solicitudesController.cambiarEstado('${s._id}', 'devuelto')" class="px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition">Devuelto</button>` : ''}
                    ${this.isAdmin && s.estado === 'penalizado' ? `<button onclick="event.stopPropagation(); window.solicitudesController.ponerFueraDeServicio('${s._id}')" class="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition inline-flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        Fuera de Servicio
                    </button>` : ''}
                </div>
            </div>`;

               }).join('');
}

    

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    formatItems(s) {
        const items = [];
        
        // Procesar activos con detalles
        if (s.activos?.length) {
            s.activos.forEach(activo => {
                // Obtener nombre del activo
                let nombre = 'Activo';
                if (typeof activo === 'object') {
                    nombre = activo.nombre || activo.marca || activo.modelo || activo.codigo_activo || 'Activo';
                }
                // Obtener cantidad (por defecto 1 si no especificada)
                const cantidad = activo.cantidad || activo.quantity || 1;
                
                if (cantidad > 1) {
                    items.push(`${cantidad}x ${nombre}`);
                } else {
                    items.push(nombre);
                }
            });
        }
        
        // Procesar insumos con detalles
        if (s.insumos?.length) {
            s.insumos.forEach(insumo => {
                let nombre = 'Insumo';
                let cantidad = 1;
                
                if (typeof insumo === 'object') {
                    // Intentar obtener nombre de diferentes propiedades
                    if (insumo.id_insumo && typeof insumo.id_insumo === 'object') {
                        nombre = insumo.id_insumo.NombProducto || insumo.id_insumo.nombre || insumo.id_insumo.descripcion || 'Insumo';
                    } else {
                        nombre = insumo.nombre || insumo.descripcion || insumo.caracteristicas || 'Insumo';
                    }
                    cantidad = insumo.cantidad || insumo.quantity || 1;
                }
                
                if (cantidad > 1) {
                    items.push(`${cantidad}x ${nombre}`);
                } else {
                    items.push(nombre);
                }
            });
        }
        
        if (items.length === 0) return '<span class="text-slate-400 italic">Sin elementos</span>';
        
        // Retornar lista HTML con los items
        return `<ul class="space-y-0.5">
            ${items.map(item => `<li class="truncate">• ${item}</li>`).join('')}
        </ul>`;
    }

    getStatusLabel(estado) {
        const labels = {
            pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada',
            entregado: 'Entregado', cancelada: 'Cancelada', devuelto: 'Devuelto', penalizado: 'Penalizado'
        };
        return labels[estado] || estado;
    }

    getStatusClass(estado) {
        const m = {
            pendiente: 'bg-yellow-50 text-yellow-700',
            aprobada: 'bg-green-50 text-green-700',
            rechazada: 'bg-red-50 text-red-700',
            entregado: 'bg-blue-50 text-blue-700',
            cancelada: 'bg-slate-100 text-slate-500',
            devuelto: 'bg-indigo-50 text-indigo-700',
            penalizado: 'bg-red-100 text-red-800'
        };
        return m[estado] || 'bg-slate-50 text-slate-500';
    }

    getStatusBorder(estado) {
        const m = {
            pendiente: 'border-l-yellow-400', aprobada: 'border-l-green-500',
            rechazada: 'border-l-red-500', entregado: 'border-l-blue-500',
            cancelada: 'border-l-slate-300', devuelto: 'border-l-indigo-500',
            penalizado: 'border-l-red-700'
        };
        return m[estado] || 'border-l-slate-200';
    }

    // ─── Ver Detalles ────────────────────────────────────────────────────────────
    async verDetalles(id) {
        const s = this.solicitudes.find(x => x._id === id);
        if (!s) return;

        // Fetch lista de espera para los insumos y activos de esta solicitud
        const insumosIds = s.insumos ? s.insumos.map(i => i.id_insumo?._id || i.id_insumo).filter(Boolean) : [];
        const activosIds = s.activos ? s.activos.map(a => a._id || a.id).filter(Boolean) : [];
        let listaEspera = [];
        const queryParams = [];
        if (insumosIds.length > 0) queryParams.push(`insumos=${insumosIds.join(',')}`);
        if (activosIds.length > 0) queryParams.push(`activos=${activosIds.join(',')}`);
        if (queryParams.length > 0) {
            try {
                const resp = await fetch(`${this.apiBase}/listaEspera?${queryParams.join('&')}`, { headers: this.headers });
                if (resp.ok) {
                    const data = await resp.json();
                    listaEspera = data.data || [];
                }
            } catch (error) {
                console.warn('Error fetching lista de espera:', error);
            }
        }

        const ahora = new Date();
        const vencida = s.estado === 'entregado' && s.fecha_entrega_esperada && new Date(s.fecha_entrega_esperada) < ahora;
        const diasRestantes = s.fecha_entrega_esperada
            ? Math.ceil((new Date(s.fecha_entrega_esperada) - ahora) / (1000*60*60*24))
            : null;

        // Historial de estados
        const historicoHtml = s.historico_estados?.length
            ? s.historico_estados.map(h => `
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${this.getStatusClass(h.estado).replace('50','100')} text-[10px] font-black mt-0.5">✓</div>
                    <div>
                        <p class="text-xs font-black text-slate-700 capitalize">${this.getStatusLabel(h.estado)}</p>
                        <p class="text-[10px] text-slate-400">${new Date(h.fecha).toLocaleDateString('es-CR', {day:'numeric',month:'long',year:'numeric'})}</p>
                        ${h.observaciones && h.observaciones !== 'Sin observaciones' ? `<p class="text-xs text-slate-500 italic mt-0.5">${h.observaciones}</p>` : ''}
                    </div>
                </div>`).join('')
            : '<p class="text-xs text-slate-400 italic">Sin historial disponible</p>';

        const alertaDev = diasRestantes !== null && s.estado === 'entregado'
            ? `<div class="${vencida ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'} border rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                ${vencida ? `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg> Devolución vencida hace ${Math.abs(diasRestantes)} días` : `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Faltan ${diasRestantes} día(s) para la devolución`}
              </div>`
            : '';

        // Crear modal inline
        let modal = document.getElementById('detalle-solicitud-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'detalle-solicitud-modal';
            modal.className = 'fixed inset-0 z-[9000] bg-black/50 flex items-center justify-center p-4';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div class="bg-gradient-to-r from-[#002D62] to-[#004daa] p-6 text-white flex-shrink-0">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-blue-200">Detalle de Solicitud</span>
                        <button onclick="document.getElementById('detalle-solicitud-modal').remove()" class="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition text-white">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <h3 class="text-lg font-black">#${String(s.folio || 0).padStart(3, '0')}</h3>
                    <span class="inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide ${this.getStatusClass(s.estado).replace('50','500/20').replace('700','50')}">${this.getStatusLabel(s.estado)}</span>
                </div>
                
                <div class="overflow-y-auto flex-1 p-6 space-y-4">
                    ${alertaDev}
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-50 rounded-xl p-3">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Solicitud</p>
                            <p class="text-sm font-bold text-slate-700">${new Date(s.createdAt).toLocaleString('es-CR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        ${s.fecha_entrega_esperada ? `
                        <div class="${vencida ? 'bg-red-50' : 'bg-slate-50'} rounded-xl p-3">
                            <p class="text-[10px] font-black ${vencida ? 'text-red-500' : 'text-slate-400'} uppercase tracking-widest mb-1">Dev. Esperada</p>
                            <p class="text-sm font-bold ${vencida ? 'text-red-700' : 'text-slate-700'}">${new Date(s.fecha_entrega_esperada).toLocaleDateString('es-CR')}</p>
                        </div>` : '<div></div>'}
                    </div>

                    <div class="bg-slate-50 rounded-xl p-4">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Elementos Solicitados</p>
                        ${s.activos?.length ? `
                        <div class="mb-4">
                            <p class="text-[10px] font-black text-blue-600 mb-2 flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg> ACTIVOS EN PRÉSTAMO</p>
                            <div class="space-y-2">
                                ${s.activos.map(a => {
                                    const hasImg = a.imagenUrl && !a.imagenUrl.includes('placeholder');
                                    return `
                                    <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm transition-hover">
                                        <div class="w-12 h-12 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                                            ${hasImg ? `<img src="${a.imagenUrl}" class="w-full h-full object-contain">` : `<svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`}
                                        </div>
                                        <div class="min-w-0">
                                            <p class="text-xs font-black text-slate-800 uppercase tracking-tight truncate">${a.numActivo || 'S/N'}</p>
                                            <p class="text-[10px] text-slate-500 font-medium truncate">${a.marca || ''} ${a.modelo || ''}</p>
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>` : ''}

                        ${s.insumos?.length ? `
                        <div>
                            <p class="text-[10px] font-black text-emerald-600 mb-2 flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86 0l-2.387.477a2 2 0 00-1.022.547l-3.846 3.846a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828l3.846-3.846a2 2 0 00.547-1.022l.477-2.387a6 6 0 000-3.86l-.477-2.387a2 2 0 00-.547-1.022L5.428 5.428a2 2 0 010-2.828l1.414-1.414a2 2 0 012.828 0l3.846 3.846a2 2 0 001.022.547l2.387.477a6 6 0 003.86 0l2.387-.477a2 2 0 001.022-.547l3.846-3.846a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828l-3.846 3.846z"/></svg> INSUMOS SOLICITADOS</p>
                            <div class="space-y-2">
                                ${s.insumos.map(i => {
                                    const info = i.id_insumo || {};
                                    const hasImg = info.imagenUrl && !info.imagenUrl.includes('placeholder');
                                    const insumoId = i.id_insumo?._id || i.id_insumo;
                                    const esperasParaEste = listaEspera.filter(e => (e.insumo?._id || e.insumo) === insumoId);
                                    let listaEsperaHtml = '';
                                    if (esperasParaEste.length > 0) {
                                        esperasParaEste.sort((a, b) => {
                                            if (a.prioridad !== b.prioridad) return b.prioridad - a.prioridad;
                                            return new Date(a.createdAt) - new Date(b.createdAt);
                                        });
                                        const listaItems = esperasParaEste.map((e, index) => `<li class="text-[10px] text-slate-600">${index + 1}. ${e.usuario.nombre_completo}</li>`).join('');
                                        listaEsperaHtml = `<p class="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">Lista de Espera:</p><ul class="text-xs text-slate-600 ml-2">${listaItems}</ul>`;
                                    }
                                    return `
                                    <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm transition-hover">
                                        <div class="w-12 h-12 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                                            ${hasImg ? `<img src="${info.imagenUrl}" class="w-full h-full object-contain">` : `<svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86 0l-2.387.477a2 2 0 00-1.022.547l-3.846 3.846a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828l3.846-3.846a2 2 0 00.547-1.022l.477-2.387a6 6 0 000-3.86l-.477-2.387a2 2 0 00-.547-1.022L5.428 5.428a2 2 0 010-2.828l1.414-1.414a2 2 0 012.828 0l3.846 3.846a2 2 0 001.022.547l2.387.477a6 6 0 003.86 0l2.387-.477a2 2 0 001.022-.547l3.846-3.846a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828l-3.846 3.846z"/></svg>`}
                                        </div>
                                        <div class="min-w-0">
                                            <p class="text-xs font-black text-slate-800 uppercase tracking-tight truncate">${info.NombProducto || 'Insumo'}</p>
                                            <p class="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">CANTIDAD: ${i.cantidad}</p>
                                            ${listaEsperaHtml}
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>` : ''}
                        ${!s.activos?.length && !s.insumos?.length ? '<p class="text-xs text-slate-400 italic">Sin elementos registrados</p>' : ''}
                    </div>

                    ${s.observaciones ? `
                    <div class="bg-slate-50 rounded-xl p-4">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observaciones</p>
                        <p class="text-sm text-slate-600 italic">${s.observaciones}</p>
                    </div>` : ''}

                    <div class="bg-slate-50 rounded-xl p-4">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Historial de Estados</p>
                        <div class="space-y-3">${historicoHtml}</div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3 p-4 border-t border-slate-100 flex-shrink-0">
                    ${this.isAdmin && s.estado === 'pendiente' ? `
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove(); window.solicitudesController.cambiarEstado('${s._id}', 'aprobada')"
                        class="flex-1 min-w-[120px] py-2.5 bg-green-50 text-green-700 font-black text-sm rounded-xl hover:bg-green-100 transition">
                        Aprobar
                    </button>
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove(); window.solicitudesController.cambiarEstado('${s._id}', 'rechazada')"
                        class="flex-1 min-w-[120px] py-2.5 bg-red-50 text-red-700 font-black text-sm rounded-xl hover:bg-red-100 transition">
                        Rechazar
                    </button>
                    ` : ''}
                    ${this.isAdmin && s.estado === 'aprobada' ? `
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove(); window.solicitudesController.cambiarEstado('${s._id}', 'entregado')"
                        class="flex-1 min-w-[120px] py-2.5 bg-blue-50 text-blue-700 font-black text-sm rounded-xl hover:bg-blue-100 transition">
                        Marcar Entregado
                    </button>
                    ` : ''}
                    ${this.isAdmin && s.estado === 'entregado' ? `
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove(); window.solicitudesController.cambiarEstado('${s._id}', 'devuelto')"
                        class="flex-1 min-w-[120px] py-2.5 bg-indigo-50 text-indigo-700 font-black text-sm rounded-xl hover:bg-indigo-100 transition">
                        Marcar Devuelto
                    </button>
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove(); window.solicitudesController.cambiarEstado('${s._id}', 'penalizado')"
                        class="flex-1 min-w-[120px] py-2.5 bg-orange-50 text-orange-700 font-black text-sm rounded-xl hover:bg-orange-100 transition">
                        Penalizar
                    </button>
                    ` : ''}
                    ${this.isAdmin && s.estado === 'penalizado' ? `
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove(); window.solicitudesController.cambiarEstado('${s._id}', 'entregado')"
                        class="flex-1 min-w-[120px] py-2.5 bg-emerald-50 text-emerald-700 font-black text-sm rounded-xl hover:bg-emerald-100 transition">
                        Quitar Sanción
                    </button>
                    ` : ''}
                    
                    ${s.estado === 'pendiente' && !this.isAdmin ? `
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove(); window.solicitudesController.cancelar('${s._id}')"
                        class="flex-1 py-2.5 bg-red-50 text-red-700 font-black text-sm rounded-xl hover:bg-red-100 transition">
                        Cancelar Solicitud
                    </button>` : ''}

                    
                    <button onclick="document.getElementById('detalle-solicitud-modal').remove()"
                        class="flex-1 min-w-[100px] py-2.5 bg-slate-100 text-slate-700 font-black text-sm rounded-xl hover:bg-slate-200 transition">
                        Cerrar
                    </button>
                </div>
            </div>`;

        modal.style.display = 'flex';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    // ─── Cancelar Solicitud ──────────────────────────────────────────────────────
    async cancelar(id) {
        const s = this.solicitudes.find(x => x._id === id);
        if (!s) { this._toast('Solicitud no encontrada', 'error'); return; }
        if (s.estado !== 'pendiente') {
            this._toast('Solo puedes cancelar solicitudes en estado Pendiente.', 'warning');
            return;
        }

        const ans = await window.SwalUTN.confirm(
            '¿Cancelar solicitud?',
            '¿Estás seguro de que deseas cancelar esta solicitud? Esta acción no se puede deshacer.'
        );
        if (!ans.isConfirmed) return;

        let motivoStr = '';
        const { value: motivo } = await Swal.fire({
            title: 'Motivo de cancelación',
            input: 'textarea',
            inputLabel: '¿Por qué deseas cancelar esta solicitud?',
            inputPlaceholder: 'Escribe tu motivo aquí (opcional)...',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Cancelar Solicitud',
            cancelButtonText: 'Cerrar',
            customClass: { popup: 'swal-utn-toast' }
        });
        if (motivo === undefined) return; // User closed/canceled
        motivoStr = motivo;

        try {
            const resp = await fetch(`${this.apiBase}/solicitudes/${id}`, {
                method: 'DELETE',
                headers: this.headers,
                body: JSON.stringify({ motivo_cancelacion: motivoStr || 'Cancelada por el estudiante' })
            });

            if (resp.ok) {
                this._toast('Solicitud cancelada exitosamente.', 'success');
                await this.initialize();
            } else {
                const err = await resp.json().catch(() => ({}));
                this._toast('No se pudo cancelar: ' + (err.message || 'Error del servidor'), 'error');
            }
        } catch(e) {
            this._toast('Error de conexión.', 'error');
        }
    }

    // ─── Admin: Cambiar Estado ───────────────────────────────────────────────────
    async cambiarEstado(id, nuevoEstado) {
        if (!this.isAdmin) return;
        let observaciones = 'Estado actualizado a ' + nuevoEstado + ' por administrador';
        let fecha_recogida_programada = null, hora_recogida = null;
        let fecha_entrega_esperada = null, comentario_admin = null;
        const s = this.solicitudes.find(x => x._id === id);
        const correoEstudiante = s?.usuario?.correo_electronico || '';
        const nombreEstudiante = s?.usuario?.nombre_completo || 'Estudiante';

        if (nuevoEstado === 'aprobada') {
            const { value: fv, isConfirmed } = await Swal.fire({
                title: '<span class="text-[#002D62] font-black tracking-tight">Aprobar Solicitud</span>',
                html: `
                    <div style="text-align:left;font-size:13px;padding: 0 10px;">
                        <p style="color:#64748b;margin-bottom:20px;font-weight:500;line-height:1.5;">Configure los detalles de entrega para notificar formalmente al estudiante sobre la disponibilidad de los equipos.</p>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display:flex;align-items:center;gap:6px;font-weight:800;color:#002D62;margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">
                                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                Fecha de Recogida *
                            </label>
                            <input id="swal-fecha" type="text" class="swal2-input" placeholder="Seleccione la fecha" style="width:100%;margin:0;font-size:14px;border-radius:10px;">
                        </div>

                        <div style="margin-bottom: 16px;">
                            <label style="display:flex;align-items:center;gap:6px;font-weight:800;color:#002D62;margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">
                                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Hora de Recogida *
                            </label>
                            <input id="swal-hora" type="text" class="swal2-input" placeholder="Seleccione la hora" style="width:100%;margin:0;font-size:14px;border-radius:10px;">
                        </div>

                        <div style="margin-bottom: 16px;">
                            <label style="display:flex;align-items:center;gap:6px;font-weight:800;color:#b45309;margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">
                                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                                Fecha Límite de Devolución
                            </label>
                            <input id="swal-devolucion" type="text" class="swal2-input" placeholder="Fecha opcional (si aplica)" style="width:100%;margin:0;font-size:14px;border-radius:10px;border-color:#fde68a;">
                        </div>

                        <div style="margin-bottom: 8px;">
                            <label style="display:flex;align-items:center;gap:6px;font-weight:800;color:#64748b;margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;">
                                <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                                Mensaje al Estudiante (opcional)
                            </label>
                            <textarea id="swal-msg" class="swal2-textarea" placeholder="Instrucciones adicionales para el retiro..." style="width:100%;margin:0;height:75px;font-size:13px;border-radius:10px;"></textarea>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Aprobar y Notificar',
                confirmButtonColor: '#002D62',
                cancelButtonColor: '#e2e8f0',
                showCancelButton: true,
                cancelButtonText: '<span style="color:#475569;font-weight:bold;">Cancelar</span>',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'font-black px-6 py-3 rounded-xl shadow-lg shadow-[#002D62]/20',
                    cancelButton: 'px-6 py-3 rounded-xl'
                },
                didOpen: () => {
                    // Inicializar Flatpickr si la librería está disponible
                    if (typeof flatpickr !== 'undefined') {
                        flatpickr("#swal-fecha", { locale: "es", dateFormat: "Y-m-d", minDate: "today" });
                        flatpickr("#swal-hora", { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true });
                        flatpickr("#swal-devolucion", { locale: "es", dateFormat: "Y-m-d", minDate: "today" });
                    }
                },
                preConfirm: () => {
                    const f = document.getElementById('swal-fecha').value;
                    const h = document.getElementById('swal-hora').value;
                    if (!f || !h) { Swal.showValidationMessage('La fecha y hora de recogida son requeridas obligatoriamente.'); return false; }
                    return { fecha: f, hora: h, devolucion: document.getElementById('swal-devolucion').value, mensaje: document.getElementById('swal-msg').value };
                }
            });
            if (!isConfirmed || !fv) return;
            fecha_recogida_programada = fv.fecha;
            hora_recogida = fv.hora;
            if (fv.devolucion) fecha_entrega_esperada = fv.devolucion;
            
            // Formatear manualmente para forzar zona horaria neutra o evitar desfasaje de días
            let fechaFmt = fv.fecha;
            try {
                const parts = fv.fecha.split('-');
                if (parts.length === 3) {
                    fechaFmt = new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });
                }
            } catch(e) {}

            observaciones = ('Solicitud aprobada. Pase a recoger el artículo el ' + fechaFmt + ' a las ' + fv.hora + '. ' + (fv.mensaje || '')).trim();
            comentario_admin = observaciones;
            if (correoEstudiante) {
                const folioFmt = String(s.folio || 0).padStart(3, '0');
                const asunto = encodeURIComponent('Notificación: Su solicitud #' + folioFmt + ' fue Aprobada — Laboratorio UTN');
                const cuerpo = encodeURIComponent(
                    'Estimado(a) ' + nombreEstudiante + ',\n\n' +
                    'Su solicitud de préstamo de equipo #' + folioFmt + ' ha sido APROBADA satisfactoriamente.\n\n' +
                    '---\n' +
                    'Fecha de recogida: ' + fechaFmt + '\n' +
                    'Hora programada:   ' + fv.hora + '\n' +
                    'Lugar:             Laboratorio de Electrónica UTN\n' +
                    '---\n\n' +
                    (fv.mensaje ? 'Nota Adicional: ' + fv.mensaje + '\n\n' : '') + 
                    'Por favor, preséntese con su documento de identificación institucional.\n\n' +
                    'Atentamente,\n' +
                    'Administración del Laboratorio UTN'
                );
                window.open('mailto:' + correoEstudiante + '?subject=' + asunto + '&body=' + cuerpo, '_blank');
            }
        } else if (['rechazada', 'cancelada', 'penalizado'].includes(nuevoEstado)) {
            const { value: motivo, isConfirmed } = await Swal.fire({
                title: 'Motivo requerido',
                text: 'Por favor indica el motivo de el/la ' + nuevoEstado + ':',
                input: 'textarea', inputPlaceholder: 'Escribe aquí el motivo...',
                showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Volver',
                inputValidator: (value) => { if (!value) return '¡El motivo es obligatorio!'; }
            });
            if (!isConfirmed) return;
            observaciones = motivo;
        } else {
            const msgConfirm = nuevoEstado === 'entregado' ? '¿Confirmas que se entregó el equipo al estudiante?' : '¿Confirmas que el equipo fue devuelto correctamente?';
            const result = await window.SwalUTN.confirm('Actualizar Estado', msgConfirm);
            if (!result.isConfirmed) return;
        }

        try {
            const body = { nuevoEstadoAdmin: nuevoEstado, observaciones };
            if (fecha_recogida_programada) body.fecha_recogida_programada = fecha_recogida_programada;
            if (hora_recogida) body.hora_recogida = hora_recogida;
            if (fecha_entrega_esperada) body.fecha_entrega_esperada = fecha_entrega_esperada;
            if (comentario_admin) body.comentario_admin = comentario_admin;
            const resp = await fetch(this.apiBase + '/solicitudes/admin-gestion/' + id, {
                method: 'PUT', headers: this.headers, body: JSON.stringify(body)
            });
            if (resp.ok) {
                this._toast('Solicitud ' + nuevoEstado + '.', 'success');
                await this.initialize();
                const modal = document.getElementById('detalle-solicitud-modal');
                if (modal) modal.remove();
            } else {
                const err = await resp.json().catch(() => ({}));
                this._toast('Error al actualizar: ' + (err.message || ''), 'error');
            }
        } catch(e) { this._toast('Error de conexión.', 'error'); }
    }

    // ─── Admin: Poner fuera de servicio ─────────────────────────────
    async ponerFueraDeServicio(id) {
        const s = this.solicitudes.find(s => s._id === id);
        if (!s) return;
        if (!this.isAdmin) return;
        
        // Primero pedir el comentario
        const { value: comentario, isConfirmed: confirmado } = await Swal.fire({
            title: 'Poner fuera de servicio',
            html: '<p class="text-sm text-gray-600 mb-4">¿Poner todos los artículos de esta solicitud en "fuera de servicio"?</p>',
            input: 'textarea',
            inputLabel: 'Motivo / Documentación (opcional)',
            inputPlaceholder: 'Ingrese el motivo por el cual se pone fuera de servicio...',
            inputAttributes: {
                'aria-label': 'Motivo para poner fuera de servicio',
                'rows': 3
            },
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            inputValidator: (value) => {
                // Permitir vacío o con comentario
                return null;
            }
        });
        
        if (!confirmado) return;
        
        try {
            const observaciones = comentario?.trim() 
                ? `fuera de servicio por penalizacion - ${comentario.trim()}` 
                : 'fuera de servicio por penalizacion - Solicitud penalizada';
            
            const resp = await fetch(`${this.apiBase}/solicitudes/poner-fuera-servicio/${id}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify({
                    observaciones: observaciones
                })
            });
            
            const responseText = await resp.text();
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                responseData = responseText;
            }
            
            if (resp.ok) {
                window.SwalUTN.success('Artículos puestos fuera de servicio');
                await this.initialize();
            } else {
                throw new Error(responseData.message || responseData || 'Error al poner fuera de servicio');
            }
        } catch (error) {
            window.SwalUTN.error('Error', error.message);
        }
    }
    // ─── Utilidades ──────────────────────────────────────────────────────────────
    _showLoading(show = true) {
        const el = document.getElementById('loading-state');
        if (el) el.classList.toggle('hidden', !show);
    }

    _toast(msg, type = 'success') {
        if (window.Utils?.showToast) { window.Utils.showToast(msg, type); return; }
        const t = document.getElementById('toast');
        const m = document.getElementById('toastMsg');
        if (t && m) {
            m.textContent = msg;
            t.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
        }
    }
}

// ─── Global ──────────────────────────────────────────────────────────────────
window.solicitudesController = new SolicitudesController();
document.addEventListener('DOMContentLoaded', () => {
    // Cargar header y footer si existen en la página
    const loadComponent = async (id, path) => {
        const el = document.getElementById(id);
        if (!el) return;
        try {
            const res = await fetch(path);
            el.innerHTML = await res.text();
        } catch(e) {}
    };

    Promise.all([
        loadComponent('header-component', '../components/header.html'),
        loadComponent('footer-component', '../components/footer.html')
    ]).then(() => {
        if (window.Utils) window.Utils.updateUserInfo();

        // Verificar auth
        const user = JSON.parse(localStorage.getItem('utn_user'));
        if (!user) { window.location.href = '../login.html'; return; }

        window.solicitudesController.initialize();
    });
});

// ─── Funciones Globales para Lista de Espera ──────────────────────────────────
window.editarEspera = async function(esperaId) {
    // Obtener datos actuales
    const token = localStorage.getItem('utn_token');
    let esperaActual = null;
    try {
        const resp = await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/listaEspera/${esperaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) esperaActual = await resp.json();
    } catch (e) {}

    // Formatear fecha actual si existe
    const fechaActual = esperaActual?.fecha_estimada 
        ? new Date(esperaActual.fecha_estimada).toISOString().slice(0, 16) 
        : '';

    const { value: formValues } = await Swal.fire({
        title: '<span class="text-[#002D62] font-black text-lg">Fecha Estimada de Disponibilidad</span>',
        html: `
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha y Hora Estimada</label>
                    <input type="datetime-local" id="swal-fecha-estimada" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-[#002D62]" value="${fechaActual}">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas Adicionales (opcional)</label>
                    <input type="text" id="swal-tiempo-estimado" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-[#002D62]" placeholder="Ej: Llegada pendiente de proveedor, mañana por la tarde..." value="${esperaActual?.tiempo_estimado || ''}">
                </div>
            </div>`,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#002D62',
        cancelButtonColor: '#64748b',
        showCancelButton: true,
        customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'font-black px-5 py-2 rounded-xl',
            cancelButton: 'font-black px-5 py-2 rounded-xl'
        },
        preConfirm: () => {
            return {
                fecha_estimada: document.getElementById('swal-fecha-estimada').value,
                tiempo_estimado: document.getElementById('swal-tiempo-estimado').value
            };
        }
    });

    if (!formValues) return;

    try {
        const payload = {};
        if (formValues.fecha_estimada) payload.fecha_estimada = formValues.fecha_estimada;
        if (formValues.tiempo_estimado) payload.tiempo_estimado = formValues.tiempo_estimado;

        await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/listaEspera/${esperaId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        window.SwalUTN.success('Actualizado', 'Fecha estimada guardada correctamente.');
        window.solicitudesController.initialize(); // Recargar
    } catch (error) {
        window.SwalUTN.error('Error', 'No se pudo actualizar.');
    }
};

window.marcarProcesando = async function(esperaId) {
    const confirm = await window.SwalUTN.confirm('¿Marcar como procesando?', '¿Estás seguro de que quieres marcar esta solicitud como procesando?');
    if (!confirm.isConfirmed) return;

    try {
        const token = localStorage.getItem('utn_token');
        await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/listaEspera/${esperaId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: 'notificado' })
        });
        window.SwalUTN.success('Marcado como procesando', 'La solicitud ha sido marcada como procesando.');
        window.solicitudesController.initialize(); // Recargar
    } catch (error) {
        window.SwalUTN.error('Error', 'No se pudo actualizar el estado.');
    }
};
