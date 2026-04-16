// Controlador de Modal y Solicitudes
class ModalController {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Botones del modal
        const cancelBtn = document.querySelector('[onclick="closeModal()"]');
        const confirmBtn = document.querySelector('[onclick="confirmarPedido()"]');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmarPedido());
        }

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Cerrar modal haciendo clic fuera
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    closeModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.classList.remove('opacity-100');
            
            // Limpiar selección
            appState.selectedItem = null;
        }
    }

    async confirmarPedido() {
        const item = appState.selectedItem;
        if (!item) {
            Utils.showToast('No hay elemento seleccionado', 'error');
            return;
        }

        const user = appState.getUser();
        if (!user) {
            Utils.showToast('Usuario no autenticado', 'error');
            return;
        }

        try {
            this.showLoading(true);

            // Preparar datos de la solicitud
            const solicitudData = this.prepareSolicitudData(item, user);
            
            // Enviar solicitud
            const response = await ApiService.createSolicitud(solicitudData);
            
            Utils.showToast(response.message || 'Solicitud creada exitosamente', 'success');
            
            // Cerrar modal
            this.closeModal();
            
            // Recargar datos
            setTimeout(() => {
                window.dashboardController?.loadInitialData();
            }, 1000);

        } catch (error) {
            console.error('Error creando solicitud:', error);
            Utils.showToast('Error al crear la solicitud', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    prepareSolicitudData(item, user) {
        const currentType = appState.currentType;
        const fechaEntrega = new Date();
        fechaEntrega.setDate(fechaEntrega.getDate() + 3); // Entrega en 3 días

        let solicitudData = {
            usuario: user._id || user.id,
            fecha_entrega_esperada: fechaEntrega.toISOString(),
            activos: [],
            insumos: []
        };

        if (currentType === 'activos') {
            solicitudData.activos = [item._id || item.id];
        } else {
            solicitudData.insumos = [{
                id_insumo: item._id || item.id,
                cantidad: 1, // Por defecto solicitar 1 unidad
                nombreProducto: item.NombProducto || item.nombre || item.name,
                caracteristicas: item.caracteristicas || '',
                descripcion: `Solicitud de ${item.NombProducto || item.nombre || item.name}`
            }];
        }

        return solicitudData;
    }

    showLoading(show) {
        const confirmBtn = document.querySelector('[onclick="confirmarPedido()"]');
        if (confirmBtn) {
            if (show) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Enviando...';
                confirmBtn.classList.add('opacity-50');
            } else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Enviar Boleta';
                confirmBtn.classList.remove('opacity-50');
            }
        }
    }

    // Actualizar información del usuario en el modal
    updateUserInfo() {
        const user = appState.getUser();
        const userDisplay = document.querySelector('#confirmModal .font-bold.text-slate-700');
        
        if (user && userDisplay) {
            const displayName = user.nombre_completo || user.nombre || 'Usuario';
            const userId = user.cedula || user.id || 'N/A';
            userDisplay.textContent = `${displayName} #${userId}`;
        }
    }
}

// Controlador de UI y Utilidades
class UIController {
    constructor() {
        this.initializeTooltips();
        this.initializeAnimations();
    }

    initializeTooltips() {
        // Agregar tooltips a elementos que lo necesiten
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target);
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip(e.target);
            });
        });
    }

    showTooltip(element) {
        const text = element.dataset.tooltip;
        if (!text) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-50 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg';
        tooltip.textContent = text;
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%) translateY(-4px)';
        
        element.style.position = 'relative';
        element.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.classList.add('opacity-100');
        }, 10);
    }

    hideTooltip(element) {
        const tooltip = element.querySelector('.absolute.z-50');
        if (tooltip) {
            tooltip.remove();
        }
    }

    initializeAnimations() {
        // Animaciones de entrada
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, {
            threshold: 0.1
        });

        // Observar elementos con animación
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    // Actualizar información del usuario en el header
    updateUserInfo() {
        const user = appState.getUser();
        const userDisplay = document.getElementById('userInfo');
        
        if (user && userDisplay) {
            const displayName = user.nombre_completo || user.nombre || 'Usuario';
            userDisplay.textContent = displayName;
        }
    }

    // Actualizar fecha y hora
    updateDateTime() {
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            const now = new Date();
            dateTimeElement.textContent = now.toLocaleString('es-CR', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Inicializar actualización de tiempo
    startTimeUpdates() {
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000); // Actualizar cada minuto
    }
}

// Crear instancias globales
window.modalController = new ModalController();
window.uiController = new UIController();

// Funciones globales para compatibilidad con HTML
window.closeModal = () => window.modalController.closeModal();
window.confirmarPedido = () => window.modalController.confirmarPedido();
window.logout = () => window.authController.logout();
