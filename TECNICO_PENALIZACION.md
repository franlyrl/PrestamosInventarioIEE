# Resumen Técnico - Sistema de Bloqueo por Penalización

## 🎯 Objetivo
Implementar un sistema que bloquee completamente a un usuario cuando tiene una solicitud penalizada, obligándolo a cerrar sesión y previniendo cualquier navegación hasta que el administrador levante la restricción.

## 🔧 Cambios Realizados

### Archivo: `frontend/js/main.js`

#### 1. Función: `_mostrarAlertaIngreso(alertas)` - MODIFICADA
**Línea ~350**

**Cambios:**
- Detecta si hay alertas de tipo "penalizado"
- Modifica el botón "Cerrar por ahora" a "Entendido, cerrar sesión" (en ROJO)
- Configura `allowOutsideClick: false` y `allowEscapeKey: false`
- En el `.then()` del modal:
  - Si hay penalización Y presionan cancelar → **Logout forzado**
  - Limpia localStorage y sessionStorage
  - Usa `location.replace()` (no permite volver atrás)

#### 2. Función: `loadNotifications()` - MEJORADA
**Línea ~285**

**Agregó:**
```javascript
// Inicia polling si hay penalizados
if (penalizados.length > 0) {
    this._iniciarPollingPenalizacion();
}
```

#### 3. Nueva Función: `_iniciarPollingPenalizacion()`
**Línea ~290**

**Propósito:** Verificar cada 30 segundos si la penalización fue removida

**Lógica:**
- Fetch a `/api/solicitudes` para obtener estado actual
- Compara si aún hay estado "penalizado"
- Si no hay penalización y antes sí la había:
  - Muestra modal: "¡Restricción Removida!"
  - Recarga la página automáticamente
  - Usuario recobra acceso completo

#### 4. Nueva Función: `verificarBloqueopenalizacion()`
**Línea ~520**

**Propósito:** Bloquear navegación a páginas restringidas

**Flujo:**
- Verifica si hay token y usuario
- Fetch a `/api/solicitudes`
- Busca estado "penalizado"
- Si existe:
  - Muestra modal "Acceso Restringido"
  - Lista las solicitudes penalizadas
  - Redirige a Dashboard

**Páginas Restringidas:**
- ❌ activos
- ❌ insumos
- ❌ usuarios
- ❌ reportes
- ❌ inventario

**Páginas Permitidas:**
- ✅ solicitudes
- ✅ dashboard
- ✅ notificaciones
- ✅ perfil

#### 5. DOMContentLoaded Event Listener - AGREGADO
**Línea ~620**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(() => {
        // Verifica bloqueo en páginas restringidas
        if (esPageRestringida && !paginaActual.includes('solicitudes')) {
            window.verificarBloqueopenalizacion();
        }
    }, 500);
});
```

#### 6. Popstate Event Listener - NUEVO
**Línea ~635**

```javascript
window.addEventListener('popstate', async () => {
    // Detecta intentos de volver atrás
    // Bloquea si intentan ir a página restringida estando penalizados
});
```

## 📊 Flujo de Ejecución

```
┌─────────────────────────────────────────────────────────┐
│ USUARIO INTENTA LOGUEARSE (tiene penalización)         │
└──────────────────┬──────────────────────────────────────┘
                   ↓
        ┌──────────────────────┐
        │ loadNotifications()  │
        │ detecta penalizados  │
        └──────────┬───────────┘
                   ↓
    ┌─────────────────────────────────┐
    │ _mostrarAlertaIngreso()         │
    │ Muestra modal con botón ROJO    │
    └──────────────┬──────────────────┘
                   ↓
          ¿Presiona botón?
         /              \
        /                \
    "Ver solicitudes"  "Cerrar sesión"
       ↓                    ↓
    Va a               1. localStorage.clear()
    Solicitudes.html   2. sessionStorage.clear()
                       3. appState.logout()
                       4. location.replace()
                          ↓
                       [LOGIN]
                       
┌─────────────────────────────────────────────────────────┐
│ USUARIO PENALIZADO INTENTA NAVEGAR A OTRA PÁGINA       │
└──────────────┬──────────────────────────────────────────┘
               ↓
    ┌────────────────────────────────────┐
    │ verificarBloqueopenalizacion()     │
    │ - Fetch /api/solicitudes           │
    │ - Verifica si estado === penalizado│
    └────────────────┬───────────────────┘
               ¿Penalizado?
              /            \
            SÍ             NO
            ↓              ↓
    Muestra    Acceso
    Modal      permitido
    "Acceso    (continúa)
    Restringido"
    ↓
    location.href = '../Dashboard'
```

## 🔄 Polling en Tiempo Real

```
MIENTRAS admin no cambie estado:
┌─────┐  ┌─────┐  ┌─────┐
│ 30s │→ │ 30s │→ │ 30s │... [Verifica cada 30s]
└─────┘  └─────┘  └─────┘

UNA VEZ admin cambia a "devuelto":
1. _iniciarPollingPenalizacion() detecta cambio
2. Muestra: "¡Restricción Removida!"
3. window.location.reload()
4. Usuario con acceso restaurado
```

## 🔐 Medidas de Seguridad

1. **Logout forzado**: `location.replace()` previene volver atrás
2. **Limpieza de storage**: localStorage + sessionStorage
3. **Modal no-escapable**: No se puede cerrar con ESC
4. **Modal no-clickeable-afuera**: Debe presionar el botón
5. **Bloqueo en múltiples puntos**: DOMContentLoaded + popstate
6. **Verificación Server-Side**: Siempre fetch datos del API

## ⚡ Performance

- **Polling**: 30 segundos (configurable)
- **Verificación de carga**: 500ms delay (evita race conditions)
- **Async**: Toda verificación es asincrónica (no bloquea UI)

## 🧪 Testing

### Test 1: Penalización Visible
- Usuario con penalización se loguea
- ✓ Debe ver modal con "Entendido, cerrar sesión"

### Test 2: Logout Forzado
- Presionar "Entendido, cerrar sesión"
- ✓ Logout inmediato
- ✓ No puede usar botón atrás para volver

### Test 3: Bloqueo de Navegación
- Usuario penalizado intenta ir a activos.html
- ✓ Se bloquea automáticamente

### Test 4: Levantamiento de Restricción
- Admin cambia estado a "devuelto"
- ✓ En 30 segundos o menos, usuario ve "¡Restricción Removida!"
- ✓ Página se recarga
- ✓ Acceso restaurado

## 📝 Logs/Console

Los siguientes mensajes aparecen en la consola:
- `[UTNNotifs] Cargando notificaciones...`
- `[Polling] Verificando penalizaciones...`
- `[Penalización] Error verificando bloqueo: ...`

## 🔄 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Responsive (móvil y escritorio)
- ✅ SweetAlert2 requerido para modales
- ✅ localStorage requerido para persistencia

## 🚀 Próximas Mejoras

1. Hacer polling configurable (actualmente 30s)
2. Agregar sonido de alerta
3. Notificación por email
4. Formulario de apelación
5. WebSocket para cambios en tiempo real (vs polling)

---

**Implementado:** 14 de Abril 2026  
**Version:** 1.0  
**Archivo principal:** frontend/js/main.js
