# Comandos Docker para Gestión de Contenedores

## 🚀 Iniciar y Detener

### Iniciar todos los servicios
```bash
docker-compose -f docker-compose-portainer.yml up --build -d
```

### Detener todos los servicios
```bash
docker-compose -f docker-compose-portainer.yml down
```

### Reiniciar un servicio específico
```bash
docker-compose -f docker-compose-portainer.yml restart backend
docker-compose -f docker-compose-portainer.yml restart frontend
```

## 📊 Ver Estado y Logs

### Ver todos los contenedores corriendo
```bash
docker ps
```

### Ver todos los contenedores (incluyendo detenidos)
```bash
docker ps -a
```

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose-portainer.yml logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose -f docker-compose-portainer.yml logs -f backend
docker-compose -f docker-compose-portainer.yml logs -f frontend
```

## 🔧 Gestión de Contenedores

### Entrar a un contenedor (terminal)
```bash
docker exec -it prestamos_backend bash
docker exec -it prestamos_frontend sh
docker exec -it prestamos_mongodb mongosh
```

### Ver recursos usados
```bash
docker stats
```

### Ver detalles de un contenedor
```bash
docker inspect prestamos_backend
```

## 📁 Gestión de Volúmenes

### Listar volúmenes
```bash
docker volume ls
```

### Ver detalles de un volumen
```bash
docker volume inspect mongodb_data
```

### Backup de base de datos MongoDB
```bash
docker exec prestamos_mongodb mongodump --out /backup
docker cp prestamos_mongodb:/backup ./backup-$(date +%Y%m%d)
```

## 🌐 Acceso a Interfaces

### Portainer (Interfaz Web)
- URL: http://IP_VM:9000
- Usuario: Admin (crear primer vez)
- Contraseña: La definas al inicio

### Aplicación Web
- Frontend: http://IP_VM:5173
- Backend API: http://IP_VM:4000/api

### Base de Datos
- MongoDB: mongodb://admin:password123@IP_VM:27017/prestamos_lab

## 🔄 Actualización y Mantenimiento

### Actualizar imágenes
```bash
docker-compose -f docker-compose-portainer.yml pull
```

### Reconstruir contenedores
```bash
docker-compose -f docker-compose-portainer.yml up --build --force-recreate
```

### Limpiar sistema Docker
```bash
docker system prune -a
```

## 🚨 Solución de Problemas

### Si un contenedor no inicia
```bash
# Ver logs del error
docker-compose -f docker-compose-portainer.yml logs nombre_contenedor

# Reconstruir solo ese contenedor
docker-compose -f docker-compose-portainer.yml up --build nombre_contenedor
```

### Si hay problemas de red
```bash
# Ver redes Docker
docker network ls

# Ver detalles de red
docker network inspect prestamos_prestamos_network
```

### Si hay problemas de permisos
```bash
# Verificar permisos de volúmenes
ls -la ./backend/uploads
sudo chown -R 1000:1000 ./backend/uploads
```

## 📱 Monitoreo Básico

### Script para verificar estado
```bash
#!/bin/bash
echo "=== Estado de Contenedores ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== Uso de Recursos ==="
docker stats --no-stream

echo -e "\n=== Espacio en Disco ==="
df -h

echo -e "\n=== Memoria ==="
free -h
```

## 🎯 Comandos Útiles Rápidos

### Reiniciar todo rápidamente
```bash
docker-compose -f docker-compose-portainer.yml down && docker-compose -f docker-compose-portainer.yml up --build -d
```

### Ver solo contenedores de tu app
```bash
docker ps --filter "name=prestamos"
```

### Limpiar logs antiguos
```bash
docker container prune -f
```
