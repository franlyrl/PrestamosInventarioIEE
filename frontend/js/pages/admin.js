class IndexController {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        this.editingInsumoId = null;
        this.init();
    }

    init() {
        this.setupModalEvents();
        this.cargarItems();
    }

    setupModalEvents() {
        const form = document.getElementById('formInsumo');
        if (form && !form.dataset.listener) {
            form.addEventListener('submit', async event => {
                event.preventDefault();
                await this.guardarArticulo();
            });
            form.dataset.listener = 'true';
        }

        window.indexController = this;
    }

    async cargarItems() {
        try {
            const token = localStorage.getItem('utn_token');
            if (!token) {
                this.showToast('Sesión no encontrada. Por favor inicie sesión.', 'error');
                setTimeout(() => window.location.href = '../login.html', 2000);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            
            // Cargar ambos en paralelo
            const [activosResponse, insumosResponse] = await Promise.all([
                fetch(`${window.CONFIG.API_BASE_URL}/activos`, { headers }),
                fetch(`${window.CONFIG.API_BASE_URL}/insumos`, { headers })
            ]);

            // Manejo detallado de errores
            if (activosResponse.status === 401 || insumosResponse.status === 401) {
                throw new Error('Su sesión ha expirado.');
            }
            if (activosResponse.status === 403 || insumosResponse.status === 403) {
                throw new Error('No tiene permisos para ver estos datos.');
            }

            if (!activosResponse.ok || !insumosResponse.ok) {
                console.error('Error Status:', { 
                    activos: activosResponse.status, 
                    insumos: insumosResponse.status 
                });
                throw new Error('Error en la comunicación con el servidor.');
            }

            const activosData = await activosResponse.json();
            const insumosData = await insumosResponse.json();

            // Mapear Activos (API devuelve array directo)
            const rawActivos = Array.isArray(activosData) ? activosData : (activosData?.todosLosActivos || []);
            const activos = rawActivos.map(item => ({ 
                ...item, 
                tipo: 'activo',
                NombProducto: item.NombProducto || `${item.marca || ''} ${item.modelo || ''}`.trim() || 'Activo sin nombre'
            }));

            // Mapear Insumos
            const insumos = Array.isArray(insumosData)
                ? insumosData.map(item => ({ 
                    ...item, 
                    tipo: item.tipo || 'consumible' 
                }))
                : [];

            this.allItems = [...activos, ...insumos];
            this.filteredItems = [...this.allItems];
            this.renderItems();
        } catch (error) {
            console.error('❌ [Admin] Error cargando items:', error);
            this.showToast(error.message || 'Error al cargar inventario', 'error');
            
            if (error.message.includes('sesión') || error.message.includes('permisos')) {
                setTimeout(() => window.location.href = '../login.html', 3000);
            }
        }
    }

    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        if (!itemsGrid) return;

        itemsGrid.innerHTML = '';

        if (!this.filteredItems.length) {
            itemsGrid.innerHTML = `
                <div class="col-span-full text-center py-10 text-slate-500">
                    No hay articulos registrados todavia.
                </div>
            `;
            return;
        }

        this.filteredItems.forEach(item => {
            itemsGrid.appendChild(this.crearItemCard(item));
        });
    }

    getEstadoUi(item) {
        const estado = String(item.estado || item.estadoActivo || '').toLowerCase();
        const cantidad = Number(item.cantidad ?? 1);

        if (estado === 'fuera de stock' || cantidad <= 0) {
            return { text: 'FUERA DE STOCK', className: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-500' };
        }
        if (estado === 'prestado') {
            return { text: 'PRESTADO', className: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' };
        }
        if (estado === 'en espera') {
            return { text: 'EN ESPERA', className: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500' };
        }
        if (estado === 'eliminado') {
            return { text: 'ELIMINADO', className: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' };
        }

        return { text: 'DISPONIBLE', className: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' };
    }

    crearItemCard(item) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group relative';

        const tipo = item.tipo === 'activo' ? 'activo' : 'consumible';
        const nombre = item.NombProducto || `${item.marca || ''} ${item.modelo || ''}`.trim() || 'Sin nombre';
        const codigo = item.codigo || item.numSerie || item.numActivo || item.id_insumo || 'N/A';
        const ubicacion = item.ubicacion || 'Laboratorio de Electronica';
        const cantidad = Number(item.cantidad ?? 1);
        const descripcion = item.caracteristicas || item.observaciones || 'Sin descripcion';
        const estadoUi = this.getEstadoUi(item);

        const itemEncoded = encodeURIComponent(JSON.stringify(item));

        card.innerHTML = `
            <div class="absolute top-3 right-3 z-10">
                <span class="flex items-center gap-1.5 px-2.5 py-1 ${estadoUi.className} border rounded-full text-[10px] font-black tracking-tight">
                    <span class="w-1.5 h-1.5 rounded-full ${estadoUi.dot}"></span>
                    ${estadoUi.text}
                </span>
            </div>

            <div class="relative h-36 bg-slate-50 overflow-hidden">
                <img src="${item.imagenUrl || `https://picsum.photos/seed/${codigo}/400/300.jpg`}" 
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div class="p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest">${tipo}</span>
                    <span class="text-[10px] text-slate-400 font-bold">${codigo}</span>
                </div>

                <h3 class="font-black text-slate-800 text-base leading-tight mb-2">${nombre}</h3>
                <p class="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[2rem]">${descripcion}</p>

                <div class="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-slate-100">
                    <div>
                        <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Cantidad</span>
                        <p class="text-sm font-black text-slate-800">${cantidad}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ubicacion</span>
                        <p class="text-[11px] font-bold text-slate-700 truncate">${ubicacion}</p>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2">
                    <button class="bg-slate-900 text-white px-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all" onclick="event.stopPropagation(); addToCart('${this.escapeForJs(nombre)}', '${tipo}', decodeURIComponent('${itemEncoded}'))">
                        Anadir
                    </button>
                    <button class="px-2 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-blue-700 hover:border-blue-200 transition-all text-[11px] font-bold" onclick="event.stopPropagation(); openHistory('${item._id || ''}', '${tipo}', decodeURIComponent('${itemEncoded}'))">
                        Historial
                    </button>
                    <button class="px-2 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-emerald-700 hover:border-emerald-200 transition-all text-[11px] font-bold" onclick="event.stopPropagation(); openEdit('${item._id || ''}', '${tipo}', decodeURIComponent('${itemEncoded}'))">
                        Editar
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    escapeForJs(value) {
        return String(value || '').replace(/'/g, "\\'");
    }

    validarFormulario(data) {
        const errorNode = document.getElementById('insumoFormError');
        const setError = message => {
            if (errorNode) {
                errorNode.textContent = message;
                errorNode.classList.remove('hidden');
            }
            return false;
        };

        if (errorNode) {
            errorNode.classList.add('hidden');
            errorNode.textContent = '';
        }

        const codigo = String(data.codigo || '').trim();
        const nombre = String(data.NombProducto || '').trim();
        const categoria = String(data.categoria || '').trim();

        if (!codigo || !/^[A-Za-z0-9-]{3,25}$/.test(codigo)) {
            return setError('El codigo es obligatorio y debe tener 3-25 caracteres alfanumericos.');
        }
        if (!nombre || nombre.length < 3) {
            return setError('El nombre es obligatorio y debe tener al menos 3 caracteres.');
        }
        if (!categoria) {
            return setError('La categoria es obligatoria.');
        }

        if (!data.id_insumo || Number(data.id_insumo) < 1) {
            return setError('El ID numerico del sistema es obligatorio.');
        }

        return true;
    }

    async guardarArticulo() {
        try {
            const form = document.getElementById('formInsumo');
            const submitBtn = form.querySelector('button[type="submit"]');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // 1. Limpieza y Formateo
            data.id_insumo = Number(data.id_insumo);
            data.cantidad = Math.max(0, Number(data.cantidad || 0));
            data.tipo = String(data.tipo || 'consumible').toLowerCase();
            data.codigo = String(data.codigo).trim();

            // Autocompletar prefijo si falta (aunque el UI ya lo tiene visualmente)
            if (!data.codigo.startsWith('ACT-') && !data.codigo.startsWith('INS-')) {
                const prefijo = data.tipo === 'activo' ? 'ACT-' : 'INS-';
                data.codigo = `${prefijo}${data.codigo}`;
            }


            // 2. Validación Frontend
            if (!this.validarFormulario(data)) {
                return;
            }

            // 3. Bloquear botón para evitar doble envío
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Guardando...';
            }

            const token = localStorage.getItem('utn_token');
            const isEditing = Boolean(this.editingInsumoId);
            const url = isEditing
                ? `${window.CONFIG.API_BASE_URL}/insumos/${this.editingInsumoId}`
                : `${window.CONFIG.API_BASE_URL}/insumos`;

            const response = await fetch(url, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || 'No se pudo guardar el articulo.');
            }

            this.showToast(isEditing ? 'Articulo actualizado con exito.' : 'Articulo registrado con exito.', 'success');
            window.cerrarModalNuevo();
            this.editingInsumoId = null;
            await this.cargarItems();
        } catch (error) {
            console.error('❌ [Admin] Error al guardar:', error);
            this.showToast(error.message || 'Error al guardar el articulo', 'error');
        } finally {
            const form = document.getElementById('formInsumo');
            const submitBtn = form?.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Artículo';
            }
        }
    }

    abrirModalEdicion(item) {
        if (!item || !item._id) {
            this.showToast('No se pudo abrir el modo edicion para este articulo.', 'error');
            return;
        }

        if (item.tipo === 'activo' && !item.id_insumo) {
            this.showToast('Los activos fijos se editan desde el modulo Activos.', 'info');
            return;
        }

        this.editingInsumoId = item._id;

        const form = document.getElementById('formInsumo');
        form.codigo.value = item.codigo || '';
        form.id_insumo.value = item.id_insumo || '';
        form.NombProducto.value = item.NombProducto || '';
        form.tipo.value = item.tipo || 'consumible';
        form.categoria.value = item.categoria || 'Otros';
        form.cantidad.value = Number(item.cantidad ?? 0);
        form.ubicacion.value = item.ubicacion || '';
        form.caracteristicas.value = item.caracteristicas || '';
        form.imagenUrl.value = item.imagenUrl || '';

        toggleCamposTipo(form.tipo.value);

        const title = document.getElementById('modalInsumoTitle');
        if (title) title.textContent = 'Editar Articulo';

        abrirModalNuevo();
    }

    mostrarHistorial(item) {
        const movimientos = Array.isArray(item.movimientos) ? item.movimientos : [];
        if (!movimientos.length) {
            this.showToast('Este articulo aun no tiene movimientos registrados.', 'info');
            return;
        }

        const resumen = movimientos
            .slice(-8)
            .reverse()
            .map(mov => {
                const fecha = new Date(mov.fecha || Date.now()).toLocaleString('es-CR');
                const tipo = mov.tipo || 'movimiento';
                const cantidad = mov.cantidad_nueva ?? mov.cantidad_anterior ?? '-';
                const estado = mov.estado_nuevo || mov.estado_anterior || '-';
                return `${fecha} | ${tipo} | cantidad: ${cantidad} | estado: ${estado}`;
            })
            .join('\n');

        alert(`Historial de movimientos:\n\n${resumen}`);
    }

    showToast(message, type = 'success') {
        if (window.Utils && typeof window.Utils.showToast === 'function') {
            window.Utils.showToast(message, type);
            return;
        }
    }
}
window.IndexController = IndexController;

window.abrirModalNuevo = () => {
    const modal = document.getElementById('modalAgregarInsumo');
    const container = document.getElementById('modalContainer');
    const title = document.getElementById('modalInsumoTitle');

    if (title && (!window.indexController || !window.indexController.editingInsumoId)) {
        title.textContent = 'Registrar Nuevo Articulo';
    }

    if (modal) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        container?.classList.remove('scale-95');
        container?.classList.add('scale-100');
    }
};

window.cerrarModalNuevo = () => {
    const modal = document.getElementById('modalAgregarInsumo');
    const container = document.getElementById('modalContainer');
    const form = document.getElementById('formInsumo');
    const title = document.getElementById('modalInsumoTitle');
    const errorNode = document.getElementById('insumoFormError');

    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
        container?.classList.remove('scale-100');
        container?.classList.add('scale-95');
    }

    if (form) form.reset();
    if (title) title.textContent = 'Registrar Nuevo Articulo';
    if (errorNode) {
        errorNode.classList.add('hidden');
        errorNode.textContent = '';
    }

    if (window.indexController) {
        window.indexController.editingInsumoId = null;
    }

    toggleCamposTipo('consumible');
};

window.toggleCamposTipo = tipo => {
    const prefix = document.getElementById('prefixCode');
    const cantidadInput = document.getElementById('inputCantidad');
    const cantidadField = document.getElementById('fieldCantidad');

    if (prefix) {
        prefix.textContent = tipo === 'activo' ? 'ACT-' : 'INS-';
    }

    if (cantidadInput && tipo === 'activo' && Number(cantidadInput.value || 0) < 1) {
        cantidadInput.value = 1;
    }

    if (cantidadField) {
        cantidadField.classList.remove('opacity-70');
    }
};

window.openHistory = (_id, _tipo, encodedItem) => {
    const item = JSON.parse(encodedItem || '{}');
    if (window.indexController) {
        window.indexController.mostrarHistorial(item);
    }
};

window.openEdit = (_id, tipo, encodedItem) => {
    const item = JSON.parse(encodedItem || '{}');
    if (tipo === 'activo' && !item.id_insumo) {
        if (window.Utils?.showToast) {
            window.Utils.showToast('Para activos fijos usa el modulo Activos.', 'info');
        }
        return;
    }

    if (window.indexController) {
        window.indexController.abrirModalEdicion(item);
    }
};

window.addToCart = (itemName) => {
    if (window.Utils?.showToast) {
        window.Utils.showToast(`${itemName} agregado al flujo de solicitud.`, 'success');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.indexController = new IndexController();
    toggleCamposTipo('consumible');
});
