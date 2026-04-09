#!/usr/bin/env bash
# Démarre / met à jour Elasticsearch + Kibana + Filebeat (après rsync du dépôt).
# Routage HTTPS Kibana :
# - labels Traefik sur le service kibana (provider Docker),
# - + fallback file provider (/opt/thetiptop/traefik/dynamic/logging.yml) pour éviter les 404
#   si le provider Docker n'est pas disponible.
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
docker compose --env-file "${ENV_FILE}" up -d --force-recreate elastic-bootstrap kibana filebeat

docker network connect traefik thetiptop-kibana 2>/dev/null || true

# Vérification rapide post-déploiement (locale) pour rendre le diagnostic CI plus explicite.
if ! docker compose --env-file "${ENV_FILE}" ps kibana | grep -q "Up"; then
  echo "::warning::Kibana ne semble pas démarré (container non Up). Vérifiez 'docker compose logs kibana' sur le VPS."
fi

LOG_YML="${ROOT}/infra/vps/traefik/dynamic/logging.yml"
if [[ -f "${LOG_YML}" ]]; then
  mkdir -p /opt/thetiptop/traefik/dynamic
  install -m 0644 "${LOG_YML}" /opt/thetiptop/traefik/dynamic/logging.yml
  if [[ -f /opt/thetiptop/traefik/docker-compose.yml ]]; then
    (cd /opt/thetiptop/traefik && docker compose up -d)
  fi
fi

KIBANA_HOST_VALUE="$(awk -F= '/^KIBANA_HOST=/{print $2}' "${ENV_FILE}" | tail -n 1)"
if [[ -z "${KIBANA_HOST_VALUE}" ]]; then
  KIBANA_HOST_VALUE="kibana.dsp5-archi-o22a-15m-g3.fr"
fi

# Readiness checks to catch 502/404 during CI deploy instead of after.
# Kibana can take several minutes on small VPS; use retries before failing.
KIBANA_READY="false"
for attempt in $(seq 1 48); do
  if docker compose --env-file "${ENV_FILE}" exec -T kibana sh -ec "curl -s --max-time 8 http://127.0.0.1:5601/api/status >/dev/null"; then
    KIBANA_READY="true"
    break
  fi
  sleep 10
done

if [[ "${KIBANA_READY}" != "true" ]]; then
  echo "::error::Kibana container is not ready on port 5601 after waiting ~8 minutes."
  docker compose --env-file "${ENV_FILE}" logs --tail=200 kibana || true
  exit 1
fi

TRAEFIK_OK="false"
for attempt in $(seq 1 24); do
  TRAEFIK_CODE="$(curl -sk -o /dev/null -w '%{http_code}' --resolve "${KIBANA_HOST_VALUE}:443:127.0.0.1" "https://${KIBANA_HOST_VALUE}/" || true)"
  if [[ "${TRAEFIK_CODE}" == "200" || "${TRAEFIK_CODE}" == "302" || "${TRAEFIK_CODE}" == "401" ]]; then
    TRAEFIK_OK="true"
    break
  fi
  sleep 10
done

if [[ "${TRAEFIK_OK}" != "true" ]]; then
  echo "::error::Traefik → Kibana check failed (last HTTP ${TRAEFIK_CODE}) for ${KIBANA_HOST_VALUE}."
  exit 1
fi

echo "Logging stack applied. Kibana expected URL: https://${KIBANA_HOST_VALUE}"
