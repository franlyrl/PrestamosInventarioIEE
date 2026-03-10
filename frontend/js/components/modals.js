// Controlador de Modales
class ModalController {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Cerrar modales haciendo clic fuera
        const modals = document.querySelectorAll('[id$="Modal"]');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Mostrar modal
    showModal(modalId, data = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Actualizar contenido si se proporcionaron datos
        this.updateModalContent(modalId, data);

        // Mostrar modal
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100');

        // Enfocar primer input
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    // Cerrar modal específico
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.classList.remove('opacity-100');

        // Limpiar formulario si existe
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    // Cerrar todos los modales
    closeAllModals() {
        const modals = document.querySelectorAll('[id$="Modal"]');
        modals.forEach(modal => {
            this.closeModal(modal.id);
        });
    }

    // Actualizar contenido del modal
    updateModalContent(modalId, data) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Actualizar título
        const titleElement = modal.querySelector('#modalTitle');
        if (titleElement && data.title) {
            titleElement.textContent = data.title;
        }

        // Actualizar descripción
        const descElement = modal.querySelector('#modalDescription');
        if (descElement && data.description) {
            descElement.textContent = data.description;
        }

        // Actualizar icono
        const iconElement = modal.querySelector('#modalIcon');
        if (iconElement && data.icon) {
            iconElement.textContent = data.icon;
        }

        // Actualizar detalles
        const detailsElement = modal.querySelector('#modalDetails');
        if (detailsElement && data.details) {
            detailsElement.innerHTML = data.details;
        }
    }

    // Modal de confirmación
    showConfirm(data) {
        const modalData = {
            title: data.title || 'Confirmar Acción',
            description: data.description || 'Esta acción no se puede deshacer',
            icon: data.icon || '⚠️',
            details: data.details || ''
        };

        this.showModal('confirmModal', modalData);

        // Configurar botón de confirmación
        const confirmBtn = document.getElementById('modalConfirmBtn');
        if (confirmBtn && data.onConfirm) {
            confirmBtn.onclick = () => {
                data.onConfirm();
                this.closeModal('confirmModal');
            };
        }
    }

    // Modal de agregar activo
    showAgregarActivo() {
        this.showModal('agregarActivoModal');
    }

    // Modal de agregar insumo
    showAgregarInsumo() {
        this.showModal('agregarInsumoModal');
    }

    // Modal de agregar masivo
    showAgregarMasivo() {
        this.showModal('agregarMasivoModal');
        this.initMasivoTable();
    }

    // Inicializar tabla masiva
    initMasivoTable() {
        const tbody = document.getElementById('masivoTableBody');
        if (!tbody) return;

        // Agregar fila inicial si está vacía
        if (tbody.children.length === 0) {
            this.agregarFilaMasiva();
        }
    }

    // Agregar fila a tabla masiva
    agregarFilaMasiva() {
        const tbody = document.getElementById('masivoTableBody');
        if (!tbody) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="number" class="input-field w-20" placeholder="ID" required></td>
            <td><input type="text" class="input-field w-32" placeholder="Nombre" required></td>
            <td><input type="number" class="input-field w-20" placeholder="Cantidad" required></td>
            <td>
                <select class="input-field w-32" required>
                    <option value="">Seleccionar</option>
                    <option value="Componentes Analógicos">Componentes Analógicos</option>
                    <option value="Componentes Digitales">Componentes Digitales</option>
                    <option value="Herramientas Menores">Herramientas Menores</option>
                    <option value="Consumibles de Soldadura">Consumibles de Soldadura</option>
                    <option value="Otros">Otros</option>
                </select>
            </td>
            <td><input type="url" class="input-field w-32" placeholder="URL imagen"></td>
            <td><input type="text" class="input-field w-48" placeholder="Características"></td>
            <td>
                <button onclick="modalController.eliminarFilaMasiva(this)" class="btn btn-secondary btn-sm">
                    🗑️
                </button>
            </td>
        `;

        tbody.appendChild(row);
    }

    // Eliminar fila de tabla masiva
    eliminarFilaMasiva(button) {
        const row = button.closest('tr');
        const tbody = row.parentElement;
        
        if (tbody.children.length > 1) {
            row.remove();
        } else {
            Utils.showToast('Debe haber al menos una fila', 'error');
        }
    }

    // Cargar ejemplo masivo
    cargarEjemploMasivo() {
        const tbody = document.getElementById('masivoTableBody');
        if (!tbody) return;

        // Limpiar tabla
        tbody.innerHTML = '';

        // Agregar ejemplos
        const ejemplos = [
            { id: '2001', nombre: 'Resistencia 10K Ohm', cantidad: 100, categoria: 'Componentes Analógicos' },
            { id: '2002', nombre: 'Capacitor 100uF', cantidad: 50, categoria: 'Componentes Analógicos' },
            { id: '2003', nombre: 'LED Rojo 5mm', cantidad: 200, categoria: 'Componentes Digitales' }
        ];

        ejemplos.forEach(ejemplo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="number" class="input-field w-20" value="${ejemplo.id}" required></td>
                <td><input type="text" class="input-field w-32" value="${ejemplo.nombre}" required></td>
                <td><input type="number" class="input-field w-20" value="${ejemplo.cantidad}" required></td>
                <td>
                    <select class="input-field w-32" required>
                        <option value="">Seleccionar</option>
                        <option value="Componentes Analógicos" ${ejemplo.categoria === 'Componentes Analógicos' ? 'selected' : ''}>Componentes Analógicos</option>
                        <option value="Componentes Digitales" ${ejemplo.categoria === 'Componentes Digitales' ? 'selected' : ''}>Componentes Digitales</option>
                        <option value="Herramientas Menores">Herramientas Menores</option>
                        <option value="Consumibles de Soldadura">Consumibles de Soldadura</option>
                        <option value="Otros">Otros</option>
                    </select>
                </td>
                <td><input type="url" class="input-field w-32" placeholder="URL imagen"></td>
                <td><input type="text" class="input-field w-48" placeholder="Características"></td>
                <td>
                    <button onclick="modalController.eliminarFilaMasiva(this)" class="btn btn-secondary btn-sm">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        Utils.showToast('Ejemplo cargado exitosamente', 'success');
    }

    // Guardar activo
    async guardarActivo() {
        if (!Utils.validateForm('agregarActivoForm')) {
            Utils.showToast('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        const formData = new FormData(document.getElementById('agregarActivoForm'));
        const activoData = Object.fromEntries(formData.entries());

        try {
            Utils.showLoading(true);
            
            await ApiService.createActivo(activoData);
            
            Utils.showToast('Activo creado exitosamente', 'success');
            this.closeModal('agregarActivoModal');
            
            // Recargar datos si estamos en la página de activos
            if (window.activosController) {
                await window.activosController.cargarActivos();
            }
            
        } catch (error) {
            Utils.showToast('Error al crear activo', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    // Guardar insumo
    async guardarInsumo() {
        if (!Utils.validateForm('agregarInsumoForm')) {
            Utils.showToast('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        const formData = new FormData(document.getElementById('agregarInsumoForm'));
        const insumoData = Object.fromEntries(formData.entries());

        try {
            Utils.showLoading(true);
            
            await ApiService.createInsumo(insumoData);
            
            Utils.showToast('Insumo creado exitosamente', 'success');
            this.closeModal('agregarInsumoModal');
            
            // Recargar datos si estamos en la página de insumos
            if (window.insumosController) {
                await window.insumosController.cargarInsumos();
            }
            
        } catch (error) {
            Utils.showToast('Error al crear insumo', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    // Guardar masivo
    async guardarMasivo() {
        const tbody = document.getElementById('masivoTableBody');
        const rows = tbody.querySelectorAll('tr');
        const insumos = [];

        rows.forEach(row => {
            const inputs = row.querySelectorAll('input, select');
            const insumo = {};
            
            inputs.forEach((input, index) => {
                const fieldNames = ['id_insumo', 'NombProducto', 'cantidad', 'categoria', 'imagenUrl', 'caracteristicas'];
                insumo[fieldNames[index]] = input.value;
            });

            // Validar campos requeridos
            if (insumo.id_insumo && insumo.NombProducto && insumo.cantidad && insumo.categoria) {
                insumos.push(insumo);
            }
        });

        if (insumos.length === 0) {
            Utils.showToast('Por favor complete al menos una fila con datos válidos', 'error');
            return;
        }

        try {
            Utils.showLoading(true);
            
            await ApiService.createInsumosMasivos(insumos);
            
            Utils.showToast(`${insumos.length} insumos creados exitosamente`, 'success');
            this.closeModal('agregarMasivoModal');
            
            // Recargar datos si estamos en la página de insumos
            if (window.insumosController) {
                await window.insumosController.cargarInsumos();
            }
            
        } catch (error) {
            Utils.showToast('Error al crear insumos masivamente', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }
}

// Crear instancia global
window.modalController = new ModalController();

// Funciones globales para compatibilidad con HTML
window.closeModal = (modalId) => window.modalController.closeModal(modalId);
window.confirmarPedido = () => window.modalController.confirmarPedido();
