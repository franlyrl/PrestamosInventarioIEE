/**
 * UTN - Sistema de Préstamos e Inventario
 * Script Principal (Mejorado)
 * Centraliza la lógica de UI y servicios API
 */

// 1. CONFIGURACIÓN GLOBAL
if (typeof window.CONFIG === 'undefined') {
    window.CONFIG = {
        API_BASE_URL: '/api',
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
}

// 1.5 INYECTAR Y CONFIGURAR SWEETALERT2 TEMPRANO
(function() {
    if (!window.Swal && !document.querySelector('script[src*="sweetalert2"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        document.head.appendChild(script);
    }
})();

window.SwalUTN = {
    success(title, text = '') {
        if (!window.Swal) return alert(title + ': ' + text);
        return Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#002D62', confirmButtonText: 'Aceptar', borderRadius: '12px', customClass: { popup: 'swal-utn' } });
    },
    error(title, text = '') {
        if (!window.Swal) return alert(title + ': ' + text);
        return Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#002D62', confirmButtonText: 'Entendido' });
    },
    warning(title, text = '') {
        if (!window.Swal) return alert(title + ': ' + text);
        return Swal.fire({ icon: 'warning', title, text, confirmButtonColor: '#002D62', confirmButtonText: 'Entendido' });
    },
    confirm(title, text = '¿Deseas continuar?') {
        if (!window.Swal) return Promise.resolve({ isConfirmed: confirm(title + '\\n\\n' + text) });
        return Swal.fire({ icon: 'question', title, text, showCancelButton: true, confirmButtonColor: '#002D62', cancelButtonColor: '#94a3b8', confirmButtonText: 'Aceptar', cancelButtonText: 'Cancelar' });
    }
};

// 2. UTILIDADES GLOBALES
if (typeof window.Utils === 'undefined') window.Utils = {};
Object.assign(window.Utils, {
    // Obtener iniciales del nombre
    getInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    },
    isAdminRole(user) {
        const rol = ((user?.tipo_rol || user?.rol || '') + '').toLowerCase();
        return ['admin', 'administrador', 'administrativo'].some(fragment => rol.includes(fragment));
    },
    // Mostrar/Ocultar Loading
    showLoading(show = true) {
        const loading = document.getElementById('loading-state') || document.getElementById('loginPage');
        if (loading) loading.classList.toggle('hidden', !show);
    },

    // Mostrar Toast
    showToast(message, type = 'success') {
        if (window.Swal) {
            const iconType = type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success');
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon: iconType,
                title: message,
                customClass: { popup: 'swal-utn-toast' }
            });
            return;
        }

        // Fallback
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        if (!toast || !toastMsg) return;

        toastMsg.textContent = message;
        const bgClass = type === 'error' ? 'bg-red-600' : (type === 'warning' ? 'bg-amber-500' : 'bg-utn-dark');
        toast.firstElementChild.className = `${bgClass} text-white text-[10px] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 uppercase tracking-widest font-bold`;

        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
        
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
            toast.classList.remove('translate-y-0', 'opacity-100');
        }, 3000);
    },

    // Actualizar Información del Usuario en TODA la página
    updateUserInfo() {
        if (!window.appState) {
            console.warn('appState no disponible para updateUserInfo');
            return;
        }

        const user = window.appState.getUser();
        if (!user) {
            console.warn('No hay usuario en el estado');
            return;
        }

        const nombre = user.nombre_completo || user.nombre || 'Usuario';
        const rol = (user.rol || 'Estudiante').charAt(0).toUpperCase() + (user.rol || 'estudiante').slice(1);
        const iniciales = this.getInitials(nombre);

        // Actualizar todos los elementos posibles
        const selectors = {
            '#nombre_completo': nombre,
            '#userInfo': nombre,
            '#userMenuName': nombre,
            '#dropdownUserName': nombre,
            '#dropdownUserRole': rol,
            '#profile-name': nombre,
            '#profile-role': rol,
            '#profile-email': user.correo_electronico || user.email || ''
        };

        Object.entries(selectors).forEach(([selector, value]) => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.tagName === 'INPUT') el.value = value;
                else el.textContent = value;
            });
        });

        // Actualizar iniciales
        document.querySelectorAll('.user-initials').forEach(el => {
            el.textContent = iniciales;
        });
        
        // Actualizar visibilidad de enlaces del menú
        this.updateMenuRoles(user);
        
        // Mostrar/ocultar carrito según rol (solo estudiantes y docentes)
        const rolLower = (user.rol || '').toLowerCase();
        const esEstudiante = rolLower.includes('estudiante');
        const esDocente = rolLower.includes('docente') || rolLower.includes('profesor');
        const esAdmin = rolLower.includes('admin') || rolLower.includes('administrativo');
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            if ((esEstudiante || esDocente) && !esAdmin) {
                cartBtn.classList.remove('hidden');
            } else {
                cartBtn.classList.add('hidden');
            }
        }
        
    },

    updateMenuRoles(user) {
        if (!user) return;
        const esAdmin = this.isAdminRole(user);

        if (esAdmin) {
            document.getElementById('navInventarioLink')?.classList.remove('hidden');
            document.getElementById('navAdminLink')?.classList.remove('hidden');
            document.getElementById('navGestionUsuariosLink')?.classList.remove('hidden');

            const nb = document.getElementById('notifBtn');
            if (nb) {
                nb.classList.remove('hidden');
                nb.style.display = 'flex';
            }
            window.UTNNotifs?.cargarYMostrarCampana();
        } else {
            document.getElementById('navSolicitudesLink')?.classList.remove('hidden');
            document.getElementById('navPrestamosLink')?.classList.remove('hidden');
            
            // Mostrar botón de lista de espera para estudiantes
            const esperaBtn = document.getElementById('esperaBtn');
            if (esperaBtn) {
                esperaBtn.classList.remove('hidden');
                esperaBtn.style.display = 'flex';
            }
            
            window.UTNNotifs?.cargarYMostrarCampana();
        }
    },

    // Formatear Fecha
    formatDate(date) {
        return new Date(date).toLocaleDateString('es-CR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
});

// ─── SISTEMA GLOBAL DE NOTIFICACIONES UTN ─────────────────────────────────────
// Funciona en TODAS las páginas. Consulta las solicitudes del estudiante,
// detecta cambios de estado importantes y alerta al usuario proactivamente.
window.UTNNotifs = {

    _apiBase: '/api',

    _escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    },

    _obtenerObservacionEstado(solicitud, estado) {
        const historico = Array.isArray(solicitud?.historico_estados) ? solicitud.historico_estados : [];
        const registro = historico
            .filter(item => item?.estado === estado && item?.observaciones)
            .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))[0];
        return registro?.observaciones || '';
    },

    _nombreArticuloEspera(espera) {
        const activoNombre = espera?.activo
            ? `${espera.activo.marca || ''} ${espera.activo.modelo || ''}`.trim()
            : '';
        return espera?.nombreProducto || espera?.insumo?.NombProducto || espera?.insumo?.nombre_insumo || activoNombre || 'Artículo en espera';
    },

    _formatearFechaEspera(fecha) {
        if (!fecha) return '';
        const parsed = new Date(fecha);
        if (Number.isNaN(parsed.getTime())) return '';
        return parsed.toLocaleString('es-CR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    async cargarYMostrarCampana() {
        const user = JSON.parse(localStorage.getItem('utn_user') || 'null');
        const token = localStorage.getItem('utn_token') || '';
        if (!user || !token) return;

        const rol = ((user.tipo_rol || user.rol || '') + '').toLowerCase();
        const esAdmin = ['admin', 'administrador', 'administrativo'].some(fragment => rol.includes(fragment));
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        try {
            if (esAdmin) {
                const [solResp, esperaResp] = await Promise.all([
                    fetch(`${window.CONFIG?.API_BASE_URL || this._apiBase}/solicitudes`, { headers }),
                    fetch(`${window.CONFIG?.API_BASE_URL || this._apiBase}/listaEspera`, { headers })
                ]);

                const todas = solResp.ok ? await solResp.json() : [];
                const esperaData = esperaResp.ok ? await esperaResp.json() : { total: 0, data: [] };
                const pendientes = Array.isArray(todas) ? todas.filter(s => s.estado === 'pendiente') : [];
                const esperaTotal = typeof esperaData.total === 'number' ? esperaData.total : (Array.isArray(esperaData) ? esperaData.length : 0);
                const alertas = [];

                if (pendientes.length > 0) {
                    const solicitudReciente = pendientes[0];
                    const usuarioNombre = solicitudReciente.usuario?.nombre_completo || solicitudReciente.usuario?.nombre || solicitudReciente.usuario || 'Usuario desconocido';
                    let fechaSolicitud = 'Fecha desconocida';
                    if (solicitudReciente.createdAt) {
                        fechaSolicitud = new Date(solicitudReciente.createdAt).toLocaleDateString('es-CR', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        });
                    }

                    alertas.push({
                        tipo: 'admin_pendientes',
                        cantidad: pendientes.length,
                        solicitudes: pendientes,
                        ultimoUsuario: usuarioNombre,
                        ultimaFecha: fechaSolicitud
                    });
                }
                if (esperaTotal > 0) {
                    // Agrupar por producto para mostrar detalles
                    const porProducto = {};
                    (esperaData.data || []).forEach(e => {
                        const activoNombre = e.activo ? `${e.activo.marca || ''} ${e.activo.modelo || ''}`.trim() : '';
                        const producto = e.nombreProducto || e.insumo?.NombProducto || activoNombre || 'Producto desconocido';
                        if (!porProducto[producto]) porProducto[producto] = [];
                        porProducto[producto].push(e);
                    });
                    alertas.push({ 
                        tipo: 'admin_espera', 
                        cantidad: esperaTotal, 
                        lista: esperaData.data || [],
                        porProducto: porProducto,
                        detalleProductos: Object.entries(porProducto).map(([nombre, items]) => ({
                            nombre,
                            cantidad: items.length,
                            primerUsuario: items[0]?.usuario?.nombre_completo || 'Desconocido',
                            fechaEstimada: items[0]?.fecha_estimada 
                                ? new Date(items[0].fecha_estimada).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : null
                        }))
                    });
                }

                const totalCount = pendientes.length + esperaTotal;
                const campana = document.getElementById('notifBtn');
                const badge = document.getElementById('notifCount');
                if (campana) {
                    campana.classList.remove('hidden');
                    campana.style.display = 'flex';
                }
                if (badge) {
                    if (totalCount > 0) {
                        badge.textContent = totalCount;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                }

                this.renderDropdown(alertas, { isAdmin: true });
                return;
            }

            const [resp, esperaResp] = await Promise.all([
                fetch(`${window.CONFIG?.API_BASE_URL || this._apiBase}/solicitudes`, { headers }),
                fetch(`${window.CONFIG?.API_BASE_URL || this._apiBase}/listaEspera/mis`, { headers })
            ]);
            if (!resp.ok) return;

            const todas = await resp.json();
            const misEsperas = esperaResp.ok ? await esperaResp.json() : [];
            const uid = user._id || user.id;
            const mis = Array.isArray(todas)
                ? todas.filter(s => {
                    const sid = s.usuario?._id || s.usuario?.id || s.usuario;
                    return sid === uid || String(sid) === String(uid);
                })
                : [];

            const ahora = new Date();
            const alertas = [];

            mis.forEach(s => {
                const folio = s.folio ? String(s.folio).padStart(3, '0') : s._id?.slice(-4) || '---';

                if (s.estado === 'aprobada') {
                    let extra = '';
                    if (s.fecha_recogida_programada) {
                        const parts = s.fecha_recogida_programada.split('-');
                        const fRec = parts.length === 3
                            ? new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : s.fecha_recogida_programada;
                        extra = `Retiro: <strong>${fRec}</strong>${s.hora_recogida ? ' a las <strong>' + s.hora_recogida + '</strong>' : ''}.`;
                    }
                    if (s.fecha_entrega_esperada) {
                        const parts2 = s.fecha_entrega_esperada.split('T')[0].split('-');
                        const fDev = parts2.length === 3
                            ? new Date(parts2[0], parts2[1] - 1, parts2[2]).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : s.fecha_entrega_esperada;
                        extra += ` Devolución antes del: <strong>${fDev}</strong>.`;
                    }
                    alertas.push({ tipo: 'aprobada', folio, extra, solicitud: s });
                } else if (s.estado === 'rechazada') {
                    alertas.push({
                        tipo: 'rechazada',
                        folio,
                        motivo: this._obtenerObservacionEstado(s, 'rechazada'),
                        solicitud: s
                    });
                } else if (s.estado === 'entregado' && s.fecha_entrega_esperada) {
                    const fDev = new Date(s.fecha_entrega_esperada);
                    const diasRestantes = Math.ceil((fDev - ahora) / (1000 * 60 * 60 * 24));
                    if (diasRestantes <= 3) {
                        alertas.push({ tipo: diasRestantes < 0 ? 'vencida' : 'por_vencer', folio, diasRestantes, solicitud: s });
                    }
                } else if (s.estado === 'penalizado') {
                    alertas.push({ tipo: 'penalizado', folio, solicitud: s });
                }
            });

            (Array.isArray(misEsperas) ? misEsperas : []).forEach(espera => {
                if (!espera.fecha_estimada && !espera.tiempo_estimado) return;
                const fechaEstimada = this._formatearFechaEspera(espera.fecha_estimada);
                const folio = `LE-${String(espera._id || espera.id || '').slice(-4) || '---'}`;
                alertas.push({
                    tipo: 'espera_estimada',
                    folio,
                    notifKey: `espera_${espera._id || espera.id || folio}_${espera.fecha_estimada || ''}_${espera.tiempo_estimado || ''}`,
                    articulo: this._nombreArticuloEspera(espera),
                    cantidad: espera.cantidad_solicitada || 1,
                    fechaEstimada,
                    tiempoEstimado: espera.tiempo_estimado || '',
                    espera
                });
            });

            const campana = document.getElementById('notifBtn');
            const badge = document.getElementById('notifCount');
            if (campana) {
                campana.classList.remove('hidden');
                campana.style.display = 'flex';
            }
            if (badge) {
                if (alertas.length > 0) {
                    badge.textContent = alertas.length;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }

            this.renderDropdown(alertas, { isAdmin: false });
            this._mostrarAlertaIngreso(alertas);

            // Cargar lista de espera para estudiantes
            await this.cargarYMostrarEspera();

            const penalizados = alertas.filter(a => a.tipo === 'penalizado');
            if (penalizados.length > 0) {
                this._iniciarPollingPenalizacion();
            }

        } catch (e) {
            console.warn('[UTNNotifs] Error al cargar notificaciones:', e.message);
        }
    },

    /**
     * Inicia un polling cada 30 segundos para verificar si la penalización fue removida
     * Si fue removida, muestra notificación de bienvenida y recarga
     */
    _iniciarPollingPenalizacion() {
        if (this._pollingActivo) return; // Evitar múltiples polls
        this._pollingActivo = true;

        const verificar = async () => {
            try {
                const resp = await fetch(`${this.apiBase}/solicitudes`, { headers: this.headers });
                if (!resp.ok) return;
                
                const todas = await resp.json();
                const uid = this.currentUser._id || this.currentUser.id;
                const mis = Array.isArray(todas) ? todas.filter(s => {
                    const sUserId = s.usuario?._id || s.usuario?.id || s.usuario;
                    return sUserId === uid || String(sUserId) === String(uid);
                }) : [];

                const tienePenalizacion = mis.some(s => s.estado === 'penalizado');

                // Si YA NO hay penalización, mostrar alerta positiva
                if (!tienePenalizacion && this._tuvoPenalizacion) {
                    this._tuvoPenalizacion = false;
                    this._pollingActivo = false;
                    
                    if (window.Swal) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Restricción Removida!',
                            html: '<p style="font-size:14px;">La restricción en tu cuenta ha sido levantada. Ahora puedes continuar.</p>',
                            confirmButtonText: 'Continuar',
                            confirmButtonColor: '#002D62',
                            customClass: { popup: 'rounded-3xl' }
                        }).then(() => {
                            window.location.reload();
                        });
                    }
                }
            } catch (e) {
                console.warn('[Polling] Error verificando penalizaciones:', e.message);
            }
        };

        // Recordar que tuvo penalización para hacer la verificación
        this._tuvoPenalizacion = true;

        // Verificar cada 10 segundos (más rápido para detectar levantamiento)
        setInterval(verificar, 10000);
    },

    async cargarYMostrarEspera() {
        const user = JSON.parse(localStorage.getItem('utn_user') || 'null');
        const token = localStorage.getItem('utn_token') || '';
        if (!user || !token) return;

        const rol = ((user.tipo_rol || user.rol || '') + '').toLowerCase();
        const esAdmin = ['admin', 'administrador', 'administrativo'].some(fragment => rol.includes(fragment));
        if (esAdmin) return; // Solo para estudiantes

        try {
            // Obtener TODA la lista de espera del sistema para calcular posiciones correctas
            const [misResp, todasResp] = await Promise.all([
                fetch(`${window.CONFIG?.API_BASE_URL || this._apiBase}/listaEspera/mis`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(`${window.CONFIG?.API_BASE_URL || this._apiBase}/listaEspera`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                })
            ]);

            if (!misResp.ok || !todasResp.ok) return;

            const misEsperas = await misResp.json();
            const todasEsperas = await todasResp.json();
            const listaCompleta = Array.isArray(todasEsperas) ? todasEsperas : (todasEsperas.data || []);

            // Calcular posición real dentro de cada producto
            const misEsperasConPosicion = this.calcularPosicionesEspera(misEsperas, listaCompleta);

            // Mostrar badge si hay items
            const esperaBtn = document.getElementById('esperaBtn');
            const esperaBadge = document.getElementById('esperaCount');
            if (esperaBtn && esperaBadge) {
                if (misEsperasConPosicion.length > 0) {
                    esperaBadge.textContent = misEsperasConPosicion.length;
                    esperaBadge.classList.remove('hidden');
                } else {
                    esperaBadge.classList.add('hidden');
                }
            }

            // Renderizar dropdown con posiciones correctas
            this.renderEsperaDropdown(misEsperasConPosicion);
        } catch (error) {
            console.error('Error cargando lista de espera:', error);
        }
    },

    // Calcular posición real en lista de espera comparando con toda la lista del sistema
    calcularPosicionesEspera(misEsperas, listaCompleta) {
        // Agrupar la lista completa por artículo (insumo o activo)
        const porArticulo = {};
        listaCompleta.forEach(espera => {
            const articuloId = espera.insumo?._id || espera.insumo || espera.activo?._id || espera.activo;
            if (!articuloId) return;
            if (!porArticulo[articuloId]) porArticulo[articuloId] = [];
            porArticulo[articuloId].push(espera);
        });

        // Ordenar cada grupo por prioridad y fecha
        Object.values(porArticulo).forEach(esperas => {
            esperas.sort((a, b) => {
                if (a.prioridad !== b.prioridad) return b.prioridad - a.prioridad;
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
        });

        // Encontrar posición de cada espera del usuario
        return misEsperas.map(miEspera => {
            const articuloId = miEspera.insumo?._id || miEspera.insumo || miEspera.activo?._id || miEspera.activo;
            const esperasDelArticulo = porArticulo[articuloId] || [];

            // Buscar la posición del usuario en la lista ordenada
            const posicion = esperasDelArticulo.findIndex(e => {
                const eId = e._id || e.id;
                const miId = miEspera._id || miEspera.id;
                return eId === miId || eId?.toString() === miId?.toString();
            }) + 1;

            return { ...miEspera, posicionReal: posicion || 1, totalEnCola: esperasDelArticulo.length };
        });
    },

    _mostrarAlertaIngreso(alertas) {
        if (!alertas.length) return;
        if (!window.Swal) return;

        // Clave de sesión única por conjunto de alertas
        const claveSession = 'utn_notif_alerted_' + alertas.map(a => (a.notifKey || a.folio) + a.tipo).join('_');
        if (sessionStorage.getItem(claveSession)) return;
        sessionStorage.setItem(claveSession, '1');

        const aprobadas = alertas.filter(a => a.tipo === 'aprobada');
        const vencidas  = alertas.filter(a => a.tipo === 'vencida');
        const porVencer = alertas.filter(a => a.tipo === 'por_vencer');
        const rechazadas = alertas.filter(a => a.tipo === 'rechazada');
        const esperasEstimadas = alertas.filter(a => a.tipo === 'espera_estimada');
        const penalizados = alertas.filter(a => a.tipo === 'penalizado');

        // Prioridad: vencida > penalizado > rechazada > espera_estimada > por_vencer > aprobada
        let tipoAlerta = 'aprobada';
        if (vencidas.length)    tipoAlerta = 'vencida';
        else if (penalizados.length) tipoAlerta = 'penalizado';
        else if (rechazadas.length)  tipoAlerta = 'rechazada';
        else if (esperasEstimadas.length) tipoAlerta = 'espera_estimada';
        else if (porVencer.length)   tipoAlerta = 'por_vencer';

        const iconHtml = {
            aprobada:   `<div class="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3" style="animation: bounceIn 0.6s ease;"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg></div>`,
            por_vencer: `<div class="mx-auto w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>`,
            vencida:    `<div class="mx-auto w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg></div>`,
            rechazada:  `<div class="mx-auto w-20 h-20 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mb-3"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg></div>`,
            espera_estimada: `<div class="mx-auto w-20 h-20 bg-blue-100 text-[#002D62] rounded-full flex items-center justify-center mb-3"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>`,
            penalizado: `<div class="mx-auto w-20 h-20 bg-red-100 text-red-700 rounded-full flex items-center justify-center mb-3"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg></div>`
        };

        const titulos = {
            aprobada:   '<span class="text-[#002D62] font-black text-xl tracking-tight">¡Tu solicitud fue aprobada!</span>',
            por_vencer: '<span class="text-amber-700 font-black text-xl">Recordatorio de devolución</span>',
            vencida:    '<span class="text-red-700 font-black text-xl">Devolución vencida</span>',
            rechazada:  '<span class="text-rose-800 font-black text-xl">Solicitud rechazada</span>',
            espera_estimada: '<span class="text-[#002D62] font-black text-xl">Fecha aproximada asignada</span>',
            penalizado: '<span class="text-red-800 font-black text-xl">Cuenta con restricción activa</span>'
        };

        // Construir bloques de detalle por cada alerta
        const bloquesHtml = alertas.map(a => {
            let bg, borde, texto;
            if (a.tipo === 'aprobada') {
                bg = 'bg-green-50'; borde = 'border-green-200';
                texto = `
                    <p class="text-xs font-black text-green-700 uppercase tracking-widest mb-1">Solicitud #${a.folio} — APROBADA</p>
                    <p class="text-sm text-slate-700 font-medium leading-relaxed">${a.extra || 'Pase al laboratorio a retirar su equipo.'}</p>
                    <a href="../pages/solicitudes.html" class="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#002D62] underline underline-offset-2 hover:no-underline">Ver mi solicitud &rarr;</a>`;
            } else if (a.tipo === 'vencida') {
                bg = 'bg-red-50'; borde = 'border-red-200';
                texto = `
                    <p class="text-xs font-black text-red-700 uppercase tracking-widest mb-1">Solicitud #${a.folio} — DEVOLUCIÓN VENCIDA</p>
                    <p class="text-sm text-slate-700 font-medium">Venció hace <strong>${Math.abs(a.diasRestantes)} día(s)</strong>. Por favor devuelva el equipo inmediatamente.</p>`;
            } else if (a.tipo === 'por_vencer') {
                bg = 'bg-amber-50'; borde = 'border-amber-200';
                texto = `
                    <p class="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Solicitud #${a.folio} — POR VENCER</p>
                    <p class="text-sm text-slate-700 font-medium">Debe devolver el equipo en <strong>${a.diasRestantes} día(s)</strong>.</p>`;
            } else if (a.tipo === 'rechazada') {
                bg = 'bg-rose-50'; borde = 'border-rose-200';
                const motivo = this._escapeHtml(a.motivo || 'Revise el detalle de la solicitud o comuníquese con el administrador.');
                texto = `
                    <p class="text-xs font-black text-rose-700 uppercase tracking-widest mb-1">Solicitud #${a.folio} — RECHAZADA</p>
                    <p class="text-sm text-slate-700 font-medium leading-relaxed">Motivo: <strong>${motivo}</strong></p>
                    <a href="../pages/solicitudes.html" class="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#002D62] underline underline-offset-2 hover:no-underline">Ver mi solicitud &rarr;</a>`;
            } else if (a.tipo === 'espera_estimada') {
                bg = 'bg-blue-50'; borde = 'border-blue-200';
                const articulo = this._escapeHtml(a.articulo);
                const detalleFecha = a.fechaEstimada ? `Fecha aproximada: <strong>${this._escapeHtml(a.fechaEstimada)}</strong>.` : '';
                const detalleTiempo = a.tiempoEstimado ? `Nota: <strong>${this._escapeHtml(a.tiempoEstimado)}</strong>.` : '';
                texto = `
                    <p class="text-xs font-black text-[#002D62] uppercase tracking-widest mb-1">Lista de espera — ${articulo}</p>
                    <p class="text-sm text-slate-700 font-medium leading-relaxed">${detalleFecha} ${detalleTiempo}</p>
                    <a href="../pages/solicitudes.html?tab=lista-espera" class="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#002D62] underline underline-offset-2 hover:no-underline">Ver lista de espera &rarr;</a>`;
            } else {
                bg = 'bg-red-50'; borde = 'border-red-200';
                texto = `
                    <p class="text-xs font-black text-red-800 uppercase tracking-widest mb-1">Solicitud #${a.folio} — PENALIZADO</p>
                    <p class="text-sm text-slate-700 font-medium">Tiene una restricción activa. Comuníquese con el administrador del laboratorio.</p>`;
            }
            return `<div class="text-left ${bg} border ${borde} rounded-2xl p-4 mb-3">${texto}</div>`;
        }).join('');

        // Verificar si hay penalizaciones
        const tienePenalizacion = penalizados.length > 0;

        // Si hay penalización, MODAL RESTRICTIVO (sin opción de escape)
        const config = {
            title: titulos[tipoAlerta],
            html: `
                <div class="py-2">
                    ${iconHtml[tipoAlerta]}
                    <p class="text-sm text-slate-500 mb-5 font-medium">Tienes <strong class="text-slate-700">${alertas.length}</strong> aviso(s) importante(s) en tus solicitudes.</p>
                    <div class="max-h-64 overflow-y-auto pr-1 space-y-1">${bloquesHtml}</div>
                </div>`,
            confirmButtonText: tienePenalizacion ? 'Enviar correo al administrador' : 'Ver mis solicitudes',
            showCancelButton: tienePenalizacion, // Solo mostrar cancelar si hay penalización
            cancelButtonText: tienePenalizacion ? 'Cerrar sesión' : undefined,
            confirmButtonColor: tienePenalizacion ? '#1d4ed8' : '#002D62',
            cancelButtonColor: '#dc2626',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'font-black px-6 py-3 rounded-xl shadow-lg',
                cancelButton: 'font-black px-6 py-3 rounded-xl bg-red-600 border border-red-700 text-white'
            },
            showClass:  { popup: 'animate__animated animate__fadeInDown animate__faster' },
            hideClass:  { popup: 'animate__animated animate__fadeOutUp animate__faster' },
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                const closeBtn = document.querySelector('.swal2-close');
                if (closeBtn) closeBtn.style.display = 'none';
            }
        };

        Swal.fire(config).then(result => {
            if (result.isConfirmed) {
                if (tienePenalizacion) {
                    window.location.href = 'mailto:admin@utn.edu.ar?subject=Cuenta%20bloqueada%20-%20Solicitud%20penalizada&body=Hola%20administrador,%0D%0A%0D%0AMi%20cuenta%20está%20bloqueada%20por%20una%20solicitud%20penalizada.%20Por%20favor,%20revise%20mi%20caso.%0D%0A%0D%0AMi%20usuario%20es%20%3Cnombre%20o%20correo%3E.%0D%0AGracias.';
                    localStorage.clear();
                    sessionStorage.clear();
                    if (window.appState) window.appState.logout();
                    window.location.replace('../login.html');
                    return;
                }
                window.location.href = '../pages/solicitudes.html';
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Si presionan "Cerrar sesión"
                localStorage.clear();
                sessionStorage.clear();
                if (window.appState) window.appState.logout();
                window.location.replace('../login.html');
            }
        });
    },

    // Renderiza las tarjetas dentro del dropdown de la campana
    renderDropdown(alertas, options = {}) {
        const list = document.getElementById('notif-dropdown-list');
        if (!list) return;

        const isAdmin = !!options.isAdmin;
        const titleEl = document.getElementById('notifDropdownTitle');
        const subtitleEl = document.getElementById('notifDropdownSubtitle');
        const allLink = document.getElementById('notifAllLink');
        const quickLink = document.getElementById('notifQuickLink');

        if (titleEl) titleEl.textContent = isAdmin ? 'Notificaciones Administrativas' : 'Notificaciones';
        if (subtitleEl) subtitleEl.textContent = isAdmin ? 'Solicitudes pendientes y lista de espera' : 'Avisos de tus solicitudes';
        if (allLink) {
            allLink.href = '../pages/solicitudes.html';
            allLink.innerHTML = `
                <svg style="width:10px;height:10px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h7"/></svg>
                <span>${isAdmin ? 'Ver solicitudes' : 'Ver Todas'}</span>`;
        }
        if (quickLink) {
            quickLink.href = '../pages/solicitudes.html';
            quickLink.innerHTML = `
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                ${isAdmin ? 'Ir a Solicitudes' : 'Ir a Mis Solicitudes'}`;
        }

        if (!alertas || alertas.length === 0) {
            list.innerHTML = `
                <div class="p-8 text-center text-slate-400">
                    <svg class="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    <p class="text-xs font-medium">${isAdmin ? 'No hay solicitudes pendientes ni usuarios en lista de espera.' : 'Sin notificaciones pendientes'}</p>
                </div>`;
            return;
        }

        const estilos = {
            aprobada:       { bg: 'bg-green-50',  borde: 'border-l-green-500',  icon: 'text-green-600',  path: 'M5 13l4 4L19 7', label: 'Aprobada' },
            por_vencer:     { bg: 'bg-amber-50',  borde: 'border-l-amber-400',  icon: 'text-amber-600',  path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Por Vencer' },
            vencida:        { bg: 'bg-red-50',    borde: 'border-l-red-500',    icon: 'text-red-600',    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z', label: 'Vencida' },
            rechazada:      { bg: 'bg-rose-50',   borde: 'border-l-rose-500',   icon: 'text-rose-700',   path: 'M6 18L18 6M6 6l12 12', label: 'Rechazada' },
            espera_estimada:{ bg: 'bg-blue-50',   borde: 'border-l-blue-500',   icon: 'text-[#002D62]',   path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Lista de Espera' },
            penalizado:     { bg: 'bg-red-50',    borde: 'border-l-red-700',    icon: 'text-red-700',    path: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', label: 'Penalizado' },
            admin_pendientes:{ bg: 'bg-blue-50',   borde: 'border-l-blue-500',   icon: 'text-blue-600',   path: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Solicitudes Pendientes' },
            admin_espera:   { bg: 'bg-amber-50',  borde: 'border-l-amber-400',  icon: 'text-amber-600',  path: 'M12 4v16m8-8H4', label: 'Lista de Espera' }
        };
        const mensajeFn = {
            aprobada:        a => `Solicitud <strong>#${a.folio}</strong> aprobada. ${a.extra || 'Pase a retirar el equipo.'}`,
            por_vencer:      a => `Solicitud <strong>#${a.folio}</strong>. Devolver en <strong>${a.diasRestantes} día(s)</strong>.`,
            vencida:         a => `Devolución de <strong>#${a.folio}</strong> vencida hace <strong>${Math.abs(a.diasRestantes)} día(s)</strong>.`,
            rechazada:       a => `Solicitud <strong>#${a.folio}</strong> rechazada.${a.motivo ? ` Motivo: <strong>${this._escapeHtml(a.motivo)}</strong>.` : ' Revise el detalle o consulte al administrador.'}`,
            espera_estimada: a => {
                const fecha = a.fechaEstimada ? `Fecha aproximada: <strong>${this._escapeHtml(a.fechaEstimada)}</strong>.` : '';
                const tiempo = a.tiempoEstimado ? `Nota: <strong>${this._escapeHtml(a.tiempoEstimado)}</strong>.` : '';
                return `<strong>${this._escapeHtml(a.articulo)}</strong> ya tiene aproximado. ${fecha} ${tiempo}`;
            },
            penalizado:      a => `Restricción activa en solicitud <strong>#${a.folio}</strong>.`,
            admin_pendientes: a => {
                const detalles = [];
                if (a.ultimoUsuario) detalles.push(`Última: <strong>${a.ultimoUsuario}</strong>`);
                if (a.ultimaFecha) detalles.push(`Fecha: <strong>${a.ultimaFecha}</strong>`);
                return `📋 <strong>${a.cantidad}</strong> solicitudes pendientes${detalles.length ? ' · ' + detalles.join(' · ') : ''}`;
            },
            admin_espera:     a => {
                if (!a.detalleProductos || a.detalleProductos.length === 0) {
                    return `⏳ <strong>${a.cantidad}</strong> usuarios en lista de espera.`;
                }
                const productosDetalle = a.detalleProductos.map(p => 
                    `• <strong>${p.nombre}</strong>: ${p.cantidad} esperando${p.fechaEstimada ? ` (llega: ${p.fechaEstimada})` : ' (sin fecha)'}`
                ).join('<br>');
                return `⏳ <strong>${a.cantidad}</strong> en espera:<br><span class="text-[10px] leading-tight">${productosDetalle}</span>`;
            }
        };

        list.innerHTML = alertas.map(a => {
            const est = estilos[a.tipo] || estilos.aprobada;
            const targetUrl = a.tipo === 'espera_estimada'
                ? '../pages/solicitudes.html?tab=lista-espera'
                : '../pages/solicitudes.html';
            return `<a href="${targetUrl}" class="flex items-start gap-3 p-4 ${est.bg} border-l-4 ${est.borde} hover:brightness-95 transition-all" style="text-decoration:none;" onclick="document.getElementById('notif-dropdown').style.display='none'">
                <div class="flex-shrink-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm mt-0.5">
                    <svg class="w-3.5 h-3.5 ${est.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="${est.path}"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 break-words">${est.label}</p>
                    <p class="text-xs text-slate-700 font-medium leading-snug break-words whitespace-normal">${mensajeFn[a.tipo]?.(a) || ''}</p>
                </div>
            </a>`;
        }).join('');
    },

    renderEsperaDropdown(misEspera) {
        const list = document.getElementById('espera-dropdown-list');
        if (!list) return;

        if (!misEspera || misEspera.length === 0) {
            list.innerHTML = `
                <div class="p-8 text-center text-slate-400">
                    <svg class="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p class="text-xs font-medium">No estás en ninguna lista de espera</p>
                </div>`;
            return;
        }

        list.innerHTML = misEspera.map((espera) => {
            const activoNombre = espera.activo
                ? `${espera.activo.marca || ''} ${espera.activo.modelo || ''}`.trim()
                : '';
            const insumoNombre = espera.nombreProducto || espera.insumo?.NombProducto || activoNombre || 'Producto desconocido';
            const fechaEntrada = new Date(espera.createdAt).toLocaleString('es-CR', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const posicion = espera.posicionReal || 1;
            const totalEnCola = espera.totalEnCola || 1;

            // Calcular días restantes si tiene fecha estimada
            let diasRestantesHTML = '';
            if (espera.fecha_estimada) {
                const hoy = new Date();
                const fechaEstimada = new Date(espera.fecha_estimada);
                const diffTime = fechaEstimada - hoy;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    diasRestantesHTML = `<br><span class="text-blue-600 font-bold text-[10px]">⏰ Faltan ${diffDays} día${diffDays > 1 ? 's' : ''}</span>`;
                } else if (diffDays === 0) {
                    diasRestantesHTML = `<br><span class="text-green-600 font-bold text-[10px]">✅ Llega hoy</span>`;
                } else {
                    diasRestantesHTML = `<br><span class="text-red-600 font-bold text-[10px]">⚠️ Vencido hace ${Math.abs(diffDays)} día${Math.abs(diffDays) > 1 ? 's' : ''}</span>`;
                }
            }

            return `
                <div class="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-400 hover:brightness-95 transition-all">
                    <div class="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm mt-0.5">
                        <span class="text-xs font-black text-amber-600">${posicion}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Posición ${posicion} de ${totalEnCola}</p>
                        <p class="text-xs text-slate-700 font-medium leading-snug">
                            <strong>${insumoNombre}</strong> - Cantidad: ${espera.cantidad_solicitada || 1}<br>
                            <span class="text-slate-500">En lista desde: ${fechaEntrada}</span>
                            ${espera.fecha_estimada ? `<br><span class="text-green-600 font-bold text-[10px]">📅 Llegada estimada: ${new Date(espera.fecha_estimada).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                            ${diasRestantesHTML}
                        </p>
                        <button onclick="window.cancelarEspera('${espera._id}')" class="mt-2 text-[10px] font-bold text-red-600 hover:text-red-800 underline">
                            Cancelar solicitud
                        </button>
                    </div>
                </div>`;
        }).join('');
    }
};

// Toggle del dropdown de notificaciones (campana)
window.toggleNotifDropdown = function(e) {
    if (e) e.stopPropagation();
    const dd = document.getElementById('notif-dropdown');
    const userDd = document.getElementById('user-dropdown');
    const esperaDd = document.getElementById('espera-dropdown');
    if (!dd) return;
    if (userDd && !userDd.classList.contains('hidden')) {
        userDd.classList.add('hidden');
        userDd.style.display = 'none';
    }
    if (esperaDd && esperaDd.style.display === 'block') {
        esperaDd.style.display = 'none';
    }
    const isOpen = dd.style.display === 'block';
    dd.style.display = isOpen ? 'none' : 'block';
};

// Toggle del dropdown de lista de espera
window.toggleEsperaDropdown = function(e) {
    if (e) e.stopPropagation();
    const dd = document.getElementById('espera-dropdown');
    const notifDd = document.getElementById('notif-dropdown');
    const userDd = document.getElementById('user-dropdown');
    if (!dd) return;
    if (notifDd && notifDd.style.display === 'block') {
        notifDd.style.display = 'none';
    }
    if (userDd && !userDd.classList.contains('hidden')) {
        userDd.classList.add('hidden');
        userDd.style.display = 'none';
    }
    const isOpen = dd.style.display === 'block';
    dd.style.display = isOpen ? 'none' : 'block';
};

// Manejar clic en Añadir - decide entre carrito o lista de espera según stock
window.handleAddToCartOrEspera = async function(item) {
    if (!item) return;
    
    const stock = item.cantidad || item.stock || item.stock_actual || 0;
    const tipo = item.tipo || (item.codigo_activo ? 'activo' : 'insumo');
    const nombre = item.nombre || item.NombProducto || item.nombre_insumo || ((item.marca || '') + ' ' + (item.modelo || '')).trim() || 'Producto';
    
    if (stock > 0) {
        // Hay stock - agregar al carrito
        if (typeof addToCart === 'function') {
            // Para insumos, preguntar cantidad
            if (tipo === 'insumo' || tipo === 'Insumo') {
                const { value: cantidad } = await Swal.fire({
                    title: 'Cantidad a solicitar',
                    html: `<p class="mb-4 text-sm text-slate-600">Stock disponible: <strong>${stock}</strong></p>
                           <input type="number" id="swal-input-qty" class="swal2-input max-w-[150px] mx-auto text-center font-black" value="1" min="1" max="${stock}" step="1">`,
                    showCancelButton: true,
                    confirmButtonText: 'Añadir al carrito',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#002D62',
                    cancelButtonColor: '#64748b',
                    customClass: { popup: 'rounded-2xl', confirmButton: 'font-black px-5 py-2 rounded-xl', cancelButton: 'font-black px-5 py-2 rounded-xl' },
                    preConfirm: () => parseInt(document.getElementById('swal-input-qty').value) || 1
                });
                if (cantidad) {
                    addToCart(nombre, tipo, item, null, cantidad);
                }
            } else {
                // Activos - agregar directo
                addToCart(nombre, tipo, item);
            }
        } else {
            window.Utils?.showToast('Función de carrito no disponible', 'error');
        }
    } else {
        // Sin stock - agregar a lista de espera
        await window.agregarAListaEspera(item, nombre, { tipo });
    }
};

window.obtenerIdParaListaEspera = async function(itemOrId, tipo = 'insumo') {
    if (!itemOrId) return null;

    const objectIdRegex = /^[a-f\d]{24}$/i;
    if (typeof itemOrId === 'string') {
        return objectIdRegex.test(itemOrId) ? itemOrId : null;
    }

    const extraerObjectId = (valor) => {
        if (!valor) return null;
        if (typeof valor === 'object') {
            const posible = valor.$oid || valor._id || valor.id;
            return posible && objectIdRegex.test(String(posible)) ? String(posible) : null;
        }
        return objectIdRegex.test(String(valor)) ? String(valor) : null;
    };

    const directo = extraerObjectId(itemOrId._id)
        || extraerObjectId(itemOrId.id)
        || extraerObjectId(itemOrId.id_insumo)
        || extraerObjectId(itemOrId.id_activo)
        || extraerObjectId(itemOrId.codigo_activo);

    if (directo) {
        return directo;
    }

    const tipoNormalizado = (tipo || '').toLowerCase();

    const endpoint = tipoNormalizado === 'activo' ? 'activos' : 'insumos';

    try {
        const token = localStorage.getItem('utn_token');
        const resp = await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/${endpoint}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!resp.ok) return null;

        const data = await resp.json();
        const items = Array.isArray(data) ? data : (data.todosLosActivos || data.activos || data.insumos || data.data || []);

        const encontrado = items.find(item => {
            if (tipoNormalizado === 'activo') {
                const numActivo = itemOrId.numActivo || itemOrId.numeroActivo || itemOrId.codigo;
                const marcaModelo = `${itemOrId.marca || ''} ${itemOrId.modelo || ''}`.trim().toLowerCase();
                const itemMarcaModelo = `${item.marca || ''} ${item.modelo || ''}`.trim().toLowerCase();
                return (numActivo && String(item.numActivo) === String(numActivo))
                    || (marcaModelo && itemMarcaModelo === marcaModelo);
            }

            const codigo = itemOrId.codigo || itemOrId.codigo_insumo;
            const idInsumo = itemOrId.id_insumo;
            const nombre = (itemOrId.NombProducto || itemOrId.nombre || itemOrId.nombre_insumo || '').trim().toLowerCase();
            const itemNombre = (item.NombProducto || item.nombre || item.nombre_insumo || '').trim().toLowerCase();

            return (codigo && String(item.codigo) === String(codigo))
                || (idInsumo && String(item.id_insumo) === String(idInsumo))
                || (nombre && itemNombre === nombre);
        });

        return encontrado?._id || null;
    } catch (error) {
        console.warn('[ListaEspera] No se pudo resolver el ID del artículo:', error.message);
        return null;
    }
};

// Agregar a lista de espera desde catálogo
window.agregarAListaEspera = async function(itemId, nombreProducto, options = {}) {
    const token = localStorage.getItem('utn_token');
    const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
    const userId = user._id || user.id;
    const opts = typeof options === 'string' ? { tipo: options } : (options || {});
    const tipo = (opts.tipo || 'insumo').toLowerCase();
    const cantidadFija = parseInt(opts.cantidad, 10);
    const sinConfirmar = opts.sinConfirmar === true;
    
    if (!token || !userId) {
        window.SwalUTN.error('Error', 'Debes iniciar sesión para agregar a lista de espera');
        return;
    }

    let cantidad = cantidadFija || 1;
    if (!sinConfirmar) {
        const result = await Swal.fire({
            title: 'Agregar a lista de espera',
            html: `<p class="text-sm text-slate-600 mb-4">Producto: <strong>${nombreProducto || 'Producto seleccionado'}</strong></p>
                   <p class="text-xs text-slate-500 mb-3">Este producto no tiene stock disponible. ¿Cuántas unidades deseas solicitar?</p>
                   <input type="number" id="swal-cantidad" class="swal2-input max-w-[120px] mx-auto text-center font-black" value="${cantidad}" min="1" max="10" step="1">`,
            showCancelButton: true,
            confirmButtonText: 'Agregar a espera',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F2A900',
            cancelButtonColor: '#64748b',
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'font-black px-5 py-2 rounded-xl',
                cancelButton: 'font-black px-5 py-2 rounded-xl'
            },
            preConfirm: () => {
                const val = document.getElementById('swal-cantidad').value;
                return parseInt(val, 10) || 1;
            }
        });
        cantidad = result.value;
    }

    if (!cantidad) return;

    try {
        const idResuelto = await window.obtenerIdParaListaEspera(itemId, tipo);
        if (!idResuelto) {
            console.warn('[ListaEspera] Item sin identificador resoluble:', { tipo, nombreProducto, itemId });
            throw new Error('No se pudo identificar el artículo para enviarlo a lista de espera. Recarga la página e inténtalo de nuevo.');
        }

        const body = {
            usuario: userId,
            cantidad_solicitada: cantidad,
            nombreProducto: nombreProducto
        };

        if (tipo === 'activo') {
            body.activo = idResuelto;
            // Compatibilidad: algunas instancias del backend aun validan `insumo` como requerido.
            body.insumo = idResuelto;
        } else {
            body.insumo = idResuelto;
        }

        const resp = await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/listaEspera`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (resp.ok) {
            if (!sinConfirmar) {
                window.SwalUTN.success('Agregado', `Has sido agregado a la lista de espera para ${cantidad} unidad(es). Te notificaremos cuando esté disponible.`);
            }
            // Recargar lista de espera si está visible
            if (window.UTNNotifs?.cargarYMostrarEspera) {
                await window.UTNNotifs.cargarYMostrarEspera();
            }
            return true;
        } else {
            const err = await resp.json();
            console.warn('[ListaEspera] Error del backend:', { status: resp.status, body, err });
            const mensajeDuplicado = [
                err.message,
                err.error
            ].filter(Boolean).join(' ').toLowerCase();

            if (mensajeDuplicado.includes('ya está') || mensajeDuplicado.includes('ya esta') || mensajeDuplicado.includes('duplicate key') || mensajeDuplicado.includes('e11000')) {
                return true;
            }

            throw new Error(err.message || 'Error al agregar');
        }
    } catch (error) {
        if (!sinConfirmar) {
            window.SwalUTN.error('Error', error.message || 'No se pudo agregar a la lista de espera');
        }
        throw error;
    }
};

window.enviarCarritoAListaEspera = async function(items = window.cart) {
    const resultados = await Promise.allSettled(items.map(item => {
        const tipo = item.type === 'activo' ? 'activo' : 'insumo';
        return window.agregarAListaEspera(item.data || item._id, item.name, {
            tipo,
            cantidad: item.quantity || 1,
            sinConfirmar: true
        });
    }));

    const agregados = resultados.filter(r => r.status === 'fulfilled').length;
    const fallidos = resultados.length - agregados;

    if (agregados > 0) {
        const msg = fallidos > 0
            ? `${agregados} artículo(s) pasaron a lista de espera. ${fallidos} ya estaban en espera o no se pudieron agregar.`
            : `${agregados} artículo(s) enviados a lista de espera.`;
        window.Utils?.showToast(msg, fallidos > 0 ? 'warning' : 'success');
    } else if (items.length > 0 && fallidos === 0) {
        window.Utils?.showToast('Los artículos ya estaban en lista de espera.', 'info');
    }

    return { agregados, fallidos };
};

// Cancelar solicitud de lista de espera
window.cancelarEspera = async function(esperaId) {
    const confirm = await window.SwalUTN.confirm('¿Cancelar solicitud?', '¿Estás seguro de que quieres cancelar esta solicitud de lista de espera?');
    if (!confirm.isConfirmed) return;

    try {
        const token = localStorage.getItem('utn_token');
        const resp = await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/listaEspera/${esperaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (resp.ok) {
            window.SwalUTN.success('Solicitud cancelada', 'Tu solicitud de lista de espera ha sido cancelada.');
            // Recargar lista de espera
            await window.UTNNotifs.cargarYMostrarEspera();
            // Cerrar dropdown
            document.getElementById('espera-dropdown').style.display = 'none';
        } else {
            throw new Error('Error al cancelar');
        }
    } catch (error) {
        window.SwalUTN.error('Error', 'No se pudo cancelar la solicitud.');
    }
};

// 3. API SERVICE
if (typeof window.ApiService === 'undefined') window.ApiService = {};

Object.assign(window.ApiService, {
    async login(credentials) {
        const res = await window.Utils.authenticatedFetch(`${window.CONFIG.API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        if (!res.ok) throw new Error('Credenciales inválidas');
        return res.json();
    },

    async getInsumos() {
        const res = await window.Utils.authenticatedFetch(`${window.CONFIG.API_BASE_URL}/insumos`);
        return res.json();
    },

    async getActivos() {
        const res = await window.Utils.authenticatedFetch(`${window.CONFIG.API_BASE_URL}/activos`);
        return res.json();
    },

    async getSolicitudes() {
        const res = await window.Utils.authenticatedFetch(`${window.CONFIG.API_BASE_URL}/solicitudes`);
        return res.json();
    },

    async getUsuarios() {
        const res = await window.Utils.authenticatedFetch(`${window.CONFIG.API_BASE_URL}/usuarios`);
        return res.json();
    },

    async getListaEspera() {
        const res = await window.Utils.authenticatedFetch(`${window.CONFIG.API_BASE_URL}/listaEspera`);
        return res.json();
    }
});

// 4. FUNCIONES DE NAVEGACIÓN Y MENÚ (ACCESIBLES GLOBALMENTE)
window.cerrarSesion = async function() {
    const ans = await window.SwalUTN.confirm('¿Cerrar sesión?', '¿Estás seguro de que quieres cerrar tu sesión?');
    if (ans.isConfirmed) {
        // Limpiar todo rastro de sesión
        localStorage.clear();
        sessionStorage.clear();
        if (window.appState) window.appState.logout();
        
        // Redirigir y forzar limpieza de historial para que no puedan volver atrás
        window.location.replace('../login.html');
    }
};

window._penalizacionActivo = false;
window._enforcePenalizacionUI = function() {
    if (!window._penalizacionActivo) return;

    document.querySelectorAll('a[href]').forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        const esMailto = href.startsWith('mailto:');
        const esLogin = href.includes('login') || href.includes('signup');
        const esHash = href === '#' || href.startsWith('javascript:');
        if (esMailto || esLogin || esHash) return;

        link.style.pointerEvents = 'none';
        link.style.opacity = '0.35';
        link.style.filter = 'grayscale(80%)';
    });

    document.querySelectorAll('button').forEach(button => {
        const onclick = (button.getAttribute('onclick') || '').toLowerCase();
        const text = (button.textContent || '').toLowerCase();
        if (onclick.includes('cerrarsesion') || text.includes('cerrar sesión') || text.includes('cerrar sesion')) return;

        button.style.pointerEvents = 'none';
        button.style.opacity = '0.35';
    });
};

window._allowedPenalizacionHref = function(href) {
    href = (href || '').toLowerCase();
    return href.startsWith('mailto:') || href.includes('login') || href.includes('signup') || href === '#' || href.startsWith('javascript:');
};

window._isSolicitudesPath = function(pathname = window.location.pathname) {
    return pathname.toLowerCase().includes('solicitudes');
};

window._setPenalizacionFlag = function(activo) {
    window._penalizacionActivo = activo;
    if (activo) {
        window._enforcePenalizacionUI();
    }
};

/**
 * Sistema de Bloqueo por Penalización - VERSIÓN RESTRICTIVA
 * Muestra un modal explicativo y obliga al usuario a cerrar sesión o enviar correo al administrador.
 */
window.verificarBloqueopenalizacion = async function() {
    try {
        const token = localStorage.getItem('utn_token');
        const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
        const apiBase = window.CONFIG?.API_BASE_URL || '/api';
        
        if (!token || !user._id) return false;

        // Obtener solicitudes del usuario
        const response = await fetch(`${apiBase}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) return false;

        const solicitudes = await response.json();
        const misSolicitudes = Array.isArray(solicitudes) ? solicitudes : [];
        
        // Verificar si hay alguna penalización activa
        const tienePenalizacion = misSolicitudes.some(s => s.estado === 'penalizado');
        window._setPenalizacionFlag(tienePenalizacion);

        // Si hay penalización, BLOQUEO TOTAL
        if (tienePenalizacion) {
            setTimeout(() => {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Cuenta bloqueada',
                        html: `
                            <div class="py-4 text-left">
                                <p class="text-sm text-slate-700 mb-3">Tu cuenta está bloqueada porque tienes una solicitud con estado <strong class="text-red-700">penalizado</strong>.</p>
                                <p class="text-xs text-slate-600 mb-4">Mientras el administrador no marque la solicitud como <strong>devuelta</strong>, no podrás acceder a otras secciones del sistema.</p>
                                <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p class="text-xs font-semibold text-red-800 uppercase mb-2">Qué debes hacer</p>
                                    <ul class="text-xs text-slate-700 space-y-2">
                                        <li>• Envía un correo al administrador explicando tu situación.</li>
                                        <li>• Espera la revisión de tu solicitud.</li>
                                        <li>• Solo podrás volver a usar el sistema cuando la penalización sea removida.</li>
                                    </ul>
                                </div>
                            </div>`,
                        confirmButtonText: 'Cerrar sesión',
                        denyButtonText: 'Enviar correo al administrador',
                        confirmButtonColor: '#dc2626',
                        denyButtonColor: '#1d4ed8',
                        showDenyButton: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        customClass: {
                            popup: 'rounded-3xl',
                            confirmButton: 'font-black px-6 py-3 rounded-xl bg-red-600 border border-red-700 text-white',
                            denyButton: 'font-black px-5 py-3 rounded-xl bg-blue-600 border border-blue-700 text-white'
                        },
                        didOpen: () => {
                            const closeBtn = document.querySelector('.swal2-close');
                            if (closeBtn) closeBtn.style.display = 'none';
                            window._enforcePenalizacionUI();
                        }
                    }).then(result => {
                        if (result.isDenied) {
                            window.location.href = 'mailto:admin@utn.edu.ar?subject=Cuenta%20bloqueada%20-%20Solicitud%20penalizada&body=Hola%20administrador,%0D%0A%0D%0ATengo%20una%20solicitud%20penalizada%20y%20necesito%20que%20se%20revise%20mi%20caso.%0D%0A%0D%0AMi%20usuario%20es%20%3Cnombre%20o%20correo%3E.%0D%0AGracias.';
                            localStorage.clear();
                            sessionStorage.clear();
                            if (window.appState) window.appState.logout();
                            window.location.replace('../login.html');
                            return;
                        }

                        localStorage.clear();
                        sessionStorage.clear();
                        if (window.appState) window.appState.logout();
                        window.location.replace('../login.html');
                    });
                }
            }, 500);
            
            return true; // Hay bloqueo
        }

        window._setPenalizacionFlag(false);
        return false; // No hay bloqueo
    } catch (e) {
        console.warn('[Penalización] Error verificando bloqueo:', e.message);
        return false;
    }
};

/**
 * Verificar si el usuario es docente esperando aprobación
 * Muestra modal bloqueante si el docente tiene estado_usuario = 'inactivo'
 */
window.verificarDocentePendiente = async function() {
    try {
        const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
        
        
        // Verificar si es docente con estado inactivo (esperando aprobación)
        if (user.tipo_rol === 'docente' && user.estado_usuario === 'inactivo') {
            window._docentePendienteActivo = true;
            window._enforceDocentePendienteUI();
            
            setTimeout(() => {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Cuenta en espera de aprobación',
                        html: `
                            <div class="py-4 text-left">
                                <p class="text-sm text-slate-700 mb-3">Hola <strong>${user.nombre_completo || 'Docente'}</strong>,</p>
                                <p class="text-sm text-slate-700 mb-3">Tu cuenta está <strong class="text-blue-700">pendiente de aprobación</strong> por parte del administrador.</p>
                                <p class="text-xs text-slate-600 mb-4">Mientras tu cuenta no sea aprobada, no podrás acceder a las funcionalidades del sistema.</p>
                                <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p class="text-xs font-semibold text-blue-800 uppercase mb-2">Qué debes hacer</p>
                                    <ul class="text-xs text-slate-700 space-y-2">
                                        <li>• Espera a que el administrador revise y apruebe tu cuenta.</li>
                                        <li>• Recibirás una notificación cuando tu cuenta sea activada.</li>
                                        <li>• Si tienes urgencia, contacta al administrador.</li>
                                    </ul>
                                </div>
                            </div>`,
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#002D62',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        backdrop: true,
                        customClass: {
                            popup: 'rounded-3xl',
                            confirmButton: 'font-black px-6 py-3 rounded-xl bg-[#002D62] border border-[#002D62] text-white'
                        },
                        didOpen: () => {
                            const closeBtn = document.querySelector('.swal2-close');
                            if (closeBtn) closeBtn.style.display = 'none';
                            window._enforceDocentePendienteUI();
                        }
                    }).then(() => {
                        window._docentePendienteActivo = false;
                        // Cerrar sesión al cerrar el modal
                        localStorage.clear();
                        sessionStorage.clear();
                        if (window.appState) window.appState.logout();
                        window.location.replace('../login.html');
                    });
                }
            }, 500);
            return true; // Hay bloqueo por aprobación pendiente
        }
        return false; // No hay bloqueo
    } catch (e) {
        console.warn('[Docente Pendiente] Error verificando:', e.message);
        return false;
    }
};

/**
 * Inicializar bloqueo de penalización y verificación de docente pendiente
 * Muestra el modal de bloqueo si el usuario está penalizado o es docente pendiente.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const paginaActual = window.location.pathname;
    const esLoginPage = paginaActual.includes('login') || paginaActual.includes('signup');

    if (!esLoginPage) {
        // Primero verificar si es docente pendiente
        const esDocentePendiente = await window.verificarDocentePendiente();
        // Si no es docente pendiente, verificar penalización
        if (!esDocentePendiente) {
            await window.verificarBloqueopenalizacion();
        }
    } else {
    }
});

/**
 * Detectar intentos de navegación hacia atrás o cambio de URL directo
 * REDIRIGE a solicitudes si intenta escapar
 */
window.addEventListener('popstate', async () => {
    const paginaActual = window.location.pathname;
    const esLoginPage = paginaActual.includes('login') || paginaActual.includes('signup');

    if (!esLoginPage) {
        await window.verificarBloqueopenalizacion();
    }
});

/**
 * Interceptar cambios de hash (#) también
 */
window.addEventListener('hashchange', async () => {
    const paginaActual = window.location.pathname;
    const esLoginPage = paginaActual.includes('login') || paginaActual.includes('signup');

    if (!esLoginPage) {
        await window.verificarBloqueopenalizacion();
    }
});


window.toggleUserMenu = function(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
        dropdown.classList.remove('hidden', 'opacity-0');
        dropdown.classList.add('opacity-100');
        dropdown.style.display = 'block';
    } else {
        dropdown.classList.add('hidden', 'opacity-0');
        dropdown.classList.remove('opacity-100');
        dropdown.style.display = 'none';
    }
};

/**
 * Interceptor de navegación para usuarios penalizados
 * REDIRIGE automáticamente si intenta ir a otro lado
 * SOLO PERMITE: Solicitudes, Logout
 */
document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href]');
    if (!link) {
        // Si es click en dropdown o notificaciones, manejar normalmente
        const dropdown = document.getElementById('user-dropdown');
        const btn = document.getElementById('user-menu-btn');
        if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.add('hidden', 'opacity-0');
            dropdown.classList.remove('opacity-100');
            dropdown.style.display = 'none';
        }
        // Cerrar también el dropdown de notificaciones
        const nd = document.getElementById('notif-dropdown');
        const nc = document.getElementById('notifContainer');
        if (nd && nc && !nc.contains(e.target)) {
            nd.style.display = 'none';
        }
        return;
    }

    // Si presionan un enlace, verificar si está penalizado
    const href = link.getAttribute('href') || '';
    const esLoginPage = href.includes('login') || href.includes('signup') || href.includes('cerrar');
    const esSolicitudes = href.includes('solicitudes');
    
    if (!esLoginPage && !esSolicitudes) {
        const bloqueado = window._penalizacionActivo ? true : await window.verificarBloqueopenalizacion();
        if (bloqueado) {
            if (!window._allowedPenalizacionHref(href)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }
}, true); // Usar capture phase para interceptar antes que otros listeners

// Cerrar el menú de usuario y el dropdown de notificaciones al hacer clic fuera
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link) return; // Si es un link, ya fue manejado arriba

    const dropdown = document.getElementById('user-dropdown');
    const btn = document.getElementById('user-menu-btn');
    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.add('hidden', 'opacity-0');
        dropdown.classList.remove('opacity-100');
        dropdown.style.display = 'none';
    }
    // Cerrar también el dropdown de notificaciones
    const nd = document.getElementById('notif-dropdown');
    const nc = document.getElementById('notifContainer');
    if (nd && nc && !nc.contains(e.target)) {
        nd.style.display = 'none';
    }
});


window.redirigirInicio = async function() {
    let user = null;
    try {
        user = window.appState?.getUser() || JSON.parse(localStorage.getItem('utn_user'));
    } catch(e) {
        user = null;
    }

    if (!user) {
        window.location.href = window.location.pathname.includes('/pages/') ? '../login.html' : 'login.html';
        return;
    }

    if (window._penalizacionActivo) {
        await window.verificarBloqueopenalizacion();
        return;
    }

    const bloqueado = await window.verificarBloqueopenalizacion();
    if (bloqueado) {
        return;
    }
    
    // Calcular rol y destino (el token siempre debería darnos rol o tipo_rol)
    const rol = (user.tipo_rol || user.rol || '').toLowerCase();
    const targetPage = (rol.includes('admin') || rol.includes('administrativo')) ? 'ModAdmis.html' : 'ModUsuarios.html';
    
    const isInsidePages = window.location.pathname.includes('/pages/');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Evitar recargar la página si ya estamos en el destino
    if (currentPage === targetPage) {
        return;
    }
    
    // Navegar de forma segura
    if (isInsidePages) {
        window.location.href = targetPage;
    } else {
        window.location.href = `pages/${targetPage}`;
    }
};

window.verImagenCompleta = function(url, titulo) {
    if (!url || url.includes('placeholder') || url === '') {
        window.SwalUTN.warning('Sin Imagen', 'Este artículo no tiene una fotografía asociada.');
        return;
    }

    // Usamos estilos EN LÍNEA para garantizar que los cambios se reflejen sin depender de caché de CSS
    const htmlContent = `
        <div style="position: relative; background: #002D62; padding: 1.5rem; text-align: center; border-bottom: 5px solid #F2A900; border-radius: 1.5rem 1.5rem 0 0;">
            <button onclick="Swal.close()" style="
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                background: #ef4444;
                color: white;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                z-index: 100;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <h3 style="color: white !important; font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin: 0; font-family: 'Inter', sans-serif;">Detalles del Artículo</h3>
        </div>
        <div style="padding: 2rem; background: white; display: flex; flex-direction: column; align-items: center; border-radius: 0 0 1.5rem 1.5rem;">
            <div style="width: 100%; height: 320px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; background: #f8fafc; border-radius: 1rem; border: 1px solid #f1f5f9; overflow: hidden;">
                <img src="${url}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
            </div>
            <h3 style="font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 2rem; text-align: center; font-family: 'Inter', sans-serif;">${titulo}</h3>
            
            <button onclick="Swal.close()" style="
                background: #F2A900 !important; 
                color: #002D62 !important; 
                font-size: 1rem !important; 
                font-weight: 900 !important; 
                text-transform: uppercase; 
                letter-spacing: 0.1em; 
                padding: 1rem 4rem !important; 
                border-radius: 1rem !important; 
                border: none !important; 
                cursor: pointer; 
                box-shadow: 0 8px 20px rgba(242, 169, 0, 0.4);
                transition: transform 0.2s ease;">
                Cerrar Vista
            </button>
        </div>
    `;

    Swal.fire({
        html: htmlContent,
        showConfirmButton: false,
        width: '500px', // Reducido de 600px para quitar la sensación de zoom
        padding: '0',
        background: 'transparent',
        showCloseButton: false,
        backdrop: 'rgba(0,45,98,0.85)',
        customClass: {
            popup: 'animate__animated animate__zoomIn animate__faster'
        }
    });
};


// 5. INICIALIZACIÓN Y EVENTOS
document.addEventListener('click', () => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden', 'opacity-0');
        dropdown.style.display = 'none';
    }
});

// Sincronización automática cuando el Header se carga dinámicamente
let isUpdating = false;

const observer = new MutationObserver((mutations) => {
    if (isUpdating) return; // Evitar bucles infinitos
    
    let shouldUpdate = false;
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            // Verificar si los nodos añadidos pertenecen a componentes que inyectamos
            mutation.addedNodes.forEach(node => {
                if (node.id === 'header-component' || node.id === 'footer-component' || 
                    (node.parentElement && (node.parentElement.id === 'header-component' || node.parentElement.id === 'footer-component'))) {
                    shouldUpdate = true;
                }
            });
        }
    });

    if (shouldUpdate) {
        isUpdating = true;
        
        // Usar un pequeño delay para asegurar que el DOM se asentó
        setTimeout(() => {
            window.Utils.updateUserInfo();
            
            // Vincular botones de inicio si aparecen
            document.querySelectorAll('#inicioBtn, .btn-inicio').forEach(btn => {
                if (!btn.onclick) btn.onclick = (e) => { e.preventDefault(); window.redirigirInicio(); };
            });
            
            isUpdating = false;
        }, 50);
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// 6. LÓGICA GLOBAL DEL CARRITO
window.cart = [];

window.addWaitlistItemToCart = function(itemName, itemType, itemData, quantity = 1, btn = null) {
    const id = itemData?._id || itemData?.id || itemData?.id_insumo || itemData?.numActivo || itemName;
    const yaEnCarrito = window.cart.find(c => c.waitlist === true && c.type === itemType && (
        (c.data?._id || c.data?.id || c.data?.id_insumo || c.data?.numActivo || c.name) === id
    ));

    if (yaEnCarrito) {
        yaEnCarrito.quantity += quantity;
    } else {
        window.cart.push({
            name: itemName,
            type: itemType,
            data: itemData,
            quantity,
            waitlist: true
        });
    }

    if (btn) window.animateFlyToCart(btn, itemData?.imagenUrl);
    window.updateCartUI();
    window.Utils?.showToast(`"${itemName}" agregado al carrito para lista de espera.`, 'success');
};

/**
 * Añadir artículo al carrito
 */
window.addToCart = async function(itemName, itemType, itemData, btn = null) {
    // Verificar si el usuario está bloqueado (solo Estudiantes)
    const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
    if (user.bloqueado === true) {
        window.Utils?.showToast('Tu cuenta tiene una restricción activa. No puedes solicitar equipos.', 'error');
        return;
    }

    // Verificar si el usuario tiene penalización activa
    const token = localStorage.getItem('utn_token');
    const apiBase = window.CONFIG?.API_BASE_URL || '/api';

    if (token && user._id) {
        try {
            const response = await fetch(`${apiBase}/solicitudes`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const solicitudes = await response.json();
                const misSolicitudes = Array.isArray(solicitudes) ? solicitudes : [];
                const tienePenalizacion = misSolicitudes.some(s => s.estado === 'penalizado');

                if (tienePenalizacion) {
                    window.Utils?.showToast('Tu cuenta tiene una restricción activa. No puedes solicitar equipos.', 'error');
                    return;
                }
            }
        } catch (e) {
            console.warn('[AddToCart] Error verificando penalización:', e.message);
        }
    }

    if (itemType === 'activo') {
        // Permitir múltiples activos del mismo tipo con cantidad
        const yaEnCarrito = window.cart.find(c => c.type === 'activo' && c.data?._id === itemData?._id);
        const qtyActual = yaEnCarrito ? yaEnCarrito.quantity : 0;
        
        // Calcular total actual en carrito
        const totalActual = window.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Verificar stock disponible del activo (si aplica)
        const cantidadActivos = Number(itemData.cantidad ?? itemData.stock);
        const estadoActivo = (itemData.estadoActivo || itemData.estado || '').toLowerCase();
        const estaDisponible = !estadoActivo || estadoActivo === 'disponible';
        const maxDisponible = estaDisponible
            ? (Number.isFinite(cantidadActivos) && cantidadActivos > 0 ? cantidadActivos : 1)
            : 0;
        const disponible = maxDisponible - qtyActual;
        
        if (disponible <= 0) {
            window.addWaitlistItemToCart(itemName, itemType, itemData, 1, btn);
            return;
        }

        const result = await Swal.fire({
            title: 'Cantidad a solicitar',
            html: `<p class="mb-2 text-sm text-slate-600">Activo: <strong>${itemName}</strong></p>
                   <p class="mb-4 text-xs text-slate-500">Disponible: ${disponible} unidad(es)</p>
                   <input type="number" id="swal-input-qty" class="swal2-input max-w-[150px] mx-auto text-center font-black" value="1" min="1" max="${disponible}" step="1">`,
            showCancelButton: true,
            confirmButtonText: 'Añadir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F2A900',
            cancelButtonColor: '#94a3b8',
            customClass: { confirmButton: 'text-[#002D62] font-black w-32 shadow-lg shadow-[#F2A900]/20', cancelButton: 'font-bold' },
            preConfirm: () => {
                const qtyStr = document.getElementById('swal-input-qty').value;
                const parseado = parseInt(qtyStr, 10);
                if (isNaN(parseado) || parseado < 1 || parseado > disponible) {
                    Swal.showValidationMessage(`Ingresa un valor entre 1 y ${disponible}`);
                }
                return parseado;
            }
        });

        if (result.isConfirmed && typeof result.value === 'number') {
            const qty = result.value;
            if (btn) window.animateFlyToCart(btn, itemData?.imagenUrl);
            
            if (yaEnCarrito) {
                yaEnCarrito.quantity += qty;
            } else {
                window.cart.push({ name: itemName, type: itemType, data: itemData, quantity: qty });
            }
            window.updateCartUI();
            window.Utils?.showToast(`Añadido(s) ${qty} activo(s) "${itemName}"`, 'success');
        }
    } else {
        // Modalidad multi-selección para Insumos
        const maxStock = itemData.cantidad !== undefined ? itemData.cantidad : (itemData.stock_actual || 0);
        const yaEnCarrito = window.cart.find(c => c.data?._id === itemData?._id);
        const qtyActual = yaEnCarrito ? yaEnCarrito.quantity : 0;
        const disponible = maxStock - qtyActual;

        if (disponible <= 0) {
            const result = await Swal.fire({
                title: 'Cantidad para lista de espera',
                html: `<p class="mb-2 text-sm text-slate-600">Insumo: <strong>${itemName}</strong></p>
                       <p class="mb-4 text-xs text-slate-500">No hay stock disponible. Puedes agregarlo al carrito para lista de espera.</p>
                       <input type="number" id="swal-input-qty" class="swal2-input max-w-[150px] mx-auto text-center font-black" value="1" min="1" max="10" step="1">`,
                showCancelButton: true,
                confirmButtonText: 'Añadir a espera',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#F2A900',
                cancelButtonColor: '#94a3b8',
                customClass: { confirmButton: 'text-[#002D62] font-black shadow-lg shadow-[#F2A900]/20', cancelButton: 'font-bold' },
                preConfirm: () => {
                    const parseado = parseInt(document.getElementById('swal-input-qty').value, 10);
                    if (isNaN(parseado) || parseado < 1 || parseado > 10) {
                        Swal.showValidationMessage('Ingresa un valor entre 1 y 10');
                    }
                    return parseado;
                }
            });

            if (result.isConfirmed && typeof result.value === 'number') {
                window.addWaitlistItemToCart(itemName, itemType, itemData, result.value, btn);
            }
            return;
        }

        const result = await Swal.fire({
            title: 'Cantidad a solicitar',
            html: `<p class="mb-4 text-sm text-slate-600">Stock disponible para solicitar: <strong>${disponible}</strong></p>
                   <input type="number" id="swal-input-qty" class="swal2-input max-w-[150px] mx-auto text-center font-black" value="1" min="1" max="${disponible}" step="1">`,
            showCancelButton: true,
            confirmButtonText: 'Añadir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F2A900',
            cancelButtonColor: '#94a3b8',
            customClass: { confirmButton: 'text-[#002D62] font-black w-32 shadow-lg shadow-[#F2A900]/20', cancelButton: 'font-bold' },
            preConfirm: () => {
                const qtyStr = document.getElementById('swal-input-qty').value;
                const parseado = parseInt(qtyStr, 10);
                if (isNaN(parseado) || parseado < 1 || parseado > disponible) {
                    Swal.showValidationMessage(`Ingresa un valor entre 1 y ${disponible}`);
                }
                return parseado;
            }
        });

        if (result.isConfirmed && typeof result.value === 'number') {
            const qty = result.value;
            if (btn) window.animateFlyToCart(btn, itemData?.imagenUrl);
            
            if (yaEnCarrito) {
                yaEnCarrito.quantity += qty;
            } else {
                window.cart.push({ name: itemName, type: itemType, data: itemData, quantity: qty });
            }
            window.updateCartUI();
            window.Utils?.showToast(`Añadido(s) ${qty} unidad(es)`, 'success');
        }
    }
};

/**
 * Animación de vuelo al carrito
 */
window.animateFlyToCart = function(btn, imgUrl = null) {
    const cartIcon = document.getElementById('cartBtn');
    if (!cartIcon) return;

    const flyItem = document.createElement('div');
    flyItem.className = 'fly-item';
    
    const hasImg = window.isValidCatalogImage?.(imgUrl);
    flyItem.innerHTML = hasImg 
        ? `<img src="${imgUrl}" class="w-full h-full object-cover rounded-full border border-white shadow-sm">`
        : `<svg class="w-5 h-5 text-[#002D62]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>`;
    
    const btnRect = btn.getBoundingClientRect();
    flyItem.style.left = `${btnRect.left + (btnRect.width / 2) - 20}px`;
    flyItem.style.top = `${btnRect.top + (btnRect.height / 2) - 20}px`;
    
    document.body.appendChild(flyItem);
    flyItem.offsetHeight;

    const cartRect = cartIcon.getBoundingClientRect();
    flyItem.style.left = `${cartRect.left + (cartRect.width / 2) - 20}px`;
    flyItem.style.top = `${cartRect.top + (cartRect.height / 2) - 20}px`;
    flyItem.style.width = '40px';
    flyItem.style.height = '40px';
    flyItem.style.opacity = '0';
    flyItem.style.transform = 'scale(0.2) rotate(45deg)';

    setTimeout(() => {
        flyItem.remove();
        cartIcon.classList.add('scale-110', 'bg-white/30');
        setTimeout(() => cartIcon.classList.remove('scale-110', 'bg-white/30'), 300);
    }, 800);
};

window.isValidCatalogImage = function(url) {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();
    return clean.length > 10 && !clean.includes('placeholder') && !clean.includes('undefined') && !clean.includes('null');
};

/**
 * Actualizar Interfaz del Carrito
 */
window.updateCartUI = function() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    // Calcular total sumando cantidades de todos los items
    const totalCantidad = window.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCount) cartCount.textContent = totalCantidad;
    if (!cartItems || !cartTotal) return;

    if (window.cart.length === 0) {
        cartItems.innerHTML = `
            <div class="py-10 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </div>
                <p class="text-slate-400 text-sm font-medium">El carrito está vacío</p>
            </div>`;
        cartTotal.textContent = '0';
        return;
    }

    cartItems.innerHTML = '';
    window.cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm animate-fade-in-up';
        
        const imgUrl = item.data?.imagenUrl || '';
        const hasImg = window.isValidCatalogImage(imgUrl);
        
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                    ${hasImg ? `<img src="${imgUrl.trim()}" class="w-full h-full object-contain" onerror="this.remove()">` : `<svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`}
                </div>
                <div>
                    <h4 class="font-bold text-sm text-slate-800 line-clamp-1">${item.name}</h4>
                    <p class="text-[10px] uppercase font-black tracking-widest ${item.waitlist ? 'text-amber-600' : 'text-[#F2A900]'}">${item.waitlist ? 'Lista de Espera' : (item.type === 'activo' ? 'Activo' : 'Insumo Digital')}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button onclick="window.decreaseQuantity(${index})" class="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors text-slate-600">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
                    </button>
                    <span class="w-8 text-center text-xs font-bold text-slate-700">${item.quantity}</span>
                    <button onclick="window.increaseQuantity(${index})" class="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors text-slate-600">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </button>
                </div>
                <button onclick="window.removeFromCart(${index})" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>`;
        cartItems.appendChild(div);
    });

    cartTotal.textContent = totalCantidad;
};

window.removeFromCart = function(index) {
    window.cart.splice(index, 1);
    window.updateCartUI();
};

window.increaseQuantity = function(index) {
    const item = window.cart[index];
    if (item.waitlist) {
        if (item.quantity < 10) {
            item.quantity++;
            window.updateCartUI();
        } else {
            window.Utils?.showToast('Máximo 10 unidades en lista de espera', 'warning');
        }
        return;
    }

    if (item.type !== 'activo') {
        const maxStock = item.data.cantidad !== undefined ? item.data.cantidad : (item.data.stock_actual || 0);
        if (item.quantity < maxStock) {
            item.quantity++;
            window.updateCartUI();
        } else {
            window.Utils?.showToast('Límite de stock alcanzado para este insumo', 'warning');
        }
    } else {
        window.Utils?.showToast('Los activos se solicitan individualmente', 'info');
    }
};

window.decreaseQuantity = function(index) {
    if (window.cart[index].quantity > 1) {
        window.cart[index].quantity--;
    } else {
        window.cart.splice(index, 1);
    }
    window.updateCartUI();
};

window.clearCart = function() {
    window.cart = [];
    window.updateCartUI();
};

window.openCartModal = function() {
    if (window._penalizacionActivo) {
        window.SwalUTN?.warning('Restricción activa', 'No puedes usar el carrito mientras tu cuenta está penalizada.');
        return;
    }

    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.add('open');
        window.updateCartUI();
    }
};

window.closeCartModal = function() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.classList.remove('open');
};

/**
 * Enviar Solicitud (Lógica Unificada)
 */
window.sendRequest = async function() {
    if (window.cart.length === 0) {
        window.Utils?.showToast('El carrito está vacío.', 'warning');
        return;
    }

    // Verificar si el usuario tiene penalización activa
    const token = localStorage.getItem('utn_token');
    const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
    const apiBase = window.CONFIG?.API_BASE_URL || '/api';

    if (token && user._id) {
        try {
            const response = await fetch(`${apiBase}/solicitudes`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const solicitudes = await response.json();
                const misSolicitudes = Array.isArray(solicitudes) ? solicitudes : [];
                const tienePenalizacion = misSolicitudes.some(s => s.estado === 'penalizado');

                if (tienePenalizacion) {
                    window.Utils?.showToast('Tu cuenta tiene una restricción activa. No puedes solicitar equipos.', 'error');
                    return;
                }
            }
        } catch (e) {
            console.warn('[SendRequest] Error verificando penalización:', e.message);
        }
    }

    const motivo = document.getElementById('solicitud-motivo')?.value?.trim();
    const observaciones = document.getElementById('solicitud-observaciones')?.value?.trim();

    if (!motivo) {
        window.Utils?.showToast('Por favor indica el motivo del préstamo.', 'warning');
        document.getElementById('solicitud-motivo')?.focus();
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
        const token = localStorage.getItem('utn_token');
        const waitlistItems = window.cart.filter(i => i.waitlist === true);
        const requestItems = window.cart.filter(i => i.waitlist !== true);

        if (requestItems.length === 0) {
            const resultadoEspera = await window.enviarCarritoAListaEspera(waitlistItems);
            if (resultadoEspera.agregados > 0 || resultadoEspera.fallidos === 0) {
                window.clearCart();
                window.closeCartModal();
                setTimeout(() => {
                    window.location.href = 'solicitudes.html?tab=lista-espera';
                }, 1500);
                return;
            }
            throw new Error('No se pudieron enviar los artículos a lista de espera.');
        }

        // SOLUCIÓN: Enviar array de IDs simples (strings) que el modelo puede castear a ObjectId
        const activos = requestItems.filter(i => i.type === 'activo').map(i => {
            const idActivo = i.data._id || i.data.id || i._id;
            if (!idActivo) {
                throw new Error(`El activo "${i.name}" no tiene ID. Recarga la página y agrégalo de nuevo.`);
            }
            return idActivo; // Solo el string ID
        });

        const insumos = requestItems.filter(i => i.type !== 'activo').map(i => {
            // Extraer el ID del insumo - puede estar en _id o id_insumo
            const idInsumo = i.data._id || i.data.id_insumo || i.data.id;
            if (!idInsumo) {
                console.error('Insumo sin ID:', i);
                throw new Error(`El insumo "${i.name}" no tiene un ID válido. Por favor, quítalo del carrito y agrégalo nuevamente.`);
            }
            return {
                id_insumo: idInsumo,
                cantidad: i.quantity || 1,
                nombre_insumo: i.name
            };
        });

        // Asegurar que activos sea un array limpio
        const activosArray = Array.isArray(activos) ? activos : [];
        const insumosArray = Array.isArray(insumos) ? insumos : [];
        

        const data = {
            usuario_solicitante: user.nombre_completo || user.nombre || 'Usuario',
            correo_solicitante: user.correo_electronico || user.email || 'usuario@example.com',
            activos: activosArray,
            insumos: insumosArray,
            observaciones: motivo,
            comentario_estudiante: observaciones,
            fecha_prestamo: new Date()
        };


        // Asegurar serialización correcta sin replacer que pueda causar problemas
        const jsonData = JSON.stringify(data);
        

        const res = await fetch(`${window.CONFIG?.API_BASE_URL}/solicitudes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: jsonData
        });


        const err = await res.json().catch(() => ({}));

        if (res.ok || (res.status === 409 && err.message && err.message.includes('lista de espera'))) {
            if (waitlistItems.length > 0 && typeof window.enviarCarritoAListaEspera === 'function') {
                await window.enviarCarritoAListaEspera(waitlistItems);
            }
            window.Utils?.showToast(err.message || '¡Solicitud enviada con éxito!', 'success');
            window.clearCart();
            window.closeCartModal();
            setTimeout(() => {
                window.location.href = waitlistItems.length > 0 ? 'solicitudes.html?tab=lista-espera' : 'solicitudes.html';
            }, 1500);
        } else {
            const mensajeError = [
                err.message,
                err.detalles,
                err.error
            ].filter(Boolean).join(' ').toLowerCase();
            const debePasarAEspera = [
                'disponible',
                'stock',
                'lista de espera',
                'insuficiente',
                'prestado',
                'duplicate key',
                'e11000'
            ].some(texto => mensajeError.includes(texto));

            if (debePasarAEspera && typeof window.enviarCarritoAListaEspera === 'function') {
                const resultadoEspera = await window.enviarCarritoAListaEspera(window.cart);
                if (resultadoEspera.agregados > 0) {
                    window.clearCart();
                    window.closeCartModal();
                    setTimeout(() => {
                        window.location.href = 'solicitudes.html?tab=lista-espera';
                    }, 1500);
                    return;
                }
            }

            console.error(' Error detallado:', {
                status: res.status,
                statusText: res.statusText,
                errorData: err,
                dataSent: data
            });
            throw new Error(err.message || `Error ${res.status}: ${res.statusText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        window.Utils?.showToast(error.message, 'error');
    }
};

// FORZAR OVERRIDE - Asegurar que esta sea la única función sendRequest usada
window.sendRequest = window.sendRequest;
