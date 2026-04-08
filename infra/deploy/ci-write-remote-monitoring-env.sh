#!/usr/bin/env bash
# Appelé depuis GitHub Actions après ssh-keyscan et définition de SSH_BASE / REMOTE.
# Variables d'environnement (runner) :
#   MONITORING_ENV_FILE, MONITORING_ENV_FILE_B64, MONITORING_GRAFANA_ADMIN_PASSWORD
# Au moins une source doit fournir le contenu ; sinon message d’avertissement uniquement.
# Dépend : SSH_BASE (tableau bash), REMOTE, déjà initialisés par le workflow.
set -euo pipefail

M_CONTENT=""
if [[ -n "${MONITORING_ENV_FILE_B64:-}" ]]; then
  M_CONTENT="$(printf '%s' "${MONITORING_ENV_FILE_B64}" | base64 -d)"
elif [[ -n "${MONITORING_ENV_FILE:-}" ]]; then
  M_CONTENT="${MONITORING_ENV_FILE}"
elif [[ -n "${MONITORING_GRAFANA_ADMIN_PASSWORD:-}" ]]; then
  M_CONTENT="$(printf 'GRAFANA_HOST=grafana.dsp5-archi-o22a-15m-g3.fr\nPROMETHEUS_HOST=prometheus.dsp5-archi-o22a-15m-g3.fr\nGRAFANA_ADMIN_USER=admin\nGRAFANA_ADMIN_PASSWORD=%s\n' "${MONITORING_GRAFANA_ADMIN_PASSWORD}")"
fi

if [[ -n "${M_CONTENT}" ]]; then
  M_CONTENT="$(printf '%s' "${M_CONTENT}" | tr -d '\r')"
  "${SSH_BASE[@]}" "$REMOTE" "mkdir -p /opt/thetiptop/app/infra/monitoring"
  printf '%s\n' "${M_CONTENT}" | "${SSH_BASE[@]}" "$REMOTE" "cat > /opt/thetiptop/app/infra/monitoring/.env"
  "${SSH_BASE[@]}" "$REMOTE" "chmod 600 /opt/thetiptop/app/infra/monitoring/.env"
else
  echo "::warning::Secret monitoring absent : définissez MONITORING_GRAFANA_ADMIN_PASSWORD (recommandé), ou MONITORING_ENV_FILE / MONITORING_ENV_FILE_B64 (comme VDEV_ENV_FILE). Sans cela, le script apply-monitoring utilisera .env.example si aucun .env n’existe sur le VPS."
fi
