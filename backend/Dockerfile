# Usar Node.js 18 Alpine
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Exponer el puerto 4000
EXPOSE 4000

# Variables de entorno
ENV NODE_ENV=production

# Iniciar la aplicación
CMD ["npm", "start"]
