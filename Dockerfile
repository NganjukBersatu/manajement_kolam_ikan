FROM node:22-slim

WORKDIR /app

# Install dependency dulu supaya layer ter-cache
COPY api/package*.json api/
COPY web/package*.json web/
RUN npm --prefix api ci --include=dev \
 && npm --prefix web ci --include=dev

COPY package.json ./
COPY api api
COPY web web
RUN npm --prefix web run build

ENV NODE_ENV=production
CMD ["node", "api/src/index.js"]
