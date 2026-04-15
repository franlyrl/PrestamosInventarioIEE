/**
 * UTN SPIEE - Cargador de Componentes Centralizado
 * - Garantiza que el header y footer carguen en TODAS las páginas.
 * - Inyecta SweetAlert2 automáticamente.
 * - Sincroniza nombre e iniciales del usuario.
 */

// Configuración de SweetAlert movida a main.js para disponibilidad global

// ── 3. Actualizar nombre e iniciales del usuario ────────────────────────────
function syncUserInHeader() {
    try {
        const raw = localStorage.getItem('utn_user');
        if (!raw) return;
        const user = JSON.parse(raw);
        const nombre = user.nombre_completo || user.nombre || 'Usuario';
        const rol = user.rol ? (user.rol.charAt(0).toUpperCase() + user.rol.slice(1)) : 'Estudiante';

        // Calcular iniciales (máx 2 letras)
        const partes = nombre.trim().split(/\s+/);
        const iniciales = partes.length >= 2
            ? (partes[0][0] + partes[1][0]).toUpperCase()
            : (partes[0][0] || 'U').toUpperCase();

        // Aplicar a todos los elementos del header/perfil
        document.querySelectorAll('#userMenuName').forEach(el => el.textContent = nombre);
        document.querySelectorAll('#dropdownUserName').forEach(el => el.textContent = nombre);
        document.querySelectorAll('#dropdownUserRole').forEach(el => el.textContent = rol);
        document.querySelectorAll('#userInfo').forEach(el => el.textContent = nombre);
        document.querySelectorAll('#profile-name').forEach(el => el.textContent = nombre);
        document.querySelectorAll('#profile-role').forEach(el => el.textContent = rol);
        document.querySelectorAll('#profile-email').forEach(el => el.textContent = user.correo_electronico || user.email || '');

        // INICIALES en el avatar del header y perfil
        document.querySelectorAll('.user-initials').forEach(el => {
            el.textContent = iniciales;
        });
        // ── Mostrar / ocultar enlaces del menú según rol ──────────────────────
        const rolRaw = (user.tipo_rol || user.rol || '').toLowerCase();
        if (rolRaw.includes('admin') || rolRaw.includes('administrativo')) {
            document.querySelectorAll('#navInventarioLink, #navAdminLink').forEach(el => el?.classList.remove('hidden'));
        } else {
            document.querySelectorAll('#navSolicitudesLink, #navPrestamosLink').forEach(el => el?.classList.remove('hidden'));
        }
    } catch(e) {
        console.warn('[COMPONENTS] No se pudo sincronizar usuario:', e);
    }
}

// ── 4. Cargar Header y Footer ───────────────────────────────────────────────
window.loadComponents = async function() {
    try {
        const headerEl = document.getElementById('header-component');
        const footerEl = document.getElementById('footer-component');

        if (headerEl && !headerEl.innerHTML.trim()) {
            const res = await fetch('../components/header.html');
            headerEl.innerHTML = await res.text();
            // Garantizar que la barra azul sea sticky en cualquier página
            headerEl.className = 'sticky top-0 z-[100] w-full block shadow-md';
        }
        if (footerEl && !footerEl.innerHTML.trim()) {
            const res = await fetch('../components/footer.html');
            footerEl.innerHTML = await res.text();
        }

        // Inyectar Carrito solo en páginas donde se pueden agregar artículos
        const allowedPages = ['activos.html', 'insumos.html', 'ModUsuarios.html', 'estudiante-dashboard.html'];
        const currentPage = window.location.pathname.split('/').pop();
        const user = JSON.parse(localStorage.getItem('utn_user') || '{}');
        const userRol = (user.rol || '').toLowerCase();
        const isEstudiante = userRol.includes('estudiante');
        const isDocente = userRol.includes('docente') || userRol.includes('profesor');
        const isAdmin = ['admin', 'administrador', 'administrativo'].some(r => userRol.includes(r));

        // El carrito solo se carga si es estudiante o docente (no admin) y está en una página permitida
        const shouldLoadCart = (isEstudiante || isDocente) && allowedPages.includes(currentPage);

        if (shouldLoadCart) {
            let cartContainer = document.getElementById('cart-container');
            if (!cartContainer) {
                cartContainer = document.createElement('div');
                cartContainer.id = 'cart-container';
                document.body.appendChild(cartContainer);
            }
            
            if (!cartContainer.innerHTML.trim()) {
                try {
                    const res = await fetch('../components/cart.html');
                    if (res.ok) {
                        cartContainer.innerHTML = await res.text();
                        console.log('[COMPONENTS] Carrito inyectado con éxito');
                    }
                } catch (cartErr) {
                    console.warn('[COMPONENTS] No se pudo cargar el carrito:', cartErr);
                }
            }
        } else {
            // Limpiar si existía (por navegación SPA si hubiera, aunque aquí es MPA)
            document.getElementById('cart-container')?.remove();
        }

        // Pequeño delay para asegurar que el DOM del header esté listo
        setTimeout(syncUserInHeader, 100);

    } catch(e) {
        console.error('[COMPONENTS] Error cargando componentes:', e);
    }
};

// Auto-cargar
document.addEventListener('DOMContentLoaded', window.loadComponents);

// El cierre de sesión se maneja globalmente en main.js mediante la función window.cerrarSesion
