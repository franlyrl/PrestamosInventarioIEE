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
        this.currentType = 'activos';
        this.data = {
            activos: [],
            insumos: []
        };
        this.selectedItem = null;
        this.isLoading = false;
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
        const icon = type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'success';
        
        // Usar SweetAlert2 si está disponible para un look premium
        if (window.Swal) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
            Toast.fire({ icon, title: message });
        } else {
            // Fallback al toast anterior si Swal no carga
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
                showLoginPage();
            }, 2000);
        } else {
            Utils.showToast('Error en la operación', 'error');
        }
    }
};

// --- GLOBAL NOTIFICATIONS ---
window.mostrarToast = (msg, type) => Utils.showToast(msg, type);

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
                throw new Error('Credenciales inválidas');
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

    // Crear solicitud
    async createSolicitud(solicitudData) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/solicitudes`, {
                method: 'POST',
                body: JSON.stringify(solicitudData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al crear solicitud');
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al crear insumo');
            }

            return response.json();
        } catch (error) {
            Utils.handleApiError(error);
            throw error;
        }
    },

    // Crear activos (redirige a insumos con tipo activo según el nuevo estándar)
    async createActivo(activoData) {
        // Por consistencia con la nueva estandarización, usamos el mismo endpoint
        return this.createInsumo({ ...activoData, tipo: 'activo' });
    }
};

// Exportar para uso global
window.CONFIG = CONFIG;
window.appState = appState;
window.Utils = Utils;
window.ApiService = ApiService;
