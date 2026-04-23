# Portainer Configurado - Gestión de Contenedores

## Estado Actual

### Portainer
- **Estado**: Corriendo correctamente
- **Contenedor**: portainer (ID: 97767fd8cf0e)
- **Puertos**: 
  - HTTP: 9000
  - HTTPS: 9443
- **Imagen**: portainer/portainer-ce:latest

## Acceso a Portainer

### Local
- **HTTP**: http://localhost:9000
- **HTTPS**: https://localhost:9443

### Red Local
- **HTTP**: http://10.90.29.31:9000
- **HTTP**: http://100.71.147.126:9000

## Configuración del Contenedor

```bash
sudo podman run -d \
  --name portainer \
  --restart unless-stopped \
  -p 9000:9000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

## Características

### Gestión Visual
- [x] **Contenedores**: Ver, iniciar, detener, reiniciar
- [x] **Imágenes**: Descargar, construir, eliminar
- [x] **Volúmenes**: Gestionar datos persistentes
- [x] **Redes**: Configurar redes de contenedores
- [x] **Logs**: Ver logs en tiempo real
- [x] **Estadísticas**: Monitorizar recursos

### Seguridad
- [x] **HTTPS**: Disponible en puerto 9443
- [x] **Autenticación**: Requiere configuración inicial
- [x] **Control de acceso**: Gestión de usuarios y roles

## Primer Uso

### 1. Acceder a Portainer
```
http://localhost:9000
```

### 2. Configurar Usuario Admin
- Crear usuario administrador
- Establecer contraseña segura
- Configurar autenticación

### 3. Seleccionar Entorno
- **Local**: Gestionar contenedores locales
- **Remote**: Conectar a otros hosts Docker

## Comandos Útiles

### Ver Estado
```bash
# Ver contenedor Portainer
sudo podman ps | grep portainer

# Ver logs de Portainer
sudo podman logs -f portainer

# Ver puertos
ss -tlnp | grep -E "(9000|9443)"
```

### Administración
```bash
# Reiniciar Portainer
sudo podman restart portainer

# Detener Portainer
sudo podman stop portainer

# Eliminar Portainer
sudo podman rm -f portainer
```

### Logs y Monitoreo
```bash
# Logs en tiempo real
sudo podman logs -f portainer

# Estadísticas de contenedores
sudo podman stats

# Ver todos los contenedores
sudo podman ps -a
```

## Integración con Aplicación Actual

### Contenedores Corriendo
- **Portainer**: localhost:9000
- **Backend**: localhost:4000 (Node.js)
- **Frontend**: localhost:5178 (Vite)
- **Ngrok**: https://monsoon-aim-mashed.ngrok-free.dev

### Gestión desde Portainer
1. **Ver todos los contenedores** en el dashboard
2. **Monitorizar recursos** de la aplicación
3. **Ver logs** del backend y frontend
4. **Reiniciar servicios** si es necesario
5. **Gestionar volúmenes** de datos

## Problemas Comunes

### Si Portainer no carga
```bash
# Verificar contenedor
sudo podman ps | grep portainer

# Reiniciar si es necesario
sudo podman restart portainer

# Ver logs para diagnóstico
sudo podman logs portainer
```

### Si hay problemas de red
```bash
# Limpiar redes conflictivas
sudo podman network prune -f

# Verificar puertos
ss -tlnp | grep -E "(9000|9443)"
```

### Si no se puede acceder desde fuera
- Configurar firewall para permitir puertos 9000/9443
- Usar ngrok para acceso externo (requiere dominio adicional)

## Resumen

**Portainer está configurado y funcionando para:**

1. **Gestión visual** de todos tus contenedores
2. **Monitorización** de recursos y logs
3. **Administración** fácil de la aplicación
4. **Control centralizado** del entorno Docker/Podman

**Acceso inmediato**: http://localhost:9000

---

**Estado**: Portainer listo para uso.
