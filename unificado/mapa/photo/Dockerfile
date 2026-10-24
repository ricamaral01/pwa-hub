FROM node:20-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js ./

ENV PORT=13059
ENV PHOTO_STORAGE_DIR=/storage
ENV ALLOWED_ORIGINS=https://concrefer.concretrack.com.br

USER 33:33
CMD ["node", "server.js"]
