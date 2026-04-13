# 🚀 Instalación Completa - UTN Sistema de Gestión

## 📋 Requisitos Previos

### Sistema Operativo
- Ubuntu 20.04+ / Debian 11+
- 4GB RAM mínimo
- 10GB espacio en disco

---

## 🔧 Instalación del Sistema

### 1. Actualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js (LTS)
```bash
# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 3. Instalar MongoDB
```bash
# Importar clave pública
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Agregar repositorio
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar y habilitar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar MongoDB
sudo systemctl status mongod
```

---

## 📦 Instalación del Backend

### 1. Crear Directorio del Proyecto
```bash
mkdir -p ~/utn-sistema/backend
cd ~/utn-sistema/backend
```

### 2. Inicializar Proyecto Node.js
```bash
npm init -y
```

### 3. Crear package.json
```bash
cat > package.json << 'EOF'
{
  "name": "utn-backend",
  "version": "1.0.0",
  "description": "Backend del Sistema de Gestión UTN",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.10.0",
    "nodemailer": "^6.9.4",
    "socket.io": "^4.7.2",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4",
    "supertest": "^6.3.3",
    "eslint": "^8.47.0",
    "prettier": "^3.0.2"
  },
  "keywords": ["utn", "gestion", "backend", "api"],
  "author": "UTN",
  "license": "MIT"
}
EOF
```

### 4. Instalar Dependencias
```bash
npm install
```

### 5. Crear Archivos Básicos del Backend
```bash
# Crear servidor principal
cat > server.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 peticiones
});
app.use(limiter);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/utn_sistema', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error MongoDB:', err));

// Rutas básicas
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend UTN funcionando' });
});

// Rutas de autenticación
app.post('/api/auth/login', (req, res) => {
  // TODO: Implementar lógica de login
  res.json({ message: 'Login endpoint' });
});

// Rutas de solicitudes
app.get('/api/solicitudes', (req, res) => {
  // TODO: Implementar lógica de solicitudes
  res.json({ message: 'Solicitudes endpoint' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});
EOF

# Crear archivo de entorno
cat > .env << 'EOF'
# Configuración del Backend
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/utn_sistema
JWT_SECRET=utn_jwt_secret_key_2024
JWT_EXPIRE=7d

# Configuración de Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=utn@ejemplo.com
EMAIL_PASS=tu_contraseña

# Configuración de Archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF

# Crear estructura de directorios
mkdir -p models routes controllers middleware uploads
```

---

## 🎨 Instalación del Frontend

### 1. Crear Directorio del Frontend
```bash
cd ~/utn-sistema
mkdir -p frontend/{js/{components,pages,utils},css,components,pages,assets}
```

### 2. Crear Archivo HTML Principal
```bash
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UTN - Sistema de Gestión</title>
    
    <!-- TailwindCSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Personalizado -->
    <link rel="stylesheet" href="css/main.css">
</head>
<body class="text-slate-800">
    <!-- Header Component -->
    <div id="header-component"></div>
    
    <!-- Contenido Principal -->
    <main class="container mx-auto py-6">
        <h1 class="text-3xl font-bold text-center mb-8">Sistema de Gestión UTN</h1>
        
        <!-- Sección de Login -->
        <div id="login-section" class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold mb-4">Iniciar Sesión</h2>
            <form id="login-form">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Email</label>
                    <input type="email" id="email" class="w-full px-3 py-2 border rounded-lg" required>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Contraseña</label>
                    <input type="password" id="password" class="w-full px-3 py-2 border rounded-lg" required>
                </div>
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    Iniciar Sesión
                </button>
            </form>
        </div>
        
        <!-- Sección Principal (oculta inicialmente) -->
        <div id="main-section" class="hidden">
            <p>Bienvenido al sistema UTN</p>
        </div>
    </main>

    <!-- JavaScript -->
    <script src="js/main.js"></script>
</body>
</html>
EOF
```

### 3. Crear Archivo CSS Principal
```bash
cat > frontend/css/main.css << 'EOF'
/* Estilos principales del Sistema UTN */

/* Variables CSS */
:root {
  --utn-blue: #1e40af;
  --utn-blue-light: #3b82f6;
  --utn-gray: #64748b;
  --utn-green: #16a34a;
  --utn-red: #dc2626;
}

/* Estilos base */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* Componentes */
.utn-blue {
  background-color: var(--utn-blue) !important;
}

.utn-text {
  color: var(--utn-blue) !important;
}

/* Animaciones */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
}
EOF
```

### 4. Crear Archivo JavaScript Principal
```bash
cat > frontend/js/main.js << 'EOF'
// Configuración global
window.CONFIG = {
  API_BASE_URL: 'http://localhost:4000/api',
  APP_NAME: 'UTN Sistema de Gestión',
  VERSION: '1.0.0'
};

// Función principal
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Sistema UTN iniciado');
  
  // Verificar si hay sesión activa
  const token = localStorage.getItem('utn_token');
  const user = localStorage.getItem('utn_user');
  
  if (token && user) {
    showMainSection();
  } else {
    showLoginSection();
  }
});

// Mostrar sección de login
function showLoginSection() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('main-section').classList.add('hidden');
}

// Mostrar sección principal
function showMainSection() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('main-section').classList.remove('hidden');
}

// Manejar login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch(`${window.CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('utn_token', data.token);
      localStorage.setItem('utn_user', JSON.stringify(data.user));
      showMainSection();
    } else {
      alert('Error en el login');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
});
EOF
```

---

## 🚀 Ejecución del Sistema

### 1. Iniciar Backend
```bash
cd ~/utn-sistema/backend
npm run dev
```

### 2. Iniciar Frontend (Opción A: Python)
```bash
cd ~/utn-sistema/frontend
python3 -m http.server 8000
```

### 3. Iniciar Frontend (Opción B: Servidor Node.js)
```bash
cd ~/utn-sistema
npm install -g http-server
http-server frontend -p 8000
```

---

## 🌐 Acceso al Sistema

### URLs de Acceso
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

---

## 🔧 Configuración Adicional

### 1. Configurar Firewall
```bash
# Permitir puertos 4000 y 8000
sudo ufw allow 4000
sudo ufw allow 8000
sudo ufw enable
```

### 2. Crear Scripts de Inicio
```bash
# Script para iniciar backend
cat > ~/utn-sistema/start-backend.sh << 'EOF'
#!/bin/bash
cd ~/utn-sistema/backend
npm run dev
EOF

# Script para iniciar frontend
cat > ~/utn-sistema/start-frontend.sh << 'EOF'
#!/bin/bash
cd ~/utn-sistema/frontend
python3 -m http.server 8000
EOF

# Hacer scripts ejecutables
chmod +x ~/utn-sistema/start-*.sh
```

---

## ✅ Verificación de Instalación

### Comprobar Servicios
```bash
# Verificar Node.js
node --version && npm --version

# Verificar MongoDB
sudo systemctl status mongod

# Verificar archivos del proyecto
ls -la ~/utn-sistema/
ls -la ~/utn-sistema/backend/
ls -la ~/utn-sistema/frontend/

# Probar API
curl http://localhost:4000/api/health
```

---

## 🐛 Solución de Problemas

### Problemas Comunes

#### 1. MongoDB no inicia
```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

#### 2. Puerto en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :4000
sudo lsof -i :8000

# Matar proceso
sudo kill -9 <PID>
```

#### 3. Permisos de archivos
```bash
chmod -R 755 ~/utn-sistema/
```

---

## 📚 Documentación Adicional

### Estructura del Proyecto
```
utn-sistema/
├── backend/
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas API
│   ├── controllers/     # Controladores
│   ├── middleware/       # Middleware
│   ├── uploads/         # Archivos subidos
│   ├── server.js        # Servidor principal
│   ├── package.json     # Dependencias
│   └── .env            # Variables de entorno
└── frontend/
    ├── js/
    │   ├── components/  # Componentes JS
    │   ├── pages/       # Páginas JS
    │   └── main.js      # JS principal
    ├── css/
    │   └── main.css     # Estilos principales
    ├── components/      # Componentes HTML
    ├── pages/          # Páginas HTML
    └── index.html      # Página principal
```

---

## 🎉 ¡Listo!

El sistema UTN está completamente instalado y listo para usar. Para iniciar el sistema:

1. **Iniciar backend**: `cd ~/utn-sistema/backend && npm run dev`
2. **Iniciar frontend**: `cd ~/utn-sistema/frontend && python3 -m http.server 8000`
3. **Acceder**: http://localhost:8000

**¡Éxito con el sistema UTN! 🚀**
