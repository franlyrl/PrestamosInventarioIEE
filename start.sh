#!/bin/bash

# Script de inicio rápido para el Sistema de Préstamos UTN
# Compatible con Docker y Podman

echo "🚀 Iniciando Sistema de Préstamos UTN..."

# Detectar si estamos usando podman o docker
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: No se encontró docker-compose ni podman-compose"
    echo "Instala con: sudo apt install podman-compose"
    exit 1
fi

# Crear directorio uploads si no existe
mkdir -p backend/uploads/items

echo "📦 Usando: $COMPOSE_CMD"
echo "🔧 Construyendo e iniciando contenedores..."
echo ""

# Levantar servicios
sudo $COMPOSE_CMD up --build -d

# Verificar estado
echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 5

# Mostrar estado
sudo $COMPOSE_CMD ps

echo ""
echo "✅ Sistema iniciado!"
echo ""
echo "📱 URLs disponibles:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:4000/api"
echo "   - MongoDB: localhost:27017"
echo ""
echo "📋 Comandos útiles:"
echo "   - Ver logs: sudo $COMPOSE_CMD logs -f"
echo "   - Detener: sudo $COMPOSE_CMD down"
echo "   - Reiniciar: sudo $COMPOSE_CMD restart"
