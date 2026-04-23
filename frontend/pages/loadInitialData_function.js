// Función para cargar datos iniciales - AGREGAR ESTA FUNCIÓN A ModAdmis.html
async function loadInitialData() {
    
    const grid = document.getElementById('itemsGrid');
    if (!grid) {
        return;
    }
    
    // Mostrar mensaje de bienvenida para el panel de administración
    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="text-6xl mb-4"></div>
            <h3 class="text-2xl font-bold text-slate-800 mb-2">Panel de Administración</h3>
            <p class="text-lg text-slate-600 mb-4">Bienvenido al sistema de gestión</p>
            <div class="flex justify-center gap-4">
                <div class="bg-blue-50 p-4 rounded-lg text-center max-w-xs">
                    <div class="text-3xl mb-2"></div>
                    <p class="font-medium text-blue-800">Activos</p>
                    <p class="text-sm text-blue-600">Gestionar equipos</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg text-center max-w-xs">
                    <div class="text-3xl mb-2"></div>
                    <p class="font-medium text-green-800">Insumos</p>
                    <p class="text-sm text-green-600">Control materiales</p>
                </div>
            </div>
        </div>
    `;
    
}
