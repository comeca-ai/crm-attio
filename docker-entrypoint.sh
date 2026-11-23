#!/bin/sh
set -e
echo "Aplicando schema no banco…"
npx prisma db push --skip-generate
echo "Populando dados de exemplo (só na primeira vez)…"
node prisma/seed.mjs
echo "Iniciando o CRM na porta ${PORT:-3000}"
exec npx next start -p "${PORT:-3000}"
