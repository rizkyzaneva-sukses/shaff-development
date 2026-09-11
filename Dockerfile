# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

# Prisma's native query engine needs libc compatibility and OpenSSL.
RUN apk add --no-cache libc6-compat openssl postgresql-client
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner-deps
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PRISMA_MIGRATE_DEPLOY=false \
    PRISMA_DB_PUSH=false

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Keep only production dependencies in the runtime image. Prisma is a runtime
# dependency so migrations can be run explicitly from the entrypoint.
COPY --from=runner-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

RUN chmod +x ./scripts/*.sh \
  && mkdir -p /app/data/private \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["node", "server.js"]
