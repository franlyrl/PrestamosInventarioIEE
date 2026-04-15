import os
import re

# Carácter problemático UTF-8
BAD_CHAR = '\ufffd'

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

def clean_content(content):
    # 1. Fix Titles and Meta
    content = content.replace(f'UTN SPIEE {BAD_CHAR} Portal', 'UTN SPIEE — Portal')
    content = content.replace(f'préstamo {BAD_CHAR} UTN', 'préstamo — UTN')
    
    # 2. Fix placeholders in HTML elements
    # Matches <tag id="...">BAD_CHAR</tag>
    content = re.sub(fr'>\s*{BAD_CHAR}\s*<', '>-<', content)
    
    # 3. Fix list items / bullets
    content = content.replace(f'{BAD_CHAR} ', '— ')
    
    # 4. Fix comments with long sequences
    content = re.sub(fr'{BAD_CHAR}{{2,}}', lambda m: '-' * len(m.group(0)), content)
    
    # 5. Generic cleanup: any remaining single BAD_CHAR within text or comments
    # If it's between letters, use a dash or space
    content = content.replace(BAD_CHAR, '—')
    
    return content

base_path = 'c:/Users/madmu/Downloads/Prestamos/PrestamosInventarioIEE/'

for rel_path in files_to_clean:
    full_path = os.path.join(base_path, rel_path)
    if not os.path.exists(full_path):
        print(f"Skipping {rel_path} (not found)")
        continue
        
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if BAD_CHAR in content:
            new_content = clean_content(content)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Cleaned {rel_path}")
        else:
            print(f"No issues found in {rel_path}")
    except Exception as e:
        print(f"Error cleaning {rel_path}: {e}")
