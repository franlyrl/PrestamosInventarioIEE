# Manual de Corrido del Sistema

Este manual deja por orden la forma de correr `PrestamosInventarioIEE` en esta maquina, con los comandos que ya quedaron probados.

Raiz del proyecto:

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE"
```

## 1. Resumen rapido

Si quieres solo el flujo que ya funciono:

1. Corrige primero la red CNI si ya te salio el warning de `cniVersion 1.0.0`.
2. Apaga Mongo local si esta usando `27017`.
3. Levanta el stack con `docker-compose-portainer.yml`.
4. Verifica que `portainer`, `prestamos_mongodb`, `prestamos_backend` y `prestamos_frontend` queden arriba.
5. Si vas a usar ngrok directo al frontend, confirma que `5173` responda.

Si ya viste este warning antes:

```text
plugin firewall does not support config version "1.0.0"
```

corre esto antes de levantar el stack:

```bash
sudo sed -i 's/"cniVersion": "1.0.0"/"cniVersion": "0.4.0"/' /etc/cni/net.d/prestamosinventarioiee_prestamos_network.conflist
grep cniVersion /etc/cni/net.d/prestamosinventarioiee_prestamos_network.conflist
```

Comandos:

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE"
mongosh --eval "db.getSiblingDB('admin').shutdownServer()" mongodb://127.0.0.1:27017/admin
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

## 2. Requisitos

Herramientas que usa este proyecto:

- Node.js
- npm
- MongoDB (`mongod`, `mongosh`)
- Podman
- `docker-compose`
- ngrok
- opcionalmente `caddy`

Verificaciones utiles:

```bash
node -v
npm -v
podman --version
docker-compose --version
ngrok version
mongod --version | head -n 1
```

## 3. Instalacion de herramientas

### 3.1. Paquetes base

```bash
sudo apt update
sudo apt install -y curl wget git ca-certificates gnupg lsb-release software-properties-common
```

### 3.2. Node.js y npm

Verificar:

```bash
node -v
npm -v
```

Si faltan:

```bash
sudo apt install -y nodejs npm
```

### 3.3. Podman

```bash
sudo apt install -y podman
podman --version
```

### 3.4. Docker Compose

Este proyecto lo estas corriendo con `docker-compose`.

```bash
sudo apt install -y docker-compose
docker-compose --version
```

Nota:

- En esta maquina `docker-compose` si existe.
- `podman-compose` no es necesario para el flujo que ya te funciono.

### 3.5. MongoDB local

Verifica:

```bash
command -v mongod
command -v mongosh
```

Si faltara:

```bash
sudo apt install -y mongodb
mongod --version
mongosh --version
```

### 3.6. ngrok

Verifica:

```bash
ngrok version
```

Si faltara:

```bash
sudo snap install ngrok
ngrok version
```

Autenticacion:

```bash
ngrok config add-authtoken TU_TOKEN_DE_NGROK
```

### 3.7. Caddy

Solo si vas a usar proxy en `80`:

```bash
sudo apt install -y caddy
caddy version
```

## 4. Instalacion de dependencias del proyecto

### 4.1. Backend

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/backend"
npm install
```

### 4.2. Frontend

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/frontend"
npm install
```

## 5. Archivo `.env` del backend

El backend usa:

```text
backend/.env
```

Plantilla minima:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/inventarioEE
JWT_SECRET=pon_aqui_un_secreto_largo
```

Editar:

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/backend"
nano .env
```

Nota importante:

- El backend local lee `MONGO_URI`.
- Algunos archivos viejos de contenedores usan `MONGODB_URI`.

## 6. Flujo recomendado con contenedores

Este es el flujo principal recomendado porque ya quedo funcionando en tu maquina.

### 6.0. Paso 0: corregir CNI antes de levantar

Si ya te habia aparecido este error alguna vez:

```text
plugin firewall does not support config version "1.0.0"
```

haz esto antes de `down` y `up`, porque si no el stack puede volver a crear contenedores en estado `Created`:

```bash
sudo sed -i 's/"cniVersion": "1.0.0"/"cniVersion": "0.4.0"/' /etc/cni/net.d/prestamosinventarioiee_prestamos_network.conflist
grep cniVersion /etc/cni/net.d/prestamosinventarioiee_prestamos_network.conflist
```

Debe quedar:

```text
"cniVersion": "0.4.0",
```

### 6.1. Paso 1: entrar a la raiz

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE"
```

### 6.2. Paso 2: apagar Mongo local

Esto es importante porque si Mongo local esta escuchando en `27017`, el contenedor `prestamos_mongodb` no puede arrancar.

```bash
mongosh --eval "db.getSiblingDB('admin').shutdownServer()" mongodb://127.0.0.1:27017/admin
```

Verificar que quedo libre:

```bash
ss -ltnp | grep 27017
```

Si no devuelve nada, el puerto ya quedo libre.

### 6.3. Paso 3: levantar el stack completo

```bash
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

Nota importante del frontend en contenedores:

- Cuando entras por `ngrok http 5173`, las llamadas a `/api` salen desde el contenedor del frontend.
- Por eso el proxy de Vite no debe apuntar a `localhost:4000` dentro del contenedor.
- La configuracion correcta del stack es usar:

```text
VITE_API_PROXY_TARGET=http://backend:4000
```

Esto ya quedo aplicado en:

- `frontend/vite.config.js`
- `docker-compose-portainer.yml`
- `docker-compose.yml`

Esto debe crear o levantar:

- `portainer`
- `prestamos_mongodb`
- `prestamos_backend`
- `prestamos_frontend`

### 6.4. Paso 4: revisar estado

```bash
sudo podman ps -a
sudo docker-compose -f docker-compose-portainer.yml ps
```

El estado correcto esperado es:

- `running` en `portainer`
- `running` en `prestamos_mongodb`
- `running` en `prestamos_backend`
- `running` en `prestamos_frontend`

Si uno sale como `created`, existe pero no alcanzo a arrancar.

### 6.5. Paso 5: comprobar puertos

```bash
ss -ltnp | grep -E '27017|4000|5173|9000|9443'
```

Puertos esperados:

- `27017` -> MongoDB
- `4000` -> backend
- `5173` -> frontend
- `9000` -> Portainer HTTP
- `9443` -> Portainer HTTPS

### 6.6. Paso 6: abrir las interfaces

- Portainer: `http://localhost:9000`
- Portainer seguro: `https://localhost:9443`
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

### 6.7. Paso 7: exponer por ngrok

La forma que ya quedo funcionando para acceso externo al sistema es:

```bash
pkill ngrok 2>/dev/null || true
ngrok http 5173
```

Importante:

- esta opcion funciona porque el frontend responde en `5173`
- y el proxy interno del frontend redirige `/api` hacia `http://backend:4000`
- no necesitas `ngrok http 80` para este flujo

## 7. Logs del stack

### 7.1. Logs generales del compose

Sirven para ver todo lo que esta pasando en el stack:

```bash
sudo docker-compose -f docker-compose-portainer.yml logs
```

En vivo:

```bash
sudo docker-compose -f docker-compose-portainer.yml logs -f
```

### 7.2. Logs de Portainer

```bash
sudo podman logs portainer
```

En vivo:

```bash
sudo podman logs -f portainer
```

### 7.3. Logs de MongoDB del contenedor

```bash
sudo podman logs prestamos_mongodb
```

En vivo:

```bash
sudo podman logs -f prestamos_mongodb
```

### 7.4. Logs de backend

```bash
sudo podman logs prestamos_backend
```

En vivo:

```bash
sudo podman logs -f prestamos_backend
```

### 7.5. Logs de frontend

```bash
sudo podman logs prestamos_frontend
```

En vivo:

```bash
sudo podman logs -f prestamos_frontend
```

## 8. Reinicio y apagado del stack

### 8.1. Levantar o recrear

```bash
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

### 8.2. Apagar

```bash
sudo docker-compose -f docker-compose-portainer.yml down
```

### 8.3. Apagar y limpiar huerfanos

```bash
sudo docker-compose -f docker-compose-portainer.yml down --remove-orphans
```

### 8.4. Reiniciar solo Portainer

```bash
sudo podman restart portainer
```

### 8.5. Reiniciar backend y frontend

```bash
sudo podman restart prestamos_backend prestamos_frontend
```

## 9. Limpieza cuando el stack queda roto

Usa esto si salen errores como:

- `that name is already in use`
- `CNI network ... not found`
- contenedores en estado `created`

### 9.1. Borrar contenedores viejos

```bash
sudo podman rm -f portainer prestamos_mongodb prestamos_backend prestamos_frontend 2>/dev/null || true
```

### 9.2. Borrar red vieja del proyecto

```bash
sudo podman network rm prestamosinventarioiee_prestamos_network 2>/dev/null || true
```

### 9.3. Limpiar redes sin uso

```bash
sudo podman network prune -f
```

### 9.4. Volver a levantar

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE"
mongosh --eval "db.getSiblingDB('admin').shutdownServer()" mongodb://127.0.0.1:27017/admin
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

## 10. Corrido local sin contenedores

Esto sirve si quieres correr Mongo, backend y frontend manualmente.

### 10.1. Crear carpeta de datos de Mongo

```bash
mkdir -p /home/spiee/mongodb-data
```

### 10.2. Levantar Mongo local

```bash
mongod --dbpath /home/spiee/mongodb-data --bind_ip 127.0.0.1 --port 27017 --fork --logpath /home/spiee/mongodb-data/mongod.log
```

### 10.3. Verificar Mongo local

```bash
ss -ltnp | grep 27017
mongosh --quiet --eval 'db.runCommand({ ping: 1 })' mongodb://127.0.0.1:27017/inventarioEE
```

### 10.4. Backend local

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/backend"
npm run dev
```

### 10.5. Frontend local

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/frontend"
npm run dev
```

### 10.6. Logs y problemas de frontend local

Si Vite falla por permisos en `.vite`:

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/frontend"
sudo rm -rf node_modules/.vite
sudo chown -R spiee:spiee node_modules
npm run dev
```

Esto corrige el error tipo:

```text
EACCES: permission denied, unlink ... node_modules/.vite/...
```

## 11. Portainer

### 11.1. Acceso

- `http://localhost:9000`
- `https://localhost:9443`

### 11.2. Ver contenedores

Dentro de Portainer:

- `running` = esta activo
- `created` = fue creado pero no inicio
- `exited` = inicio y luego se detuvo

### 11.3. Backup desde la interfaz

Dentro de Portainer:

1. Entrar a `Settings`
2. Ir a `Backup`
3. Elegir `Create backup` o `Download backup`
4. Guardar el archivo en una carpeta segura

Recomendacion:

- guardarlo con fecha
- hacer tambien copia del volumen de Portainer

### 11.4. Restaurar desde backup

Se usa la pantalla `Restore Portainer from backup`.

Necesitas:

- archivo de backup de Portainer
- password del backup si fue cifrado

Si no existe backup, no restaura usuarios viejos.

## 12. Mongo del contenedor y MongoDB Compass

### 12.1. Como esta funcionando Mongo ahora

Cuando el stack corre con:

```bash
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

el sistema usa MongoDB dentro del contenedor `prestamos_mongodb`.

Eso significa:

- no dependes de `mongod` local del sistema
- el backend del contenedor no se conecta a `127.0.0.1`
- el backend se conecta al servicio interno del compose llamado `mongodb`

La conexion interna del backend del contenedor es:

```text
mongodb://admin:password123@mongodb:27017/prestamos_lab?authSource=admin
```

La palabra `mongodb` no es tu maquina local. Es el nombre del servicio dentro de la red del stack.

Por eso puede pasar esto:

- Mongo local apagado
- pero el sistema sigue funcionando

siempre que `prestamos_mongodb` este `running`.

### 12.2. Como verlo desde MongoDB Compass

Para Compass debes entrar por el puerto publicado al host:

```text
mongodb://admin:password123@127.0.0.1:27017/prestamos_lab?authSource=admin
```

Pasos:

1. Abrir MongoDB Compass
2. Elegir `New Connection`
3. Borrar cualquier URI anterior
4. Pegar la URI completa
5. Presionar `Connect`

### 12.3. Si Compass muestra error con `mongodb.net`

Si aparece algo como:

```text
getaddrinfo EAI_AGAIN ac-....mongodb.net
```

eso significa que Compass no estaba usando la URI local de `127.0.0.1`, sino una conexion vieja de MongoDB Atlas.

Solucion:

1. Crear una conexion nueva
2. Borrar todo el campo
3. Pegar solo la URI local

### 12.4. Como ver datos desde terminal

Con `mongosh`:

```bash
mongosh "mongodb://admin:password123@127.0.0.1:27017/prestamos_lab?authSource=admin"
```

Luego:

```javascript
show dbs
use prestamos_lab
show collections
db.usuarios.find().limit(5).pretty()
db.activos.find().limit(5).pretty()
db.insumos.find().limit(5).pretty()
db.solicitudes.find().limit(5).pretty()
```

### 12.5. RAM y recursos del contenedor Mongo

En el archivo `docker-compose-portainer.yml` actual no hay un limite de RAM definido para `prestamos_mongodb`.

Eso significa:

- Mongo no tiene una cuota fija de memoria declarada en ese compose
- usa la memoria que el motor de contenedores le permita tomar del host
- en la practica, comparte los recursos disponibles de la maquina

En otras palabras:

- no esta configurado como `512MB`, `1GB` o `2GB`
- no hay una restriccion explicita en el compose

Si algun dia quieres ponerle limite, habria que agregar una configuracion de recursos al stack.

### 12.6. Como verificar si Mongo esta expuesto al host

```bash
ss -ltnp | grep 27017
```

Si responde, entonces Compass puede conectarse por `127.0.0.1:27017`.

## 13. ngrok

### 12.1. Usar ngrok directo al frontend

Esto sirve si el frontend corre en `5173`.

```bash
pkill ngrok 2>/dev/null || true
ngrok http 5173
```

Antes de correrlo, verifica:

```bash
ss -ltnp | grep 5173
curl http://127.0.0.1:5173
```

Si `5173` no responde, ngrok devolvera error `502` o `ERR_NGROK_8012`.

### 12.2. Usar ngrok con Caddy

Si tienes Caddy escuchando en `80`:

```bash
pkill ngrok 2>/dev/null || true
ngrok http 80
```

Verifica antes:

```bash
ss -ltnp | grep 80
curl http://127.0.0.1:80
```

### 12.3. Ver tuneles

```bash
curl http://127.0.0.1:4040/api/tunnels
```

Panel local:

```text
http://127.0.0.1:4040
```

## 14. Caddy

El `Caddyfile` de este proyecto enruta:

- `/api/*` -> `localhost:4000`
- `/portainer/*` -> `localhost:9000`
- todo lo demas -> `localhost:5173`

### 13.1. Correr Caddy

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE"
caddy run --config Caddyfile
```

### 13.2. Recargar Caddy

```bash
caddy reload --config Caddyfile
```

### 13.3. Verificar puerto 80

```bash
ss -ltnp | grep 80
curl http://127.0.0.1:80
```

## 15. Diagnostico rapido

### 14.1. Ver puertos

```bash
ss -ltnp | grep -E '27017|4000|5173|9000|9443|80'
```

### 14.2. Ver contenedores

```bash
sudo podman ps -a
```

### 14.3. Ver imagenes

```bash
sudo podman images
```

### 14.4. Ver procesos de Mongo local

```bash
ps -ef | grep mongod
tail -n 50 /home/spiee/mongodb-data/mongod.log
```

## 16. Problemas comunes

### 16.1. `bind: address already in use` en Mongo del contenedor

Causa:

- Mongo local esta usando `27017`

Solucion:

```bash
mongosh --eval "db.getSiblingDB('admin').shutdownServer()" mongodb://127.0.0.1:27017/admin
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

### 16.2. `connect ECONNREFUSED 127.0.0.1:27017`

Causa:

- Mongo no esta corriendo

Solucion local:

```bash
mongod --dbpath /home/spiee/mongodb-data --bind_ip 127.0.0.1 --port 27017 --fork --logpath /home/spiee/mongodb-data/mongod.log
```

### 16.3. `ERR_NGROK_8012` o `502` en ngrok

Causa:

- ngrok si levanto
- pero el servicio destino no estaba arriba

Ejemplos:

- `5173` apagado
- `80` apagado

Solucion si usas frontend directo:

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/frontend"
npm run dev
pkill ngrok 2>/dev/null || true
ngrok http 5173
```

Solucion si usas Caddy:

```bash
caddy run --config Caddyfile
pkill ngrok 2>/dev/null || true
ngrok http 80
```

### 16.4. Login por ngrok abre la pagina pero `/api/usuarios/login` falla

Sintomas comunes:

- `HTTP 500` en `/api/usuarios/login`
- `Unexpected end of JSON input`
- `Failed to execute 'json' on 'Response'`
- `Unexpected token '<'`

Causa real que ya se presento en este proyecto:

- el frontend estaba bien expuesto por `ngrok http 5173`
- pero el proxy de Vite dentro del contenedor frontend apuntaba a `localhost:4000`
- dentro del contenedor, `localhost` no es el backend
- la direccion correcta entre contenedores es:

```text
http://backend:4000
```

Solucion aplicada:

- en `frontend/vite.config.js` se agrego:

```text
VITE_API_PROXY_TARGET=http://backend:4000
```

- en `docker-compose-portainer.yml` y `docker-compose.yml` se paso esa variable al contenedor frontend

Despues de cambiar eso, toca reconstruir:

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE"
mongosh --eval "db.getSiblingDB('admin').shutdownServer()" mongodb://127.0.0.1:27017/admin
sudo docker-compose -f docker-compose-portainer.yml down
sudo docker-compose -f docker-compose-portainer.yml up -d --build
pkill ngrok 2>/dev/null || true
ngrok http 5173
```

### 16.5. `EACCES` en `frontend/node_modules/.vite`

Causa:

- archivos de cache creados por `root`

Solucion:

```bash
cd "/home/spiee/Documentos/PrestamosInventarioIEE (3)/PrestamosInventarioIEE/frontend"
sudo rm -rf node_modules/.vite
sudo chown -R spiee:spiee node_modules
npm run dev
```

### 16.6. `CNI network ... not found`

Causa:

- red vieja o corrupta de Podman

Solucion:

```bash
sudo podman rm -f portainer prestamos_mongodb prestamos_backend prestamos_frontend 2>/dev/null || true
sudo podman network rm prestamosinventarioiee_prestamos_network 2>/dev/null || true
sudo podman network prune -f
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

### 16.7. Contenedores en `Created` y warning `plugin firewall does not support config version "1.0.0"`

Sintoma:

- `portainer` y `prestamos_mongodb` quedan en estado `Created`
- aparece algo como:

```text
plugin firewall does not support config version "1.0.0"
```

Causa:

- tu Podman y sus plugins CNI son mas viejos
- el archivo de red del proyecto se crea con `cniVersion: "1.0.0"`
- el plugin `firewall` de esa maquina no soporta esa version

Solucion:

1. Cambiar la version del archivo CNI a `0.4.0`
2. Arrancar de nuevo los contenedores que quedaron en `Created`

Comandos:

```bash
sudo sed -i 's/"cniVersion": "1.0.0"/"cniVersion": "0.4.0"/' /etc/cni/net.d/prestamosinventarioiee_prestamos_network.conflist
grep cniVersion /etc/cni/net.d/prestamosinventarioiee_prestamos_network.conflist
sudo podman start portainer prestamos_mongodb
sudo podman ps -a
ss -ltnp | grep -E '27017|9000|9443'
```

Resultado esperado:

- `portainer` pasa a `running`
- `prestamos_mongodb` pasa a `running`
- Portainer abre en `http://localhost:9000`

### 16.8. `podman-compose: orden no encontrada`

En este proyecto no lo necesitas para el flujo actual.

Usa:

```bash
sudo docker-compose -f docker-compose-portainer.yml up -d --build
```

## 17. Checklist final

Para dejar todo bien:

1. `mongosh ... shutdownServer()` si vas a usar Mongo del contenedor.
2. `sudo docker-compose -f docker-compose-portainer.yml up -d --build`
3. `sudo podman ps -a`
4. `ss -ltnp | grep -E '27017|4000|5173|9000|9443'`
5. abrir Portainer en `9000`
6. abrir frontend en `5173`
7. correr ngrok solo cuando el puerto ya responda
