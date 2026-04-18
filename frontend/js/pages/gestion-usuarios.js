const API = window.CONFIG?.API_BASE_URL || 'http://localhost:4000/api';
let todosLosUsuarios = [];

function getToken() { return localStorage.getItem('utn_token'); }
function authHeaders() { return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }; }

document.addEventListener('DOMContentLoaded', async () => {
    const token = getToken();
    const user = JSON.parse(localStorage.getItem('utn_user') || 'null');
    const rol = (user?.tipo_rol || user?.rol || '').toLowerCase();
    
    if (!token || !user || (!rol.includes('admin') && !rol.includes('administrativo'))) {
        window.location.href = '../login.html';
        return;
    }

    await cargarUsuarios();
    setupFiltros();
    verificarDocentesPendientes(); // Verificar notificaciones
});

async function cargarUsuarios() {
    showLoading(true);
    try {
        const res = await fetch(`${API}/usuarios`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        
        let data = await res.json();
        // Handle search API format if used
        if (data.data && data.data.usuarios) data = data.data.usuarios;
        
        todosLosUsuarios = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Error cargando usuarios:', e);
        mostrarToast('Error al cargar la lista de usuarios. Verifica tu conexión.', 'error');
    }
    showLoading(false);
    renderUsuarios();
}

function showLoading(show) {
    document.getElementById('loadingState').classList.toggle('hidden', !show);
}

// ----- PAGINACIÓN Y RENDER -----
let currentPage = 1;
const itemsPerPage = 24;

function setupFiltros() {
    document.getElementById('busquedaInput')?.addEventListener('input', () => renderUsuarios(1));
    document.getElementById('rolFiltro')?.addEventListener('change', () => renderUsuarios(1));
}

function limpiarFiltros() {
    document.getElementById('busquedaInput').value = '';
    document.getElementById('rolFiltro').value = '';
    renderUsuarios(1);
}

function filtrarUsuarios() {
    const q = (document.getElementById('busquedaInput')?.value || '').toLowerCase();
    const rol = document.getElementById('rolFiltro')?.value || '';

    return todosLosUsuarios.filter(u => {
        const texto = [(u.nombre_completo||''),(u.cedula||''),(u.correo_electronico||'')].join(' ').toLowerCase();
        if (q && !texto.includes(q)) return false;
        if (rol && u.tipo_rol !== rol) return false;
        return true;
    });
}

function renderUsuarios(page = 1) {
    currentPage = page;
    const grid = document.getElementById('usuariosGrid');
    const container = document.getElementById('paginationContainer');
    const count = document.getElementById('totalCount');
    
    const filtrados = filtrarUsuarios();
    count.textContent = filtrados.length;

    if (filtrados.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400">No se encontraron usuarios.</div>';
        container.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filtrados.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filtrados.slice(start, start + itemsPerPage);

    grid.innerHTML = paginatedItems.map((u, i) => buildUserCard(u, i)).join('');
    setupPaginationList(totalPages, container);
}

function buildUserCard(u, i) {
    const rolBadges = {
        'admin': 'bg-red-50 text-red-600 border border-red-200',
        'operador': 'bg-purple-50 text-purple-600 border border-purple-200',
        'administrativo': 'bg-purple-50 text-purple-600 border border-purple-200',
        'docente': 'bg-blue-50 text-blue-600 border border-blue-200',
        'estudiante': 'bg-slate-100 text-slate-600 border border-slate-200'
    };
    
    const estadoBadges = {
        'activo': 'bg-emerald-50 text-emerald-600',
        'inactivo': 'bg-slate-100 text-slate-500',
        'sancionado': 'bg-red-100 text-red-700'
    };

    const rolClass = rolBadges[u.tipo_rol] || rolBadges['estudiante'];
    const estadoClass = estadoBadges[u.estado || u.estado_usuario] || estadoBadges['inactivo'];
    // Default empty array if permisos isn't loaded correctly in getUsuarios
    const permisosText = (u.permisos && u.permisos.length > 0) ? u.permisos.join(', ') : 'Ninguno';
    const isOperador = u.tipo_rol === 'operador' || u.tipo_rol === 'administrativo';

    return `
    <div class="item-card p-5 fade-up flex flex-col" style="animation-delay:${i * 30}ms">
        <div class="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
            <div class="flex-1 min-w-0 pr-2">
                <h3 class="font-black text-slate-800 truncate">${u.nombre_completo || 'Sin Nombre'}</h3>
                <p class="text-xs text-slate-400 font-mono mt-0.5 truncate">${u.correo_electronico || '-'}</p>
                <p class="text-[10px] uppercase font-bold text-slate-300 mt-1">Cédula: ${u.cedula || '-'}</p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
                <span class="badge ${rolClass} uppercase text-[9px] tracking-wider">${u.tipo_rol || 'Estudiante'}</span>
                <span class="badge ${estadoClass} uppercase text-[9px] tracking-wider">${u.estado || u.estado_usuario || 'Inactivo'}</span>
            </div>
        </div>
        ${isOperador ? `<div class="bg-blue-50 rounded-lg p-2 mb-3"><p class="text-[10px] font-black text-[#002D62] uppercase tracking-wide">Permisos:</p><p class="text-xs text-blue-800 line-clamp-2">${permisosText}</p></div>` : ''}
        <div class="mt-auto pt-2 grid grid-cols-2 gap-2">
            <button onclick="abrirModalRoles('${u._id}')" class="w-full py-2 bg-slate-50 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-100 transition border border-slate-200">Rol y Permisos</button>
            <button onclick="window.location.href='perfil.html?userId=${u._id}'" class="w-full py-2 bg-[#002D62]/5 text-[#002D62] rounded-lg font-bold text-xs hover:bg-[#002D62]/10 transition">Ver Perfil</button>
        </div>
    </div>`;
}

function setupPaginationList(totalPages, container) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = `<button onclick="renderUsuarios(${currentPage - 1})" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 font-bold text-sm bg-white hover:bg-slate-50 disabled:opacity-30" ${currentPage === 1 ? 'disabled' : ''}>Ant</button>`;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button onclick="renderUsuarios(${i})" class="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition ${i === currentPage ? 'bg-[#002D62] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">${i}</button>`;
    }
    
    html += `<button onclick="renderUsuarios(${currentPage + 1})" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 font-bold text-sm bg-white hover:bg-slate-50 disabled:opacity-30" ${currentPage === totalPages ? 'disabled' : ''}>Sig</button>`;
    container.innerHTML = html;
}

// ----- MODAL ROLES Y PERMISOS -----

async function abrirModalRoles(id) {
    // Buscar detalles actualizados si necesitamos permisos (el getUsuarios básico de tu backend excluye permisos a menos que lo agregues, o usamos la información existente si se incluyó)
    // Para asegurar, llamamos GET /:id
    const userRow = todosLosUsuarios.find(u => u._id === id);
    if (!userRow) return;

    try {
        const res = await fetch(`${API}/usuarios/${id}`, { headers: authHeaders() });
        const userDetalle = res.ok ? await res.json() : userRow;
        
        document.getElementById('editUserId').value = userDetalle._id;
        document.getElementById('modalUserName').textContent = userDetalle.nombre_completo;
        document.getElementById('userEmail').value = userDetalle.correo_electronico;
        
        const rolSelect = document.getElementById('userRol');
        rolSelect.value = userDetalle.tipo_rol || 'estudiante';
        
        // Cargar estado del usuario
        const estadoSelect = document.getElementById('userEstado');
        if (estadoSelect) {
            estadoSelect.value = userDetalle.estado || userDetalle.estado_usuario || 'activo';
        }
        
        // Reset checkboxes
        document.querySelectorAll('input[name="permiso"]').forEach(chk => chk.checked = false);
        
        // Check permissions
        if (userDetalle.permisos && Array.isArray(userDetalle.permisos)) {
            userDetalle.permisos.forEach(permiso => {
                const checkbox = document.querySelector(`input[name="permiso"][value="${permiso}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        togglePermisosSection();
        
        const modal = document.getElementById('modalRoles');
        const box = document.getElementById('modalRolesBox');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        box.classList.remove('scale-95');
        
    } catch(err) {
        mostrarToast('Error al obtener los detalles del usuario', 'error');
    }
}

function cerrarModalRoles() {
    const modal = document.getElementById('modalRoles');
    const box = document.getElementById('modalRolesBox');
    box.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('opacity-0', 'pointer-events-none');
    }, 150);
}

function togglePermisosSection() {
    const rol = document.getElementById('userRol').value;
    const section = document.getElementById('permisosSection');
    // Only 'operador' (and perhaps 'administrativo') needs specific permissions
    if (rol === 'operador' || rol === 'administrativo') {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
        document.querySelectorAll('input[name="permiso"]').forEach(chk => chk.checked = false);
    }
}

async function guardarRolesPermisos(event) {
    event.preventDefault();
    const id = document.getElementById('editUserId').value;
    const tipo_rol = document.getElementById('userRol').value;
    const estado = document.getElementById('userEstado')?.value || 'activo';
    
    // Recolectar permisos
    const permisos = [];
    if (tipo_rol === 'operador' || tipo_rol === 'administrativo') {
        document.querySelectorAll('input[name="permiso"]:checked').forEach(chk => {
            permisos.push(chk.value);
        });
    }

    const btnGuardar = document.getElementById('btnGuardar');
    const txtOriginal = btnGuardar.textContent;
    btnGuardar.innerHTML = `<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>`;
    btnGuardar.disabled = true;

    try {
        const res = await fetch(`${API}/usuarios/${id}/permisos`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ tipo_rol, permisos, estado })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Error al actualizar usuario');
        
        mostrarToast(data.message || 'Usuario actualizado con éxito', 'success');
        cerrarModalRoles();
        await cargarUsuarios(); // Refrescar lista
        
    } catch (e) {
        mostrarToast(e.message, 'error');
    } finally {
        btnGuardar.textContent = txtOriginal;
        btnGuardar.disabled = false;
    }
}

// ----- FUNCIONES CSV DOCENTES -----
function abrirModalCSV() {
    document.getElementById('modalCSV').classList.remove('hidden');
    document.getElementById('modalCSV').classList.add('flex');
}

function cerrarModalCSV() {
    document.getElementById('modalCSV').classList.add('hidden');
    document.getElementById('modalCSV').classList.remove('flex');
    document.getElementById('csvFile').value = '';
}

async function procesarCSV() {
    const fileInput = document.getElementById('csvFile');
    const btnProcesar = document.getElementById('btnProcesarCSV');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        mostrarToast('Selecciona un archivo CSV', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const txtOriginal = btnProcesar.textContent;
    btnProcesar.innerHTML = `<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>`;
    btnProcesar.disabled = true;
    
    try {
        const texto = await file.text();
        const lineas = texto.split(/\r?\n/).filter(l => l.trim());
        
        if (lineas.length < 2) {
            throw new Error('El archivo CSV debe tener al menos una fila de datos');
        }
        
        // Parsear CSV (formato: Nombre Completo, Cedula, Correo, Estado)
        const actualizaciones = [];
        const errores = [];
        
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            
            // Saltar líneas vacías
            if (!linea) continue;
            
            // Detectar separador: coma o punto y coma
            let separador = linea.includes(';') ? ';' : ',';
            let campos = linea.split(separador).map(c => c.trim()).filter(c => c);
            
            // Saltar encabezado (si contiene palabras clave)
            const lineaLower = linea.toLowerCase();
            if (lineaLower.includes('nombre') && lineaLower.includes('correo')) {
                console.log(`Fila ${i + 1}: Saltando encabezado`);
                continue;
            }
            
            // Detectar automáticamente posición de datos (buscar correo con @)
            let nombre, cedula, correo, estado;
            
            // Encontrar índice del correo (campo con @)
            let correoIdx = campos.findIndex(c => c.includes('@'));
            
            if (correoIdx === -1) {
                errores.push(`Fila ${i + 1}: no se encontró correo válido`);
                continue;
            }
            
            // Asignar valores basados en posición del correo
            correo = campos[correoIdx];
            cedula = campos[correoIdx - 1] || '';  // Antes del correo
            nombre = campos[correoIdx - 2] || '';   // Dos antes del correo
            estado = campos[correoIdx + 1] || 'activo'; // Después del correo (default: activo)
            
            // Si no hay nombre, usar campo anterior a cédula si existe
            if (!nombre && correoIdx >= 3) {
                nombre = campos.slice(0, correoIdx - 1).join(' ');
            }
            
            // Debug
            console.log(`Fila ${i + 1}:`, { nombre, cedula, correo, estado });
            
            // Validar correo
            if (!correo || !correo.includes('@')) {
                errores.push(`Fila ${i + 1}: correo inválido "${correo}"`);
                continue;
            }
            
            const correoLower = correo.toLowerCase();
            if (!correoLower.endsWith('@utn.ac.cr') || correoLower.endsWith('@est.utn.ac.cr')) {
                errores.push(`Fila ${i + 1}: "${correo}" no es correo de docente (debe ser @utn.ac.cr)`);
                continue;
            }
            
            // Validar estado (si viene en el CSV)
            const estadoNormalizado = estado ? estado.toLowerCase().trim() : 'activo';
            if (!['activo', 'inactivo'].includes(estadoNormalizado)) {
                errores.push(`Fila ${i + 1}: estado "${estado}" no válido (debe ser "activo" o "inactivo")`);
                continue;
            }
            
            actualizaciones.push({ nombre, cedula, correo: correoLower, estado: estadoNormalizado });
        }
        
        if (actualizaciones.length === 0) {
            const msgErrores = errores.slice(0, 5).join('\n');
            throw new Error(`No hay registros válidos para procesar.\n\nErrores encontrados:\n${msgErrores}${errores.length > 5 ? '\n... y ' + (errores.length - 5) + ' errores más' : ''}`);
        }
        
        // Enviar al backend
        const res = await fetch(`${API}/usuarios/actualizar-csv`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ actualizaciones })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Error al procesar CSV');
        
        let msg = `${data.actualizados || 0} docentes actualizados correctamente`;
        if (data.noEncontrados > 0) msg += `, ${data.noEncontrados} no encontrados`;
        if (errores.length > 0) msg += `. ${errores.length} filas con errores.`;
        
        mostrarToast(msg, 'success');
        cerrarModalCSV();
        await cargarUsuarios(); // Refrescar lista
        
        if (errores.length > 0) {
            console.warn('Errores en filas ignoradas:', errores);
        }
        
    } catch (e) {
        mostrarToast(e.message, 'error');
    } finally {
        btnProcesar.textContent = txtOriginal;
        btnProcesar.disabled = false;
    }
}

// ----- NOTIFICACIONES DE DOCENTES PENDIENTES -----

async function verificarDocentesPendientes() {
    try {
        const res = await fetch(`${API}/usuarios/pendientes-aprobacion`, {
            headers: authHeaders()
        });
        
        if (!res.ok) return; // Silencioso si hay error
        
        const data = await res.json();
        const notificacion = document.getElementById('notificacionPendientes');
        const contador = document.getElementById('contadorPendientes');
        const lista = document.getElementById('listaDocentesPendientes');
        
        if (data.count > 0) {
            notificacion.classList.remove('hidden');
            contador.textContent = data.count;
            
            // Mostrar lista de docentes pendientes (máximo 3)
            const docentesMostrar = data.docentes.slice(0, 3);
            lista.innerHTML = docentesMostrar.map(d => `
                <div class="flex items-center justify-between bg-white/50 rounded-lg p-2 text-sm">
                    <div>
                        <span class="font-semibold text-slate-700">${d.nombre || 'Sin nombre'}</span>
                        <span class="text-slate-500">- ${d.correo_electronico}</span>
                    </div>
                    <button onclick="abrirModalRoles('${d._id}')" class="text-[#002D62] hover:underline font-medium">Aprobar</button>
                </div>
            `).join('');
            
            if (data.docentes.length > 3) {
                lista.innerHTML += `<p class="text-xs text-orange-600 mt-1">Y ${data.docentes.length - 3} más...</p>`;
            }
            
            // Mostrar toast si hay nuevos pendientes (solo una vez por sesión)
            if (!sessionStorage.getItem('notificacionDocentesMostrada')) {
                mostrarToast(`${data.count} docente(s) esperando aprobación`, 'warning');
                sessionStorage.setItem('notificacionDocentesMostrada', 'true');
            }
        } else {
            notificacion.classList.add('hidden');
        }
        
    } catch (e) {
        console.error('Error verificando docentes pendientes:', e);
    }
}

function filtrarDocentesPendientes() {
    // Limpiar búsqueda actual
    document.getElementById('busquedaInput').value = '';
    // Seleccionar filtro de docentes
    document.getElementById('rolFiltro').value = 'docente';
    // Aplicar filtros
    aplicarFiltros();
    // Mostrar toast
    mostrarToast('Mostrando docentes. Busca los de estado "Inactivo"', 'info');
}
