import os

# Carácter a reemplazar (em dash)
LONG_DASH = '\u2014'
# Reemplazo (hyphen)
FINE_DASH = '-'

files_to_clean = [
    'frontend/pages/ModUsuarios.html',
    'frontend/pages/ModAdmis.html',
    'frontend/pages/solicitudes.html',
    'frontend/pages/perfil.html',
    'frontend/pages/inventario.html',
    'frontend/pages/activos.html',
    'frontend/pages/insumos.html',
    'frontend/pages/mis-prestamos.html',
    'frontend/login.html'
]

base_path = 'c:/Users/madmu/Downloads/Prestamos/PrestamosInventarioIEE/'

for rel_path in files_to_clean:
    full_path = os.path.join(base_path, rel_path)
    if not os.path.exists(full_path):
        continue
        
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if LONG_DASH in content:
            # Reemplazamos los guiones largos por guiones normales con espacios si es necesario
            # o simplemente el carácter
            new_content = content.replace(LONG_DASH, FINE_DASH)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated dashes in {rel_path}")
    except Exception as e:
        print(f"Error in {rel_path}: {e}")
