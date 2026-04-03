#!/usr/bin/env bash
# Après docker compose up (CI ou manuel).
# - createAdmin.js : idempotent (comptes démo / admin).
# - seedTickets.js : génère les codes au premier déploiement ; si des codes existent déjà, sort sans rien refaire.
# Usage : bash infra/deploy/seed-app-users.sh [APP_ROOT] [ENV_FILE_REL_OR_ABS]
# Exemple : bash infra/deploy/seed-app-users.sh /opt/thetiptop/app infra/deploy/env/vdev.env
set -euo pipefail
APP_ROOT="${1:-/opt/thetiptop/app}"
ENV_FILE="${2:-infra/deploy/env/vdev.env}"
cd "$APP_ROOT"

COMPOSE=(docker compose -f infra/deploy/docker-compose.stack.yml --env-file "$ENV_FILE")

ADMIN_OK=0
set +e
for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if "${COMPOSE[@]}" exec -T api node src/scripts/createAdmin.js; then
    ADMIN_OK=1
    break
  fi
  sleep 5
done
set -e

if [ "$ADMIN_OK" -ne 1 ]; then
  echo "::error::createAdmin.js a échoué après 12 tentatives (API / Mongo pas prêts ?)"
  exit 1
fi

echo ""
echo "📋 seedTickets.js — génération des codes si la base est vide (sinon aucune action)."
SEED_OK=0
set +e
for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if "${COMPOSE[@]}" exec -T api node src/scripts/seedTickets.js; then
    SEED_OK=1
    break
  fi
  sleep 5
done
set -e

if [ "$SEED_OK" -ne 1 ]; then
  echo "::error::seedTickets.js a échoué après 12 tentatives"
  exit 1
fi

exit 0
