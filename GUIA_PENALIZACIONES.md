# Guía para Administradores - Sistema de Penalizaciones

## 📌 Para Penalizar a un Usuario

### Paso 1: Acceder a Solicitudes
- Ir a la sección "Solicitudes" en el panel administrativo
- Buscar la solicitud del usuario que deseas penalizar

### Paso 2: Penalizar
- Click en el botón **"Penalizar"** (ícono de prohibición 🚫 en rojo)
- La solicitud cambia a estado **"Penalizado"**
- El usuario será bloqueado **INMEDIATAMENTE** en su próxima acción

## 🔓 Para Levantar la Penalización

### Opción A: Cambiar estado a "Devuelto"
1. Ir a solicitudes del usuario penalizado
2. Click en la solicitud penalizada
3. Cambiar estado a **"Devuelto"**
4. El usuario verá automáticamente: "¡Restricción Removida!"
5. Se recargará su página y volverá a tener acceso

### Opción B: Cambiar estado a "Cancelada"
- También levanta la penalización
- El usuario puede volver a solicitar normalmente

## ⚙️ Comportamiento del Sistema

### Cuando Hay Penalización Activa:

**En el Login:**
```
Usuario intenta loguearse 
→ Se muestra modal de penalización
→ Botón cambia a "Entendido, cerrar sesión" (ROJO)
→ Si presiona, logout automático
→ NO puede acceder al sistema
```

**Intentando Navegar:**
```
Usuario penalizado intenta ir a:
- Activos.html
- Insumos.html
- Usuarios.html
- Reportes.html
- Inventario.html

→ Se bloquea automáticamente
→ Se muestra modal de "Acceso Restringido"
→ Se redirige a Home
```

**Páginas Permitidas (incluso penalizados):**
- ✅ Página Principal / Home (Dashboard)
- ✅ Ver sus Solicitudes (para ver cuál está penalizada)
- ✅ Notificaciones (para ver detalles)
- ✅ Perfil (información personal)

### Después de Cambiar a "Devuelto":

```
Polling cada 30 segundos detecta cambio
→ Se muestra: "¡Restricción Removida!"
→ Página se recarga automáticamente
→ Usuario vuelve a tener acceso completo
```

## 📊 Estados de Solicitud Disponibles

```
┌─────────────────────────────────────────────────────┐
│ ESTADO          │ QUÉ SIGNIFICA          │ BLOQUEA   │
├─────────────────────────────────────────────────────┤
│ Pendiente       │ En espera de revisar   │ No       │
│ Aprobada        │ Solicitud aceptada ✅  │ No       │
│ Rechazada       │ Denegada               │ No       │
│ Entregado       │ Equipo en uso          │ No       │
│ Devuelto        │ Equipo retornado ✅    │ No       │
│ Penalizado      │ Restricción activa 🚫  │ SÍ       │
│ Cancelada       │ Solicitud cancelada    │ No       │
└─────────────────────────────────────────────────────┘
```

## 💡 Casos de Uso Comunes

### Caso 1: Estudiante No Devuelve Equipo a Tiempo
1. Marcar solicitud como "Penalizado"
2. Usuario verá bloqueo inmediato
3. Una vez devuelvan el equipo → Cambiar a "Devuelto"
4. Usuario automáticamente desbloqueado

### Caso 2: Estudiante Daña Equipo
1. Abrir la solicitud
2. Agregar observación: "Equipo dañado - requiere reparación"
3. Cambiar a "Penalizado"
4. Usuario bloqueado hasta que pague reparación
5. Una vez pagado → Cambiar a "Devuelto"

### Caso 3: Levantamiento de Penalización

**No es necesario hacer nada especial**, simplemente:
1. Cambiar estado de la solicitud a "Devuelto" o "Cancelada"
2. El sistema automáticamente:
   - Detectará el cambio en 30 segundos
   - Mostrará notificación al usuario
   - Recargará su acceso

## 🔍 Monitoreo

### Para Ver Usuarios Penalizados:
- Ir a Solicitudes
- Filtrar por estado: "Penalizado"
- Verás todas las restricciones activas

### Para Ver Historial:
- Click en una solicitud
- Ver "Historial de Estados"
- Muestra cuándo fue penalizado y cuándo se levantó

## ⚠️ Consideraciones Importantes

1. **El bloqueo es total**: El usuario NO puede hacer nada en el sistema
2. **Automático**: Se aplica inmediatamente, no necesita reiniciar
3. **Reversible**: En cualquier momento puedes cambiar el estado
4. **A Nivel de Usuario**: Bloquea TODAS sus acciones, no solo una solicitud

## 🚀 Mejores Prácticas

✅ **Recomendado:**
- Penalizar solo por incumplimientos graves
- Notificar al estudiante antes de penalizar
- Dar plazo para resolver (ej: 3 días)
- Levantar penalización una vez cumplan

❌ **No Recomendado:**
- Penalizar por olvidos simples
- Penalizar sin antes intentar contactar
- Dejar penalizaciones indefinidas
- Usar como castigo sin propósito claro

## 📞 Soporte

Si hay algún problema con el sistema de penalizaciones, contactar a:
- Administrador del Sistema
- Equipo de TI
- Desarrollo (para reportar bugs)

---

**Última Actualización:** 14 de Abril 2026
**Versión del Sistema:** 2.0
