#!/usr/bin/env bash
# Depuis le runner GitHub Actions : SSH vers le VPS et exécute prune-mongodb-backup-dumps.sh (déjà rsyncé).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

: "${VPS_HOST:?VPS_HOST requis}"
: "${VPS_SSH_USER:?VPS_SSH_USER requis}"
: "${VPS_SSH_KEY:?VPS_SSH_KEY requis}"

mkdir -p ~/.ssh
printf '%s\n' "$VPS_SSH_KEY" > ~/.ssh/id_prune_vps
chmod 600 ~/.ssh/id_prune_vps
ssh-keyscan -H "$VPS_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true

REMOTE="${VPS_SSH_USER}@${VPS_HOST}"
REMOTE_SCRIPT="/opt/thetiptop/app/infra/deploy/prune-mongodb-backup-dumps.sh"

ssh -i ~/.ssh/id_prune_vps -o StrictHostKeyChecking=yes \
  "$REMOTE" "set -euo pipefail; chmod +x '${REMOTE_SCRIPT}' 2>/dev/null || true; bash '${REMOTE_SCRIPT}'"
