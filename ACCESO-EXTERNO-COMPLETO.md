# Acceso Externo Completo - Fuera del Servidor

## Configuración Actual

### Servicios Corriendo
- **Backend**: localhost:4000 (UTF-8 configurado)
- **Frontend**: localhost:5178 (accesible desde red)
- **Ngrok**: https://monsoon-aim-mashed.ngrok-free.dev

## URLs de Acceso Externo

### Principal (via ngrok)
- **Frontend completo**: https://monsoon-aim-mashed.ngrok-free.dev
- **Login**: https://monsoon-aim-mashed.ngrok-free.dev/login.html
- **API**: https://monsoon-aim-mashed.ngrok-free.dev/api

### Red Local (si estás en la misma red)
- **Frontend**: http://10.90.29.31:5178
- **Frontend**: http://100.71.147.126:5178

## Para Acceder desde Fuera

### Opción 1: Via ngrok (Recomendado)
```
URL: https://monsoon-aim-mashed.ngrok-free.dev
Login: https://monsoon-aim-mashed.ngrok-free.dev/login.html
```

### Opción 2: Via IP local (si estás en la misma red)
```
http://10.90.29.31:5178
http://100.71.147.126:5178
```

## Credenciales
- **Usuario**: admin@utn.ac.cr
- **Contraseña**: (contraseña por defecto del sistema)

## Comandos para Mantener Activo

### Terminal 1 - Backend
```bash
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### Terminal 3 - Ngrok
```bash
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE
ngrok http 5178
```

## Verificación

### Probar acceso externo
```bash
# Verificar que ngrok responda
curl -I https://monsoon-aim-mashed.ngrok-free.dev

# Probar login externo
curl -I https://monsoon-aim-mashed.ngrok-free.dev/login.html

# Probar API externa
curl -X POST https://monsoon-aim-mashed.ngrok-free.dev/api/test-utf8 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"María González","mensaje":"¿Qué tal? áéíóú ñ"}'
```

## Solución de Problemas

### Si ngrok no funciona
```bash
# Reiniciar ngrok
pkill ngrok
ngrok http 5178
```

### Si frontend no carga
```bash
# Reiniciar frontend
pkill -f vite
cd frontend && npm run dev -- --host 0.0.0.0 --port 5173
```

### Si backend no responde
```bash
# Reiniciar backend
pkill -f "node.*server.js"
cd backend && npm run dev
```

## Configuración de Red

### Frontend (vite.config.js)
```javascript
server: {
  host: '0.0.0.0',  // Acepta conexiones de cualquier IP
  port: 5173,
  allowedHosts: ['monsoon-aim-mashed.ngrok-free.dev', '.ngrok-free.dev']
}
```

### Backend CORS
El backend ya está configurado para permitir:
- http://localhost:5173
- https://monsoon-aim-mashed.ngrok-free.dev
- Todas las IPs de red local

## Características Verificadas

- [x] **Acceso externo**: ngrok funcionando
- [x] **UTF-8**: Caracteres españoles perfectos
- [x] **Login**: Funcionando externamente
- [x] **API**: Respondiendo vía ngrok
- [x] **Red local**: IPs accesibles

## Resumen

**Para acceder desde fuera de tu servidor:**

1. **Abre**: https://monsoon-aim-mashed.ngrok-free.dev
2. **Login**: admin@utn.ac.cr
3. **Listo**: Tienes acceso completo a la aplicación

La aplicación está completamente accesible desde internet con UTF-8 configurado correctamente.

---

**Estado**: Todo funcionando para acceso externo.
