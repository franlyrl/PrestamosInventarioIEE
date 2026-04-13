import os

def find_replacement_chars(directory):
    affected_files = []
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(('.html', '.js', '.css', '.md')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if '' in content:
                            count = content.count('')
                            affected_files.append((path, count))
                except Exception as e:
                    pass
    return affected_files

files = find_replacement_chars('c:/Users/madmu/Downloads/Prestamos/PrestamosInventarioIEE/frontend')
for f, c in files:
    print(f"{f}: {c} occurrences")
