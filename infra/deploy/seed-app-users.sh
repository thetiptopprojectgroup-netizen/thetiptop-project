#!/usr/bin/env bash
# Appelé après docker compose up (CI ou manuel). Idempotent : createAdmin.js ne recrée pas les comptes existants.
# Usage : bash infra/deploy/seed-app-users.sh [APP_ROOT] [ENV_FILE_REL_OR_ABS]
# Exemple : bash infra/deploy/seed-app-users.sh /opt/thetiptop/app infra/deploy/env/vdev.env
set -euo pipefail
APP_ROOT="${1:-/opt/thetiptop/app}"
ENV_FILE="${2:-infra/deploy/env/vdev.env}"
cd "$APP_ROOT"

COMPOSE=(docker compose -f infra/deploy/docker-compose.stack.yml --env-file "$ENV_FILE")

set +e
for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if "${COMPOSE[@]}" exec -T api node src/scripts/createAdmin.js; then
    exit 0
  fi
  sleep 5
done
echo "::error::createAdmin.js a échoué après 12 tentatives (API / Mongo pas prêts ?)"
exit 1
