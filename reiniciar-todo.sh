#!/bin/bash

echo "🔄 Reiniciando Sistema de Préstamos UTN..."
sudo podman restart prestamos-backend prestamos-frontend 2>/dev/null || true
echo "⏳ Esperando..."
sleep 3
echo "✅ Sistema reiniciado"
echo ""
echo "📱 Accede al sistema:"
echo "   • Frontend: http://localhost:5173"
echo "   • Backend API: http://localhost:4000/api"
