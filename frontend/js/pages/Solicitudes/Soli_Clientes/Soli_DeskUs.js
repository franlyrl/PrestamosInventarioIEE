/**
* Controlador Desktop para Usuarios (Docentes y Estudiantes)
* Maneja la lógica específica para usuarios no administradores
* Depende de solicitudes.js para funciones compartidas
*/

// Asegurar que solicitudes.js está cargado
if (typeof window.solicitudesController === 'undefined') {
console.warn('Soli_DeskUs.js: solicitudes.js no está cargado, cargándolo...');
const script = document.createElement('script');
script.src = '../js/pages/solicitudes.js';
script.onload = () => {
console.log('Soli_DeskUs.js: solicitudes.js cargado');
initDesktopUserController();
};
document.head.appendChild(script);
} else {
initDesktopUserController();
}

function initDesktopUserController() {
console.log('Soli_DeskUs.js: Inicializando con solicitudes.js disponible');
}

class DesktopUserController {
constructor() {
this.solicitudes = [];
this.container = null;
this.tbody = null;
this.filters = {
estado: 'todos',
busqueda: '',
fechaDesde: '',
fechaHasta: ''
};
this.init();
}

init() {
console.log('🖥️ Inicializando DesktopUserController...');
this.setupContainer();
this.setupEventListeners();
this.loadUserSolicitudes();
}

setupContainer() {
// Buscar tbody principal o crear uno si no existe
this.tbody = document.getElementById('solicitudes-tbody') || 
document.getElementById('solicitudes-tbody-desktop') ||
document.querySelector('tbody[id*="solicitudes"]');
if (!this.tbody) {
console.error('No se encontró ningún tbody de solicitudes, creando uno...');
// Crear tbody si no existe
const table = document.querySelector('table') || document.createElement('table');
table.className = 'w-full';
if (!table.querySelector('thead')) {
table.innerHTML = `
<thead>
<tr class="bg-slate-100">
<th class="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
<th class="px-4 py-3 text-left font-semibold text-slate-700">Usuario</th>
<th class="px-4 py-3 text-left font-semibold text-slate-700">Elementos</th>
<th class="px-4 py-3 text-left font-semibold text-slate-700">Fecha</th>
<th class="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
<th class="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
</tr>
</thead>
<tbody id="solicitudes-tbody"></tbody>
`;
}
this.tbody = table.querySelector('tbody');
// Agregar la tabla al contenedor principal si no está en el DOM
const mainContainer = document.getElementById('desktop-container') || 
document.querySelector('.container') ||
document.body;
if (!table.parentNode) {
mainContainer.appendChild(table);
}
}
console.log('Tbody encontrado/creado:', this.tbody.id);
}

setupEventListeners() {
// Filtro de estado
const estadoFilter = document.getElementById('estado-filter');
if (estadoFilter) {
estadoFilter.addEventListener('change', (e) => {
this.filters.estado = e.target.value;
this.applyFilters();
});
}

// Botones de búsqueda
const buscarBtn = document.getElementById('buscar-btn');
const limpiarBtn = document.getElementById('limpiar-btn');
if (buscarBtn) {
buscarBtn.addEventListener('click', () => {
this.loadUserSolicitudes();
});
}
if (limpiarBtn) {
limpiarBtn.addEventListener('click', () => {
this.clearFilters();
});
}

// Botón refrescar
const refrescarBtn = document.getElementById('btn-refrescar');
if (refrescarBtn) {
refrescarBtn.addEventListener('click', () => {
this.loadUserSolicitudes();
});
}
}

async loadUserSolicitudes() {
try {
console.log('Cargando solicitudes del usuario...');
const userData = localStorage.getItem('utn_user');
const currentUser = JSON.parse(userData);
if (!currentUser) {
throw new Error('No hay usuario autenticado');
}

console.log('Datos completos del usuario:', currentUser);
console.log('Campos disponibles:', Object.keys(currentUser));

// Usar la misma URL que solicitudes.html
const token = localStorage.getItem('utn_token');
console.log('Token disponible:', !!token);
// URL principal corregida para localhost
const apiUrl = 'http://localhost:4000/api/solicitudes';
console.log('URL completa:', apiUrl);
const response = await fetch(apiUrl, {
headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json'
}
});
console.log('Respuesta completa:', {
status: response.status,
statusText: response.statusText,
ok: response.ok,
headers: Object.fromEntries(response.headers.entries())
});
if (!response.ok) {
const errorText = await response.text();
console.log('Error response body:', errorText);
throw new Error(`Error ${response.status}: ${response.statusText}`);
}
const data = await response.json();
console.log('Datos recibidos del API:', data);
console.log('Tipo de datos recibidos:', typeof data);
console.log('¿Es array?', Array.isArray(data));
// Extraer el array de solicitudes
let todasLasSolicitudes = Array.isArray(data) ? data : (data.solicitudes || data.data || []);
console.log('Total de solicitudes en BD:', todasLasSolicitudes.length);
// Filtrar por usuario actual (como lo hace solicitudes.html)
const nombreUsuario = currentUser.nombre_completo || currentUser.nombre || '';
const emailUsuario = currentUser.email || currentUser.correo_electronico || currentUser.correo || '';
console.log('Filtrando por usuario:', { nombreUsuario, emailUsuario });
this.solicitudes = todasLasSolicitudes.filter(solicitud => {
// Verificar si la solicitud pertenece al usuario actual
const solicitudUsuario = solicitud.usuario?.nombre_completo || solicitud.usuario?.nombre || '';
const solicitudEmail = solicitud.usuario?.email || solicitud.usuario?.correo_electronico || solicitud.usuario?.correo || '';
return solicitudUsuario === nombreUsuario || solicitudEmail === emailUsuario;
});
console.log('Solicitudes filtradas para este usuario:', this.solicitudes.length);
if (this.solicitudes.length > 0) {
console.log('Primer solicitud encontrada:', this.solicitudes[0]);
}
} catch (error) {
console.error('Error cargando solicitudes desde API:', error);
this.showError('Error al cargar las solicitudes: ' + error.message);
return;
}
// Renderizar y actualizar estadísticas solo si tenemos datos reales
this.renderSolicitudes();
this.updateStatistics();
console.log('Renderizado completado con datos reales');
}

renderSolicitudes() {
if (!this.tbody) {
console.error('No se encontró el tbody');
return;
}

console.log(`Renderizando ${this.solicitudes.length} solicitudes en el DOM...`);
// Limpiar tbody completamente
this.tbody.innerHTML = '';

if (this.solicitudes.length === 0) {
this.tbody.innerHTML = `
<tr>
<td colspan="6" class="text-center py-8 text-slate-500">
No tienes solicitudes registradas
</td>
</tr>
`;
console.log('Estado vacío mostrado');
return;
}

// Renderizar todas las solicitudes
const todasLasFilas = this.solicitudes.map((solicitud, index) => {
const rowHTML = this.createSolicitudRow(solicitud);
console.log(`Creando fila ${index + 1}: ${solicitud._id?.slice(-6)}`);
return rowHTML;
}).join('');

// Insertar todas las filas de una vez
this.tbody.innerHTML = todasLasFilas;

console.log(`Filas insertadas en DOM. Total de elementos en tbody: ${this.tbody.children.length}`);
// Verificar que las filas sean visibles
setTimeout(() => {
const filasVisibles = this.tbody.querySelectorAll('tr').length;
console.log(`Verificación: ${filasVisibles} filas visibles en el DOM`);
// Forzar visibilidad si es necesario
if (filasVisibles > 0) {
this.tbody.style.display = '';
this.tbody.style.visibility = '';
console.log('Tbody hecho visible');
}
}, 100);
}

createSolicitudRow(solicitud) {
const usuario = JSON.parse(localStorage.getItem('utn_user'));
const rol = usuario?.rol || usuario?.rol_nombre || 'estudiante';
const rolText = rol.toLowerCase();
const esEstudiante = rolText.includes('estudiante');
const esDocente = rolText.includes('docente') || rolText.includes('profesor');
// Determinar colores según rol
let rolColor = '#10b981'; // Verde para estudiantes
let rolBgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
let rolIcono = '🎓';
if (esDocente) {
rolColor = '#f59e0b'; // Naranja para docentes
rolBgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
rolIcono = '👨‍🏫';
}

return `
<tr class="hover:bg-slate-50 border-b">
<td class="px-4 py-3 font-mono text-sm">#${solicitud._id?.slice(-6)}</td>
<td class="px-4 py-3 font-medium">${solicitud.usuario?.nombre_completo || 'Usuario'}</td>
<td class="px-4 py-3 text-sm">${this.getElementosInfo(solicitud)}</td>
<td class="px-4 py-3 text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</td>
<td class="px-4 py-3">${this.formatEstado(solicitud.estado)}</td>
<td class="px-4 py-3">
<div class="relative">
<button 
onclick="window.desktopUserController.toggleMenu('${solicitud._id}')" 
class="p-2 rounded-lg transition-all duration-200 hover:scale-110"
style="background: ${rolBgGradient}; color: white; box-shadow: 0 2px 8px ${rolColor}40;">
⋮
</button>
<div id="menu-${solicitud._id}" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2" style="border-color: ${rolColor}; z-index: 1000;">
<!-- Encabezado del menú -->
<div class="menu-header" style="background: ${rolBgGradient}; color: white; padding: 12px; border-radius: 8px 8px 0 0;">
<div class="flex items-center gap-2">
<span class="text-lg">${rolIcono}</span>
<div>
<div class="font-bold text-xs">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
<div class="text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
</div>
</div>
</div>
<!-- Acciones según rol y estado -->
<div class="p-2">
${this.createActionsForRole(solicitud, esEstudiante, esDocente, rolColor)}
</div>
</div>
</div>
</td>
</tr>
`;
}

createActionsForRole(solicitud, esEstudiante, esDocente, rolColor) {
const estado = solicitud.estado;
let actions = [];

// Acción Ver (siempre disponible)
actions.push(`
<button onclick="window.desktopUserController.verSolicitud('${solicitud._id}')" 
class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
style="color: ${rolColor}; hover: background-color: ${rolColor}15;">
👁️ Ver Detalles
</button>
`);

// Acciones según rol y estado
if (esEstudiante || esDocente) {
if (estado === 'pendiente') {
actions.push(`
<button onclick="window.desktopUserController.editarSolicitud('${solicitud._id}')" 
class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
style="color: ${rolColor}; hover: background-color: ${rolColor}15;">
✏️ Editar Solicitud
</button>
`);
}
if (estado === 'pendiente' || estado === 'aprobada') {
actions.push(`
<button onclick="window.desktopUserController.cancelarSolicitud('${solicitud._id}')" 
class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
style="color: ${rolColor}; hover: background-color:#004a8c ${rolColor}15;">
<span style="opacity: 0.8;">×</span> Cancelar Solicitud
</button>
`);
}
}

return actions.join('');
}

createSolicitudRow(solicitud) {
const usuario = JSON.parse(localStorage.getItem('utn_user'));
const rol = usuario?.rol || usuario?.rol_nombre || 'estudiante';
const rolText = rol.toLowerCase();
const esEstudiante = rolText.includes('estudiante');
const esDocente = rolText.includes('docente') || rolText.includes('profesor');
// Determinar colores según rol
        let rolColor = '#000000'; // Negro para todos
        let rolBgGradient = 'linear-gradient(135deg, rgba(229, 220, 220, 0) 0%, rgba(132, 128, 128, 0) 100%)';
        let rolIcono = '🎓';
        
        if (esDocente) {
            rolColor = '#000000'; // Negro también para docentes
            rolBgGradient = 'linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(51, 51, 51, 0) 100%)';
            rolIcono = '👨‍🏫';
        }

        return `
            <tr class="hover:bg-slate-50 border-b">
                <td class="px-4 py-3 font-mono text-sm">#${solicitud._id?.slice(-6)}</td>
                <td class="px-4 py-3 font-medium">${solicitud.usuario?.nombre_completo || 'Usuario'}</td>
                <td class="px-4 py-3 text-sm">${this.getElementosInfo(solicitud)}</td>
                <td class="px-4 py-3 text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</td>
                <td class="px-4 py-3">${this.formatEstado(solicitud.estado)}</td>
                <td class="px-4 py-3">
                    <div class="relative">
                        <button 
                            onclick="window.desktopUserController.toggleMenu('${solicitud._id}')" 
                            class="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                            style="background: ${rolBgGradient}; color: black; box-shadow: 0 2px 8px ${rolColor}40;">
                            ⋮
                        </button>
                        <div id="menu-${solicitud._id}" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2" style="border-color: #000000; z-index: 1000;">
                            <!-- Encabezado del menú -->
                            <div class="menu-header" style="background: ${rolBgGradient}; color: #004a8c; padding: 12px; border-radius: 8px 8px 0 0;">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">${rolIcono}</span>
                                    <div>
                                        <div class="font-bold text-xs" style="color: #004a8c;">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                                        <div class="text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Acciones según rol y estado -->
                            <div class="p-2">
                                ${this.createActionsForRole(solicitud, esEstudiante, esDocente, rolColor)}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    updateStatistics() {
        const stats = {
            pendientes: this.solicitudes.filter(s => s.estado === 'pendiente').length,
            aprobadas: this.solicitudes.filter(s => s.estado === 'aprobada').length,
            entregadas: this.solicitudes.filter(s => s.estado === 'entregado').length,
            devueltas: this.solicitudes.filter(s => s.estado === 'devuelto').length
        };

        // Actualizar contadores desktop
        const pendientesCount = document.getElementById('pendientes-count');
        const aprobadasCount = document.getElementById('aprobadas-count');
        const entregadasCount = document.getElementById('entregadas-count');
        const devueltasCount = document.getElementById('devueltas-count');
        const totalCount = document.getElementById('total-solicitudes');

        if (pendientesCount) pendientesCount.textContent = stats.pendientes;
        if (aprobadasCount) aprobadasCount.textContent = stats.aprobadas;
        if (entregadasCount) entregadasCount.textContent = stats.entregadas;
        if (devueltasCount) devueltasCount.textContent = stats.devueltas;
        if (totalCount) totalCount.textContent = this.solicitudes.length;

        // Actualizar contadores mobile
        const pendientesMobile = document.getElementById('pendientes-count-mobile');
        const aprobadasMobile = document.getElementById('aprobadas-count-mobile');
        const entregadasMobile = document.getElementById('entregadas-count-mobile');
        const devueltasMobile = document.getElementById('devueltas-count-mobile');

        if (pendientesMobile) pendientesMobile.textContent = stats.pendientes;
        if (aprobadasMobile) aprobadasMobile.textContent = stats.aprobadas;
        if (entregadasMobile) entregadasMobile.textContent = stats.entregadas;
        if (devueltasMobile) devueltasMobile.textContent = stats.devueltas;
    }

    applyFilters() {
        const filas = this.tbody.querySelectorAll('tr');
        let filasVisibles = 0;

        filas.forEach(fila => {
            let mostrarFila = true;

            // Filtrar por estado
            if (this.filters.estado !== 'todos') {
                const estadoElement = fila.querySelector('td:nth-child(5) span');
                if (estadoElement) {
                    const estadoTexto = estadoElement.textContent.toLowerCase();
                    if (!estadoTexto.includes(this.filters.estado)) {
                        mostrarFila = false;
                    }
                }
            }

            // Filtrar por búsqueda
            if (this.filters.busqueda && mostrarFila) {
                const textoFila = fila.textContent.toLowerCase();
                if (!textoFila.includes(this.filters.busqueda.toLowerCase())) {
                    mostrarFila = false;
                }
            }

            fila.style.display = mostrarFila ? '' : 'none';
            if (mostrarFila) filasVisibles++;
        });

        // Actualizar contador
        const resultadosCount = document.getElementById('resultados-count');
        if (resultadosCount) resultadosCount.textContent = filasVisibles;
    }

    clearFilters() {
        this.filters = {
            estado: 'todos',
            busqueda: '',
            fechaDesde: '',
            fechaHasta: ''
        };

        const estadoFilter = document.getElementById('estado-filter');
        if (estadoFilter) estadoFilter.value = 'todos';

        this.applyFilters();
        this.showToast('🧹 Filtros limpiados', 'success');
    }

    toggleMenu(solicitudId) {
        const menu = document.getElementById(`menu-${solicitudId}`);
        const allMenus = document.querySelectorAll('[id^="menu-"]');

        // Cerrar otros menús
        allMenus.forEach(m => {
            if (m.id !== `menu-${solicitudId}`) {
                m.classList.add('hidden');
            }
        });

        // Toggle menú actual
        menu.classList.toggle('hidden');
    }

    verSolicitud(solicitudId) {
        console.log('👁️ Ver solicitud:', solicitudId);
        // Buscar la solicitud en los datos
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            this.showToast('Solicitud no encontrada', 'error');
            return;
        }
        
        // Crear modal con detalles
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-800">Detalles de Solicitud</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700">ID Solicitud</label>
                            <p class="text-slate-900 font-mono">#${solicitud._id?.slice(-6) || 'N/A'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Estado</label>
                            <div class="mt-1">
                                ${this.formatEstado(solicitud.estado)}
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Fecha</label>
                            <p class="text-slate-900">${new Date(solicitud.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Usuario</label>
                            <p class="text-slate-900">${solicitud.usuario?.nombre_completo || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Elementos Solicitados</label>
                        <div class="space-y-2">
                            ${this.getElementosInfo(solicitud)}
                        </div>
                    </div>
                    ${solicitud.observaciones ? `
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                        <p class="text-slate-900 bg-slate-50 p-3 rounded-lg">${solicitud.observaciones}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    editarSolicitud(solicitudId) {
        console.log('✏️ Editar solicitud:', solicitudId);
        // Buscar la solicitud en los datos
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            this.showToast('Solicitud no encontrada', 'error');
            return;
        }
        
        // Solo permitir editar si está en estado pendiente
        if (solicitud.estado !== 'pendiente') {
            this.showToast('Solo se pueden editar solicitudes en estado pendiente', 'warning');
            return;
        }
        
        // Crear modal de edición
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-800">Editar Solicitud</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="editForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">ID Solicitud</label>
                        <input type="text" value="#${solicitud._id?.slice(-6)}" readonly 
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                        <textarea id="observaciones" rows="4" 
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Agrega observaciones adicionales...">${solicitud.observaciones || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Elementos Solicitados</label>
                        <div class="space-y-2">
                            ${this.getElementosInfo(solicitud)}
                        </div>
                    </div>
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="window.desktopUserController.guardarEdicion('${solicitudId}')" 
                            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Guardar Cambios
                        </button>
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                            class="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    cancelarSolicitud(solicitudId) {
        console.log(' ❌ Cancelar solicitud:', solicitudId);
        // Buscar la solicitud en los datos
        const solicitud = this.solicitudes.find(s => s._id === solicitudId);
        if (!solicitud) {
            this.showToast('Solicitud no encontrada', 'error');
            return;
        }
        
        // Solo permitir cancelar si está en estado pendiente o aprobada
        if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'aprobada') {
            this.showToast('Solo se pueden cancelar solicitudes en estado pendiente o aprobada', 'warning');
            return;
        }
        
        if (!confirm(`¿Estás seguro de que quieres cancelar la solicitud #${solicitud._id?.slice(-6)}? Esta acción no se puede deshacer.`)) {
            return;
        }
        
        // Intentar cancelar en la API
        this.actualizarSolicitudAPI(solicitudId, { estado: 'cancelada' })
            .then(() => {
                // Actualizar estado localmente
                const solicitudIndex = this.solicitudes.findIndex(s => s._id === solicitudId);
                if (solicitudIndex !== -1) {
                    this.solicitudes[solicitudIndex].estado = 'cancelada';
                    this.renderSolicitudes();
                    this.updateStatistics();
                    this.showToast('Solicitud cancelada correctamente', 'success');
                }
            })
            .catch(error => {
                console.error('Error cancelando solicitud:', error);
                this.showToast('Error al cancelar la solicitud', 'error');
            });
    }

    guardarEdicion(solicitudId) {
        console.log('Guardando edicion:', solicitudId);
        const observaciones = document.getElementById('observaciones').value;
        // Actualizar la solicitud localmente primero
        const solicitudIndex = this.solicitudes.findIndex(s => s._id === solicitudId);
        if (solicitudIndex !== -1) {
            this.solicitudes[solicitudIndex].observaciones = observaciones;
        }
        // Intentar guardar en la base de datos
        this.actualizarSolicitudAPI(solicitudId, { observaciones })
            .then(() => {
                this.renderSolicitudes();
                this.showToast('Solicitud actualizada correctamente', 'success');
            })
            .catch(error => {
                console.error('Error guardando en API:', error);
                this.showToast('Error al guardar en la base de datos, pero los cambios se muestran localmente', 'warning');
                this.renderSolicitudes();
            });
        // Cerrar modal
        document.querySelector('.fixed').remove();
    }

    async actualizarSolicitudAPI(solicitudId, datosActualizados) {
        try {
            const token = localStorage.getItem('utn_token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            // Usar localhost para consistencia
            const response = await fetch(`http://localhost:4000/api/solicitudes/${solicitudId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Solicitud actualizada en API:', data);
            return data;

        } catch (error) {
            console.error('Error en API:', error);
            throw error;
        }
    }

    getElementosInfo(solicitud) {
        const elementos = [];
        let totalCantidad = 0;
        
        if (solicitud.insumos && solicitud.insumos.length > 0) {
            solicitud.insumos.forEach(insumo => {
                const nombre = insumo.id_insumo?.NombProducto || insumo.descripcion || 'Insumo';
                const cantidad = insumo.cantidad || 1;
                elementos.push(`${nombre} (${cantidad})`);
                totalCantidad += cantidad;
            });
        }
        
        if (solicitud.activos && solicitud.activos.length > 0) {
            solicitud.activos.forEach(activo => {
                elementos.push(`${activo.nombre || 'Activo'}`);
                totalCantidad += 1;
            });
        }
        
        if (elementos.length === 0) {
            return '<span class="text-slate-400 italic">Sin elementos</span>';
        }
        
        // Formato profesional: lista con total al final
        const elementosHtml = elementos.map((elemento, index) => {
            const esUltimo = index === elementos.length - 1;
            return `<span class="text-slate-700">${elemento}${esUltimo ? '' : ', '}</span>`;
        }).join('');
        
        return `
            <div class="space-y-1">
                <div class="text-sm">${elementosHtml}</div>
                <div class="text-xs text-slate-500 font-medium">
                    Total: ${totalCantidad} ${totalCantidad === 1 ? 'elemento' : 'elementos'}
                </div>
            </div>
        `;
    }

    formatEstado(estado) {
        const estados = {
            'pendiente': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Pendiente</span>',
            'aprobada': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Aprobada</span>',
            'rechazada': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">🚫 Rechazada</span>',
            'entregado': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">📦 Entregado</span>',
            'devuelto': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">🔄 Devuelto</span>',
            'cancelada': '<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">❌ Cancelada</span>'
        };
        return estados[estado] || `<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${estado}</span>`;
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Usar showToast de solicitudes.js si está disponible
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
        } else if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // Fallback propio
            console.log(`Toast (${type}): ${message}`);
            const toast = document.getElementById('toast');
            if (toast) {
                const toastMsg = document.getElementById('toastMsg');
                if (toastMsg) toastMsg.textContent = message;
                toast.classList.remove('opacity-0', 'translate-y-20');
                toast.classList.add('opacity-100', 'translate-y-0');
                setTimeout(() => {
                    toast.classList.add('opacity-0', 'translate-y-20');
                    toast.classList.remove('opacity-100', 'translate-y-0');
                }, 3000);
            }
        }
    }
}

// Hacer disponible globalmente
window.desktopUserController = new DesktopUserController();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Soli_DeskUs.js: DOM listo, verificando condiciones...');
    
    // Esperar a que solicitudes.js esté cargado
    setTimeout(() => {
        console.log('Soli_DeskUs.js: Iniciando verificación...');
        
        // Verificar ancho de pantalla
        const isDesktop = window.innerWidth >= 768;
        console.log('Soli_DeskUs.js: Ancho de pantalla:', window.innerWidth, 'Desktop:', isDesktop);
        
        if (!isDesktop) {
            console.log('Soli_DeskUs.js: No es desktop, saliendo');
            return;
        }
        
        // Verificar usuario
        const userData = localStorage.getItem('utn_user');
        console.log('Soli_DeskUs.js: Datos de usuario encontrados:', !!userData);
        
        if (!userData) {
            console.log('Soli_DeskUs.js: No hay datos de usuario, saliendo');
            return;
        }
        
        const currentUser = JSON.parse(userData);
        const rol = currentUser?.rol || currentUser?.rol_nombre || '';
        const rolText = rol.toLowerCase();
        
        console.log('Soli_DeskUs.js: Rol del usuario:', rol, 'Texto:', rolText);
        
        // Verificar si es administrador
        const esAdmin = rolText.includes('admin') || rolText.includes('administrador');
        console.log('Soli_DeskUs.js: Es administrador:', esAdmin);
        
        if (esAdmin) {
            console.log('Soli_DeskUs.js: Usuario es administrador, no se inicia controlador desktop');
            return;
        }
        
        console.log('Soli_DeskUs.js: Todas las condiciones cumplidas, iniciando controlador desktop...');
        
        // Forzar renderizado después de cargar
        setTimeout(() => {
            console.log('Soli_DeskUs.js: Verificando si se cargaron datos...');
            console.log('Soli_DeskUs.js: Solicitudes cargadas:', window.desktopUserController.solicitudes.length);
            
            if (window.desktopUserController.solicitudes.length === 0) {
                console.log('Soli_DeskUs.js: No se cargaron datos, renderizando estado vacío...');
            }
            
            window.desktopUserController.renderSolicitudes();
            console.log('Soli_DeskUs.js: Renderizado completado');
        }, 1000); // Dar más tiempo para la carga del API
        
        console.log('Soli_DeskUs.js: DesktopUserController inicializado completamente');
        
    }, 500); // Mayor retraso para asegurar que todo esté cargado
});
