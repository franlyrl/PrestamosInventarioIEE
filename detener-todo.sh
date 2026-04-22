#!/bin/bash

echo "🛑 Deteniendo Sistema de Préstamos UTN..."
sudo podman stop prestamos-backend prestamos-frontend 2>/dev/null || true
echo "✅ Sistema detenido"
