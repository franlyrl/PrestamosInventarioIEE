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

    // Crear activo
    async createActivo(activoData) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/activos`, {
                method: 'POST',
                body: JSON.stringify(activoData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al crear activo');
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
            console.error('Error en getSolicitudes:', error);
            throw error;
        }
    },

    // Obtener solicitudes del usuario actual
    async getMisSolicitudes() {
        try {
            // Obtener usuario actual
            const userData = localStorage.getItem('utn_user');
            const currentUser = userData ? JSON.parse(userData) : null;

            console.log('🔍 currentUser en getMisSolicitudes:', currentUser);
            console.log('🔍 Campos de currentUser:', Object.keys(currentUser || {}));
            console.log('🔍 currentUser._id:', currentUser?._id);
            console.log('🔍 currentUser.id:', currentUser?.id);

            // Intentar obtener el ID del usuario desde el token
            let userId = currentUser?._id || currentUser?.id || currentUser?.uid;

            // Si no hay ID en localStorage, intentar extraer del token
            if (!userId) {
                const token = localStorage.getItem('utn_token');
                if (token) {
                    try {
                        // Decodificar el token JWT (payload es la segunda parte)
                        const payload = token.split('.')[1];
                        const decoded = JSON.parse(atob(payload));
                        userId = decoded.id || decoded._id || decoded.userId;
                        console.log('🔑 ID extraído del token:', userId);
                    } catch (error) {
                        console.error('Error al decodificar token:', error);
                    }
                }
            }

            console.log('🔍 userId final a usar:', userId);

            if (!userId) {
                console.error('No hay usuario o ID para cargar solicitudes');
                return [];
            }

            // Usar el endpoint general que existe y filtra automáticamente por rol
            // El backend hace: if (!['admin', 'administrador'].includes(req.user.role)) { filtro = { usuario: req.user.id }; }
            const url = `${CONFIG.API_BASE_URL}/solicitudes`;
            console.log('🌐 URL construida:', url);
            console.log('📋 Backend filtrará automáticamente según el rol del usuario');

            const response = await Utils.authenticatedFetch(url);

            if (!response.ok) {
                throw new Error('Error al cargar solicitudes del usuario');
            }

            const data = await response.json();
            console.log('📡 Datos recibidos de getMisSolicitudes:', data);
            console.log('👤 Datos con populate de usuario:', data[0]?.usuario);

            // Enriquecer los datos con populate completo si es necesario
            const enrichedData = await this.enrichUsersWithFullData(data);

            return enrichedData;
        } catch (error) {
            console.error('Error en getMisSolicitudes:', error);
            throw error;
        }
    },

    // Enriquecer datos de usuario si viene solo como ID
    async enrichUsersWithFullData(solicitudes) {
        try {
            const enrichedSolicitudes = await Promise.all(
                solicitudes.map(async (solicitud) => {
                    // Si el usuario es solo un ID, obtener datos completos
                    if (solicitud.usuario && typeof solicitud.usuario === 'string') {
                        console.log('🔄 Enriqueciendo solicitud con usuario completo:', solicitud.usuario);

                        // Obtener datos completos del usuario
                        const usuarioCompleto = await this.getUserFullData(solicitud.usuario);

                        // Reemplazar el usuario con los datos completos
                        return {
                            ...solicitud,
                            usuario: usuarioCompleto
                        };
                    }

                    // Enriquecer insumos con nombres reales
                    if (solicitud.insumos && Array.isArray(solicitud.insumos)) {
                        const enrichedInsumos = await Promise.all(
                            solicitud.insumos.map(async (insumo) => {
                                if (insumo.id_insumo && typeof insumo.id_insumo === 'string') {
                                    const insumoCompleto = await this.getInsumoFullData(insumo.id_insumo);
                                    return {
                                        ...insumo,
                                        nombre_insumo: insumoCompleto.NombProducto || 'Insumo sin nombre'
                                    };
                                }
                                return insumo;
                            })
                        );

                        return {
                            ...solicitud,
                            insumos: enrichedInsumos
                        };
                    }

                    // Enriquecer activos con nombres reales
                    if (solicitud.activos && Array.isArray(solicitud.activos)) {
                        const enrichedActivos = await Promise.all(
                            solicitud.activos.map(async (activo) => {
                                if (activo.codigo_activo && typeof activo.codigo_activo === 'string') {
                                    const activoCompleto = await this.getActivoFullData(activo.codigo_activo);
                                    return {
                                        ...activo,
                                        nombre_activo: activoCompleto.nombre || activoCompleto.nombre_activo || 'Activo sin nombre'
                                    };
                                }
                                return activo;
                            })
                        );

                        return {
                            ...solicitud,
                            activos: enrichedActivos
                        };
                    }

                    // Si ya es un objeto completo, devolver tal cual
                    return solicitud;
                })
            );

            console.log('✅ Solicitudes enriquecidas:', enrichedSolicitudes);
            return enrichedSolicitudes;
        } catch (error) {
            console.error('Error enriqueciendo usuarios:', error);
            return solicitudes; // Devolver datos originales si hay error
        }
    },

    // Obtener datos completos del usuario por ID
    async getUserFullData(usuarioId) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/usuarios/${usuarioId}`);

            if (!response.ok) {
                console.error('Error obteniendo usuario completo:', usuarioId);
                return { _id: usuarioId, nombre_completo: 'Usuario desconocido' };
            }

            const usuarioCompleto = await response.json();
            console.log('✅ Usuario completo obtenido:', usuarioCompleto);
            return usuarioCompleto;
        } catch (error) {
            console.error('Error en getUserFullData:', error);
            return { _id: usuarioId, nombre_completo: 'Error al cargar' };
        }
    },

    // Obtener datos completos del insumo por ID
    async getInsumoFullData(insumoId) {
        try {
            const response = await Utils.authenticatedFetch(`${CONFIG.API_BASE_URL}/insumos/${insumoId}`);

            if (!response.ok) {
                console.error('Error obteniendo insumo completo:', insumoId);
                return { NombProducto: 'Insumo desconocido' };
            }

            const insumoCompleto = await response.json();
            console.log('✅ Insumo completo obtenido:', insumoCompleto);
            return insumoCompleto;
        } catch (error) {
            console.error('Error en getInsumoFullData:', error);
            return { NombProducto: 'Error al cargar' };
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
