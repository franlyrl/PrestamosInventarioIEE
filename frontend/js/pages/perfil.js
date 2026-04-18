/**
 * PerfilController
 * Gestiona la informacion del usuario y las acciones de seguridad.
 */
class PerfilController {
    constructor() {
        this.usuario = null;
        this.initialized = false;
        this.SESSIONS_KEY = 'utn_sessions_local';
        this.SESSION_ID_KEY = 'utn_session_id';
    }

    async initialize() {
        if (this.initialized) return;

        try {
            Utils.showLoading(true);
            await this.cargarDatosUsuario();
            this.registrarSesionActual();
            this.setupEventListeners();
            this.render();
            this.cargarEstadoBoleta();
            this.cargarEstadisticas();
            this.initialized = true;
        } catch (error) {
            console.error('Error al inicializar perfil:', error);
            Utils.showToast('Error al cargar datos del perfil', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async cargarDatosUsuario() {
        try {
            const token = localStorage.getItem('utn_token');
            const api = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
            const response = await fetch(`${api}/usuarios/perfil`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('No se pudo obtener el perfil');

            const data = await response.json();
            if (data.ok && data.usuario) {
                this.usuario = data.usuario;
                if (window.appState) window.appState.setUser(this.usuario);
            }
        } catch (error) {
            console.error('Error cargando perfil desde API:', error);
            this.usuario = JSON.parse(localStorage.getItem('utn_user') || 'null');
        }
    }

    setupEventListeners() {
        document.getElementById('cambiar-password-btn')?.addEventListener('click', () => this.abrirModalPassword());
        document.getElementById('sesiones-activas-btn')?.addEventListener('click', () => this.abrirModalSesiones());
        document.getElementById('subir-boleta-btn')?.addEventListener('click', () => this.abrirSubidaBoleta());
    }

    render() {
        if (!this.usuario) return;

        const usuarioLocal = JSON.parse(localStorage.getItem('utn_user') || '{}');
        const cedulaPerfil =
            this.usuario.cedula ||
            this.usuario.identificacion ||
            this.usuario.identificación ||
            usuarioLocal.cedula ||
            usuarioLocal.identificacion ||
            usuarioLocal.identificación ||
            null;

        const estadoCuenta =
            this.usuario.estado ||
            this.usuario.estado_usuario ||
            usuarioLocal.estado ||
            usuarioLocal.estado_usuario ||
            'Activo';

        const selectors = {
            '#profile-name': this.usuario.nombre || this.usuario.nombre_completo || 'Usuario',
            '#profile-role': this.usuario.rol || this.usuario.tipo_rol || 'Usuario',
            '#profile-email': this.usuario.correo || this.usuario.correo_electronico || 'N/A',
            '#cedula': cedulaPerfil || 'Sin cédula registrada',
            '#estado': estadoCuenta
        };

        Object.entries(selectors).forEach(([selector, value]) => {
            document.querySelectorAll(selector).forEach((el) => {
                el.textContent = value;
            });
        });

        // Personalizar según rol
        const rol = (this.usuario.tipo_rol || this.usuario.rol || '').toLowerCase();
        const esAdmin = rol.includes('admin') || rol.includes('administrativo');
        
        if (esAdmin) {
            this.renderAdminView();
        } else {
            this.renderEstudianteView();
        }

        if (window.Utils?.updateUserInfo) window.Utils.updateUserInfo();
    }

    renderAdminView() {
        // Cambiar subtítulo
        const subtitulo = document.getElementById('perfil-subtitulo');
        if (subtitulo) subtitulo.textContent = 'Panel de Administración del Sistema';
        
        // Cambiar badge de cuenta
        const badge = document.querySelector('.mt-4.flex.items-center.justify-center.gap-2 span:last-child');
        if (badge) {
            badge.textContent = 'Administrador';
            badge.className = 'text-xs font-bold text-[#002D62]';
        }
        
        // Ocultar sección de matrícula y mostrar estadísticas de admin
        const seccionDinamica = document.getElementById('seccion-dinamica');
        if (seccionDinamica) {
            seccionDinamica.innerHTML = `
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                        <svg class="w-4 h-4 text-[#002D62]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <h3 class="text-base font-black text-slate-800">Estadísticas del Sistema</h3>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-slate-50 rounded-xl p-4 text-center">
                        <p class="text-2xl font-black text-[#002D62]" id="admin-total-usuarios">-</p>
                        <p class="text-[10px] font-black uppercase text-slate-400 mt-1">Usuarios</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-4 text-center">
                        <p class="text-2xl font-black text-orange-500" id="admin-pendientes">-</p>
                        <p class="text-[10px] font-black uppercase text-slate-400 mt-1">Pendientes</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-4 text-center">
                        <p class="text-2xl font-black text-[#002D62]" id="admin-activos">-</p>
                        <p class="text-[10px] font-black uppercase text-slate-400 mt-1">Préstamos Activos</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-4 text-center">
                        <p class="text-2xl font-black text-[#002D62]" id="admin-solicitudes">-</p>
                        <p class="text-[10px] font-black uppercase text-slate-400 mt-1">Solicitudes Hoy</p>
                    </div>
                </div>
                <div class="mt-4 flex gap-2">
                    <a href="gestion-usuarios.html" class="flex-1 py-2 bg-[#002D62] text-white text-xs font-bold rounded-lg text-center hover:bg-[#001A33] transition">Gestionar Usuarios</a>
                </div>
            `;
            this.cargarEstadisticasAdmin();
        }
        
        // Ocultar botón de subir boleta
        const btnBoleta = document.getElementById('subir-boleta-btn');
        if (btnBoleta) btnBoleta.style.display = 'none';
        
        // Ocultar sección extra de préstamos
        const extraSections = document.getElementById('extra-sections');
        if (extraSections) extraSections.style.display = 'none';
    }

    renderEstudianteView() {
        // Mostrar sección de matrícula normal
        const seccionDinamica = document.getElementById('seccion-dinamica');
        if (seccionDinamica) {
            seccionDinamica.innerHTML = `
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0"></path></svg>
                    </div>
                    <h3 class="text-base font-black text-slate-800">Verificación de Matrícula</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <div class="md:col-span-2 matricula-panel">
                        <label class="field-label">Estado Boleta</label>
                        <div id="boleta-estado-chip" class="estado-chip mb-2">
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span id="boleta-estado">Pendiente</span>
                        </div>
                        <p id="boleta-detalle" class="text-xs text-slate-600 mt-1 leading-relaxed">Sin información</p>
                    </div>
                    <div class="flex items-end">
                        <button id="subir-boleta-btn" class="w-full boleta-btn p-4 text-left">
                            <p class="font-black text-sm text-slate-800">Subir Boleta PDF</p>
                            <p class="text-xs text-slate-500 mt-1">Actualizar validación del cuatrimestre</p>
                        </button>
                    </div>
                </div>
            `;
            // Re-attach event listener
            document.getElementById('subir-boleta-btn')?.addEventListener('click', () => this.abrirSubidaBoleta());
        }
        
        // Mostrar sección extra
        const extraSections = document.getElementById('extra-sections');
        if (extraSections) extraSections.style.display = 'block';
    }

    async cargarEstadisticasAdmin() {
        try {
            const token = localStorage.getItem('utn_token');
            const api = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
            
            // Cargar conteo de usuarios pendientes
            const respPendientes = await fetch(`${api}/usuarios/pendientes-aprobacion`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (respPendientes.ok) {
                const data = await respPendientes.json();
                const el = document.getElementById('admin-pendientes');
                if (el) el.textContent = data.count || 0;
            }
            
            // Cargar estadísticas generales
            const [usuariosRes, solicitudesRes] = await Promise.all([
                fetch(`${api}/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${api}/solicitudes`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (usuariosRes.ok) {
                const usuarios = await usuariosRes.json();
                const total = Array.isArray(usuarios) ? usuarios.length : (usuarios.data?.usuarios?.length || 0);
                const el = document.getElementById('admin-total-usuarios');
                if (el) el.textContent = total;
            }
            
            if (solicitudesRes.ok) {
                const solicitudes = await solicitudesRes.json();
                const lista = Array.isArray(solicitudes) ? solicitudes : [];
                const activos = lista.filter(s => s.estado === 'entregado').length;
                
                const elActivos = document.getElementById('admin-activos');
                const elSolicitudes = document.getElementById('admin-solicitudes');
                if (elActivos) elActivos.textContent = activos;
                if (elSolicitudes) elSolicitudes.textContent = lista.length;
            }
        } catch (e) {
            console.error('Error cargando estadísticas de admin:', e);
        }
    }

    async cargarEstadisticas() {
        const stats = { total: 0, enUso: 0 };
        const totalEl = document.getElementById('total-solicitudes');
        const usoEl = document.getElementById('activos-en-uso');
        if (totalEl) totalEl.textContent = stats.total;
        if (usoEl) usoEl.textContent = stats.enUso;
    }

    async cargarEstadoBoleta() {
        try {
            const token = localStorage.getItem('utn_token');
            const api = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
            const response = await fetch(`${api}/usuarios/boleta/estado`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) return;
            const data = await response.json();
            const boleta = data.boleta || {};
            const cuatri = data.cuatrimestre_activo || null;

            const estadoEl = document.getElementById('boleta-estado');
            const detalleEl = document.getElementById('boleta-detalle');
            const chipEl = document.getElementById('boleta-estado-chip');
            if (!estadoEl || !detalleEl || !chipEl) return;

            const estado = boleta.estado || 'pendiente_boleta';
            const etiquetas = {
                validada: 'Validada',
                pendiente_revision: 'Pendiente de revisión',
                pendiente_boleta: 'Pendiente de boleta',
                rechazada: 'Rechazada'
            };
            estadoEl.textContent = etiquetas[estado] || estado;
            const tone = estado === 'validada'
                ? { cls: 'estado-chip mb-2 bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
                : estado === 'rechazada'
                    ? { cls: 'estado-chip mb-2 bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' }
                    : { cls: 'estado-chip mb-2 bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
            chipEl.className = tone.cls;
            chipEl.innerHTML = `<span class="w-2 h-2 rounded-full ${tone.dot}"></span><span id="boleta-estado">${etiquetas[estado] || estado}</span>`;

            const cuatriTxt = cuatri?.codigo ? `Cuatrimestre activo: ${cuatri.codigo}.` : 'Sin cuatrimestre activo.';
            const obs = boleta.observaciones ? ` ${boleta.observaciones}` : '';
            detalleEl.textContent = `${cuatriTxt}${obs}`;
        } catch (error) {
            console.error('Error cargando estado de boleta:', error);
        }
    }

    async abrirSubidaBoleta() {
        if (!window.Swal) {
            Utils.showToast('No se pudo abrir la carga de boleta', 'error');
            return;
        }

        this.ensureBoletaModalStyles();

        const result = await Swal.fire({
            title: '',
            html: `
                <div class="perfil-boleta-wrap">
                    <header class="perfil-boleta-head">
                        <div class="perfil-boleta-head__left">
                            <span class="perfil-boleta-head__icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                            </span>
                            <div>
                                <h3>Actualizar Boleta</h3>
                                <p>Validacion automatica institucional</p>
                            </div>
                        </div>
                    </header>
                    <div class="perfil-boleta-body">
                        <div class="perfil-boleta-note">
                            <p>Sube tu boleta PDF del cuatrimestre requerido.</p>
                            <span>El sistema valida cédula, nombre, carrera y período.</span>
                        </div>
                        <label class="perfil-boleta-label">Boleta PDF</label>
                        <div class="perfil-boleta-drop">
                            <input id="swal-boleta-file" type="file" class="swal2-file" accept=".pdf,application/pdf" hidden>
                            <div class="perfil-file-uploader">
                                <button type="button" id="swal-boleta-file-btn" class="perfil-file-btn">Seleccionar PDF</button>
                                <div id="swal-boleta-file-name" class="perfil-file-name">Ningún archivo seleccionado</div>
                            </div>
                            <small>Solo PDF oficial descargado de AVATAR.</small>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: 'Enviar PDF',
            cancelButtonText: 'Ahora no',
            buttonsStyling: false,
            customClass: {
                popup: 'perfil-boleta-popup',
                confirmButton: 'perfil-boleta-btn perfil-boleta-btn--primary',
                cancelButton: 'perfil-boleta-btn perfil-boleta-btn--secondary',
                closeButton: 'perfil-boleta-close'
            },
            didOpen: () => {
                const input = document.getElementById('swal-boleta-file');
                const btn = document.getElementById('swal-boleta-file-btn');
                const name = document.getElementById('swal-boleta-file-name');
                if (!input || !btn || !name) return;
                btn.addEventListener('click', () => input.click());
                input.addEventListener('change', () => {
                    const file = input.files && input.files[0] ? input.files[0] : null;
                    name.textContent = file ? file.name : 'Ningún archivo seleccionado';
                });
            },
            preConfirm: () => {
                const file = document.getElementById('swal-boleta-file').files[0];
                if (!file) {
                    Swal.showValidationMessage('Debes seleccionar un archivo PDF');
                    return false;
                }
                if (!(file.name || '').toLowerCase().endsWith('.pdf')) {
                    Swal.showValidationMessage('Solo se permite archivo PDF');
                    return false;
                }
                return file;
            }
        });

        if (!result.isConfirmed || !result.value) return;

        try {
            Utils.showLoading(true);
            const token = localStorage.getItem('utn_token');
            const api = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
            const fd = new FormData();
            fd.append('boleta_pdf', result.value);

            const response = await fetch(`${api}/usuarios/boleta`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'No se pudo subir la boleta');

            const rechazada = data?.boleta?.validada === false || String(data?.boleta?.estado || '').toLowerCase() === 'rechazada';
            Utils.showToast(
                data.message || (rechazada ? 'Boleta rechazada automáticamente.' : 'Boleta subida correctamente'),
                rechazada ? 'error' : 'success'
            );
            await this.cargarEstadoBoleta();
        } catch (error) {
            Utils.showToast(error.message || 'Error al subir boleta', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    ensureBoletaModalStyles() {
        if (document.getElementById('perfil-boleta-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'perfil-boleta-modal-styles';
        style.textContent = `
            .swal2-popup.perfil-boleta-popup {
                width: min(680px, 94vw) !important;
                padding: 0 !important;
                border-radius: 22px !important;
                border: 1px solid #cfe0f8 !important;
                overflow: hidden !important;
                font-family: Inter, sans-serif !important;
                box-shadow: 0 30px 70px rgba(2, 32, 71, 0.24) !important;
                background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%) !important;
            }
            .perfil-boleta-popup .swal2-html-container { margin: 0 !important; padding: 0 !important; }
            .perfil-boleta-wrap { text-align: left; }
            .perfil-boleta-head {
                background: linear-gradient(130deg, #002d62 0%, #0b4a98 100%);
                border-bottom: 3px solid #f2a900;
                padding: 16px 20px;
            }
            .perfil-boleta-head__left { display: flex; align-items: center; gap: 12px; }
            .perfil-boleta-head__icon {
                width: 42px; height: 42px; border-radius: 12px;
                background: rgba(255,255,255,.17); border: 1px solid rgba(255,255,255,.24);
                color: #fff; display: inline-flex; align-items: center; justify-content: center;
            }
            .perfil-boleta-head__icon svg { width: 22px; height: 22px; }
            .perfil-boleta-head h3 { margin: 0; color: #fff; font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: .01em; }
            .perfil-boleta-head p { margin: 5px 0 0 0; color: #dbeafe; font-size: 12px; font-weight: 600; }
            .perfil-boleta-body { padding: 16px 20px 8px; }
            .perfil-boleta-note {
                border: 1px solid #d8e6fa; border-radius: 14px; background: #f3f8ff;
                padding: 11px 12px; margin-bottom: 12px;
            }
            .perfil-boleta-note p { margin: 0; color: #17365d; font-size: 13px; font-weight: 800; }
            .perfil-boleta-note span { display:block; margin-top: 3px; color: #5a7395; font-size: 11px; font-weight: 600; }
            .perfil-boleta-label {
                display: block; margin-bottom: 6px; color: #64748b; font-size: 10px; font-weight: 900;
                letter-spacing: .13em; text-transform: uppercase;
            }
            .perfil-boleta-drop {
                border: 1.5px dashed #bcd0ef; border-radius: 12px; background: #f8fbff; padding: 10px 12px;
            }
            .perfil-file-uploader {
                display: grid; grid-template-columns: auto 1fr; gap: 9px; align-items: center;
            }
            .perfil-file-btn {
                background: #eef4ff; border: 1px solid #cfe0f8; color: #27496d;
                border-radius: 10px; padding: 8px 11px; font-size: 12px; font-weight: 800; letter-spacing: .02em;
                cursor: pointer;
            }
            .perfil-file-name {
                min-height: 36px; border: 1px solid #d7e3f3; border-radius: 10px; background: #fff;
                color: #64748b; font-size: 13px; padding: 8px 11px; display: flex; align-items: center;
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            .perfil-boleta-drop small { display:block; margin-top: 7px; color: #5f7593; font-size: 11px; font-weight: 600; }
            .swal2-actions { gap: 10px !important; margin: 8px 0 18px !important; }
            .perfil-boleta-btn {
                border: 0; border-radius: 11px; min-width: 148px; padding: .74rem 1rem;
                font-size: 14px; font-weight: 800; letter-spacing: .02em; transition: all .2s ease;
            }
            .perfil-boleta-btn--primary {
                background: linear-gradient(120deg, #002d62 0%, #0b4a98 100%); color: #fff;
                box-shadow: 0 10px 20px rgba(0,45,98,.24);
            }
            .perfil-boleta-btn--primary:hover { transform: translateY(-1px); }
            .perfil-boleta-btn--secondary {
                background: #e9f0fb; color: #385573; border: 1px solid #ccdcf3;
            }
            .swal2-close.perfil-boleta-close { color: #dbeafe !important; font-size: 28px !important; font-weight: 300 !important; }
            .swal2-validation-message { margin-top: 10px !important; }
        `;
        document.head.appendChild(style);
    }

    async abrirModalPassword() {
        if (!window.Swal) {
            Utils.showToast('No se pudo abrir el formulario de cambio de contraseña', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Cambiar Contraseña',
            html: `
                <div style="text-align:left">
                    <label style="display:block;font-size:11px;font-weight:700;margin:8px 0 4px;color:#64748b">Contraseña actual</label>
                    <input id="swal-current-pass" type="password" class="swal2-input" placeholder="Ingresa tu contraseña actual" style="margin:0 0 8px 0;width:100%">
                    <label style="display:block;font-size:11px;font-weight:700;margin:8px 0 4px;color:#64748b">Nueva contraseña</label>
                    <input id="swal-new-pass" type="password" class="swal2-input" placeholder="Mínimo 8 caracteres" style="margin:0 0 8px 0;width:100%">
                    <label style="display:block;font-size:11px;font-weight:700;margin:8px 0 4px;color:#64748b">Confirmar contraseña</label>
                    <input id="swal-confirm-pass" type="password" class="swal2-input" placeholder="Repite la nueva contraseña" style="margin:0;width:100%">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#002D62',
            cancelButtonColor: '#94a3b8',
            focusConfirm: false,
            preConfirm: () => {
                const current = document.getElementById('swal-current-pass').value;
                const nuevo = document.getElementById('swal-new-pass').value;
                const confirm = document.getElementById('swal-confirm-pass').value;

                if (!current || !nuevo || !confirm) {
                    Swal.showValidationMessage('Todos los campos son obligatorios');
                    return false;
                }
                if (nuevo.length < 8) {
                    Swal.showValidationMessage('La nueva contraseña debe tener al menos 8 caracteres');
                    return false;
                }
                if (nuevo !== confirm) {
                    Swal.showValidationMessage('Las contraseñas no coinciden');
                    return false;
                }
                return { current, nuevo };
            }
        });

        if (!result.isConfirmed || !result.value) return;
        await this.actualizarPassword(result.value.current, result.value.nuevo);
    }

    async actualizarPassword(currentPassword, newPassword) {
        try {
            Utils.showLoading(true);
            const token = localStorage.getItem('utn_token');
            const api = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
            const response = await fetch(`${api}/usuarios/update-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'No se pudo actualizar la contraseña');
            }

            Utils.showToast('Contraseña actualizada con éxito', 'success');
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    registrarSesionActual() {
        const sessionId = this.obtenerSessionId();
        const sessions = this.obtenerSesionesLocales();
        const now = new Date().toISOString();

        const deviceLabel = this.getDeviceLabel();
        const current = {
            id: sessionId,
            device: deviceLabel,
            platform: navigator.platform || 'Desconocido',
            userAgent: navigator.userAgent || 'Desconocido',
            lastSeen: now
        };

        const index = sessions.findIndex((s) => s.id === sessionId);
        if (index >= 0) sessions[index] = current;
        else sessions.unshift(current);

        const limit = sessions.slice(0, 8);
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(limit));
    }

    obtenerSessionId() {
        let id = sessionStorage.getItem(this.SESSION_ID_KEY);
        if (!id) {
            id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            sessionStorage.setItem(this.SESSION_ID_KEY, id);
        }
        return id;
    }

    obtenerSesionesLocales() {
        try {
            return JSON.parse(localStorage.getItem(this.SESSIONS_KEY) || '[]');
        } catch {
            return [];
        }
    }

    getDeviceLabel() {
        const ua = (navigator.userAgent || '').toLowerCase();
        if (ua.includes('edg')) return 'Microsoft Edge';
        if (ua.includes('chrome')) return 'Google Chrome';
        if (ua.includes('firefox')) return 'Mozilla Firefox';
        if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
        return 'Navegador web';
    }

    abrirModalSesiones() {
        if (!window.Swal) {
            Utils.showToast('No se pudo abrir el detalle de sesiones', 'error');
            return;
        }

        const currentId = this.obtenerSessionId();
        const sessions = this.obtenerSesionesLocales()
            .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

        const rows = sessions.length
            ? sessions.map((s) => {
                const isCurrent = s.id === currentId;
                const fecha = new Date(s.lastSeen).toLocaleString('es-CR');
                return `
                    <div style="border:1px solid #dbe5f2;border-radius:12px;padding:10px 12px;margin-bottom:8px;background:${isCurrent ? '#eef6ff' : '#f8fafc'}">
                        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
                            <strong style="color:#1e293b;font-size:13px">${s.device}</strong>
                            ${isCurrent ? '<span style="font-size:10px;font-weight:800;background:#dbeafe;color:#1e40af;padding:3px 8px;border-radius:999px">Actual</span>' : ''}
                        </div>
                        <div style="font-size:11px;color:#64748b;margin-top:4px">${s.platform}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:2px">Última actividad: ${fecha}</div>
                    </div>
                `;
            }).join('')
            : '<p style="font-size:13px;color:#64748b">No hay sesiones registradas en este dispositivo.</p>';

        Swal.fire({
            title: 'Sesiones Activas',
            html: `
                <div style="text-align:left">
                    <p style="font-size:12px;color:#64748b;margin-bottom:10px">
                        Esta vista muestra sesiones detectadas en este navegador.
                    </p>
                    <div style="max-height:260px;overflow:auto">${rows}</div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Cerrar sesión aquí',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#94a3b8'
        }).then((result) => {
            if (result.isConfirmed) this.cerrarSesionActual();
        });
    }

    cerrarSesionActual() {
        localStorage.removeItem('utn_token');
        localStorage.removeItem('utn_user');
        Utils.showToast('Sesión cerrada correctamente', 'success');
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 500);
    }
}

window.perfilController = new PerfilController();
document.addEventListener('DOMContentLoaded', () => {
    if (window.Utils?.updateUserInfo) window.Utils.updateUserInfo();
    setTimeout(() => {
        window.perfilController.initialize();
    }, 350);
});
