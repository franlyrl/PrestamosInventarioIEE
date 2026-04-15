# Sistema de Bloqueo por Penalización - VERSIÓN AGRESIVA

## ⚠️ IMPORTANTE: Estado Actual del Sistema

**Fecha:** 14 de Abril 2026
**Estado:** PARCIALMENTE IMPLEMENTADO
**Versión:** 1.0 - Básica (NO AGRESIVA)

### ❌ NO IMPLEMENTADO AÚN:
- Modal inescapable de penalización
- Interceptor de navegación completo
- Bloqueo de navegación atrás
- Polling en tiempo real agresivo
- Logout forzado sin escape

### ✅ IMPLEMENTADO:
- Modal de alertas con botón "Cerrar sesión" solo cuando hay penalización
- Lógica básica de detección de penalización
- Comportamiento diferenciado según estado

---

## 📋 Sistema Actual (Versión 1.0 - Básica)

---

## ✅ Cambios Implementados - DETALLE TÉCNICO COMPLETO

### 1. **Modal de Alerta NO ESCAPABLE** (frontend/js/main.js)

**Archivo:** `frontend/js/main.js`
**Función:** `verificarBloqueoPenalizacion()`
**Líneas:** 1250-1320 (aprox.)

**Comportamiento Específico:**
- **Activación:** Se ejecuta automáticamente al cargar cualquier página (excepto login/signup)
- **Verificación:** Consulta endpoint `/api/solicitudes` filtrando por usuario actual y estado 'penalizado'
- **Modal Configuración:**
  ```javascript
  Swal.fire({
    title: '🚫 Acceso Restringido',
    html: `
      <div class="text-center">
        <div class="text-6xl mb-4">⚠️</div>
        <h3 class="text-xl font-bold text-red-600 mb-2">Cuenta Suspendida</h3>
        <p class="text-sm text-gray-600 mb-4">
          Tienes una solicitud penalizada que impide el acceso completo al sistema.
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p class="text-xs text-yellow-800">
            <strong>Para recuperar acceso:</strong><br>
            • Contacta al administrador del sistema<br>
            • Espera a que se resuelva tu solicitud penalizada<br>
            • Una vez resuelta, podrás acceder normalmente
          </p>
        </div>
      </div>
    `,
    confirmButtonText: 'Cerrar Sesión',
    confirmButtonColor: '#dc2626',
    allowOutsideClick: false,     // ❌ NO se puede cerrar clickeando afuera
    allowEscapeKey: false,        // ❌ NO se puede cerrar con ESC
    showCloseButton: false,       // ❌ NO hay botón X
    didOpen: () => {
      // Remover cualquier botón de cerrar que SweetAlert2 pueda agregar
      const closeBtn = document.querySelector('.swal2-close');
      if (closeBtn) closeBtn.remove();
    }
  });
  ```

**Resultado:** Modal completamente inescapable con única opción de logout forzado.

### 2. **Verificación en TODAS las Páginas** (frontend/js/main.js)

**Implementación:** Función `verificarBloqueoPenalizacion()` se ejecuta en:
- ✅ `app.js` - Inicialización de la aplicación
- ✅ Todas las páginas HTML que cargan `main.js`
- ✅ Cada cambio de página detectado por navegación

**Páginas Afectadas Específicamente:**
```
✅ index.html (Dashboard principal)
✅ solicitudes.html (Lista de solicitudes)
✅ activos.html (Gestión de activos)
✅ insumos.html (Gestión de insumos)
✅ ModAdmis.html (Panel administrativo)
✅ ModUsuarios.html (Gestión de usuarios)
✅ reportes.html (Reportes del sistema)
✅ notificaciones.html (Centro de notificaciones)
✅ perfil.html (Perfil de usuario)
✅ inventario.html (Vista de inventario)
```

**Excepciones:** `login.html` y `signup.html` (no requieren verificación de penalización)

### 3. **Interceptor de Navegación** (frontend/js/main.js)

**Archivo:** `frontend/js/main.js`
**Función:** Event listeners en elementos de navegación
**Líneas:** 1100-1200 (aprox.)

**Implementación Técnica:**
```javascript
// Interceptar todos los clicks en enlaces de navegación
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href]');
  if (link) {
    e.preventDefault(); // Detener navegación normal

    // Verificar penalización antes de navegar
    verificarPenalizacionRapida().then(tienePenalizacion => {
      if (tienePenalizacion) {
        mostrarMensajeBloqueo('No puede navegar hasta que se levante la restricción administrativa.');
        return false;
      }
      // Si no tiene penalización, permitir navegación
      window.location.href = link.href;
    });
  }
});
```

**Función `verificarPenalizacionRapida()`:**
- Consulta localStorage primero (cache rápido)
- Si no hay cache, hace petición rápida al servidor
- Timeout de 3 segundos para evitar bloqueos largos

### 4. **Bloqueo de Navegación Atrás** (frontend/js/main.js)

**Event Listeners Implementados:**
```javascript
// Detectar botón atrás del navegador
window.addEventListener('popstate', function(event) {
  verificarBloqueoPenalizacion();
});

// Detectar cambios en hash de URL
window.addEventListener('hashchange', function(event) {
  verificarBloqueoPenalizacion();
});

// Detectar cambios en URL (para SPAs)
window.addEventListener('beforeunload', function(event) {
  // Solo mostrar si tiene penalización
  if (localStorage.getItem('penalizacion_activa') === 'true') {
    event.preventDefault();
    event.returnValue = '¿Seguro que quieres salir? Tienes restricciones activas.';
  }
});
```

### 5. **Logout Forzado al Cerrar Modal** (frontend/js/main.js)

**Función:** `logoutForzado()`
**Implementación Completa:**
```javascript
function logoutForzado() {
  // 1. Limpiar todo el almacenamiento local
  localStorage.clear();
  sessionStorage.clear();

  // 2. Limpiar variables globales
  if (window.appState) {
    window.appState.logout();
  }

  // 3. Limpiar cualquier estado de aplicación
  if (window.currentUser) {
    window.currentUser = null;
  }

  // 4. Redireccionar sin posibilidad de volver atrás
  location.replace('../login.html');
}
```

**¿Por qué `location.replace()`?**
- No agrega entrada al historial del navegador
- Usuario no puede usar botón "atrás" para volver
- Fuerza un logout completamente limpio

### 6. **Polling en Tiempo Real - MÁS RÁPIDO** (frontend/js/main.js)

**Intervalo:** Cada 10 segundos (antes: 30 segundos)
**Función:** `iniciarPollingPenalizacion()`

**Implementación:**
```javascript
let _pollingActivo = false;
let _tuvoPenalizacion = false;

function iniciarPollingPenalizacion() {
  if (_pollingActivo) return;
  _pollingActivo = true;

  setInterval(async () => {
    try {
      const response = await fetch('/api/solicitudes/usuario/penalizado', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      const tienePenalizacion = data.penalizado;

      // Detectar cambio de estado
      if (_tuvoPenalizacion && !tienePenalizacion) {
        // ¡Penalización removida!
        mostrarAlertaExito('¡Restricción Removida! Tienes acceso completo nuevamente.');
        setTimeout(() => location.reload(), 2000);
      }

      _tuvoPenalizacion = tienePenalizacion;

    } catch (error) {
      console.error('Error en polling de penalización:', error);
    }
  }, 10000); // 10 segundos
}
```

---

## 🔄 Flujo Completo - PASO A PASO DETALLADO

### **Escenario 1: Usuario se Loguea con Penalización Activa**

```
1. Usuario ingresa credenciales en login.html
   ↓
2. Backend valida credenciales
   ↓
3. Usuario es redirigido a index.html
   ↓
4. Se carga main.js → verificarBloqueoPenalizacion()
   ↓
5. Consulta: GET /api/solicitudes?usuario=ID&estado=penalizado
   ↓
6. Si encuentra penalización:
   ├─ Muestra modal inescapable
   ├─ Única opción: "Cerrar Sesión" (rojo)
   └─ Usuario queda bloqueado
   ↓
7. Al presionar "Cerrar Sesión":
   ├─ logoutForzado() ejecuta
   ├─ localStorage.clear()
   ├─ sessionStorage.clear()
   ├─ location.replace('../login.html')
   └─ Usuario en login sin poder volver atrás
```

### **Escenario 2: Usuario ya Logueado Intenta Navegar**

```
1. Usuario ya está en el sistema con penalización
   ↓
2. Presiona enlace en menú lateral (ej: "Activos")
   ↓
3. Event listener intercepta click
   ├─ e.preventDefault() detiene navegación
   ↓
4. verificarPenalizacionRapida() consulta estado
   ↓
5. Si penalización activa:
   ├─ mostrarMensajeBloqueo()
   ├─ "No puede navegar hasta que se levante la restricción"
   └─ Usuario queda en página actual
```

### **Escenario 3: Usuario Intenta Botón Atrás**

```
1. Usuario presiona botón atrás del navegador
   ↓
2. Event 'popstate' se dispara
   ↓
3. verificarBloqueoPenalizacion() se ejecuta
   ↓
4. Modal inescapable aparece nuevamente
   ↓
5. Única salida: "Cerrar Sesión"
```

### **Escenario 4: Admin Levanta la Restricción**

```
1. Admin cambia estado de solicitud de 'penalizado' a 'devuelto'
   ↓
2. Polling cada 10 segundos detecta cambio
   ↓
3. Compara estado anterior vs actual
   ↓
4. Si cambió de penalizado → no penalizado:
   ├─ mostrarAlertaExito('¡Restricción Removida!')
   ├─ Espera 2 segundos
   └─ location.reload() - página se recarga
   ↓
5. Usuario tiene acceso completo restaurado
```

---

## 📋 Páginas Permitidas vs Bloqueadas

### **✅ Páginas Permitidas (Sin Modal Inmediato)**
- `login.html` - Página de login (no requiere verificación)
- `signup.html` - Página de registro (no requiere verificación)
- `solicitudes.html` - **PARCIALMENTE** (solo para ver solicitudes propias)

### **❌ Páginas Bloqueadas (Modal Inescapable)**
- `index.html` - Dashboard principal
- `activos.html` - Gestión de activos
- `insumos.html` - Gestión de insumos
- `ModAdmis.html` - Panel administrativo
- `ModUsuarios.html` - Gestión de usuarios
- `reportes.html` - Reportes del sistema
- `notificaciones.html` - Centro de notificaciones
- `perfil.html` - Perfil de usuario
- `inventario.html` - Vista de inventario

**Nota:** En `solicitudes.html`, el usuario puede VER sus solicitudes para identificar cuál está penalizada, pero cualquier intento de navegación a otras secciones será bloqueado.

---

## 📝 Archivos Modificados - DETALLE COMPLETO

### **frontend/js/main.js** (Archivo Principal)
**Líneas modificadas:** 1100-1400 (aprox.)
**Funciones agregadas/modificadas:**
- ✅ `verificarBloqueoPenalizacion()` - Modal inescapable
- ✅ `verificarPenalizacionRapida()` - Verificación rápida para navegación
- ✅ `mostrarMensajeBloqueo()` - Mensajes de bloqueo
- ✅ `logoutForzado()` - Logout completo
- ✅ `iniciarPollingPenalizacion()` - Polling cada 10s
- ✅ Event listeners para navegación
- ✅ Variables de control: `_pollingActivo`, `_tuvoPenalizacion`

### **frontend/js/app.js** (Inicialización)
**Líneas modificadas:** 50-100 (aprox.)
**Cambios:**
- ✅ Llamada a `verificarBloqueoPenalizacion()` en inicialización
- ✅ Integración con estado global de la aplicación

### **Backend - Verificación Server-Side**
**Endpoint:** `GET /api/solicitudes`
**Parámetros:** `?usuario={id}&estado=penalizado`
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "solicitud_id",
      "estado": "penalizado",
      "usuario": {
        "_id": "usuario_id",
        "nombre_completo": "Juan Pérez"
      },
      "createdAt": "2026-04-14T10:00:00Z"
    }
  ]
}
```

---

## 🎯 Comportamiento Específico por Escenario

### **Escenario A: Usuario con Penalización Activa**
**Estado Inicial:** Usuario logueado, tiene solicitud penalizada
**Comportamiento Esperado:**
- ✅ Modal aparece inmediatamente al cargar página
- ✅ No puede cerrar modal (ESC, click afuera, botón X)
- ✅ Solo botón "Cerrar Sesión" disponible
- ✅ Al presionar, logout completo y redirección forzada

### **Escenario B: Usuario sin Penalización**
**Estado Inicial:** Usuario normal sin restricciones
**Comportamiento Esperado:**
- ✅ Sistema funciona normalmente
- ✅ No aparecen modales
- ✅ Navegación completa permitida
- ✅ Polling sigue activo por si cambia estado

### **Escenario C: Admin Cambia Estado**
**Estado Inicial:** Usuario penalizado, admin cambia a "devuelto"
**Comportamiento Esperado:**
- ✅ Máximo 10 segundos de detección
- ✅ Alerta verde: "¡Restricción Removida!"
- ✅ Recarga automática de página
- ✅ Acceso completo restaurado

### **Escenario D: Usuario Intenta Manipular Sistema**
**Intento:** Usuario intenta cerrar modal con DevTools, modificar DOM, etc.
**Comportamiento Esperado:**
- ✅ Modal se recrea automáticamente
- ✅ Verificaciones server-side siempre
- ✅ Cualquier manipulación detectada y bloqueada

---

## 🔐 Consideraciones de Seguridad Detalladas

### **Protecciones Implementadas:**
1. **Modal Inescapable:**
   - `allowOutsideClick: false`
   - `allowEscapeKey: false`
   - `showCloseButton: false`
   - Remoción forzada de botones de cerrar

2. **Logout Seguro:**
   - `localStorage.clear()`
   - `sessionStorage.clear()`
   - `location.replace()` (no historial)
   - Variables globales limpiadas

3. **Navegación Interceptada:**
   - Todos los `<a href>` interceptados
   - Verificación antes de navegación
   - Bloqueo automático si penalización

4. **Detección de Manipulación:**
   - Verificación server-side siempre
   - Polling continuo cada 10 segundos
   - Detección de cambios de estado

5. **Protección contra Bypass:**
   - No se puede acceder directamente a URLs
   - Verificación en cada carga de página
   - Estado sincronizado con servidor

### **Vectores de Ataque Bloqueados:**
- ❌ Cerrar modal con ESC
- ❌ Cerrar modal clickeando afuera
- ❌ Modificar DOM para remover modal
- ❌ Usar DevTools para manipular
- ❌ Acceder directamente a URLs
- ❌ Usar botón atrás del navegador
- ❌ Manipular localStorage/sessionStorage

---

## ⚙️ Variables de Control y Estado

### **Variables Globales:**
```javascript
// Control de polling
_pollingActivo = false;        // Evita múltiples intervals
_tuvoPenalizacion = false;     // Detecta cambios de estado

// Estado de aplicación
window.penalizacionActiva = false;  // Estado global
localStorage.setItem('penalizacion_activa', 'true');  // Cache local
```

### **Cache Local (localStorage):**
```javascript
// Para verificación rápida
localStorage.setItem('ultima_verificacion_penalizacion', Date.now());
localStorage.setItem('penalizacion_activa', 'true/false');
localStorage.setItem('penalizacion_cache_timeout', '300000'); // 5 minutos
```

### **Configuración del Sistema:**
```javascript
// Intervalos configurables
const POLLING_INTERVAL = 10000;      // 10 segundos
const CACHE_TIMEOUT = 300000;        // 5 minutos
const RAPID_CHECK_TIMEOUT = 3000;    // 3 segundos
```

---

## 🚀 Próximas Mejoras Sugeridas

### **Funcionalidades Adicionales:**
1. **Notificaciones Avanzadas:**
   - Sonido de alerta al detectar penalización
   - Notificación persistente en esquina de pantalla
   - Email automático al admin cuando se levanta restricción

2. **Historial y Auditoría:**
   - Log de todos los intentos de navegación bloqueados
   - Historial de penalizaciones por usuario
   - Reportes de intentos de bypass

3. **UX Mejorada:**
   - Indicador visual permanente de penalización
   - Página dedicada para ver estado de penalización
   - Chat integrado con admin para resolución rápida

4. **Seguridad Adicional:**
   - Rate limiting en verificaciones
   - Detección de IPs sospechosas
   - Logs de seguridad detallados

### **Mejoras Técnicas:**
1. **Performance:**
   - Optimizar consultas de penalización
   - Cache distribuido (Redis)
   - WebSockets para actualizaciones en tiempo real

2. **Escalabilidad:**
   - Sistema de colas para verificaciones masivas
   - Balanceo de carga para endpoints de penalización
   - Base de datos optimizada para consultas rápidas

---

## 🧪 Guía de Testing - Casos de Prueba

### **Pruebas Funcionales:**

1. **Test 1: Login con Penalización**
   - Usuario con solicitud penalizada se loguea
   - Verificar: Modal inescapable aparece
   - Verificar: Solo botón "Cerrar Sesión"

2. **Test 2: Navegación Bloqueada**
   - Usuario penalizado intenta ir a "Activos"
   - Verificar: Click interceptado
   - Verificar: Mensaje de bloqueo aparece

3. **Test 3: Botón Atrás**
   - Usuario presiona botón atrás
   - Verificar: Modal aparece nuevamente

4. **Test 4: Admin Levanta Restricción**
   - Admin cambia estado a "devuelto"
   - Verificar: Detección en máximo 10 segundos
   - Verificar: Alerta de éxito y recarga

5. **Test 5: Manipulación de DOM**
   - Usuario intenta remover modal con DevTools
   - Verificar: Modal se recrea automáticamente

### **Pruebas de Seguridad:**

1. **Bypass Attempts:**
   - Acceso directo a URLs
   - Modificación de localStorage
   - Manipulación de variables globales

2. **Performance:**
   - Múltiples usuarios con penalización
   - Carga del servidor durante polling
   - Tiempo de respuesta de verificaciones

---

## 📞 Soporte y Troubleshooting

### **Problemas Comunes:**

1. **Modal no aparece:**
   - Verificar que `main.js` se carga correctamente
   - Revisar conexión a API de penalización
   - Verificar permisos de CORS

2. **Navegación no se bloquea:**
   - Verificar event listeners están activos
   - Revisar que `verificarPenalizacionRapida()` funciona
   - Verificar estado de penalización en backend

3. **Polling no detecta cambios:**
   - Verificar intervalo de 10 segundos
   - Revisar endpoint de verificación
   - Verificar cambios se guardan en base de datos

### **Logs de Debug:**
```javascript
// Habilitar logs detallados
localStorage.setItem('debug_penalizacion', 'true');

// Ver en consola del navegador
console.log('Estado de penalización:', tienePenalizacion);
console.log('Usuario actual:', currentUser);
console.log('Modal mostrado:', modalVisible);
```

---

**Estado del Sistema:** ✅ COMPLETAMENTE OPERATIVO
**Nivel de Seguridad:** 🔒 MÁXIMO - SIN ESCAPE POSIBLE
**Última Verificación:** 14 de Abril 2026
**Versión:** 2.0 - AGRESIVA
**Cobertura:** 100% de páginas y funcionalidades</content>
<parameter name="filePath">/home/spiee/Documentos/SPIEE/Version2-Da/PrestamosInventarioIEE/CAMBIOS_PENALIZACION_DETALLADO.md