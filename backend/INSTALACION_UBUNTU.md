# 📦 Guía de Instalación - PrestamosInventarioIEE
### Ubuntu 22.04 LTS de 64 bits

## 🚀 **Resumen Rápido**
```bash
# Copia y pega este comando para instalar todo de una vez
sudo apt update && sudo apt install -y nodejs npm mongodb git curl && sudo systemctl start mongod && sudo systemctl enable mongod && git clone <TU_REPOSITORIO> && cd PrestamosInventarioIEE && npm install && npm start
```

---

## � **Librerías y Dependencias del Proyecto**

### Dependencias Principales (package.json):
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",              // Hashing de contraseñas
    "bcryptjs": "^3.0.3",            // Hashing compatible con browser
    "cors": "^2.8.6",                // Cross-Origin Resource Sharing
    "dotenv": "^17.2.3",             // Variables de entorno
    "express": "^5.2.1",             // Framework web
    "express-rate-limit": "^8.2.1",  // Límite de peticiones
    "express-validator": "^7.3.1",   // Validación de datos
    "helmet": "^8.1.0",              // Seguridad HTTP headers
    "jsonwebtoken": "^9.0.3",         // Tokens JWT
    "mongoose": "^9.1.5",            // ODM para MongoDB
    "morgan": "^1.10.1",             // Logger HTTP requests
    "multer": "^2.1.0"               // Upload de archivos
  },
  "devDependencies": {
    "nodemon": "^3.1.11"             // Recarga automática en desarrollo
  }
}
```

---

## � **1. Instalación de Node.js y npm**

### Opción A: Desde repositorios (Recomendado)
```bash
# Actualizar paquetes
sudo apt update

# Instalar Node.js y npm
sudo apt install -y nodejs npm

# Verificar versiones
node --version  # Debe ser v16.x o superior
npm --version   # Debe ser 8.x o superior
```

### Opción B: Usando NodeSource (última versión)
```bash
# Instalar Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

---

## 🗄️ **2. Instalación de MongoDB**

### Instalar MongoDB Community Edition
```bash
# Importar la clave GPG
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Agregar el repositorio
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Actualizar paquetes
sudo apt update

# Instalar MongoDB
sudo apt install -y mongodb-org

# Iniciar y habilitar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar estado
sudo systemctl status mongod
```

### Configurar MongoDB
```bash
# Conectar a MongoDB
mongosh

# Crear base de datos (opcional, se crea automáticamente)
use prestamos_inventario

# Salir
exit
```

---

## 🛠️ **3. Herramientas Adicionales**

### Git
```bash
# Instalar Git
sudo apt install -y git

# Configurar Git (opcional)
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### cURL
```bash
# Instalar cURL
sudo apt install -y curl
```

### Editor de texto (opcional)
```bash
# Visual Studio Code
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install -y code

# Nano (editor simple)
sudo apt install -y nano
```

---

## 📁 **4. Clonar y Configurar el Proyecto**

### Clonar el repositorio
```bash
# Clonar tu repositorio
git clone https://github.com/franlyrl/PrestamosInventarioIEE.git

# O si es local:
# git clone <URL_DE_TU_REPOSITORIO>

# Entrar al directorio
cd PrestamosInventarioIEE
```

### Instalar dependencias
```bash
# Instalar todas las dependencias del package.json
npm install

# Esto instalará automáticamente:
# - bcrypt, bcryptjs (hashing de contraseñas)
# - cors (permisos跨域)
# - dotenv (variables de entorno)
# - express (framework web)
# - express-rate-limit (límite de peticiones)
# - express-validator (validación)
# - helmet (seguridad)
# - jsonwebtoken (tokens JWT)
# - mongoose (ODM MongoDB)
# - morgan (logger HTTP requests)
# - multer (upload archivos)
# - nodemon (desarrollo)

# Verificar instalación
ls node_modules/
```

### Scripts disponibles
```bash
# Iniciar en producción
npm start

# Iniciar en desarrollo (con nodemon)
npm run dev

# Ver otros scripts
npm run
```

---

## 🔐 **5. Variables de Entorno**

### Crear archivo .env
```bash
# Copiar archivo de ejemplo (si existe)
cp .env.example .env

# O crear uno nuevo
nano .env
```

### Contenido del archivo .env
```env
# Configuración del servidor
PORT=4000
NODE_ENV=development

# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/prestamos_inventario

# JWT Secret
JWT_SECRET=tu_secreto_super_seguro_aqui

# Otras configuraciones
BCRYPT_ROUNDS=10
```

---

## 🚀 **6. Ejecutar la Aplicación**

### Iniciar el servidor
```bash
# Modo desarrollo (con nodemon y morgan logs)
npm run dev

# Modo producción
npm start

# Ver logs de morgan en consola
# GET /api/usuarios 200 15.123 ms
# POST /api/usuarios/login 200 8.456 ms
# etc.
```

### Verificar que funciona
```bash
# En otra terminal
curl http://localhost:4000/api/usuarios/login

# O en navegador
# http://localhost:4000
```

---

## 📋 **7. Verificación de Instalación**

### Verificar Node.js
```bash
node --version
# v18.19.0 (o similar)
```

### Verificar npm
```bash
npm --version
# 9.2.0 (o similar)
```

### Verificar MongoDB
```bash
mongosh --version
# 7.0.0 (o similar)

# Verificar que MongoDB está corriendo
sudo systemctl status mongod
```

### Verificar el proyecto
```bash
# Verificar que el servidor responde
curl -X POST http://localhost:4000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"correo_electronico": "ashla@utn.ac.cr", "contrasena": "uttntutututut"}'

# Ver logs de Morgan (deberías ver en consola del servidor)
# POST /api/usuarios/login 200 12.345 ms - 123
```

---

## 🛠️ **8. Comandos Útiles**

### Administrar MongoDB
```bash
# Iniciar MongoDB
sudo systemctl start mongod

# Detener MongoDB
sudo systemctl stop mongod

# Reiniciar MongoDB
sudo systemctl restart mongod

# Ver estado
sudo systemctl status mongod

# Ver logs
sudo journalctl -u mongod
```

### Administrar la aplicación
```bash
# Ver procesos de Node.js
ps aux | grep node

# Matar proceso (si es necesario)
kill -9 <PID>

# Ver logs en tiempo real
tail -f logs/app.log  # si tienes logs configurados
```

### Actualizar paquetes
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade

# Actualizar npm
npm update -g

# Actualizar dependencias del proyecto
npm update
```

---

## 🔧 **9. Solución de Problemas Comunes**

### Problema: "command not found: node"
```bash
# Reinstalar Node.js
sudo apt remove --purge nodejs npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Problema: MongoDB no inicia
```bash
# Verificar permisos
sudo chown -R mongodb:mongodb /var/lib/mongodb

# Reiniciar MongoDB
sudo systemctl restart mongod

# Ver logs
sudo journalctl -u mongod
```

### Problema: Error de permisos
```bash
# Cambiar permisos del directorio
sudo chown -R $USER:$USER /ruta/al/proyecto

# O ejecutar con sudo (no recomendado para desarrollo)
sudo npm start
```

### Problema: Puerto 4000 ocupado
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :4000

# Matar el proceso
sudo kill -9 <PID>

# O cambiar el puerto en .env
PORT=3000
```

---

## 🚀 **10. Instalación Automática (Script)**

### Crear script de instalación
```bash
# Crear archivo
nano install.sh

# Pegar este contenido:
#!/bin/bash

echo "🚀 Instalando PrestamosInventarioIEE en Ubuntu 22.04..."

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js y npm
echo "📦 Instalando Node.js y npm..."
sudo apt install -y nodejs npm git curl

# Instalar MongoDB
echo "🗄️ Instalando MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar y habilitar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Clonar repositorio (reemplazar con tu URL)
echo "📁 Clonando repositorio..."
git clone https://github.com/franlyrl/PrestamosInventarioIEE.git
cd PrestamosInventarioIEE

# Instalar dependencias
echo "🛠️ Instalando dependencias..."
npm install

# Crear .env
echo "🔐 Creando archivo .env..."
cat > .env << EOF
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/prestamos_inventario
JWT_SECRET=tu_secreto_super_seguro_aqui
BCRYPT_ROUNDS=10
EOF

echo "✅ Instalación completada!"
echo "🚀 Ejecuta 'npm start' para iniciar la aplicación"

# Hacer ejecutable y correr
chmod +x install.sh
./install.sh
```

---

## 📊 **11. Requisitos del Sistema**

### Mínimos recomendados:
- **RAM:** 2GB (4GB recomendado)
- **CPU:** 2 núcleos (4 recomendado)
- **Almacenamiento:** 20GB libres
- **Red:** Conexión a internet

### Verificar recursos del sistema:
```bash
# Ver RAM
free -h

# Ver CPU
lscpu

# Ver espacio en disco
df -h

# Ver versión de Ubuntu
lsb_release -a
```

---

## 🎯 **12. Resumen Final de Comandos**

### Para empezar desde cero:
```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar todo
sudo apt install -y nodejs npm mongodb-org git curl

# 3. Configurar MongoDB
sudo systemctl start mongod && sudo systemctl enable mongod

# 4. Clonar proyecto
git clone <TU_REPOSITORIO> && cd PrestamosInventarioIEE

# 5. Instalar dependencias
npm install

# 6. Configurar variables de entorno
nano .env

# 7. Iniciar aplicación
npm start
```

### Para desarrollo continuo:
```bash
cd PrestamosInventarioIEE
npm start
# Ctrl+C para detener

# Para desarrollo con recarga automática
npm run dev
```

---

## 📞 **13. Soporte y Recursos**

### Documentación útil:
- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Ubuntu Documentation](https://ubuntu.com/server/docs)

### Comandos de ayuda:
```bash
# Ayuda de Node.js
node --help

# Ayuda de npm
npm --help

# Ayuda de MongoDB
mongosh --help

# Ayuda de systemctl
systemctl --help
```

---

## ✅ **14. Checklist de Verificación**

- [ ] Ubuntu 22.04 actualizado
- [ ] Node.js v16+ instalado
- [ ] npm v8+ instalado
- [ ] MongoDB instalado y corriendo
- [ ] Git instalado
- [ ] Proyecto clonado
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Servidor iniciado y funcionando
- [ ] API responde en http://localhost:4000

---

**🎉 ¡Listo! Ahora puedes ejecutar tu aplicación PrestamosInventarioIEE en Ubuntu 22.04**
