# Ngrok Configurado - Acceso Externo Funcionando

## Configuración Actual

### Backend
- **Estado**: Corriendo en puerto 4000
- **UTF-8**: Configurado correctamente
- **URL Externa**: https://monsoon-aim-mashed.ngrok-free.dev

### Frontend  
- **Estado**: Corriendo en puerto 5175
- **Proxy**: Redirige /api a ngrok
- **URL Local**: http://localhost:5175

## URLs de Acceso

### Para desarrollo local:
- **Frontend**: http://localhost:5175
- **Backend via proxy**: http://localhost:5175/api

### Para acceso externo:
- **Frontend**: https://monsoon-aim-mashed.ngrok-free.dev (si se configura)
- **Backend API**: https://monsoon-aim-mashed.ngrok-free.dev/api
- **Login**: admin@utn.ac.cr / (contraseña por defecto)

## Comandos para Iniciar

### 1. Backend (Terminal 1)
```bash
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/backend
npm run dev
```

### 2. Ngrok (Terminal 2)
```bash
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE
ngrok http 4000 --log=stdout > ngrok-new.log 2>&1 &
```

### 3. Frontend (Terminal 3)
```bash
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/frontend
npm run dev
```

## Verificación

### Probar API externa:
```bash
curl -X POST https://monsoon-aim-mashed.ngrok-free.dev/api/test-utf8 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"María González","mensaje":"¿Qué tal? áéíóú ñ"}'
```

### Probar login:
```bash
curl -X POST https://monsoon-aim-mashed.ngrok-free.dev/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"correo_electronico":"admin@utn.ac.cr","contrasena":"admin123"}'
```

## Configuración Aplicada

### vite.config.js
```javascript
allowedHosts: ['localhost', '127.0.0.1', 'monsoon-aim-mashed.ngrok-free.dev', '.ngrok-free.dev'],

proxy: {
  '/api': {
    target: 'https://monsoon-aim-mashed.ngrok-free.dev',
    changeOrigin: true,
    secure: false
  }
}
```

## Logs

### Ver logs de ngrok:
```bash
tail -f ngrok-new.log
```

### Ver logs de frontend:
```bash
tail -f frontend-ngrok.log
```

## Características Verificadas

- [x] UTF-8 funciona correctamente (ñ, á, é, í, ó, ú, ¿, ¡)
- [x] API responde vía ngrok
- [x] Frontend redirige a ngrok via proxy
- [x] Login funciona externamente
- [x] CORS configurado correctamente

## Solución de Problemas

### Si el frontend no carga:
```bash
# Reiniciar frontend
pkill -f "vite\|npm.*dev"
cd frontend && npm run dev
```

### Si ngrok no funciona:
```bash
# Reiniciar ngrok
pkill ngrok
ngrok http 4000 --log=stdout > ngrok-new.log 2>&1 &
```

### Si hay errores CORS:
El backend ya está configurado para permitir ngrok en los orígenes CORS.

## Resumen

La aplicación ahora está completamente accesible desde internet con:
- **Backend**: https://monsoon-aim-mashed.ngrok-free.dev/api
- **Frontend local**: http://localhost:5175 (con API externa)
- **UTF-8**: Funcionando perfectamente
- **Caracteres españoles**: ñ, á, é, í, ó, ú soportados

---

**Estado**: Todo funcionando correctamente.
