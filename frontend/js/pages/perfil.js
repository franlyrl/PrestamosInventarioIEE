/**
 * PerfilController
 * Gestiona la información del usuario y acciones de seguridad
 */
class PerfilController {
    constructor() {
        this.usuario = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        console.log('PerfilController: Inicializando...');
        try {
            Utils.showLoading(true);
            await this.cargarDatosUsuario();
            this.setupEventListeners();
            this.render();
            this.cargarEstadisticas();
            
            this.initialized = true;
            Utils.showLoading(false);
        } catch (error) {
            console.error('Error al inicializar Perfil:', error);
            Utils.showToast('Error al cargar datos del perfil', 'error');
            Utils.showLoading(false);
        }
    }

    async cargarDatosUsuario() {
        try {
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`${window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api'}/usuarios/perfil`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('No se pudo obtener el perfil');
            
            const data = await response.json();
            if (data.ok) {
                this.usuario = data.usuario;
                // Sincronizar con appState si existe
                if (window.appState) window.appState.setUser(this.usuario);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            // Fallback al localStorage
            this.usuario = JSON.parse(localStorage.getItem('utn_user'));
        }
    }

    setupEventListeners() {
        // Botón Cambiar Contraseña
        document.getElementById('cambiar-password-btn')?.addEventListener('click', () => this.abrirModalPassword());
        
        // Botón Editar Perfil (Pendiente implementación API)
        document.querySelectorAll('.btn-editar-perfil').forEach(btn => {
            btn.addEventListener('click', () => {
                Utils.showToast('Funcionalidad de edición de datos próximamente', 'info');
            });
        });
    }

    render() {
        if (!this.usuario) return;

        console.log('PerfilController: Renderizando...', this.usuario);

        const selectors = {
            '#profile-name': this.usuario.nombre || this.usuario.nombre_completo || 'Usuario',
            '#profile-role': this.usuario.rol || 'Estudiante',
            '#profile-email': this.usuario.correo || this.usuario.correo_electronico || 'N/A',
            '#cedula': this.usuario.cedula || 'N/A',
            '#estado': this.usuario.estado || 'Activo'
        };

        Object.entries(selectors).forEach(([selector, value]) => {
            document.querySelectorAll(selector).forEach(el => el.textContent = value);
        });

        // Actualizar header si es necesario
        if (window.Utils?.updateUserInfo) window.Utils.updateUserInfo();
    }

    async cargarEstadisticas() {
        // Simulación o carga desde API de estadísticas
        // En una fase posterior se conectará con estadisticasRoutes
        const stats = {
            total: 0,
            enUso: 0
        };
        
        document.getElementById('total-solicitudes').textContent = stats.total;
        document.getElementById('activos-en-uso').textContent = stats.enUso;
    }

    /**
     * Gestión de Seguridad
     */
    abrirModalPassword() {
        if (!window.modalController) {
            alert('Error: Controlador de modales no disponible');
            return;
        }

        window.modalController.showModal('confirmModal', {
            title: 'Cambiar Contraseña',
            icon: '🔒',
            details: `
                <div class="space-y-4">
                    <p class="text-xs text-slate-500 mb-4">Por seguridad, ingresa tu contraseña actual para establecer una nueva.</p>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Contraseña Actual</label>
                        <input type="password" id="currentPassword" class="input-field w-full" placeholder="••••••••">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Nueva Contraseña</label>
                        <input type="password" id="newPassword" class="input-field w-full" placeholder="Mínimo 8 caracteres">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirmNewPassword" class="input-field w-full" placeholder="Repite la contraseña">
                    </div>
                </div>
            `
        });

        // Configurar el botón del modal
        const btn = document.getElementById('modalConfirmBtn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Actualizar Contraseña';
            btn.onclick = async () => {
                const current = document.getElementById('currentPassword').value;
                const nuevo = document.getElementById('newPassword').value;
                const confirm = document.getElementById('confirmNewPassword').value;

                if (!current || !nuevo || !confirm) {
                    Utils.showToast('Todos los campos son obligatorios', 'error');
                    return;
                }

                if (nuevo !== confirm) {
                    Utils.showToast('Las contraseñas no coinciden', 'error');
                    return;
                }

                if (nuevo.length < 8) {
                    Utils.showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error');
                    return;
                }

                await this.actualizarPassword(current, nuevo);
                btn.textContent = originalText;
            };
        }
    }

    async actualizarPassword(currentPassword, newPassword) {
        try {
            Utils.showLoading(true);
            const token = localStorage.getItem('utn_token');
            const response = await fetch(`${window.CONFIG?.API_BASE_URL}/usuarios/update-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar');
            }

            Utils.showToast('Contraseña actualizada con éxito', 'success');
            window.modalController?.closeModal('confirmModal');
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }
}

// Global
window.perfilController = new PerfilController();
document.addEventListener('DOMContentLoaded', () => {
    // Sincronizar UI inicial
    if (window.Utils?.updateUserInfo) window.Utils.updateUserInfo();
    
    // Inicializar controlador con pequeño delay para asegurar componentes cargados
    setTimeout(() => {
        window.perfilController.initialize();
    }, 500);
});
