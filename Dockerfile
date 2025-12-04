# -----------------------------------------------------------------
# Fase 1: Construcción (Build Stage)
# -----------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./

# Instalamos dependencias
RUN npm ci --only=production

COPY backend/ .
COPY public/ /app/public/

# -----------------------------------------------------------------
# Fase 2: Producción (Production Stage)
# -----------------------------------------------------------------
FROM node:18-alpine

# --- ¡ESTA ES LA LÍNEA MÁGICA PARA ALPINE! ---
# Instalamos mysql-client para tener el comando 'mysqldump' disponible
RUN apk add --no-cache mysql-client
# ---------------------------------------------

WORKDIR /app/backend

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/ .
COPY --from=builder /app/public/ /app/public/

EXPOSE 3000

ENV NODE_ENV=production

CMD [ "node", "server.js" ]


