#!/bin/sh
set -e
echo "Applying database migrations…"
npx prisma migrate deploy
echo "Seeding demo data (first run only)…"
node prisma/seed.mjs
echo "Starting the CRM on port ${PORT:-3000}"
exec npx next start -p "${PORT:-3000}"
