// Controlador de la página de Perfil
class PerfilController {
    constructor() {
        this.usuario = null;
        this.initializeEventListeners();
    }

    async initialize() {
        await this.cargarDatosUsuario();
        this.renderPerfil();
        this.cargarEstadisticas();
        this.cargarActividadReciente();
    }

    initializeEventListeners() {
        // Editar perfil
        const editarPerfilBtn = document.getElementById('editar-perfil-btn');
        if (editarPerfilBtn) {
            editarPerfilBtn.addEventListener('click', () => this.editarPerfil());
        }

        // Ver todo
        const verTodoBtn = document.getElementById('ver-todo-btn');
        if (verTodoBtn) {
            verTodoBtn.addEventListener('click', () => this.verTodoHistorial());
        }

        // Guardar preferencias
        const guardarPreferenciasBtn = document.getElementById('guardar-preferencias-btn');
        if (guardarPreferenciasBtn) {
            guardarPreferenciasBtn.addEventListener('click', () => this.guardarPreferencias());
        }

        // Cambiar contraseña
        const cambiarPasswordBtn = document.getElementById('cambiar-password-btn');
        if (cambiarPasswordBtn) {
            cambiarPasswordBtn.addEventListener('click', () => this.cambiarPassword());
        }

        // Periodo selector
        const periodoSelect = document.getElementById('periodo');
        if (periodoSelect) {
            periodoSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    document.getElementById('fechas-custom').classList.remove('hidden');
                } else {
                    document.getElementById('fechas-custom').classList.add('hidden');
                }
            });
        }
    }

    async cargarDatosUsuario() {
        this.usuario = appState.getUser();
        if (!this.usuario) {
            Utils.showToast('No se encontró información del usuario', 'error');
            return;
        }
    }

    renderPerfil() {
        if (!this.usuario) return;

        // Actualizar información personal
        this.updateElement('nombre-completo', this.usuario.nombre_completo || 'N/A');
        this.updateElement('cedula', this.usuario.cedula || 'N/A');
        this.updateElement('correo', this.usuario.correo_electronico || 'N/A');
        this.updateElement('codigo-barras', this.usuario.codigo_barras || 'N/A');
        this.updateElement('rol', this.usuario.rol || 'Usuario');
        this.updateElement('estado', this.usuario.estado || 'Activo');

        // Actualizar nombre en header
        this.updateElement('userMenuName', this.usuario.nombre_completo || 'Usuario');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    async cargarEstadisticas() {
        try {
            // Simular estadísticas (en producción vendría de API)
            const estadisticas = {
                totalSolicitudes: 15,
                activosEnUso: 2,
                solicitudesPendientes: 1,
                devolucionesTiempo: 12
            };

            this.updateElement('total-solicitudes', estadisticas.totalSolicitudes);
            this.updateElement('activos-en-uso', estadisticas.activosEnUso);
            this.updateElement('solicitudes-pendientes', estadisticas.solicitudesPendientes);
            this.updateElement('devoluciones-tiempo', estadisticas.devolucionesTiempo);

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    async cargarActividadReciente() {
        try {
            // Simular actividad reciente (en producción vendría de API)
            const actividad = [
                {
                    icono: '🔧',
                    titulo: 'Multímetro Digital Prestado',
                    descripcion: 'Préstamo por 3 días',
                    fecha: '2024-01-15T10:30:00Z'
                },
                {
                    icono: '📦',
                    titulo: 'Resistencias Solicitadas',
                    descripcion: '10 unidades de 1K Ohm',
                    fecha: '2024-01-14T14:20:00Z'
                },
                {
                    icono: '🔧',
                    titulo: 'Osciloscopio Devuelto',
                    descripcion: 'Devolución completa',
                    fecha: '2024-01-13T16:45:00Z'
                }
            ];

            const actividadElement = document.getElementById('actividad-reciente');
            if (actividadElement) {
                actividadElement.innerHTML = actividad.map(item => `
                    <div class="actividad-item">
                        <div class="actividad-icono">${item.icono}</div>
                        <div class="actividad-contenido">
                            <div class="actividad-titulo">${item.titulo}</div>
                            <div class="actividad-descripcion">${item.descripcion}</div>
                            <div class="actividad-fecha">${this.getTimeAgo(item.fecha)}</div>
                        </div>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Error cargando actividad reciente:', error);
        }
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `Hace ${diffMins} minutos`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} horas`;
        } else {
            return `Hace ${diffDays} días`;
        }
    }

    editarPerfil() {
        // Mostrar modal de edición
        window.modalController?.showModal('confirmModal', {
            title: 'Editar Perfil',
            icon: '✏️',
            details: `
                <form id="editar-perfil-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
                        <input type="text" value="${this.usuario.nombre_completo || ''}" class="input-field w-full">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
                        <input type="email" value="${this.usuario.correo_electronico || ''}" class="input-field w-full">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Código de Barras</label>
                        <input type="text" value="${this.usuario.codigo_barras || ''}" class="input-field w-full">
                    </div>
                </form>
            `
        });

        // Configurar botón de confirmación
        const confirmBtn = document.getElementById('modalConfirmBtn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.guardarCambiosPerfil();
        }
    }

    async guardarCambiosPerfil() {
        Utils.showToast('Cambios guardados exitosamente', 'success');
        window.modalController?.closeModal('confirmModal');
    }

    verTodoHistorial() {
        window.location.href = 'solicitudes.html';
    }

    guardarPreferencias() {
        const notificacionesEmail = document.getElementById('notificaciones-email')?.checked;
        const recordatoriosDevolucion = document.getElementById('recordatorios-devolucion')?.checked;
        const idioma = document.getElementById('idioma-select')?.value;

        // Guardar preferencias (en producción se enviarían a API)
        const preferencias = {
            notificacionesEmail,
            recordatoriosDevolucion,
            idioma
        };

        localStorage.setItem('user-preferences', JSON.stringify(preferencias));
        Utils.showToast('Preferencias guardadas exitosamente', 'success');
    }

    async cambiarPassword() {
        const passwordActual = document.getElementById('password-actual')?.value;
        const passwordNueva = document.getElementById('password-nueva')?.value;
        const passwordConfirmacion = document.getElementById('password-confirmacion')?.value;

        // Validaciones
        if (!passwordActual || !passwordNueva || !passwordConfirmacion) {
            Utils.showToast('Por favor complete todos los campos', 'error');
            return;
        }

        if (passwordNueva !== passwordConfirmacion) {
            Utils.showToast('Las contraseñas no coinciden', 'error');
            return;
        }

        if (passwordNueva.length < 6) {
            Utils.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            // Simular cambio de contraseña (en producción se enviaría a API)
            Utils.showToast('Contraseña cambiada exitosamente', 'success');
            
            // Limpiar formulario
            document.getElementById('password-actual').value = '';
            document.getElementById('password-nueva').value = '';
            document.getElementById('password-confirmacion').value = '';

        } catch (error) {
            Utils.showToast('Error al cambiar la contraseña', 'error');
        }
    }

    // Cargar preferencias guardadas
    cargarPreferencias() {
        const preferenciasGuardadas = localStorage.getItem('user-preferences');
        if (preferenciasGuardadas) {
            const preferencias = JSON.parse(preferenciasGuardadas);
            
            const notificacionesEmail = document.getElementById('notificaciones-email');
            const recordatoriosDevolucion = document.getElementById('recordatorios-devolucion');
            const idiomaSelect = document.getElementById('idioma-select');

            if (notificacionesEmail) notificacionesEmail.checked = preferencias.notificacionesEmail;
            if (recordatoriosDevolucion) recordatoriosDevolucion.checked = preferencias.recordatoriosDevolucion;
            if (idiomaSelect) idiomaSelect.value = preferencias.idioma || 'es';
        }
    }
}

// Crear instancia global
window.perfilController = new PerfilController();
