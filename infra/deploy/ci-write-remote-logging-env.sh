#!/usr/bin/env bash
# Write logging .env to the VPS via SSH.
# Called from deploy-*.yml after SSH_BASE/REMOTE are set.
# Secrets: LOGGING_ELASTIC_PASSWORD (required), LOGGING_ADMIN_PASSWORD (optional).
set -euo pipefail

L_CONTENT=""
if [[ -n "${LOGGING_ENV_FILE_B64:-}" ]]; then
  L_CONTENT="$(printf '%s' "${LOGGING_ENV_FILE_B64}" | base64 -d)"
elif [[ -n "${LOGGING_ENV_FILE:-}" ]]; then
  L_CONTENT="${LOGGING_ENV_FILE}"
elif [[ -n "${LOGGING_ELASTIC_PASSWORD:-}" ]]; then
  EP="${LOGGING_ELASTIC_PASSWORD}"
  AP="${LOGGING_ADMIN_PASSWORD:-${EP}}"
  SP="${LOGGING_KIBANA_SYSTEM_PASSWORD:-${EP}}"
  KH="${LOGGING_KIBANA_HOST:-kibana.dsp5-archi-o22a-15m-g3.fr}"
  L_CONTENT="KIBANA_HOST=${KH}
ELASTIC_PASSWORD=${EP}
KIBANA_SYSTEM_PASSWORD=${SP}
KIBANA_USERNAME=admin
KIBANA_PASSWORD=${AP}"
fi

if [[ -n "${L_CONTENT}" ]]; then
  L_CONTENT="$(printf '%s' "${L_CONTENT}" | tr -d '\r')"
  "${SSH_BASE[@]}" "$REMOTE" "mkdir -p /opt/thetiptop/app/infra/logging"
  printf '%s\n' "${L_CONTENT}" | "${SSH_BASE[@]}" "$REMOTE" "cat > /opt/thetiptop/app/infra/logging/.env"
  "${SSH_BASE[@]}" "$REMOTE" "chmod 600 /opt/thetiptop/app/infra/logging/.env"
else
  echo "::warning::No logging secret found. Set LOGGING_ELASTIC_PASSWORD in GitHub Secrets."
fi
