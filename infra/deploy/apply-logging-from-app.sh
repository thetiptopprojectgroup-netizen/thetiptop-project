#!/usr/bin/env bash
# Démarre / met à jour Elasticsearch + Kibana + Filebeat (après rsync du dépôt).
# Routage HTTPS Kibana : labels Traefik sur le service kibana (provider Docker → IP conteneur, pas DNS fragile).
# Supprime toute ancienne route fichier logging.yml sur le VPS (évite 404/502 ou doublons).
set -euo pipefail
ROOT="${1:-/opt/thetiptop/app}"
LOG="${ROOT}/infra/logging"
if [[ ! -f "${LOG}/docker-compose.yml" ]]; then
  echo "Répertoire logging absent : ${LOG}" >&2
  exit 1
fi

ENV_FILE="${LOG}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  ENV_FILE="${LOG}/.env.example"
  echo "::warning::${LOG}/.env manquant — utilisation de .env.example (mot de passe Elasticsearch par défaut « changeme » : à corriger)."
fi

cd "${LOG}"
docker compose --env-file "${ENV_FILE}" up -d
docker compose --env-file "${ENV_FILE}" up -d --force-recreate kibana filebeat

docker network connect traefik thetiptop-kibana 2>/dev/null || true

if [[ -f /opt/thetiptop/traefik/dynamic/logging.yml ]]; then
  rm -f /opt/thetiptop/traefik/dynamic/logging.yml
  if [[ -f /opt/thetiptop/traefik/docker-compose.yml ]]; then
    (cd /opt/thetiptop/traefik && docker compose up -d)
  fi
fi
