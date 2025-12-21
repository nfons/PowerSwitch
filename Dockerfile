FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

## Install production dependencies for both frontend and backend
FROM base AS prod-deps
COPY frontend/package.json ./frontend/
COPY frontend/package-lock.json ./frontend/
COPY package.json ./
COPY package-lock.json ./
RUN npm install --prod --frozen-lockfile

# Build frontend assets
FROM base AS build-frontend
COPY --from=prod-deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend/public ./frontend/public
COPY frontend/src ./frontend/src
RUN npm run build


FROM base AS build-svc
COPY --from=prod-deps /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json ./
COPY tsconfig.build.json ./
RUN npm run build


FROM base
COPY --from=build-svc /app/dist /app/dist
COPY --from=build-frontend frontend/build /app/frontend/build
EXPOSE 8000
# CMD [ "npm", "start:prod" ]