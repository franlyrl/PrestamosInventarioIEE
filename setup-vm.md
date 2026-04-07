# Configuración de Máquina Virtual Docker para PrestamosInventarioIEE

## 🖥️ Pasos para crear la VM en VMware

### 1. Configuración de la VM
- **Nombre**: Prestamos-Docker-VM
- **SO**: Ubuntu Server 22.04 LTS
- **RAM**: 4GB (mínimo) / 8GB (recomendado)
- **CPU**: 2 núcleos (mínimo) / 4 núcleos (recomendado)
- **Disco**: 40GB
- **Red**: Bridge (para acceso desde red local)

### 2. Instalación de Ubuntu Server
- Descargar Ubuntu Server 22.04 LTS
- Instalar con opciones básicas
- Configurar red durante instalación
- Crear usuario: `dockeruser` (o el que prefieras)

### 3. Post-instalación en Ubuntu
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git vim net-tools

# Copiar script de instalación de Docker
# (Desde tu máquina host a la VM)
scp install-docker-ubuntu.sh dockeruser@IP_VM:/home/dockeruser/

# Ejecutar script
chmod +x install-docker-ubuntu.sh
./install-docker-ubuntu.sh

# Reiniciar sesión
exit
# Volver a iniciar sesión
```

### 4. Copiar proyecto a la VM
```bash
# Desde tu máquina Windows (cmd/PowerShell)
scp -r "c:\Users\Franly\Documents\PracticaProfesional\VERSION CORREGUIDA\PrestamosInventarioIEE\*" dockeruser@IP_VM:/home/dockeruser/prestamos-app/

# O usar Git si tienes el proyecto en un repositorio
git clone TU_REPOSITORIO_URL
```

### 5. Configurar para acceso externo
```bash
# Editar docker-compose para acceso externo
vim docker-compose-vm.yml

# Cambiar VITE_API_URL a la IP de la VM
# Ejemplo: VITE_API_URL: http://192.168.0.100:4000/api
```

### 6. Iniciar servicios
```bash
cd /home/dockeruser/prestamos-app
docker-compose -f docker-compose-vm.yml up --build -d
```

### 7. Verificar funcionamiento
```bash
# Ver contenedores corriendo
docker ps

# Ver logs
docker-compose -f docker-compose-vm.yml logs -f

# Probar acceso local
curl http://localhost:4000/api
curl http://localhost:5173
```

## 🌐 Configuración de Red

### Opción A: Red Bridge (Recomendado)
- La VM obtiene IP de tu router
- Accesible desde otros dispositivos de tu red
- Ej: `http://192.168.0.100:5173`

### Opción B: Red NAT + Port Forwarding
- VM usa IP interna de VMware
- Configurar port forwarding en VMware
- Mapear puertos 5173 y 4000

## 🔧 Configurar Port Forwarding en Router

Si quieres acceso externo (desde internet):

1. **Obtener IP de la VM**:
```bash
ip addr show
# Buscar la interfaz eth0 o similar
```

2. **Configurar en tu router**:
   - Puerto externo 5173 → IP_VM:5173
   - Puerto externo 4000 → IP_VM:4000

## 📱 Acceso a la Aplicación

### Desde tu red local:
- Frontend: `http://IP_VM:5173`
- Backend: `http://IP_VM:4000/api`

### Desde internet (con port forwarding):
- Frontend: `http://TU_IP_PUBLICA:5173`
- Backend: `http://TU_IP_PUBLICA:4000/api`

## 🛠️ Mantenimiento

### Actualizar contenedores:
```bash
docker-compose -f docker-compose-vm.yml pull
docker-compose -f docker-compose-vm.yml up --build -d
```

### Backup de base de datos:
```bash
docker exec prestamos_mongodb mongodump --out /backup
docker cp prestamos_mongodb:/backup ./backup-$(date +%Y%m%d)
```

### Reiniciar servicios:
```bash
docker-compose -f docker-compose-vm.yml restart
```

## 🔍 Solución de Problemas

### Si no funciona el acceso externo:
1. Verificar firewall de Ubuntu: `sudo ufw status`
2. Verificar firewall de VMware
3. Verificar configuración de red Bridge

### Si los contenedores no inician:
```bash
# Ver logs detallados
docker-compose -f docker-compose-vm.yml logs

# Reconstruir todo
docker-compose -f docker-compose-vm.yml down
docker-compose -f docker-compose-vm.yml up --build
```

## 📋 Resumen de Comandos Útiles
```bash
# Iniciar todo
docker-compose -f docker-compose-vm.yml up --build -d

# Ver estado
docker ps

# Ver logs
docker-compose -f docker-compose-vm.yml logs -f

# Detener todo
docker-compose -f docker-compose-vm.yml down

# Actualizar código
git pull
docker-compose -f docker-compose-vm.yml up --build -d
```
