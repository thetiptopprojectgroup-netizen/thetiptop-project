#!/usr/bin/env bash
# Appelé depuis GitHub Actions après ssh-keyscan et définition de SSH_BASE / REMOTE.
# Variables : LOGGING_ENV_FILE, LOGGING_ENV_FILE_B64, LOGGING_ELASTIC_PASSWORD, LOGGING_KIBANA_HOST, LOGGING_ADMIN_PASSWORD
set -euo pipefail

L_CONTENT=""
if [[ -n "${LOGGING_ENV_FILE_B64:-}" ]]; then
  L_CONTENT="$(printf '%s' "${LOGGING_ENV_FILE_B64}" | base64 -d)"
elif [[ -n "${LOGGING_ENV_FILE:-}" ]]; then
  L_CONTENT="${LOGGING_ENV_FILE}"
elif [[ -n "${LOGGING_ELASTIC_PASSWORD:-}" ]]; then
  ADMIN_PASSWORD="${LOGGING_ADMIN_PASSWORD:-${LOGGING_ELASTIC_PASSWORD}}"
  L_CONTENT="$(printf 'KIBANA_HOST=%s\nELASTIC_PASSWORD=%s\nKIBANA_USERNAME=admin\nKIBANA_PASSWORD=%s\n' \
    "${LOGGING_KIBANA_HOST:-kibana.dsp5-archi-o22a-15m-g3.fr}" \
    "${LOGGING_ELASTIC_PASSWORD}" \
    "${ADMIN_PASSWORD}")"
fi

if [[ -n "${L_CONTENT}" ]]; then
  L_CONTENT="$(printf '%s' "${L_CONTENT}" | tr -d '\r')"
  "${SSH_BASE[@]}" "$REMOTE" "mkdir -p /opt/thetiptop/app/infra/logging"
  printf '%s\n' "${L_CONTENT}" | "${SSH_BASE[@]}" "$REMOTE" "cat > /opt/thetiptop/app/infra/logging/.env"
  "${SSH_BASE[@]}" "$REMOTE" "chmod 600 /opt/thetiptop/app/infra/logging/.env"
else
  echo "::warning::Secret logging absent : définissez LOGGING_ELASTIC_PASSWORD (recommandé), ou LOGGING_ENV_FILE / LOGGING_ENV_FILE_B64. Sinon apply-logging utilisera .env.example si aucun .env n’existe sur le VPS."
fi
