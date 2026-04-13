#!/bin/bash

# Instalar Docker en Ubuntu Server
echo "🐳 Instalando Docker en Ubuntu..."

# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Agregar clave GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Iniciar y habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario actual al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
echo "✅ Docker instalado correctamente"
docker --version
docker-compose --version

echo "🔄 Por favor, cierra sesión y vuelve a iniciar para aplicar los cambios de grupo"

# Crear directorio para el proyecto
mkdir -p /home/$USER/prestamos-app
cd /home/$USER/prestamos-app

echo "📁 Directorio de trabajo creado: /home/$USER/prestamos-app"
echo "📋 Siguientes pasos:"
echo "1. Copia tu proyecto aquí: /home/$USER/prestamos-app"
echo "2. Ejecuta: docker-compose up --build"
