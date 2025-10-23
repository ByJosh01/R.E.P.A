# -----------------------------------------------------------------
# Fase 1: Construcción (Build Stage)
# -----------------------------------------------------------------
# Usa una imagen oficial de Node.js (ligera)
FROM node:18-alpine AS builder

# 1. Establece el directorio de trabajo DENTRO de una carpeta 'backend'
# Todos los comandos siguientes se ejecutarán desde /app/backend
WORKDIR /app/backend

# 2. Copia los archivos de manifiesto del backend
# Copia package.json Y package-lock.json
COPY backend/package*.json ./

# 3. Instala las dependencias de forma limpia para producción
# 'npm ci' es mejor que 'npm install' porque usa el package-lock.json
# y asegura una instalación idéntica y rápida.
# '--only=production' omite las dependencias de desarrollo (devDependencies)
RUN npm ci --only=production

# 4. Copia el código del backend a /app/backend
# El '.' significa "cópialo al directorio de trabajo actual" (/app/backend)
COPY backend/ .

# 5. Copia la carpeta 'public' (frontend) a una carpeta paralela
# Esto asume que tu server.js sabe buscar en '../public'
# (ej. con path.join(__dirname, '../public'))
COPY public/ /app/public/

# -----------------------------------------------------------------
# Fase 2: Producción (Production Stage)
# -----------------------------------------------------------------
# Usamos una imagen limpia de Node para mantenerla ligera
FROM node:18-alpine

# Establece el directorio de trabajo, igual que en la fase de build
WORKDIR /app/backend

# Copia solo los archivos necesarios de la fase 'builder'
# Copiamos las dependencias ya instaladas
COPY --from=builder /app/backend/node_modules ./node_modules
# Copiamos el código del backend
COPY --from=builder /app/backend/ .
# Copiamos la carpeta public
COPY --from=builder /app/public/ /app/public/

# Expone el puerto que usa tu servidor
EXPOSE 3000

# Variables de entorno (buena práctica)
ENV NODE_ENV=production

# 7. Comando para iniciar el servidor
# Se ejecuta 'node server.js' desde el WORKDIR (/app/backend)
CMD [ "node", "server.js" ]