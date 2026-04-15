path = 'c:/Users/madmu/Downloads/Prestamos/PrestamosInventarioIEE/frontend/pages/ModUsuarios.html'
with open(path, 'rb') as f:
    data = f.read()

# Inspect first 1000 bytes for non-ascii and find their hex values
print(f"Total size: {len(data)} bytes")
for i, b in enumerate(data[:2000]):
    if b > 127:
        print(f"Byte at {i}: 0x{b:02x} ('{chr(b)}' in latin-1)")
