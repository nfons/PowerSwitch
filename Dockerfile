FROM node:20-slim AS base
WORKDIR /app

# Build stage
FROM base AS build
COPY frontend/package*.json ./frontend/
COPY package*.json ./
RUN npm ci && npm --prefix ./frontend ci

COPY frontend/ ./frontend/
RUN npm --prefix ./frontend run build

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM base

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
        chromium \
        libappindicator3-1 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcups2 \
        libdbus-glib-1-2 \
        libgbm1 \
        libnss3 \
        lsb-release \
        xdg-utils \
        wget \
        --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=build /app/dist ./dist
COPY --from=build /app/frontend/build ./frontend/build
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

EXPOSE 8000
CMD ["node", "dist/main"]