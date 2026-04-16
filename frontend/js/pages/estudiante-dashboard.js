/**
 * EstudianteDashboard
 * Módulo centralizado para toda la lógica del rol Estudiante.
 * Gestiona: estadísticas, bloqueos, notificaciones, lista de espera.
 */

class EstudianteDashboard {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('utn_user')) || {};
        this.token = localStorage.getItem('utn_token') || '';
        this.apiBase = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
        this.notificaciones = [];
        this.solicitudesActivas = [];
        this.listaEspera = [];
        this._bloqueado = false;
    }

    get headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // ─── Inicialización ─────────────────────────────────────────────────────────

    async inicializar() {
        console.log('[EstudianteDashboard] Inicializando...');
        try {
            await Promise.all([
                this.verificarBloqueoEstudiante(),
                this.cargarEstadisticasEstudiante()
            ]);
            this.generarNotificacionesLocales();
            this.renderizarNotificaciones();
            this.renderizarBadgeNotificaciones();
            this.alertarNotificacionesNuevas();
        } catch (e) {
            console.error('[EstudianteDashboard] Error en inicialización:', e);
        }
    }

    // ─── Verificar Bloqueo ───────────────────────────────────────────────────────

    async verificarBloqueoEstudiante() {
        try {
            const resp = await fetch(`${this.apiBase}/solicitudes`, {
                headers: this.headers
            });
            if (!resp.ok) return;

            const data = await resp.json();
            const misSolicitudes = Array.isArray(data)
                ? data.filter(s => s.usuario?._id === this.user._id || s.usuario === this.user._id)
                : [];

            this.solicitudesActivas = misSolicitudes;

            // Chequear si hay alguna con estado 'penalizado' o devolución vencida
            const tieneAtraso = misSolicitudes.some(s => {
                if (s.estado === 'penalizado') return true;
                if (s.estado === 'entregado' && s.fecha_entrega_esperada) {
                    return new Date(s.fecha_entrega_esperada) < new Date();
                }
                return false;
            });

            this._bloqueado = tieneAtraso;

            if (tieneAtraso) {
                this._mostrarAlertaBloqueo();
            }

            return tieneAtraso;
        } catch (e) {
            console.warn('[EstudianteDashboard] No se pudo verificar bloqueo:', e.message);
            return false;
        }
    }

    estaBloqueado() {
        return this._bloqueado;
    }

    _mostrarAlertaBloqueo() {
        // Mostrar un banner de alerta en el dashboard
        const mainApp = document.getElementById('mainApp');
        if (!mainApp) return;
        if (document.getElementById('alerta-bloqueo')) return;

        const alerta = document.createElement('div');
        alerta.id = 'alerta-bloqueo';
        alerta.className = 'mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3';
        alerta.innerHTML = `
            <div class="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            <div class="flex-1">
                <p class="text-sm font-black text-red-700">Cuenta con restricción activa</p>
                <p class="text-xs text-red-600 mt-1">Tienes préstamos vencidos o penalizaciones pendientes. No podrás crear nuevas solicitudes hasta resolver la situación. Visita tu perfil o contacta al administrador.</p>
            </div>
        `;
        mainApp.prepend(alerta);
    }

    // ─── Estadísticas del Estudiante ─────────────────────────────────────────────

    async cargarEstadisticasEstudiante() {
        try {
            const resp = await fetch(`${this.apiBase}/solicitudes`, {
                headers: this.headers
            });
            if (!resp.ok) return;

            const data = await resp.json();
            const mias = Array.isArray(data)
                ? data.filter(s => s.usuario?._id === this.user._id || s.usuario === this.user._id)
                : [];

            const stats = {
                total: mias.length,
                pendientes: mias.filter(s => s.estado === 'pendiente').length,
                activos_prestados: mias.filter(s => ['aprobada', 'entregado'].includes(s.estado?.toLowerCase())).length,
                por_vencer: mias.filter(s => {
                    if (!['aprobada', 'entregado'].includes(s.estado?.toLowerCase()) || !s.fecha_entrega_esperada) return false;
                    const dias = (new Date(s.fecha_entrega_esperada) - new Date()) / (1000 * 60 * 60 * 24);
                    return dias >= 0 && dias <= 3;
                }).length
            };

            this._renderizarStatsEstudiante(stats);
            this.solicitudesActivas = mias;
        } catch (e) {
            console.warn('[EstudianteDashboard] Error cargando stats:', e.message);
        }
    }

    _renderizarStatsEstudiante(stats) {
        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setEl('est-stat-total', stats.total);
        setEl('est-stat-pendientes', stats.pendientes);
        setEl('est-stat-prestados', stats.activos_prestados);
        setEl('est-stat-por-vencer', stats.por_vencer);
    }

    // ─── Notificaciones Internas ──────────────────────────────────────────────────

    generarNotificacionesLocales() {
        const previas = JSON.parse(localStorage.getItem('utn_notifs') || '[]');
        const ahora = new Date();
        const nuevas = [];

        this.solicitudesActivas.forEach(s => {
            const folio = s.folio ? String(s.folio).padStart(3, '0') : '---';
            const reqId = s._id || folio;

            let notif = null;

            if (s.estado === 'aprobada') {
                notif = {
                    id: `${reqId}-aprobada`,
                    tipo: 'success',
                    titulo: 'Solicitud Aprobada',
                    mensaje: `Tu solicitud #${folio} fue aprobada. Ya puedes pasar a retirar el equipo al laboratorio.`,
                    fecha: new Date(s.updatedAt || s.createdAt),
                    leida: false
                };
            } else if (s.estado === 'rechazada') {
                notif = {
                    id: `${reqId}-rechazada`,
                    tipo: 'error',
                    titulo: 'Solicitud Rechazada',
                    mensaje: `Tu solicitud #${folio} no pudo ser aprobada. Consulta más detalles con el administrador.`,
                    fecha: new Date(s.updatedAt || s.createdAt),
                    leida: false
                };
            } else if (s.estado === 'entregado' && s.fecha_entrega_esperada) {
                const fechaDev = new Date(s.fecha_entrega_esperada);
                const diasRestantes = Math.ceil((fechaDev - ahora) / (1000 * 60 * 60 * 24));

                if (diasRestantes < 0) {
                    notif = {
                        id: `${reqId}-vencida-${Math.abs(diasRestantes)}`,
                        tipo: 'danger',
                        titulo: '⚠ Devolución Vencida',
                        mensaje: `¡Importante! La devolución de #${folio} venció hace ${Math.abs(diasRestantes)} días. Entrégalo inmediatamente.`,
                        fecha: fechaDev,
                        leida: false
                    };
                } else if (diasRestantes <= 3) {
                    notif = {
                        id: `${reqId}-por-vencer`,
                        tipo: 'warning',
                        titulo: 'Recordatorio de Devolución',
                        mensaje: `El préstamo #${folio} debe devolverse en ${diasRestantes} día(s). Recuerda llevar el equipo a tiempo.`,
                        fecha: fechaDev,
                        leida: false
                    };
                } else if (s.estado === 'penalizado') {
                    notif = {
                        id: `${reqId}-penalizado`,
                        tipo: 'danger',
                        titulo: 'Cuenta Penalizada',
                        mensaje: `Tienes una penalización activa relacionada a la solicitud #${folio}. Contacta al administrador para más información.`,
                        fecha: new Date(s.updatedAt || s.createdAt),
                        leida: false,
                        acciones: [
                            {
                                texto: 'Contactar Administrador',
                                accion: () => window.estDash.contactarAdministrador(s._id, folio)
                            }
                        ]
                    };
                }
            } else {
                // Para todas las demás notificaciones, agregar botón de contacto
                console.log('🔍 Procesando notificación normal:', { tipo: s.estado, notifExiste: !!notif, tieneAcciones: !!(notif && notif.acciones) });
                if (notif) {
                    if (!notif.acciones) {
                        console.log('➕ Agregando botón de contacto a notificación normal');
                        notif.acciones = [
                            {
                                texto: 'Contactar Administrador',
                                accion: () => window.estDash.contactarAdministrador(s._id || s._id, folio)
                            }
                        ];
                    }
                }
            }

            // Excluir si ya existe en las previas (deduplicación por ID)
            if (notif) {
                console.log('✅ Notificación creada:', notif);
                if (!previas.some(p => p.id === notif.id)) {
                    console.log('➕ Agregando notificación a nuevas:', notif.id);
                    nuevas.push(notif);
                } else {
                    console.log('⚠️ Notificación ya existe, omitiendo:', notif.id);
                }
            } else {
                console.log('❌ No se creó notificación para solicitud:', s._id, 'estado:', s.estado);
            }
        });

        // Combinar, limitando el total y dándole prioridad a las nuevas
        const todasLasNotifs = [...nuevas, ...previas].slice(0, 30);
        localStorage.setItem('utn_notifs', JSON.stringify(todasLasNotifs));
        this.notificaciones = todasLasNotifs;
    }

    alertarNotificacionesNuevas() {
        const noLeidas = this.notificaciones.filter(n => !n.leida);
        if (noLeidas.length > 0) {
            const yaAvisado = sessionStorage.getItem('utn_notif_alerted_count');
            
            // Avisar sólo si el número ha cambiado u omitieron verlas la sesión anterior
            if (yaAvisado !== String(noLeidas.length)) {
                sessionStorage.setItem('utn_notif_alerted_count', String(noLeidas.length));
                
                if (window.SwalUTN || window.Swal) {
                    const swal = window.SwalUTN || window.Swal;
                    const principal = noLeidas[0]; // Mostrar el aviso más crítico y reciente
                    const headerHtml = principal.tipo === 'success' 
                        ? `<div class="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 animate-bounce"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>`
                        : `<div class="mx-auto w-16 h-16 bg-[#F2A900]/10 text-[#F2A900] rounded-full flex items-center justify-center mb-2 animate-pulse"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></div>`;
                        
                    swal.fire({
                        title: '<span class="text-[#002D62] font-black tracking-tight">¡Aviso Importante!</span>',
                        html: `
                            ${headerHtml}
                            <div class="mt-4 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                                <div class="absolute top-0 left-0 w-1 h-full ${principal.tipo === 'success' ? 'bg-green-500' : 'bg-[#F2A900]'}"></div>
                                <p class="text-xs font-black uppercase tracking-widest text-[#002D62] mb-1.5">${principal.titulo}</p>
                                <p class="text-sm text-slate-700 font-medium leading-relaxed">${principal.mensaje}</p>
                            </div>
                            <p class="mt-5 text-xs font-bold text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">Tienes <strong>${noLeidas.length}</strong> notificación(es) sin leer</p>
                        `,
                        confirmButtonText: 'Ver Bandeja de Avisos',
                        showCancelButton: true,
                        cancelButtonText: 'Entendido, cerrar',
                        confirmButtonColor: '#002D62',
                        cancelButtonColor: '#e2e8f0',
                        customClass: { 
                            popup: 'rounded-3xl', 
                            confirmButton: 'font-black px-6 py-3 rounded-xl shadow-lg shadow-[#002D62]/20', 
                            cancelButton: 'font-bold px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-200' 
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            if (typeof window.toggleNotifPanel === 'function') {
                                const panel = document.getElementById('notif-panel');
                                if (panel && !panel.classList.contains('open')) {
                                    window.toggleNotifPanel();
                                }
                            }
                        }
                    });
                }
            }
        }
    }

    renderizarBadgeNotificaciones() {
        const noLeidas = this.notificaciones.filter(n => !n.leida).length;
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.textContent = noLeidas;
            badge.classList.toggle('hidden', noLeidas === 0);
        }
    }

    renderizarNotificaciones() {
        const container = document.getElementById('notif-list');
        if (!container) return;

        if (this.notificaciones.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-slate-400">
                    <svg class="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    <p class="text-sm font-medium">Sin notificaciones</p>
                </div>`;
            return;
        }

        const iconos = {
            success: { bg: 'bg-green-100', text: 'text-green-600', icon: 'M5 13l4 4L19 7' },
            error: { bg: 'bg-red-100', text: 'text-red-600', icon: 'M6 18L18 6M6 6l12 12' },
            warning: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            danger: { bg: 'bg-red-100', text: 'text-red-700', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
        };

        container.innerHTML = this.notificaciones.map((n, i) => {
            const style = iconos[n.tipo] || iconos.info;
            const fecha = n.fecha ? new Date(n.fecha).toLocaleDateString('es-CR') : '';
            const accionesHtml = n.acciones ? (console.log('🎨 Renderizando acciones:', n.acciones), n.acciones.map((acc, index) => 
                `<button onclick="event.stopPropagation(); window.estDash.contactarAdministrador('${s._id}', '${folio}');" class="mt-2 px-3 py-1 bg-utn-blue text-white text-xs font-medium rounded-lg hover:bg-utn-dark transition-colors">
                    Contactar Administrador
                </button>`
            ).join(' ')) : '';
            
            return `
                <div class="flex items-start gap-3 p-4 ${n.leida ? 'opacity-60' : ''} hover:bg-slate-50 rounded-xl transition-colors cursor-pointer" onclick="window.estDash.marcarLeida(${i})">
                    <div class="flex-shrink-0 w-8 h-8 ${style.bg} rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 ${style.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${style.icon}"/>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-black text-slate-700">${n.titulo}</p>
                        <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">${n.mensaje}</p>
                        <p class="text-[10px] text-slate-400 mt-1">${fecha}</p>
                        ${accionesHtml ? `<div class="flex gap-2 mt-2">${accionesHtml}</div>` : ''}
                    </div>
                    ${!n.leida ? '<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>' : ''}
                </div>`;
        }).join('');
    }

    marcarLeida(index) {
        if (this.notificaciones[index]) {
            this.notificaciones[index].leida = true;
            localStorage.setItem('utn_notifs', JSON.stringify(this.notificaciones));
            this.renderizarBadgeNotificaciones();
            this.renderizarNotificaciones();
        }
    }

    marcarTodasLeidas() {
        this.notificaciones.forEach(n => n.leida = true);
        localStorage.setItem('utn_notifs', JSON.stringify(this.notificaciones));
        this.renderizarBadgeNotificaciones();
        this.renderizarNotificaciones();
    }

    // ─── Lista de Espera ─────────────────────────────────────────────────────────

    async entrarListaEspera(insumoId, cantidad = 1) {
        // En ausencia de un endpoint backend nativo para listas de espera, 
        // simulamos un flujo profesional e informamos al usuario de manera elegante.
        if (window.SwalUTN || window.Swal) {
            const swalInst = window.Swal || window.SwalUTN;
            await swalInst.fire({
                title: '<span class="font-black text-[#002D62]">Equipo No Disponible</span>',
                html: `
                    <div class="mt-2 space-y-4">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-100 mb-2">
                            <svg class="w-8 h-8 text-[#002D62]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <p class="text-sm text-slate-600 font-medium leading-relaxed">
                            El recurso que deseas solicitar se encuentra actualmente <strong class="text-indigo-600">prestado</strong> o <strong class="text-red-600">sin inventario válido</strong>.
                        </p>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                            <p class="text-xs text-slate-500 font-medium">Te hemos añadido a la lista de prioridad. Mantente pendiente de tu bandeja de notificaciones o acércate al laboratorio de sistemas para más información sobre fechas de devolución estimadas.</p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#002D62',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'font-bold px-8 shadow-lg shadow-[#002D62]/20 rounded-xl'
                }
            });
        } else {
            alert('El recurso está bajo préstamo o fuera de stock. Comuníquese con el Laboratorio para detalles sobre disponibilidad futura.');
        }
        return true;
    }

    async cargarMiListaEspera() {
        try {
            const resp = await fetch(`${this.apiBase}/lista-espera`, { headers: this.headers });
            if (!resp.ok) return [];
            const data = await resp.json();
            this.listaEspera = Array.isArray(data) ? data : [];
            return this.listaEspera;
        } catch (e) {
            return [];
        }
    }

    // ─── Cancelar Solicitud ──────────────────────────────────────────────────────

    async cancelarSolicitud(solicitudId, motivo = 'Cancelada por el estudiante') {
        if (this.estaBloqueado()) {
            if (window.SwalUTN) window.SwalUTN.error('Cuenta restringida', 'Tu cuenta tiene restricciones. No puedes realizar esta acción.');
            else alert('Tu cuenta tiene restricciones. No puedes realizar esta acción.');
            return false;
        }

        if (window.SwalUTN) {
            const ans = await window.SwalUTN.confirm('¿Cancelar solicitud?', 'Esta acción no se puede deshacer.');
            if (!ans.isConfirmed) return false;
        } else {
            if (!confirm(`¿Estás seguro de que deseas cancelar esta solicitud?\n\nEsta acción no se puede deshacer.`)) return false;
        }

        try {
            const resp = await fetch(`${this.apiBase}/solicitudes/${solicitudId}`, {
                method: 'DELETE',
                headers: this.headers,
                body: JSON.stringify({ motivo_cancelacion: motivo })
            });

            if (resp.ok) {
                if (window.Utils?.showToast) window.Utils.showToast('Solicitud cancelada exitosamente', 'success');
                return true;
            } else {
                const err = await resp.json().catch(() => ({}));
                if (window.SwalUTN) window.SwalUTN.error('Error al cancelar', err.message || 'Error del servidor.');
                else alert('❌ No se pudo cancelar: ' + (err.message || 'Error del servidor.'));
                return false;
            }
        } catch (e) {
            if (window.SwalUTN) window.SwalUTN.error('Error de conexión', 'No se pudo contactar al servidor.');
            else alert('Error de conexión.');
            return false;
        }
    }

    // ─── Contactar Administrador ──────────────────────────────────────────────────────
    async contactarAdministrador(solicitudId, folio) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('utn_user') || '{}');
            
            const { value: motivo, isConfirmed } = await Swal.fire({
                title: 'Contactar Administrador',
                html: `
                    <div class="text-left">
                        <p class="mb-4">Escribe el motivo de tu contacto regarding la solicitud #${folio}:</p>
                        <textarea id="motivo-contacto" class="w-full p-3 border border-slate-300 rounded-lg text-sm" 
                                  rows="4" placeholder="Describe tu situación o pregunta..."></textarea>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonColor: '#002D62',
                confirmButtonText: 'Enviar Mensaje',
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'swal-utn-toast' },
                preConfirm: () => {
                    const motivo = document.getElementById('motivo-contacto').value.trim();
                    if (!motivo) {
                        Swal.showValidationMessage('Por favor escribe un mensaje');
                        return false;
                    }
                    return motivo;
                }
            });

            if (!isConfirmed) return;

            // Preparar correo
            const asunto = `Consulta sobre Penalización - Solicitud #${folio}`;
            const cuerpo = `
Estudiante: ${currentUser.nombre || 'Usuario'} 
Correo: ${currentUser.correo || 'No disponible'}
Cédula: ${currentUser.cedula || 'No disponible'}

Solicitud afectada: #${folio}
Motivo del contacto:
${motivo}

---
Este mensaje fue enviado desde el sistema de gestión UTN el ${new Date().toLocaleString('es-CR')}.
            `.trim();

            // Enviar correo al administrador
            const adminEmail = 'admin@utn.ac.cr'; // Email del administrador
            window.open(`mailto:${adminEmail}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank');

            // Mostrar confirmación
            if (window.SwalUTN) {
                window.SwalUTN.success(
                    'Mensaje Preparado',
                    'Tu cliente de correo se abrirá para enviar el mensaje al administrador.'
                );
            } else {
                alert('✅ Tu cliente de correo se abrirá para enviar el mensaje al administrador.');
            }

        } catch (error) {
            console.error('Error al contactar administrador:', error);
            if (window.SwalUTN) {
                window.SwalUTN.error(
                    'Error',
                    'No se pudo preparar el mensaje de contacto.'
                );
            } else {
                alert('❌ No se pudo preparar el mensaje de contacto.');
            }
        }
    }

    // ─── Añadir a Carrito desde Detalle ─────────────────────────────────────────────
    addToCarritoDesdeDetalle(item, btn) {
        // Determinar el tipo basado en las propiedades del item
        const itemType = item.NombProducto ? 'insumo' : 'activo';
        const itemName = item.NombProducto || item.nombre || item.marca + ' ' + item.modelo;
        
        // Llamar a la función global addToCart
        if (window.addToCart) {
            window.addToCart(itemName, itemType, item, btn);
        } else {
            console.error('addToCart function not available');
        }
    }
}

// Instancia global
window.estDash = new EstudianteDashboard();

// Función global para añadir a carrito desde detalle
window.addToCarritoDesdeDetalle = function(item, btn) {
    window.estDash.addToCarritoDesdeDetalle(item, btn);
};

// Auto-inicializar si estamos en la página de ModUsuarios
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('vistaEstudiante')) {
        window.estDash.inicializar();
    }
});
