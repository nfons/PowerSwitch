FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy configuration files
COPY nest-cli.json tsconfig.json tsconfig.build.json .prettierrc eslint.config.mjs ./

# Copy source code
COPY src ./src

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

ARG PORT=8080
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD [ "pnpm", "start:prod" ]