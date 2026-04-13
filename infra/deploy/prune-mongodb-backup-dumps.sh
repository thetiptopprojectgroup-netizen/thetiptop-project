#!/usr/bin/env bash
# Exécuté sur le VPS (chemin déployé : /opt/thetiptop/app/infra/deploy/…).
# Ne conserve que les MONGODUMP_KEEP derniers fichiers mongodump*.gz par environnement.
# Appelé après chaque déploiement CD + à chaque run du cron backup-repo (logique alignée).
set -euo pipefail

KEEP="${MONGODUMP_KEEP:-5}"
BASE="/opt/thetiptop/backup/mongodb"

for env_name in vdev vpreprod vprod; do
  d="${BASE}/${env_name}"
  [[ -d "$d" ]] || continue
  if compgen -G "${d}/mongodump*.gz" >/dev/null 2>&1; then
    ls -1t "${d}"/mongodump*.gz | tail -n "+$((KEEP + 1))" | xargs -r rm -f
  fi
done
