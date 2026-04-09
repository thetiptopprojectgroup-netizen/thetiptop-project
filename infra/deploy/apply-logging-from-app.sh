#!/usr/bin/env bash
# Deploy ELK stack (Elasticsearch + Kibana + Filebeat).
# Routing: Traefik file provider (infra/vps/traefik/dynamic/logging.yml).
# Called from CD workflows after rsync.
set -euo pipefail
ROOT="${1:-/opt/thetiptop/app}"
LOG="${ROOT}/infra/logging"

if [[ ! -f "${LOG}/docker-compose.yml" ]]; then
  echo "Logging compose not found: ${LOG}" >&2
  exit 1
fi

ENV_FILE="${LOG}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "::error::${LOG}/.env missing. Set LOGGING_ELASTIC_PASSWORD in GitHub Secrets so the CI creates it."
  exit 1
fi

# Ensure KIBANA_SYSTEM_PASSWORD exists (backward compat with old .env files).
if ! grep -q '^KIBANA_SYSTEM_PASSWORD=' "${ENV_FILE}"; then
  EP="$(grep '^ELASTIC_PASSWORD=' "${ENV_FILE}" | head -1 | cut -d= -f2-)"
  if [[ -n "${EP}" ]]; then
    printf '\nKIBANA_SYSTEM_PASSWORD=%s\n' "${EP}" >> "${ENV_FILE}"
  fi
fi

cd "${LOG}"

# Start everything. setup-users runs first (depends_on), then Kibana starts.
docker compose --env-file "${ENV_FILE}" up -d --remove-orphans

# Copy Traefik dynamic config for Kibana routing.
LOG_YML="${ROOT}/infra/vps/traefik/dynamic/logging.yml"
if [[ -f "${LOG_YML}" ]]; then
  mkdir -p /opt/thetiptop/traefik/dynamic
  install -m 0644 "${LOG_YML}" /opt/thetiptop/traefik/dynamic/logging.yml
  if [[ -f /opt/thetiptop/traefik/docker-compose.yml ]]; then
    (cd /opt/thetiptop/traefik && docker compose up -d)
  fi
fi

echo "ELK stack deployed. Kibana: https://$(grep '^KIBANA_HOST=' "${ENV_FILE}" | cut -d= -f2- || echo 'kibana.dsp5-archi-o22a-15m-g3.fr')"
