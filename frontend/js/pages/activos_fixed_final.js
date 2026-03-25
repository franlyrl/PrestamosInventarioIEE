// Controlador simple de Activos
console.log('🚀 Cargando activos.js...');

class ActivosController {
    constructor() {
        this.activos = [];
        this.filtros = {
            busqueda: '',
            categoria: 'todas',
            estado: 'todos'
        };
    }

    async initialize() {
        console.log('🚀 Inicializando ActivosController...');
        this.setupEventListeners();
        console.log('✅ ActivosController inicializado correctamente');
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        const agregarMasivoBtn = document.getElementById('agregar-masivo-btn');
        console.log('🔍 Botón agregar masivo encontrado:', !!agregarMasivoBtn);

        if (agregarMasivoBtn) {
            agregarMasivoBtn.addEventListener('click', () => {
                console.log('📦 Click en botón agregar masivo');
                if (typeof window.abrirModalMasivo === 'function') {
                    window.abrirModalMasivo();
                } else {
                    console.error('❌ Función abrirModalMasivo no disponible');
                }
            });
            console.log('✅ Event listener agregado al botón agregar masivo');
        }
    }
}

// Crear instancia global
window.activosController = new ActivosController();
console.log('✅ ActivosController creado y asignado a window');
