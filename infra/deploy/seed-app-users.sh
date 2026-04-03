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

dump_api_logs() {
  echo "----- docker compose logs api (dernières lignes) -----"
  "${COMPOSE[@]}" logs api --tail 120 2>&1 || true
  echo "------------------------------------------------------"
}

# Tant que le conteneur api est en "restarting", exec échoue (erreur daemon Docker).
# On attend l'état running, puis on laisse les boucles ci-dessous gérer Mongo / démarrage Node.
wait_api_container_running() {
  local i=0
  local max=48
  while [ "$i" -lt "$max" ]; do
    local cid st
    cid=$("${COMPOSE[@]}" ps -q api 2>/dev/null | head -n1) || true
    if [ -z "${cid:-}" ] && [ "$i" -ge 8 ]; then
      echo "::error::Aucun conteneur « api » pour ce compose (vérifiez COMPOSE_PROJECT_NAME et --env-file)."
      "${COMPOSE[@]}" ps -a 2>&1 || true
      return 1
    fi
    if [ -n "${cid:-}" ]; then
      st=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null || echo unknown)
      if [ "$st" = "running" ]; then
        return 0
      fi
      if [ "$st" = "dead" ]; then
        echo "::error::Conteneur api en état dead."
        dump_api_logs
        return 1
      fi
    fi
    i=$((i + 1))
    sleep 5
  done
  echo "::error::Le conteneur api n'est pas passé à l'état « running » après ~$((max * 5))s (souvent: crash au démarrage, MongoDB injoignable, mauvais MONGO_* / JWT dans le .env, ou volume Mongo déjà initialisé avec un autre mot de passe)."
  dump_api_logs
  return 1
}

wait_api_container_running

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
  dump_api_logs
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
  dump_api_logs
  exit 1
fi

exit 0
