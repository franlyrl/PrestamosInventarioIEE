#!/bin/bash

echo "🚀 Iniciando Sistema de Préstamos UTN..."
echo ""

# Verificar si los contenedores existen
BACKEND_EXISTS=$(sudo podman ps -a --format "{{.Names}}" | grep -c "^prestamos-backend$")
FRONTEND_EXISTS=$(sudo podman ps -a --format "{{.Names}}" | grep -c "^prestamos-frontend$")

# Iniciar backend
if [ "$BACKEND_EXISTS" -gt 0 ]; then
    echo "▶️  Iniciando backend..."
    sudo podman start prestamos-backend > /dev/null 2>&1
else
    echo "❌ Contenedor backend no existe. Creándolo..."
    sudo podman run -d \
        --name prestamos-backend \
        -p 4000:4000 \
        -e NODE_ENV=production \
        -e PORT=4000 \
        -e MONGODB_URI=mongodb://127.0.0.1:27017/inventarioEE \
        -e JWT_SECRET=tu_secreto_jwt_aqui \
        -e DB_NAME=inventarioEE \
        --network=host \
        localhost/prestamos-backend:latest
fi

# Iniciar frontend
if [ "$FRONTEND_EXISTS" -gt 0 ]; then
    echo "▶️  Iniciando frontend..."
    sudo podman start prestamos-frontend > /dev/null 2>&1
else
    echo "❌ Contenedor frontend no existe. Creándolo..."
    sudo podman run -d \
        --name prestamos-frontend \
        -p 5173:5173 \
        -e VITE_API_URL=http://127.0.0.1:4000/api \
        --network=host \
        -v /home/spiee/Documentos/PrestamosInventarioIEE\ \(3\)/PrestamosInventarioIEE/frontend:/app \
        -v /app/node_modules \
        prestamos-frontend
fi

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 3

echo ""
echo "✅ Sistema listo!"
echo ""
echo "📱 Accede al sistema:"
echo "   • Frontend: http://localhost:5173"
echo "   • Backend API: http://localhost:4000/api"
echo ""
echo "📋 Comandos útiles:"
echo "   ./detener-todo.sh     - Detener todo"
echo "   ./reiniciar-todo.sh   - Reiniciar todo"
echo ""
sudo podman ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | grep -E "NAMES|prestamos" || true
