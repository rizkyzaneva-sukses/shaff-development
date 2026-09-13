# Deployment security

## Production seed guard

The container entrypoint treats demo seed data as an explicit, non-production opt-in:

- Production images default to `NODE_ENV=production` and `SEED_DEMO=false`.
- `SEED_DEMO_PASSWORD` alone never starts a seed.
- Production startup fails closed if `SEED_DEMO=true` or if `SEED_DEMO_PASSWORD` is present, even when the password is set to `false`.
- In a non-production environment, set both `SEED_DEMO=true` and a non-empty `SEED_DEMO_PASSWORD` only for an intentional demo bootstrap.
- Keep `SEED_DEMO=false` and omit `SEED_DEMO_PASSWORD` from production deployment secrets.

Migrations and normal application startup remain controlled independently by `PRISMA_MIGRATE_DEPLOY` and `PRISMA_DB_PUSH`. Do not enable `PRISMA_DB_PUSH` in production unless the deployment change is explicitly reviewed.
