// Funcionalidad para manejo de imágenes en insumos

// Función global para el menú
window.toggleUserMenu = function() {
    console.log('toggleUserMenu() llamada desde insumos.html');
    
    const userDropdown = document.getElementById('user-dropdown');
    if (!userDropdown) {
        console.log('ERROR: No se encontró el dropdown');
        return;
    }
    
    if (userDropdown.classList.contains('hidden')) {
        // Mostrar dropdown
        userDropdown.classList.remove('hidden');
        userDropdown.classList.remove('opacity-0');
        userDropdown.classList.add('opacity-100');
        
        // Estilos inline para forzar visibilidad
        userDropdown.style.display = 'block';
        userDropdown.style.visibility = 'visible';
        userDropdown.style.opacity = '1';
        userDropdown.style.pointerEvents = 'auto';
        
        console.log('Menú abierto - estilos inline aplicados');
    } else {
        // Ocultar dropdown
        userDropdown.classList.add('hidden');
        userDropdown.classList.add('opacity-0');
        userDropdown.classList.remove('opacity-100');
        
        // Estilos inline para ocultar
        userDropdown.style.display = 'none';
        userDropdown.style.visibility = 'hidden';
        userDropdown.style.opacity = '0';
        userDropdown.style.pointerEvents = 'none';
        
        console.log('Menú cerrado');
    }
};

// Función para subir imagen
window.subirImagen = async function(file) {
    if (!file) return null;
    
    try {
        const formData = new FormData();
        formData.append('imagen', file);
        
        const token = localStorage.getItem('utn_token');
        const response = await fetch(`${window.CONFIG.API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Imagen subida:', data);
            return data.imageUrl; // URL de la imagen subida
        } else {
            console.error('❌ Error al subir imagen:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('❌ Error en la subida de imagen:', error);
        return null;
    }
};

// Vista previa de imagen
document.addEventListener('DOMContentLoaded', function() {
    const imagenInput = document.getElementById('imagen-manual');
    const imagenModalInput = document.getElementById('imagenInsumoModal');
    const previewDiv = document.getElementById('imagen-preview');
    const previewModalDiv = document.getElementById('imagenPreviewModal');
    const previewImg = previewDiv?.querySelector('img');
    const previewModalImg = previewModalDiv?.querySelector('img');
    
    // Vista previa para imagen manual
    if (imagenInput && previewDiv && previewImg) {
        imagenInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    previewDiv.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                previewDiv.classList.add('hidden');
            }
        });
    }
    
    // Vista previa para imagen del modal
    if (imagenModalInput && previewModalDiv && previewModalImg) {
        imagenModalInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewModalImg.src = e.target.result;
                    previewModalDiv.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                previewModalDiv.classList.add('hidden');
            }
        });
    }
});
