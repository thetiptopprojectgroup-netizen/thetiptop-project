#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-}"
if [[ -z "${ENV_NAME}" ]]; then
  echo "Usage: $0 <vdev|vpreprod|vprod>"
  exit 1
fi

DATE_TAG="$(date +%Y%m%d-%H%M%S)"
DUMP_DIR="/tmp/mongo-dump-${ENV_NAME}-${DATE_TAG}"
ARCHIVE="/tmp/mongo-dump-${ENV_NAME}-${DATE_TAG}.tgz"

case "${ENV_NAME}" in
  vdev) DB_NAME="db_vdev" ;;
  vpreprod) DB_NAME="db_vpreprod" ;;
  vprod) DB_NAME="db_vprod" ;;
  *)
    echo "Unknown environment: ${ENV_NAME}"
    exit 1
    ;;
esac

echo "Starting mongodump for ${ENV_NAME} (${DB_NAME})..."
mkdir -p "${DUMP_DIR}"
mongodump --db "${DB_NAME}" --out "${DUMP_DIR}"
tar -czf "${ARCHIVE}" -C "${DUMP_DIR}" .

echo "Sending backup to Restic repository..."
restic backup "${ARCHIVE}" --tag "${ENV_NAME}" --tag "mongodb"

echo "Cleanup temporary files..."
rm -rf "${DUMP_DIR}" "${ARCHIVE}"

echo "Backup completed for ${ENV_NAME}"
