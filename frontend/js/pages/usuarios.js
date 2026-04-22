// Fallback para showToast si no existe aun
if (typeof showToast === 'undefined') {
    window.showToast = function(msg, type) {
        if (window.Utils?.showToast) { window.Utils.showToast(msg, type); return; }
        console.log('[Toast]', type, msg);
    };
}

// Controlador simple para el dashboard
class IndexController {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        this.currentPage = 1;
        this.itemsPerPage = 15; // 15 elementos por página (3 filas x 5 columnas máximo)
        this.init();
    }

    async init() {
        console.log(' Iniciando IndexController simple...');
        console.log(' DEBUG: Versión con depuración activada');

        // Esperar a que el DOM esté listo antes de configurar filtros y cargar items
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log(' DOM listo - Configurando filtros y cargando items...');
                this.setupFiltros(() => this.cargarItems());
            });
        } else {
            // DOM ya está listo, configurar filtros y cargar items
            setTimeout(() => {
                console.log(' DOM ya listo - Configurando filtros y cargando items...');
                this.setupFiltros(() => this.cargarItems());
            }, 100);
        }
    }

    setupFiltros(callback) {
        // Espera para asegurar que el DOM esté listo
        setTimeout(() => {
            const buscarBtn = document.getElementById('buscar-btn');         // opcional
            const limpiarBtn = document.getElementById('limpiar-busqueda');  // opcional
            const busquedaInput = document.getElementById('busqueda-universal');
            const tipoSelect = document.getElementById('tipo-select');
            const categoriaSelect = document.getElementById('categoria-select');
            const estadoSelect = document.getElementById('estado-select');

            console.log('[Index] setupFiltros - busquedaInput:', !!busquedaInput, 'tipoSelect:', !!tipoSelect);

            // Registrar eventos (solo si el elemento existe)
            buscarBtn?.addEventListener('click', () => this.aplicarFiltros());
            limpiarBtn?.addEventListener('click', () => this.limpiarFiltros());
            busquedaInput?.addEventListener('input', () => this.aplicarFiltros());
            tipoSelect?.addEventListener('change', () => this.aplicarFiltros());
            categoriaSelect?.addEventListener('change', () => this.aplicarFiltros());
            estadoSelect?.addEventListener('change', () => this.aplicarFiltros());

            // SIEMPRE ejecutar callback — no depender de que existan todos los filtros
            if (typeof callback === 'function') {
                callback();
            }
        }, 150);
    }

    async cargarItems() {
        try {
            console.log(' Cargando items desde la API...');
            const token = localStorage.getItem('utn_token');

            const [activosResponse, insumosResponse] = await Promise.all([
                fetch(`${window.CONFIG.API_BASE_URL}/activos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${window.CONFIG.API_BASE_URL}/insumos`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (activosResponse.ok && insumosResponse.ok) {
                let activos = await activosResponse.json();
                let insumos = await insumosResponse.json();

                console.log(' Activos cargados:', activos?.todosLosActivos?.length || activos?.length || 0);
                console.log(' Insumos cargados:', insumos?.length || 0);

                // Procesar arrays primero
                let activosArray = [];
                if (Array.isArray(activos)) {
                    activosArray = activos;
                } else if (activos && Array.isArray(activos.todosLosActivos)) {
                    activosArray = activos.todosLosActivos;
                }
                const insumosArray = Array.isArray(insumos) ? insumos : [];

                // Depuración de origen de datos
                console.log(' === ORIGEN DE DATOS ===');
                console.log(' Items que vienen de /activos:');
                activosArray.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.NombProducto || item.nombre || 'SIN NOMBRE'} | Categoría: ${item.categoria || 'undefined'}`);
                });
                console.log(' Items que vienen de /insumos:');
                insumosArray.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.NombProducto || item.nombre || 'SIN NOMBRE'} | Categoría: ${item.categoria || 'undefined'}`);
                });

                // Debug: mostrar todos los insumos con sus cantidades
                console.log(' Todos los insumos con sus cantidades:');
                insumosArray.forEach(item => {
                    console.log(`- ${item.NombProducto || item.nombre} | cantidad: ${item.cantidad} | categoría: ${item.categoria}`);
                });

                const todosLosInsumos = insumosArray;

                // NO agregar items forzados - usar solo datos reales
                const todosLosInsumosConForzados = todosLosInsumos;

                // Debug: mostrar categorías reales
                console.log(' Categorías de ACTIVOS encontradas:');
                activosArray.forEach(item => {
                    console.log(`- ${item.categoria || 'Sin categoría'} (${item.marca} ${item.modelo}) - Cantidad: ${item.cantidad || 'undefined'} - Stock: ${item.stock_actual || 'undefined'}`);
                });

                console.log(' Categorías de INSUMOS encontradas:');
                insumosArray.forEach(item => {
                    console.log(`- ${item.categoria || 'Sin categoría'} (${item.nombre || item.NombProducto}) - Cantidad: ${item.cantidad || 'undefined'}`);
                });

                // Depuración específica para Componentes Analógicos
                console.log(' === DEPURACIÓN COMPONENTES ANALÓGICOS ===');
                const analogicos = insumosArray.filter(item => 
                    item.categoria === 'Componentes Analógicos' || 
                    item.categoria?.includes('Analógic')
                );
                console.log(' Insumos analógicos encontrados:', analogicos.length);
                analogicos.forEach(item => {
                    console.log(`  - ${item.NombProducto || item.nombre} | Categoría: "${item.categoria}" | Tipo: ${item.tipo || 'undefined'} | Cantidad: ${item.cantidad || 'undefined'}`);
                });

                // Depuración completa de insumos
                console.log(' === TODOS LOS INSUMOS CARGADOS ===');
                console.log(' Total insumos desde API:', insumosArray.length);
                insumosArray.forEach((item, index) => {
                    console.log(` ${index + 1}. ${item.NombProducto || item.nombre || 'SIN NOMBRE'}`);
                    console.log(`    - Tipo guardado: ${item.tipo || 'undefined'}`);
                    console.log(`    - Categoría: ${item.categoria || 'undefined'}`);
                    console.log(`    - Cantidad: ${item.cantidad || 'undefined'}`);
                    console.log(`    - ID: ${item._id || 'undefined'}`);
                });

                // Clasificar correctamente por categoría
                const todosLosItems = [
                    ...activosArray.map(item => ({ ...item, tipo: 'activo' })),
                    ...todosLosInsumosConForzados.map(item => ({ ...item, tipo: item.tipo || 'insumo' }))
                ];

                // Corregir tipo basado en categoría
                console.log(' === CORRIGIENDO TIPOS POR CATEGORÍA ===');
                this.allItems = todosLosItems.map(item => {
                    const tipoOriginal = item.tipo;
                    let tipoCorregido = item.tipo;
                    
                    if (item.categoria === 'Componentes Analógicos' || item.categoria === 'Componentes Digitales') {
                        tipoCorregido = 'insumo';
                        console.log(` CORREGIDO: ${item.NombProducto || item.nombre} | ${tipoOriginal} -> ${tipoCorregido} | Categoría: ${item.categoria}`);
                    }
                    
                    return { ...item, tipo: tipoCorregido };
                });

                console.log(' Total items:', this.allItems.length);
                
                // Depuración de tipos
                console.log(' === DEPURACIÓN DE TIPOS ===');
                const tipos = {};
                this.allItems.forEach(item => {
                    const tipo = item.tipo || 'undefined';
                    tipos[tipo] = (tipos[tipo] || 0) + 1;
                });
                console.log(' Conteo por tipo:', tipos);
                
                // Mostrar insumos específicamente
                const itemsInsumos = this.allItems.filter(item => item.tipo === 'insumo');
                console.log(' Insumos encontrados:', itemsInsumos.length);
                itemsInsumos.forEach(item => {
                    console.log(`  - ${item.NombProducto || item.nombre} | Tipo: ${item.tipo} | Categoría: ${item.categoria || 'undefined'}`);
                });

                // Forzar valores iniciales
                const tipoSelect = document.getElementById('tipo-select');
                const categoriaSelect = document.getElementById('categoria-select');
                const estadoSelect = document.getElementById('estado-select');

                if (tipoSelect) tipoSelect.value = 'todos';
                if (categoriaSelect) categoriaSelect.value = 'todas';
                if (estadoSelect) estadoSelect.value = 'todos';

                // Agregar event listeners para los filtros
                if (tipoSelect) tipoSelect.addEventListener('change', () => this.aplicarFiltros());
                if (categoriaSelect) categoriaSelect.addEventListener('change', () => this.aplicarFiltros());
                if (estadoSelect) estadoSelect.addEventListener('change', () => this.aplicarFiltros());

                // Event listener para búsqueda
                const busquedaInput = document.getElementById('busqueda-universal');
                if (busquedaInput) {
                    busquedaInput.addEventListener('input', () => this.aplicarFiltros());
                }

                // Botones
                const buscarBtn = document.getElementById('buscar-btn');
                const limpiarBtn = document.getElementById('limpiar-busqueda');

                if (buscarBtn) buscarBtn.addEventListener('click', () => this.aplicarFiltros());
                if (limpiarBtn) limpiarBtn.addEventListener('click', () => this.limpiarFiltros());

                this.filteredItems = [...this.allItems];
                this.renderItems();
            }
        } catch (error) {
            console.error(' Error cargando items:', error);
        }
    }

    aplicarFiltros() {
        const busqueda = document.getElementById('busqueda-universal')?.value.toLowerCase() || '';
        const tipo = document.getElementById('tipo-select')?.value || 'todos';
        const categoria = document.getElementById('categoria-select')?.value || 'todas';
        const estado = document.getElementById('estado-select')?.value || 'todos';

        console.log(' VALORES DE FILTRO - Búsqueda:', busqueda, 'Tipo:', tipo, 'Categoría:', categoria, 'Estado:', estado);

        this.filteredItems = this.allItems.filter(item => {
            if (item.estado === 'eliminado') return false;

            // RECHAZAR ITEMS CON DATOS CORRUPTOS O INCOMPLETOS (PRIMERO QUE TODO)
            if (!item.NombProducto && !item.nombre && !item.descripcion && !item.marca && !item.modelo) {
                console.log(' RECHAZADO: Item completamente sin datos - Tipo:', item.tipo);
                return false;
            }

            // Para activos, requerir al menos nombre, marca+modelo, o un ID válido
            const tieneIdValido = item.numActivo && item.numActivo !== 'N/A' && item.numActivo.trim() !== '';
            const tieneCodigoValido = item.codigo && item.codigo !== 'N/A' && item.codigo.trim() !== '';
            if (item.tipo === 'activo' && !item.NombProducto && !item.nombre && (!item.marca || !item.modelo) && !tieneIdValido && !tieneCodigoValido) {
                console.log(' RECHAZADO: Activo sin identificación - Tipo:', item.tipo);
                return false;
            }

            // Filtro de búsqueda (primero)
            if (busqueda !== '') {
                const nombre = item.nombre || item.NombProducto || '';
                const descripcion = item.descripcion || item.caracteristicas || '';
                if (!nombre.toLowerCase().includes(busqueda) && !descripcion.toLowerCase().includes(busqueda)) {
                    return false;
                }
            }

            // Filtro de estado (ANTES que categoría para que siempre se ejecute)
            if (estado !== 'todos') {
                const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                console.log(' FILTRO ESTADO - Estado:', estado, 'Cantidad:', cantidad, 'Item:', item.NombProducto || item.nombre, 'Tipo:', item.tipo);

                // FORZAR RECHAZO DE ACTIVOS CON CANTIDAD > 0 CUANDO ESTADO ES SIN-STOCK
                if (estado === 'sin-stock' && item.tipo === 'activo' && cantidad > 0) {
                    console.log(' ACTIVO RECHAZADO - Cantidad:', cantidad, '> 0 en filtro sin-stock');
                    return false;
                }

                if (estado === 'sin-stock') {
                    if (cantidad !== 0 || cantidad === undefined || cantidad === null) {
                        console.log(' Item rechazado por sin-stock: cantidad', cantidad, '!== 0 o es undefined/null (SOLO 0 es sin-stock)');
                        return false;
                    }
                    console.log(' Item aceptado por sin-stock: cantidad', cantidad, '=== 0 (PERFECTO)');
                }
                if (estado === 'con-stock' && cantidad <= 0) {
                    console.log(' Item rechazado por con-stock: cantidad', cantidad, '<= 0');
                    return false;
                }
                if (estado === 'bajo-stock') {
                    if (cantidad < 1 || cantidad > 5 || cantidad === 0) {
                        console.log(' Item rechazado por bajo-stock: cantidad', cantidad, '(debe ser 1-5, no puede ser 0)');
                        return false;
                    }
                    console.log(' Item aceptado por bajo-stock: cantidad', cantidad, 'está entre 1 y 5');
                }

                if (estado === 'sin-stock' && cantidad === 0) {
                    console.log(' Item aceptado por sin-stock: cantidad 0 === 0');
                }
            }

            // Filtro de categoría con detección automática de tipo (SIEMPRE se ejecuta)
            if (categoria !== 'todas') {
                console.log(' EJECUTANDO FILTRO DE CATEGORÍA - Categoría:', categoria, 'Estado:', estado);

                // DEBUG: Mostrar todos los activos para depuración
                if (item.tipo === 'activo') {
                    console.log(' ACTIVO EVALUADO - Nombre:', item.NombProducto || item.nombre || 'SIN NOMBRE', 'Cantidad:', item.cantidad || 'undefined', 'Categoría:', item.categoria || 'SIN CATEGORÍA');
                }

                // DEBUG: Mostrar todos los items con bajo stock para depuración
                if (estado === 'bajo-stock' && item.tipo === 'activo') {
                    const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                    if (cantidad >= 1 && cantidad <= 5) {
                        console.log(' ACTIVO CON BAJO STOCK - Nombre:', item.NombProducto || item.nombre || 'SIN NOMBRE', 'Cantidad:', cantidad, 'Categoría:', item.categoria || 'SIN CATEGORÍA');
                    }
                }

                let tipoRequerido = null;
                let categoriaFiltrada = categoria;
                if (categoria === 'Instrumentos' || categoria === 'Herramientas') {
                    categoriaFiltrada = categoria;
                    tipoRequerido = 'activo';
                } else if (categoria === 'Componentes Digitales' || categoria === 'Componentes Analógicos') {
                    categoriaFiltrada = categoria;
                    tipoRequerido = 'insumo';
                }

                // Primero verificar que el tipo coincida si se requiere
                if (tipoRequerido && item.tipo !== tipoRequerido) {
                    console.log(' Item rechazado por tipo:', item.tipo, 'requerido:', tipoRequerido);
                    return false;
                }

                // Luego verificar que la categoría coincida
                const itemCategoria = (item.categoria || '').trim();
                const categoriaBuscada = categoria.trim();

                console.log(' Item categoría:', itemCategoria, 'buscando:', categoriaBuscada);

                // Depuración especial para Componentes Analógicos
                if (categoriaBuscada === 'Componentes Analógicos') {
                    console.log(' DEPURACIÓN COMPONENTES ANALÓGICOS:');
                    console.log('  - Item:', item.NombProducto || item.nombre);
                    console.log('  - Tipo:', item.tipo);
                    console.log('  - Categoría:', itemCategoria);
                    console.log('  - Cantidad:', item.cantidad);
                    console.log('  - Estado:', item.estado);
                }

                if (itemCategoria !== categoriaBuscada) {
                    console.log(' Item rechazado por categoría:', itemCategoria, '!==', categoriaBuscada);
                    return false;
                }

                console.log(' Item aceptado por categoría:', item.NombProducto || item.nombre);
            }

            // Filtro de estado
            if (estado !== 'todos') {
                const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                console.log(' FILTRO ESTADO - Estado:', estado, 'Cantidad:', cantidad, 'Item:', item.NombProducto || item.nombre, 'Tipo:', item.tipo);

                // FORZAR RECHAZO DE ACTIVOS CON CANTIDAD > 0 CUANDO ESTADO ES SIN-STOCK
                if (estado === 'sin-stock' && item.tipo === 'activo' && cantidad > 0) {
                    console.log(' ACTIVO RECHAZADO - Cantidad:', cantidad, '> 0 en filtro sin-stock');
                    return false;
                }

                if (estado === 'sin-stock') {
                    if (cantidad !== 0 || cantidad === undefined || cantidad === null) {
                        console.log(' Item rechazado por sin-stock: cantidad', cantidad, '!== 0 o es undefined/null (SOLO 0 es sin-stock)');
                        return false;
                    }
                    console.log(' Item aceptado por sin-stock: cantidad', cantidad, '=== 0 (PERFECTO)');
                }
                if (estado === 'con-stock' && cantidad <= 0) {
                    console.log(' Item rechazado por con-stock: cantidad', cantidad, '<= 0');
                    return false;
                }
                if (estado === 'bajo-stock') {
                    if (cantidad < 1 || cantidad > 5 || cantidad === 0) {
                        console.log(' Item rechazado por bajo-stock: cantidad', cantidad, '(debe ser 1-5, no puede ser 0)');
                        return false;
                    }
                    console.log(' Item aceptado por bajo-stock: cantidad', cantidad, 'está entre 1 y 5');
                }

                if (estado === 'sin-stock' && cantidad === 0) {
                    console.log(' Item aceptado por sin-stock: cantidad 0 === 0');
                }
            }

            // Filtro de tipo (solo si no está ya filtrado por categoría)
            if (tipo !== 'todos') {
                console.log(' FILTRO DE TIPO - Tipo requerido:', tipo, 'Item tipo:', item.tipo, 'Item nombre:', item.NombProducto || item.nombre);
                if (item.tipo !== tipo) {
                    console.log(' Item rechazado por tipo:', item.tipo, '!==', tipo);
                    return false;
                }
                console.log(' Item aceptado por tipo:', item.NombProducto || item.nombre);
            }

            return true;
        });

        this.currentPage = 1;
        this.renderItems();
    }

    limpiarFiltros() {
        const fields = ['busqueda-universal', 'tipo-select', 'categoria-select', 'estado-select'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.tagName === 'SELECT') el.value = el.options[0]?.value || '';
            else el.value = '';
        });
        this.filteredItems = [...this.allItems];
        this.currentPage = 1;
        this.renderItems();
    }

    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        const resultadosCount = document.getElementById('resultados-count');
        const resultadosTitulo = document.getElementById('resultados-titulo');

        if (!itemsGrid) return;

        // Actualizar contador
        if (resultadosCount) {
            resultadosCount.textContent = `(${this.filteredItems.length})`;
        }

        // Actualizar título
        if (resultadosTitulo) {
            const busqueda = document.getElementById('busqueda-universal')?.value;
            if (busqueda) {
                resultadosTitulo.textContent = 'Resultados de búsqueda';
            } else {
                const sumaTotal = this.filteredItems.reduce((total, item) => {
                    const cantidad = item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0);
                    return total + cantidad;
                }, 0);
                resultadosTitulo.textContent = `Todos los artículos (${this.filteredItems.length} items, ${sumaTotal} unidades)`;
            }
        }

        // Limpiar grid
        itemsGrid.innerHTML = '';

        if (this.filteredItems.length === 0) {
            itemsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-slate-400 text-lg"> No se encontraron resultados</div>
                    <div class="text-slate-500 text-sm mt-2">Intenta con otros criterios de búsqueda</div>
                </div>
            `;
            return;
        }

        // Paginación
        const totalItems = this.filteredItems.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, totalItems);
        const paginatedItems = this.filteredItems.slice(startIndex, endIndex);

        // Renderizar items de la página actual
        paginatedItems.forEach((item, index) => {
            const card = this.crearItemCard(item);
            card.style.animationDelay = `${(index % this.itemsPerPage) * 50}ms`;
            itemsGrid.appendChild(card);
        });

        console.log(` Items renderizados: ${paginatedItems.length} (Página ${this.currentPage} de ${totalPages})`);
        
        this.renderPagination();
    }

    renderPagination() {
        const container = document.getElementById('pagination-controls');
        if (!container) return;

        const totalItems = this.filteredItems.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

        container.innerHTML = '';
        if (totalPages <= 1) return;

        // Contenedor principal de controles
        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = 'flex items-center gap-2';

        // Botón Anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = `px-4 py-2 border rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            this.currentPage === 1 
            ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50 border-slate-200' 
            : 'text-utn-blue bg-white border-[#002D62]/20 hover:bg-blue-50 shadow-sm'
        }`;
        prevBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg> Anterior';
        prevBtn.onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderItems();
                document.getElementById('filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        controlsWrapper.appendChild(prevBtn);

        // Indicador de Paginación
        const indicator = document.createElement('div');
        indicator.className = 'px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 text-sm border border-slate-200';
        indicator.innerHTML = `Página <span class="text-utn-blue">${this.currentPage}</span> de ${totalPages}`;
        controlsWrapper.appendChild(indicator);

        // Botón Siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = `px-4 py-2 border rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            this.currentPage === totalPages 
            ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50 border-slate-200' 
            : 'text-white bg-utn-blue border-utn-blue hover:bg-[#001A33] shadow-md'
        }`;
        nextBtn.innerHTML = 'Siguiente <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
        nextBtn.onclick = () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderItems();
                document.getElementById('filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        controlsWrapper.appendChild(nextBtn);

        container.appendChild(controlsWrapper);
    }


    crearItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 overflow-hidden group';

        const tipo = item.tipo || 'insumo';
        let cantidad = tipo === 'activo'
            ? (item.estadoActivo === 'disponible' || !item.estadoActivo ? 1 : 0)
            : (item.cantidad !== undefined ? item.cantidad : (item.stock_actual || 0));

        const nombre = tipo === 'activo'
            ? (((item.marca || '') + ' ' + (item.modelo || '')).trim() || item.NombProducto || 'Sin nombre')
            : (item.nombre || item.NombProducto || 'Sin nombre');
        const id = item.numActivo || item.codigo_insumo || item.codigo || 'N/A';
        const descripcion = item.caracteristicas || item.descripcion || 'Sin descripcion';
        const categoriaOriginal = item.categoria || 'General';

        let stockCls = cantidad <= 0 ? 'bg-red-100 text-red-700' : cantidad <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
        let stockTxt = cantidad <= 0 ? 'Sin stock' : cantidad <= 5 ? 'Bajo stock' : 'Disponible';

        // Tratamiento especial visual si es un Activo Fijo prestado
        if (tipo === 'activo' && item.estadoActivo && item.estadoActivo.toLowerCase() === 'prestado') {
            stockCls = 'bg-indigo-100 text-indigo-700 font-bold';
            stockTxt = 'Prestado';
            cantidad = 0; // Bloquea añadir al carrito internamente
        }
        const tipoCls = tipo === 'activo' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700';
        const tipoLabel = tipo === 'activo' ? 'Activo' : 'Insumo';

        // Agregar nombre calculado al item para que esté disponible en el botón
        item.nombre = nombre;
        const itemSafe = JSON.stringify(item).replace(/"/g, '&quot;');
        
        // Sistema de auto-asignación de imágenes basado en categoría y tipo
        const getAutoImageUrl = (item, tipo, categoria, id) => {
            // Si tiene imagenUrl válida, usarla
            if (item.imagenUrl && !item.imagenUrl.includes('placeholder')) {
                return item.imagenUrl;
            }
            
            // Mapeo de categorías a seeds de imágenes para picsum
            const categoriaSeeds = {
                'Instrumentos': 'instrumentos-lab',
                'Herramientas': 'herramientas-taller',
                'Componentes Digitales': 'componentes-digital',
                'Componentes Analógicos': 'componentes-analog',
                'Electrónica': 'electronica-general',
                'Consumibles': 'consumibles-lab',
                'Equipos de Medición': 'equipos-medicion',
                'Prototipado': 'prototipado-arduino',
                'Cables y Conectores': 'cables-conectores',
                'Seguridad': 'seguridad-lab',
                'Almacenamiento': 'almacenamiento-digital'
            };
            
            // Obtener seed basado en categoría o usar default
            const categoriaKey = categoria || 'General';
            const baseSeed = categoriaSeeds[categoriaKey] || (tipo === 'activo' ? 'activo-lab' : 'insumo-lab');
            
            // Crear seed única basada en tipo, categoría e ID
            const uniqueSeed = `${baseSeed}-${id}-${tipo}`.replace(/\s+/g, '-').toLowerCase();
            
            return `https://picsum.photos/seed/${uniqueSeed}/400/300.jpg`;
        };
        
        const imgUrl = getAutoImageUrl(item, tipo, categoriaOriginal, id);
        const hasImg = true; // Ahora siempre tenemos una imagen asignada

        const headerHtml = `<div class="relative h-32 bg-slate-100 overflow-hidden cursor-zoom-in group" onclick="event.stopPropagation(); window.verImagenCompleta('${imgUrl}', '${nombre.replace(/'/g, "\\'")}')" title="Clic para ampliar">
                <img src="${imgUrl}" alt="${nombre}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style="display:none;">
                    <svg class="w-8 h-8 text-white scale-50 group-hover:scale-100 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                </div>`;

        const btnCarrito = '<button class="flex-1 ' + (cantidad > 0 ? 'bg-utn-blue' : 'bg-amber-500') + ' text-white px-3 py-2 rounded-lg text-xs font-bold hover:' + (cantidad > 0 ? 'bg-utn-dark' : 'bg-amber-600') + ' transition" onclick="event.stopPropagation(); window.handleAddToCartOrEspera && window.handleAddToCartOrEspera({id: \'' + item._id + '\', nombre: \'' + nombre.replace(/'/g, "\\'") + '\', tipo: \'' + tipo + '\', cantidad: ' + cantidad + '})" data-nombre="' + nombre.replace(/"/g, '&quot;') + '">Añadir</button>';

        card.innerHTML = headerHtml
            + '<div class="absolute top-2 right-2 z-10"><span class="px-2 py-1 text-[9px] font-black uppercase rounded-full ' + stockCls + '">' + stockTxt + '</span></div>'
            + '<div class="absolute top-2 left-2 z-10"><span class="text-[9px] font-black uppercase px-2 py-1 rounded-full ' + tipoCls + '">' + tipoLabel + '</span></div>'
            + '<div class="absolute bottom-2 left-2 right-2 z-10"><p class="text-[10px] font-black ' + (hasImg ? 'text-white drop-shadow-md' : 'text-slate-500') + ' uppercase tracking-wider truncate">' + categoriaOriginal + '</p></div>'
            + '</div>'
            + '<div class="p-4">'
            + '<h3 class="font-black text-slate-800 text-sm mb-1 line-clamp-2 leading-snug">' + nombre + '</h3>'
            + '<p class="text-[10px] font-mono text-slate-400 mb-2">' + id + '</p>'
            + '<p class="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">' + descripcion + '</p>'
            + '<div class="flex items-center mb-3"><span class="text-xs text-slate-500">Disponibles: <strong class=\"text-slate-800\">' + cantidad + '</strong></span></div>'
            + '<div class="flex gap-2">'
            + '<button class="flex-1 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition" onclick="event.stopPropagation(); if(typeof abrirDetalleItem===\'function\') abrirDetalleItem(JSON.parse(this.dataset.item))" data-item="' + itemSafe + '">Ver Detalle</button>'
            + btnCarrito
            + '</div>'
            + '</div>';

        return card;
    }
}

// NOTA: La lógica del carrito se ha movido a main.js para ser global y compartida entre todos los roles.
