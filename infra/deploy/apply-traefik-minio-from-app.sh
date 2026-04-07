#!/usr/bin/env bash
# Appelé par GitHub Actions après rsync vers /opt/thetiptop/app — aucune commande manuelle sur le VPS requise.
# Met à jour les routes Traefik pour MinIO / Restic depuis le dépôt Git.
set -euo pipefail
ROOT="${1:-/opt/thetiptop/app}"
SRC="$ROOT/infra/vps/traefik/dynamic/minio.yml"
if [[ ! -f "$SRC" ]]; then
  echo "Fichier absent : $SRC" >&2
  exit 1
fi
mkdir -p /opt/thetiptop/traefik/dynamic
install -m 0644 "$SRC" /opt/thetiptop/traefik/dynamic/minio.yml
if [[ -f /opt/thetiptop/traefik/docker-compose.yml ]]; then
  (cd /opt/thetiptop/traefik && docker compose up -d)
fi
# Si MinIO existe déjà (Ansible / install précédente), l’attacher au réseau Traefik pour que les routes fichier résolvent thetiptop-minio
docker network connect traefik thetiptop-minio 2>/dev/null || true
