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

# Reset passwords if SEED_DEMO_PASSWORD is set
if [ -n "${SEED_DEMO_PASSWORD:-}" ]; then
  echo "Mengupdate password semua user ke: ${SEED_DEMO_PASSWORD}..."
  node -e "
const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcryptjs');
const prisma = new PrismaClient();
async function run() {
  const password = process.env.SEED_DEMO_PASSWORD;
  const hash = hashSync(password, 10);
  const users = await prisma.user.findMany();
  console.log('Found ' + users.length + ' users');
  for (const u of users) {
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: hash } });
    console.log('Updated: ' + u.email);
  }
  console.log('All passwords updated to: ' + password);
  await prisma.\$disconnect();
}
run().catch(e => { console.error(e); process.exit(0); });
" || echo "Password update completed or skipped"
fi

exec "$@"
