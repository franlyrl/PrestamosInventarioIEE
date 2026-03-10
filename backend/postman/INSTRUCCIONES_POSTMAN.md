# COPIA ESTE TEXTO Y PÉGALO EN POSTMAN

## Importación Manual:

1. Abre Postman
2. Crea una nueva colección llamada "PrestamosInventarioIEE"
3. Para cada petición, haz clic en "Add Request" y copia:

### 1. Login:
- Method: POST
- URL: http://localhost:4000/api/usuarios/login
- Body: raw → JSON
```json
{
    "correo_electronico": "ashla@utn.ac.cr",
    "contrasena": "uttntutututut"
}
```

### 2. Crear Insumo con Imagen:
- Method: POST
- URL: http://localhost:4000/api/insumos
- Headers: Authorization → Bearer TU_TOKEN
- Body: raw → JSON
```json
{
    "id_insumo": 2001,
    "NombProducto": "Resistencia 10k Ohm 1/4W",
    "cantidad": 500,
    "caracteristicas": "Resistencia de carbón 5% tolerancia 1/4 de vatios",
    "categoria": "Componentes Analógicos",
    "imagenUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format"
}
```

### 3. Creación Masiva:
- Method: POST
- URL: http://localhost:4000/api/insumos/bulk
- Headers: Authorization → Bearer TU_TOKEN
- Body: raw → JSON
```json
[
    {
        "id_insumo": 2002,
        "NombProducto": "Capacitor Electrolítico 100uF 25V",
        "cantidad": 200,
        "caracteristicas": "Capacitor electrolítico radial 105°C 20% tolerancia",
        "categoria": "Componentes Analógicos",
        "imagenUrl": "https://images.unsplash.com/photo-1622737133809-d9a7f2b9b470?w=400&h=300&fit=crop&auto=format"
    },
    {
        "id_insumo": 2003,
        "NombProducto": "LED Rojo 5mm Difuso",
        "cantidad": 1000,
        "caracteristicas": "LED rojo difuso 5mm 2V 20mA ángulo de visión 60°",
        "categoria": "Componentes Digitales",
        "imagenUrl": "https://images.unsplash.com/photo-1603792553731-c1f3a8802d1b?w=400&h=300&fit=crop&auto=format"
    }
]
```
