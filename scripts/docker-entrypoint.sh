#!/bin/sh
set -eu

if [ "${PRISMA_MIGRATE_DEPLOY:-false}" = "true" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL wajib diisi saat PRISMA_MIGRATE_DEPLOY=true" >&2
    exit 1
  fi
  echo "Menjalankan Prisma migrations..."
  ./node_modules/.bin/prisma migrate deploy
elif [ "${PRISMA_DB_PUSH:-false}" = "true" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL wajib diisi saat PRISMA_DB_PUSH=true" >&2
    exit 1
  fi

  echo "Menyelaraskan schema Prisma ke database..."
  ./node_modules/.bin/prisma db push --skip-generate
fi

# Demo data is opt-in and must never be enabled by a production container.
SEED_DEMO_ENABLED="${SEED_DEMO:-false}"
SEED_DEMO_PASSWORD_VALUE="${SEED_DEMO_PASSWORD:-}"
if [ "${NODE_ENV:-}" = "production" ]; then
  if [ "${SEED_DEMO_ENABLED}" = "true" ] || [ -n "${SEED_DEMO_PASSWORD_VALUE}" ]; then
    echo "Refusing unsafe demo seed configuration in production" >&2
    exit 1
  fi
elif [ "${SEED_DEMO_ENABLED}" = "true" ]; then
  if [ -z "${SEED_DEMO_PASSWORD_VALUE}" ] || [ "${SEED_DEMO_PASSWORD_VALUE}" = "false" ]; then
    echo "SEED_DEMO=true requires a non-empty SEED_DEMO_PASSWORD" >&2
    exit 1
  fi
  echo "Menjalankan database seed..."
  npx tsx prisma/seed.ts
elif [ -n "${SEED_DEMO_PASSWORD_VALUE}" ]; then
  echo "SEED_DEMO_PASSWORD is ignored unless SEED_DEMO=true" >&2
fi

exec "$@"
