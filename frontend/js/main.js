// Evitar duplicación de CONFIG
if (typeof window.CONFIG === 'undefined') {
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
    
    // Hacer CONFIG global
    window.CONFIG = CONFIG;
}

// Utilidades adicionales que no están en app.js

const Utils = {
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
            console.log('🔄 Iniciando enriquecimiento de solicitudes:', solicitudes.length);

            const enrichedSolicitudes = await Promise.all(
                solicitudes.map(async (solicitud, index) => {
                    console.log(`🔄 Procesando solicitud ${index + 1}:`, solicitud);

                    let enrichedSolicitud = { ...solicitud };

                    // Si el usuario es un objeto con $oid, extraer el ID
                    if (solicitud.usuario && typeof solicitud.usuario === 'object') {
                        const usuarioId = solicitud.usuario.$oid || solicitud.usuario._id || solicitud.usuario.id;
                        console.log(`👤 Usuario ID extraído: ${usuarioId}`);

                        if (usuarioId) {
                            try {
                                // Intentar obtener datos completos del usuario
                                const usuarioCompleto = await this.getUserFullData(usuarioId);
                                enrichedSolicitud.usuario = usuarioCompleto;
                                console.log(`✅ Usuario ${index + 1} enriquecido:`, usuarioCompleto);
                            } catch (error) {
                                console.error(`❌ Error obteniendo usuario ${usuarioId}:`, error);
                                // Usar datos básicos del localStorage
                                const userData = localStorage.getItem('utn_user');
                                const currentUser = userData ? JSON.parse(userData) : null;
                                enrichedSolicitud.usuario = {
                                    _id: usuarioId,
                                    nombre_completo: currentUser?.nombre_completo || currentUser?.nombre || 'Usuario',
                                    correo_electronico: currentUser?.correo_electronico || currentUser?.email || ''
                                };
                            }
                        }
                    }

                    // Enriquecer insumos con nombres reales
                    if (solicitud.insumos && Array.isArray(solicitud.insumos)) {
                        console.log(`📦 Procesando ${solicitud.insumos.length} insumos`);

                        const enrichedInsumos = await Promise.all(
                            solicitud.insumos.map(async (insumo, insumoIndex) => {
                                console.log(`📦 Insumo ${insumoIndex + 1}:`, insumo);

                                let enrichedInsumo = { ...insumo };

                                // Si id_insumo es un objeto con $oid
                                if (insumo.id_insumo && typeof insumo.id_insumo === 'object') {
                                    const insumoId = insumo.id_insumo.$oid || insumo.id_insumo._id || insumo.id_insumo.id;
                                    console.log(`📦 Insumo ID extraído: ${insumoId}`);

                                    if (insumoId) {
                                        try {
                                            const insumoCompleto = await this.getInsumoFullData(insumoId);
                                            enrichedInsumo.nombre_insumo = insumoCompleto.NombProducto || insumoCompleto.nombre || 'Insumo sin nombre';
                                            console.log(`✅ Insumo ${insumoIndex + 1} enriquecido:`, insumoCompleto);
                                        } catch (error) {
                                            console.error(`❌ Error obteniendo insumo ${insumoId}:`, error);
                                            enrichedInsumo.nombre_insumo = `Insumo #${insumoId.slice(-6)}`;
                                        }
                                    }
                                }

                                return enrichedInsumo;
                            })
                        );

                        enrichedSolicitud.insumos = enrichedInsumos;
                    }

                    console.log(`✅ Solicitud ${index + 1} final enriquecida:`, enrichedSolicitud);
                    return enrichedSolicitud;
                })
            );

            console.log('✅ Todas las solicitudes enriquecidas:', enrichedSolicitudes);
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

// Exportar para uso global - Evitar duplicación
try {
    if (typeof window !== 'undefined') {
        if (!window.CONFIG) {
            window.CONFIG = CONFIG;
        }
        // Utils y AppState ya se exportan desde app.js
        if (!window.Utils) {
            window.Utils = Utils;
        }
        if (!window.ApiService) {
            window.ApiService = ApiService;
        }
    }
} catch (error) {
    console.warn('Error exportando variables globales:', error);
}