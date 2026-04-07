# Usar Node.js 18 Alpine
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Exponer el puerto 5173
EXPOSE 5173

# Variables de entorno
ENV NODE_ENV=development

# Iniciar el servidor de desarrollo
CMD ["npm", "run", "dev"]
