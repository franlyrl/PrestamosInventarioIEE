# Docker para PrestamosInventarioIEE

## Requisitos
- Docker Desktop instalado
- Docker Compose

## Ejecutar el proyecto completo

### 1. Construir y iniciar todos los servicios
```bash
docker-compose up --build
```

### 2. Ejecutar en modo detached (segundo plano)
```bash
docker-compose up --build -d
```

### 3. Detener los servicios
```bash
docker-compose down
```

### 4. Ver logs
```bash
docker-compose logs -f
```

### 5. Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

## Servicios

### Frontend
- URL: http://localhost:5173
- Container: prestamos_frontend

### Backend
- URL: http://localhost:4000
- API: http://localhost:4000/api
- Container: prestamos_backend

### Base de datos
- MongoDB en puerto 27017
- Container: prestamos_mongodb
- Usuario: admin
- Password: password123
- Base de datos: prestamos_lab

## Variables de entorno importantes

Puedes modificar estas variables en el `docker-compose.yml`:

### Backend
- `MONGODB_URI`: Cadena de conexión a MongoDB
- `JWT_SECRET`: Secreto para tokens JWT
- `DB_NAME`: Nombre de la base de datos

### Frontend
- `VITE_API_URL`: URL del API del backend

## Volúmenes persistentes

- `mongodb_data`: Datos de la base de datos
- `./backend/src`: Código fuente del backend (para desarrollo)
- `./frontend`: Código fuente del frontend (para desarrollo)
- `./backend/uploads`: Archivos subidos al backend

## Desarrollo vs Producción

Para desarrollo:
```bash
docker-compose up --build
```

Para producción (sin volúmenes de código):
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Solución de problemas

### Si el frontend no se conecta al backend
1. Verifica que ambos contenedores estén corriendo: `docker ps`
2. Revisa los logs del backend: `docker-compose logs backend`
3. Asegúrate que el backend esté escuchando en el puerto 4000

### Si la base de datos no inicia
1. Revisa los logs de MongoDB: `docker-compose logs mongodb`
2. Verifica que no haya otro servicio usando el puerto 27017

### Para reconstruir un servicio
```bash
docker-compose up --build --force-recreate backend
```

### Para limpiar todo (incluyendo volúmenes)
```bash
docker-compose down -v
```
