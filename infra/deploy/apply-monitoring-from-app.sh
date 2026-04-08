#!/usr/bin/env bash
# Démarre / met à jour Prometheus + Grafana + exporters (après rsync du dépôt).
set -euo pipefail
ROOT="${1:-/opt/thetiptop/app}"
MON="${ROOT}/infra/monitoring"
if [[ ! -f "${MON}/docker-compose.yml" ]]; then
  echo "Répertoire monitoring absent : ${MON}" >&2
  exit 1
fi

ENV_FILE="${MON}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  ENV_FILE="${MON}/.env.example"
  echo "::warning::${MON}/.env manquant — utilisation de .env.example (mot de passe Grafana par défaut « changeme » : à corriger)."
fi

cd "${MON}"
docker compose --env-file "${ENV_FILE}" up -d

# Prometheus ne recharge pas automatiquement prometheus.yml.
# On force la recréation des services UI/collecte pour appliquer config + env à chaque CD.
docker compose --env-file "${ENV_FILE}" up -d --force-recreate prometheus grafana

MON_YML="${ROOT}/infra/vps/traefik/dynamic/monitoring.yml"
if [[ -f "${MON_YML}" ]]; then
  mkdir -p /opt/thetiptop/traefik/dynamic
  install -m 0644 "${MON_YML}" /opt/thetiptop/traefik/dynamic/monitoring.yml
  if [[ -f /opt/thetiptop/traefik/docker-compose.yml ]]; then
    (cd /opt/thetiptop/traefik && docker compose up -d)
  fi
fi
