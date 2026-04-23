# 📋 Footer de Insumos.html - Referencia para ModAdmis.html

## 🎯 **Footer Actual de Insumos.html**

### **Código HTML:**
```html
<div class="footer">
    <strong>SPIEE</strong> - Sistema de Préstamos e Inventario de Equipos Electrónicos<br>
    Universidad Técnica Nacional
</div>
```

### **Estilos CSS:**
```css
.footer { 
    text-align: center; 
    color: #94a3b8; 
    font-size: 12px; 
    margin-top: 40px; 
    padding-top: 20px; 
    border-top: 1px solid #e2e8f0; 
}
.footer strong { 
    color: #002D62; 
}
```

## 📍 **Dónde Aplicar en ModAdmis.html**

### **Opción 1: Reemplazar el footer componente**
En `ModAdmis.html` (línea 472), reemplaza:
```html
<!-- Footer cargado por components.js -->
<div id="footer-component"></div>
```

Por:
```html
<!-- Footer simple como insumos.html -->
<div class="footer">
    <strong>SPIEE</strong> - Sistema de Préstamos e Inventario de Equipos Electrónicos<br>
    Universidad Técnica Nacional
</div>
```

### **Opción 2: Agregar estilos CSS**
Agrega estos estilos en el `<style>` de `ModAdmis.html`:
```css
.footer { 
    text-align: center; 
    color: #94a3b8; 
    font-size: 12px; 
    margin-top: 40px; 
    padding-top: 20px; 
    border-top: 1px solid #e2e8f0; 
}
.footer strong { 
    color: #002D62; 
}
```

## 🎨 **Características del Footer de Insumos.html**

- **Simple**: Solo texto, sin logos ni iconos
- **Centrado**: Texto alineado al centro
- **Línea divisoria**: Borde superior gris claro
- **Colores**: Gris para texto, azul para "SPIEE"
- **Espaciado**: 40px margin-top, 20px padding-top

## 🚀 **Resultado Esperado**

```
SPIEE - Sistema de Préstamos e Inventario de Equipos Electrónicos
Universidad Técnica Nacional
```

**Este footer es mucho más simple y limpio que el actual componente.**
