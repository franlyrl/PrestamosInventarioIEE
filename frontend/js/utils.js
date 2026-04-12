// Utilidades globales para la aplicación UTN
class Utils {
    // Mostrar/ocultar indicador de carga
    static showLoading(show = true) {
        const loadingElement = document.getElementById('loading-state');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    // Mostrar notificaciones toast
    static showToast(message, type = 'info') {
        // Crear toast si no existe
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 translate-y-20 opacity-0 transition-all duration-500 pointer-events-none z-[200]';
            toast.innerHTML = `
                <div class="bg-slate-900 text-white text-[10px] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 uppercase tracking-widest font-bold">
                    <span id="toastMsg">Operación Exitosa</span>
                </div>
            `;
            document.body.appendChild(toast);
        }

        const toastMsg = toast.querySelector('#toastMsg');
        if (toastMsg) {
            toastMsg.textContent = message;
        }

        // Mostrar toast
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        // Ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
            toast.classList.remove('translate-y-0', 'opacity-100');
        }, 3000);
    }

    // Formatear fecha y hora
    static formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleString('es-CR', options);
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return 'Fecha inválida';
        }
    }

    // Formatear fecha solo
    static formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            };
            return date.toLocaleDateString('es-CR', options);
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return 'Fecha inválida';
        }
    }

    // Validar email
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validar cédula costarricense
    static validateCedula(cedula) {
        const re = /^\d{9,12}$/;
        return re.test(cedula);
    }

    // Generar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Formatear moneda
    static formatCurrency(amount) {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC'
        }).format(amount || 0);
    }

    // Copiar al portapapeles
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copiado al portapapeles', 'success');
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            this.showToast('Error al copiar', 'error');
        }
    }

    // Descargar archivo
    static downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Confirmación personalizada
    static confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-bold mb-4">${title}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end gap-3">
                        <button onclick="this.closest('.fixed').remove(); window.utilsConfirm(false)" 
                                class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                            Cancelar
                        </button>
                        <button onclick="this.closest('.fixed').remove(); window.utilsConfirm(true)" 
                                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Confirmar
                        </button>
                    </div>
                </div>
            `;
            
            window.utilsConfirm = (result) => {
                modal.remove();
                resolve(result);
                delete window.utilsConfirm;
            };
            
            document.body.appendChild(modal);
        });
    }

    // Fetch autenticado con token
    static async authenticatedFetch(url, options = {}) {
        const token = localStorage.getItem('utn_token');
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            // Si el token expiró, redirigir al login
            if (response.status === 401) {
                localStorage.removeItem('utn_token');
                localStorage.removeItem('utn_user');
                window.location.href = '../login.html';
                throw new Error('Sesión expirada');
            }

            return response;
        } catch (error) {
            console.error('Error en authenticatedFetch:', error);
            throw error;
        }
    }
}

// Hacer Utils disponible globalmente
window.Utils = Utils;
