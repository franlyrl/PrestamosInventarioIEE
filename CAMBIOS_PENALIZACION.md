# Sistema de Bloqueo por Penalización - VERSIÓN BÁSICA

## 📋 Información General del Sistema

**Propósito:** Sistema básico de notificaciones para usuarios con solicitudes penalizadas.

**Alcance:** Afecta a todos los usuarios del sistema SPIEE (Sistema de Préstamos de Inventario Electrónico Educativo).

**Severidad:** Baja - Solo notificaciones, sin bloqueo real.

**Última Actualización:** 14 de Abril 2026
**Versión:** 1.0 - BÁSICA
**Estado:** ⚠️ NOTIFICACIONES SOLAMENTE

---

## 📖 Documentación Completa

Para información detallada del sistema actual, consulte:

**[📄 CAMBIOS_PENALIZACION_DETALLADO.md](CAMBIOS_PENALIZACION_DETALLADO.md)**

Este documento incluye:
- ✅ Detalles del sistema de notificaciones actual
- ✅ Comportamiento diferenciado por tipo de alerta
- ✅ Lógica de botones condicionales
- ✅ Estados de implementación

---

## ✅ Sistema Actual Implementado

### 1. **Modal de Alertas Condicional**
- Se ejecuta cuando hay alertas pendientes
- Modal escapable (se puede cerrar con ESC o click afuera)
- Botones diferentes según el tipo de alerta:
  - **Sin penalización:** Solo botón "Ver mis solicitudes"
  - **Con penalización:** Botones "Enviar correo al administrador" y "Cerrar sesión"

### 2. **Comportamiento por Tipo de Alerta**

#### **Alertas Normales (aprobada, por_vencer, vencida):**
- ✅ Modal escapable
- ✅ Solo botón "Ver mis solicitudes"
- ✅ Redirige a la página de solicitudes

#### **Alertas con Penalización:**
- ✅ Modal escapable
- ✅ Dos botones: "Enviar correo al administrador" y "Cerrar sesión"
- ✅ Opción de contactar admin o cerrar sesión

---

## 🎯 Comportamiento Actual

### **Para Usuario sin Penalización:**
- ✅ Recibe notificaciones normales
- ✅ Modal con botón único "Ver mis solicitudes"
- ✅ Puede navegar libremente

### **Para Usuario Penalizado:**
- ✅ Recibe notificaciones de penalización
- ✅ Modal con opción de contactar administrador
- ✅ Opción de cerrar sesión voluntariamente
- ✅ Sin bloqueo automático de navegación

---

## 📋 Páginas Afectadas

**Notificaciones aparecen en TODAS las páginas** cuando hay alertas pendientes, pero **SIN BLOQUEO**.

---

## 🔐 Nivel de Seguridad Actual

- **Modal:** Escapable (ESC, click afuera)
- **Navegación:** Libre
- **Logout:** Voluntario
- **Server-side:** Sin verificación de bloqueo

---

**Estado del Sistema:** ✅ NOTIFICACIONES FUNCIONANDO  
**Nivel de Seguridad:** ⚠️ BÁSICO  
**Última Verificación:** 14 de Abril 2026  
**Versión:** 1.0 - BÁSICA  

**📖 Para detalles técnicos completos:** [CAMBIOS_PENALIZACION_DETALLADO.md](CAMBIOS_PENALIZACION_DETALLADO.md)
