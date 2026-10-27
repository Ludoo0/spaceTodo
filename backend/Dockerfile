FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN bun build ./src/index.ts \
    --target=bun \
    --outdir=dist \
    --external pg-native \
    --minify


FROM oven/bun:1-alpine
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["bun", "dist/index.js"]
