# ---- Estágio 1: Build ----
FROM node:18-slim AS builder

# MUDANÇA: Adicionado 'cron'
RUN apt-get update && apt-get install -y --no-install-recommends \
    cron \
    chromium \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libxss1 \
    libxshmfence1 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn prisma generate
RUN yarn build

# ---- Estágio 2: Produção ----
FROM node:18-slim AS production

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# MUDANÇA: Adicionado 'cron'
RUN apt-get update && apt-get install -y cron chromium --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3333

CMD [ "node", "dist/server.js" ]