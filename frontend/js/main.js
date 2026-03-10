// Configuración Principal
const CONFIG = {
    API_BASE_URL: 'http://localhost:4000/api',
    ANIMATIONS: {
        FADE_IN: 400,
        MODAL: 300,
        TOAST: 500
    },
    STORAGE_KEYS: {
        TOKEN: 'utn_token',
        USER: 'utn_user'
    }
};

// Estado de la Aplicación
class AppState {
    constructor() {
        this.currentUser = null;
        this.currentPage = this.getCurrentPage();
        this.data = {
            activos: [],
            insumos: [],
            solicitudes: []
        };
        this.isLoading = false;
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page || 'index';
    }

    setUser(user) {
        this.currentUser = user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    }

    getUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
            this.currentUser = stored ? JSON.parse(stored) : null;
        }
        return this.currentUser;
    }

    setToken(token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    }

    getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        window.location.href = '../index.html';
    }
}

// Instancia global del estado
const appState = new AppState();

// Utilidades
const Utils = {
    // Formatear fecha
    formatDate(date) {
        return new Date(date).toLocaleDateString('es-CR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Formatear fecha y hora
    formatDateTime(date) {
        return new Date(date).toLocaleString('es-CR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Formatear número
    formatNumber(num) {
        return new Intl.NumberFormat('es-CR').format(num);
    },

    // Capitalizar texto
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Validar email
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validar cédula costarricense
    isValidCedula(cedula) {
        const re = /^\d{9,10}$/;
        return re.test(cedula);
    },

    // Mostrar toast
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');

        if (!toast || !toastMsg) return;

        toastMsg.textContent = message;
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    },

    // Mostrar loading
    showLoading(show = true) {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.classList.toggle('hidden', !show);
        }
    },

    // Mostrar empty state
    showEmpty(show = true, message = 'No se encontraron resultados') {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.classList.toggle('hidden', !show);
            const messageElement = emptyState.querySelector('h3');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    },

    // Animar elemento
    animate(element, animation) {
        element.classList.add(animation);
        setTimeout(() => {
            element.classList.remove(animation);
        }, CONFIG.ANIMATIONS.FADE_IN);
    },

    // Hacer fetch con autenticación
    async authenticatedFetch(url, options = {}) {
        const token = appState.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers
        });
    },

    // Manejar errores de API
    handleApiError(error) {
        console.error('Error de API:', error);
        if (error.message.includes('401') || error.message.includes('403')) {
            Utils.showToast('Sesión expirada, por favor inicie sesión nuevamente', 'error');
            setTimeout(() => {
                appState.logout();
            }, 2000);
        } else {
            Utils.showToast('Error en la operación', 'error');
        }
    },

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
    },

    // Inicializar actualización de tiempo
    startTimeUpdates() {
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000); // Actualizar cada minuto
    },

    // Actualizar información del usuario
    updateUserInfo() {
        const user = appState.getUser();
        const userInfoElements = document.querySelectorAll('#userInfo');
        const userMenuElements = document.querySelectorAll('#userMenuName');

        if (user) {
            const displayName = user.nombre_completo || user.nombre || 'Usuario';
            userInfoElements.forEach(el => {
                el.textContent = displayName;
            });
            userMenuElements.forEach(el => {
                el.textContent = displayName;
            });
        }
    },

    // Validar formulario
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }
        });

        return isValid;
    },

    // Limpiar formulario
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.reset();
        form.querySelectorAll('.border-red-500').forEach(field => {
            field.classList.remove('border-red-500');
        });
    }
};

// API Service
const ApiService = {
    // Autenticación
    async login(credentials) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/usuarios/login`, {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Credenciales inválidas');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Obtener activos
    async getActivos() {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/activos`);

            if (!response.ok) {
                throw new Error('Error al cargar activos');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Obtener insumos
    async getInsumos() {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/insumos`);

            if (!response.ok) {
                throw new Error('Error al cargar insumos');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Obtener solicitudes
    async getSolicitudes() {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/solicitudes`);

            if (!response.ok) {
                throw new Error('Error al cargar solicitudes');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Crear activo
    async createActivo(activoData) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/activos`, {
                method: 'POST',
                body: JSON.stringify(activoData)
            });

            if (!response.ok) {
                throw new Error('Error al crear activo');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Crear insumo
    async createInsumo(insumoData) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/insumos`, {
                method: 'POST',
                body: JSON.stringify(insumoData)
            });

            if (!response.ok) {
                throw new Error('Error al crear insumo');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Crear solicitud
    async createSolicitud(solicitudData) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/solicitudes`, {
                method: 'POST',
                body: JSON.stringify(solicitudData)
            });

            if (!response.ok) {
                throw new Error('Error al crear solicitud');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Creación masiva de insumos
    async createInsumosMasivos(insumosData) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/insumos/bulk`, {
                method: 'POST',
                body: JSON.stringify(insumosData)
            });

            if (!response.ok) {
                throw new Error('Error al crear insumos masivamente');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    }
};

// Exportar para uso global
window.CONFIG = CONFIG;
window.appState = appState;
window.Utils = Utils;
window.ApiService = ApiService;
