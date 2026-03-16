# 🔧 Instalación de Dependencias - Proyecto UTN Existente

## 📋 Requisitos Previos

### Sistema Operativo
- Ubuntu 20.04+ / Debian 11+
- Node.js 18+ (o instalar con guía)
- MongoDB 7.0+ (o instalar con guía)

---

## 🚀 Instalación Rápida

### 1. Actualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js (si no tienes)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 3. Instalar MongoDB (si no tienes)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 📦 Instalación del Backend (Proyecto Existente)

### 1. Navegar al Directorio del Proyecto
```bash
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/backend
```

### 2. Verificar si existe package.json
```bash
ls -la package.json
```

### 3. Instalar Dependencias del Backend
```bash
npm install
```

### 4. Si no existe package.json, crearlo
```bash
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken multer helmet morgan compression express-rate-limit nodemailer socket.io swagger-jsdoc swagger-ui-express
npm install -D nodemon jest supertest eslint prettier
```

### 5. Crear archivo .env (si no existe)
```bash
cat > .env << 'EOF'
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/utn_sistema
JWT_SECRET=utn_jwt_secret_key_2024
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=utn@ejemplo.com
EMAIL_PASS=tu_contraseña
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
```

---

## 🎨 Configuración del Frontend (Proyecto Existente)

### 1. Navegar al Directorio Frontend
```bash
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/frontend
```

### 2. Verificar Estructura del Proyecto
```bash
ls -la
# Deberías ver:
# - index.html
# - components/
# - pages/
# - js/
# - css/
```

### 3. El Frontend no necesita npm install
- Usa **TailwindCSS** vía CDN
- Usa **JavaScript vanilla**
- Usa **Font Awesome** vía CDN

### 4. Verificar que los archivos HTML tengan los CDN correctos
```bash
# Verificar en index.html que tenga:
# <script src="https://cdn.tailwindcss.com"></script>
# <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

---

## 🚀 Ejecución del Proyecto Existente

### 1. Iniciar Backend
```bash
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/backend
npm run dev
# o si no tiene script dev:
npm start
# o directamente:
node server.js
```

### 2. Iniciar Frontend (en otra terminal)
```bash
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/frontend
python3 -m http.server 8000
# o:
python3 -m http.server 3000
```

### 3. Acceder al Sistema
- **Frontend**: http://localhost:8000 o http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

---

## 🔧 Verificación de Instalación

### 1. Verificar Backend
```bash
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/backend
npm list --depth=0
node server.js
# En otra terminal:
curl http://localhost:4000/api/health
```

### 2. Verificar Frontend
```bash
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/frontend
ls -la js/
ls -la components/
ls -la pages/
python3 -m http.server 8000
# Abrir http://localhost:8000 en navegador
```

### 3. Verificar MongoDB
```bash
sudo systemctl status mongod
mongo --eval "db.adminCommand('ismaster')"
```

---

## 🐛 Solución de Problemas Comunes

### Problema: "command not found: node"
```bash
# Reinstalar Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Problema: "MongoDB connection failed"
```bash
# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
# Verificar status
sudo systemctl status mongod
```

### Problema: "Port already in use"
```bash
# Ver qué usa el puerto
sudo lsof -i :4000
sudo lsof -i :8000
# Matar proceso
sudo kill -9 <PID>
```

### Problema: "Cannot find module"
```bash
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/backend
npm install
# Si sigue fallando:
npm cache clean --force
npm install
```

### Problema: "Frontend no carga CSS/JS"
```bash
# Verificar que los archivos existan
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/frontend
ls -la js/main.js
ls -la css/main.css
# Verificar rutas en index.html
grep -n "script src=" index.html
grep -n "link rel=" index.html
```

---

## 📁 Estructura Esperada del Proyecto

### Backend
```
PrestamosInventarioIEE/backend/
├── package.json          # ✅ Debe existir
├── .env                 # ✅ Crear si no existe
├── server.js            # ✅ Debe existir
├── models/              # ✅ Debe existir
├── routes/              # ✅ Debe existir
├── controllers/         # ✅ Debe existir
├── middleware/          # ✅ Debe existir
└── uploads/             # ✅ Crear si no existe
```

### Frontend
```
PrestamosInventarioIEE/frontend/
├── index.html           # ✅ Debe existir
├── components/          # ✅ Debe existir
│   └── header.html      # ✅ Debe existir
├── pages/              # ✅ Debe existir
│   ├── index.html       # ✅ Debe existir
│   ├── solicitudes.html # ✅ Debe existir
│   ├── perfil.html      # ✅ Debe existir
│   └── ...
├── js/                 # ✅ Debe existir
│   ├── main.js         # ✅ Debe existir
│   ├── components/     # ✅ Debe existir
│   └── pages/          # ✅ Debe existir
└── css/                # ✅ Debe existir
    └── main.css        # ✅ Debe existir
```

---

## 🎉 Resumen de Comandos

### Instalación Completa (Una línea)
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js si no tienes
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs

# Instalar MongoDB si no tienes
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add - && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list && sudo apt-get update && sudo apt-get install -y mongodb-org && sudo systemctl start mongod && sudo systemctl enable mongod

# Instalar dependencias del backend
cd /ruta/a/tu/proyecto/PrestamosInventarioIEE/backend && npm install

# Iniciar servicios
npm run dev &  # Backend
cd ../frontend && python3 -m http.server 8000 &  # Frontend
```

---

## ✅ Verificación Final

### Test de Funcionamiento
```bash
# 1. Verificar backend
curl http://localhost:4000/api/health

# 2. Verificar frontend
curl http://localhost:8000

# 3. Verificar MongoDB
sudo systemctl status mongod

# 4. Verificar Node.js
node --version && npm --version
```

---

## 🚀 ¡Listo!

Con estos comandos, tu proyecto UTN existente debería funcionar perfectamente en Linux:

1. **Backend**: `cd backend && npm run dev`
2. **Frontend**: `cd frontend && python3 -m http.server 8000`
3. **Acceder**: http://localhost:8000

**¡Tu proyecto UTN está listo para usar en Linux! 🎉**
