# Contenedores Completos - Todo en Docker/Podman

## Estado Final de Contenedores

### Contenedores Corriendo
- **Backend**: `prestamos-backend` (localhost/prestamos-backend:latest)
- **Frontend**: `prestamos_frontend` (localhost/prestamos-frontend:latest) 
- **Portainer**: `portainer` (docker.io/portainer/portainer-ce:latest)

### Servicios Externos
- **Ngrok**: https://monsoon-aim-mashed.ngrok-free.dev

## Detalles de Contenedores

### Backend Container
```bash
# Nombre: prestamos_backend
# Imagen: localhost/prestamos-backend:latest
# Puerto: 4000 (interno)
# Estado: Up 18 minutes
# Comando: npm start
```

### Frontend Container
```bash
# Nombre: prestamos_frontend
# Imagen: localhost/prestamos-frontend:latest
# Puerto: 5179 (interno)
# Estado: Up 2 minutes
# Comando: npm run dev
# Network: host
```

### Portainer Container
```bash
# Nombre: portainer
# Imagen: docker.io/portainer/portainer-ce:latest
# Puertos: 9000->9000/tcp, 9443->9443/tcp
# Estado: Up 11 minutes
# Volumes: /var/run/docker.sock, portainer_data
```

## URLs de Acceso

### Externo (via ngrok)
- **Frontend completo**: https://monsoon-aim-mashed.ngrok-free.dev
- **Login**: https://monsoon-aim-mashed.ngrok-free.dev/login.html
- **API**: https://monsoon-aim-mashed.ngrok-free.dev/api

### Local
- **Frontend**: http://localhost:5179
- **Backend**: http://localhost:4000/api
- **Portainer**: http://localhost:9000

### Red Local
- **Frontend**: http://10.90.29.31:5179
- **Frontend**: http://100.71.147.126:5179
- **Portainer**: http://10.90.29.31:9000

## Comandos de Gestión

### Ver Todos los Contenedores
```bash
sudo podman ps
sudo podman ps -a  # incluyendo detenidos
```

### Logs de Contenedores
```bash
# Backend
sudo podman logs -f prestamos_backend

# Frontend
sudo podman logs -f prestamos_frontend

# Portainer
sudo podman logs -f portainer
```

### Reiniciar Contenedores
```bash
sudo podman restart prestamos_backend
sudo podman restart prestamos_frontend
sudo podman restart portainer
```

### Detener/Iniciar
```bash
# Detener
sudo podman stop prestamos_backend prestamos_frontend portainer

# Iniciar
sudo podman start prestamos_backend prestamos_frontend portainer
```

## Construcción de Imágenes

### Backend
```bash
cd backend
sudo podman build -t prestamos-backend .
```

### Frontend
```bash
cd frontend
sudo podman build -t prestamos-frontend .
```

## Configuración de Redes

### Network Host
- **Frontend**: Usa `--network host` para acceso directo
- **Backend**: Usa `--network host` para comunicación local
- **Portainer**: Usa bridge con puertos mapeados

### Proxy Configuration
El frontend contenedor está configurado para redirigir `/api` al backend local.

## Volumenes y Datos

### Backend
- **Source code**: Montado como volumen para desarrollo
- **Uploads**: `/app/uploads` persistente

### Frontend
- **Source code**: Montado como volumen para desarrollo
- **Node modules**: Excluido del volumen

### Portainer
- **Docker socket**: `/var/run/docker.sock` para gestión
- **Data**: `portainer_data` para configuración

## Monitorización con Portainer

### Acceder a Portainer
```
http://localhost:9000
```

### Qué puedes ver:
- **Dashboard**: Estado de todos los contenedores
- **Containers**: Logs, estadísticas, control
- **Images**: Imágenes disponibles
- **Volumes**: Almacenamiento persistente
- **Networks**: Configuración de redes

## Verificación del Sistema

### Probar Frontend Externo
```bash
curl -I https://monsoon-aim-mashed.ngrok-free.dev
```

### Probar API Externa
```bash
curl -X POST https://monsoon-aim-mashed.ngrok-free.dev/api/test-utf8 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"María González","mensaje":"¿Qué tal? áéíóú ñ"}'
```

### Probar Portainer
```bash
curl -I http://localhost:9000
```

## Resolución de Problemas

### Si un contenedor no inicia
```bash
# Ver logs
sudo podman logs nombre_contenedor

# Reconstruir imagen
cd directorio && sudo podman build -t nombre:imagen .

# Reiniciar contenedor
sudo podman rm -f nombre_contenedor
sudo podman run -d ... nombre_contenedor
```

### Si hay problemas de red
```bash
# Limpiar redes
sudo podman network prune -f

# Verificar puertos
ss -tlnp | grep -E "(4000|5179|9000|9443)"
```

## Características Verificadas

- [x] **Backend en contenedor**: Funcionando
- [x] **Frontend en contenedor**: Funcionando
- [x] **Portainer**: Gestión visual activa
- [x] **Ngrok**: Acceso externo configurado
- [x] **UTF-8**: Caracteres españoles perfectos
- [x] **API**: Comunicación frontend-backend
- [x] **Logs**: Visibles en Portainer

## Resumen

**Todo está corriendo en contenedores Docker/Podman:**

1. **Backend**: Contenedor con Node.js y API
2. **Frontend**: Contenedor con Vite y desarrollo
3. **Portainer**: Contenedor de gestión visual
4. **Ngrok**: Túnel externo para acceso

**Acceso completo**: https://monsoon-aim-mashed.ngrok-free.dev

---

**Estado**: Infraestructura completa en contenedores funcionando.
