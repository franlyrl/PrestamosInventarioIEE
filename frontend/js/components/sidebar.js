// Controlador del Sidebar
class SidebarComponent {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.render();
        this.startStatusUpdates();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page || 'index';
    }

    render() {
        const sidebar = document.getElementById('sidebar-component');
        if (!sidebar) return;

        // El sidebar ya está en el HTML, solo necesitamos actualizar el estado activo
        this.updateActiveNavigation();
    }

    updateActiveNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const page = link.dataset.page;
            
            if (page === this.currentPage) {
                link.classList.add('active');
                link.classList.remove('text-slate-600');
            } else {
                link.classList.remove('active');
                link.classList.add('text-slate-600');
            }
        });
    }

    startStatusUpdates() {
        // Actualizar estado del sistema cada minuto
        this.updateSystemStatus();
        setInterval(() => this.updateSystemStatus(), 60000);
    }

    updateSystemStatus() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            const now = new Date();
            const minutes = Math.floor((Date.now() - now) / 60000);
            
            if (minutes === 0) {
                lastUpdateElement.textContent = 'Actualizado ahora';
            } else if (minutes === 1) {
                lastUpdateElement.textContent = 'Actualizado hace 1 min';
            } else {
                lastUpdateElement.textContent = `Actualizado hace ${minutes} min`;
            }
        }
    }

    // Acciones rápidas
    setupQuickActions() {
        const nuevaSolicitudBtn = document.querySelector('button:has-text("Nueva Solicitud")');
        const listaEsperaBtn = document.querySelector('button:has-text("Ver Lista de Espera")');
        const generarReporteBtn = document.querySelector('button:has-text("Generar Reporte")');

        if (nuevaSolicitudBtn) {
            nuevaSolicitudBtn.addEventListener('click', () => {
                window.location.href = 'solicitudes.html';
            });
        }

        if (listaEsperaBtn) {
            listaEsperaBtn.addEventListener('click', () => {
                window.location.href = 'solicitudes.html?tab=lista-espera';
            });
        }

        if (generarReporteBtn) {
            generarReporteBtn.addEventListener('click', () => {
                window.location.href = 'reportes.html';
            });
        }
    }
}

// Crear instancia global
window.sidebarComponent = new SidebarComponent();

// Auto-render cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.sidebarComponent.render();
    window.sidebarComponent.setupQuickActions();
});
