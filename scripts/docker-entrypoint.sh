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

# Run seed if SEED_DEMO_PASSWORD is set (minimum 12 characters required)
if [ -n "${SEED_DEMO_PASSWORD:-}" ]; then
  if [ "${SEED_DEMO_PASSWORD}" != "false" ]; then
    echo "Menjalankan database seed..."
    npx tsx prisma/seed.ts || echo "Seed completed or skipped"
  fi
fi

exec "$@"
