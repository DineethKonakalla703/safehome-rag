# SafeHome-RAG Backend Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
RUN mkdir -p uploads/tickets

EXPOSE 5000

ENV NODE_ENV=production \
    PORT=5000

USER node

CMD ["node", "src/server.js"]
