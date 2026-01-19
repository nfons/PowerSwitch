FROM node:20-slim AS base
WORKDIR /app

## Install production dependencies for both frontend and backend
FROM base AS prod-deps
COPY frontend/package.json ./frontend/
COPY frontend/package-lock.json ./frontend/
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
RUN npm --prefix ./frontend ci

# Build frontend assets
FROM prod-deps AS build-frontend
COPY --from=prod-deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src
RUN npm --prefix ./frontend run build


FROM prod-deps AS build-svc
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./
COPY src ./src
COPY package.json ./
RUN npm install
RUN npm run build

FROM base

# Install Chromium and dependencies for Puppeteer
# See: https://stackoverflow.com/questions/66070860/puppeteer-error-error-while-loading-shared-libraries-libgobject-2-0-so-0
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_DISABLE_DEV_SHM_USAGE=true

COPY --from=build-svc /app/dist /app/dist
COPY --from=build-frontend /app/frontend/build /app/frontend/build
COPY package.json ./
RUN npm install --only=production
EXPOSE 8000
CMD [ "node", "dist/main" ]