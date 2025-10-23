# Usa una imagen oficial de Node.js
FROM node:18-alpine

# CAMBIO 1: Establece el directorio de trabajo DENTRO de una carpeta 'backend'
WORKDIR /app/backend

# Copia el package.json para instalar dependencias
# Nota: Docker es suficientemente inteligente para buscarlo en la carpeta correcta
COPY backend/package*.json ./

# Instala las dependencias
RUN npm install

# Copia el código del backend a /app/backend
COPY backend/ .

# CAMBIO 2: Copia la carpeta 'public' a /app/public
COPY public/ /app/public/

# Expone el puerto que usa tu app
EXPOSE 3000

# Comando para iniciar el servidor (se ejecuta desde /app/backend)
ENTRYPOINT [ "node", "server.js" ]