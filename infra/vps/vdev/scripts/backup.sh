#!/usr/bin/env bash
# Sauvegarde MongoDB (mongodump) + Restic vers MinIO — à exécuter sur le VPS dans /srv/vdev
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

BACKUP_ROOT="${BACKUP_ROOT:-/srv/vdev/backups}"
mkdir -p "$BACKUP_ROOT"
DUMP_FILE="${BACKUP_ROOT}/mongodb-$(date +%Y%m%d-%H%M%S).archive.gz"

echo "📦 mongodump → $DUMP_FILE"
docker compose exec -T mongodb mongodump \
  --username "${MONGO_ROOT_USER:-root}" \
  --password "${MONGO_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --db "${MONGO_APP_DB:-db_vdev}" \
  --archive --gzip > "$DUMP_FILE"

if [[ -n "${RESTIC_REPOSITORY:-}" ]] && command -v restic >/dev/null 2>&1; then
  export AWS_ACCESS_KEY_ID="${MINIO_ACCESS_KEY:-}"
  export AWS_SECRET_ACCESS_KEY="${MINIO_SECRET_KEY:-}"
  echo "📤 restic backup"
  restic backup "$DUMP_FILE" --tag mongodb --tag vdev
else
  echo "ℹ️ RESTIC_REPOSITORY non défini ou restic absent — archive conservée : $DUMP_FILE"
fi

echo "✅ Backup terminé."
