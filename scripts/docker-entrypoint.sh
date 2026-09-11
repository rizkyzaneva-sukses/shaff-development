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

# Run seed if SEED_DEMO_PASSWORD is set
if [ -n "${SEED_DEMO_PASSWORD:-}" ] && [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Menjalankan database seed..."
  node prisma/seed.js 2>/dev/null || npx tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped (not found)"
fi

exec "$@"
