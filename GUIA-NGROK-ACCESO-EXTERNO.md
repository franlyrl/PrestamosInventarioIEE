# Guía Ngrok - Acceso Externo

## Configuración para Acceso "por afuera"

### 1. Preparar Backend

```bash
# Asegurar que backend esté corriendo
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/backend
npm run dev
```

### 2. Iniciar Ngrok

```bash
# Detener ngrok si está corriendo
pkill ngrok 2>/dev/null || true

# Iniciar ngrok para el backend (puerto 4000)
ngrok http 4000 > ngrok.log 2>&1 &

# Esperar y verificar
sleep 5
curl -s http://localhost:4040/api/tunnels 2>/dev/null | jq '.tunnels[0].public_url' || echo "Revisar ngrok.log"
```

### 3. Obtener URL de Ngrok

```bash
# Ver logs de ngrok
tail -10 ngrok.log

# O obtener URL directamente
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

### 4. Configurar Frontend para URL Externa

```bash
# Editar login.html para usar URL de ngrok
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/frontend

# Reemplazar localhost con URL de ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
sed -i "s|http://localhost:4000/api|${NGROK_URL}/api|g" login.html

# También en app.js si es necesario
sed -i "s|'/api'|'${NGROK_URL}/api'|g" js/app.js
```

### 5. Iniciar Frontend

```bash
# En otra terminal
cd /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/frontend
npm run dev
```

### 6. Acceso Externo

Una vez configurado:

- **Frontend local**: http://localhost:5173 (con API externa)
- **Backend externo**: https://xxxxx.ngrok-free.dev/api
- **Acceso completo**: https://xxxxx.ngrok-free.dev/login.html

### 7. Comandos Útiles

```bash
# Ver estado de ngrok
curl http://localhost:4040/api/tunnels | jq

# Ver logs en tiempo real
tail -f ngrok.log

# Reiniciar ngrok
pkill ngrok && sleep 2 && ngrok http 4000 > ngrok.log 2>&1 &

# Restaurar configuración local
sed -i "s|${NGROK_URL}/api|http://localhost:4000/api|g" login.html
sed -i "s|'${NGROK_URL}/api'|'/api'|g" js/app.js
```

### 8. Verificación

```bash
# Probar API externa
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
curl -X POST ${NGROK_URL}/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"correo_electronico":"admin@utn.ac.cr","contrasena":"admin123"}'

# Probar UTF-8 externo
curl -X POST ${NGROK_URL}/api/test-utf8 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"María González","mensaje":"¿Qué tal? áéíóú ñ"}'
```

### 9. Solución de Problemas

```bash
# Si ngrok no funciona
pkill ngrok
ngrok http 4000 --log=stdout

# Si frontend no carga con URL externa
# Verificar que no haya CORS issues
curl -I ${NGROK_URL}/api/test-utf8

# Restaurar configuración local si es necesario
git checkout login.html js/app.js
```

### 10. URL Fija (Opcional)

```bash
# Si tienes cuenta ngrok pro
ngrok http 4000 --domain tu-dominio.ngrok.io > ngrok.log 2>&1 &

# O con dominio gratuito existente
ngrok http 4000 --url monsoon-aim-mashed.ngrok-free.dev > ngrok.log 2>&1 &
```

## Resumen Rápido

```bash
# 1. Iniciar backend
cd backend && npm run dev

# 2. Iniciar ngrok
ngrok http 4000 > ngrok.log 2>&1 &

# 3. Obtener URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

# 4. Configurar frontend
cd frontend
sed -i "s|http://localhost:4000/api|${NGROK_URL}/api|g" login.html

# 5. Iniciar frontend
npm run dev

# 6. Acceder
# Frontend: http://localhost:5173
# API: ${NGROK_URL}/api
```

---

**Nota**: Los caracteres UTF-8 (ñ, á, é, í, ó, ú) ya están configurados correctamente y funcionarán a través de ngrok.
