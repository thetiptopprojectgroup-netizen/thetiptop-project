#!/usr/bin/env bash
# Normalise infra/deploy/env/<env>.env en LF (Unix).
# Usage : depuis la racine du dépôt : bash infra/scripts/normalize-env-for-github.sh vdev
set -euo pipefail
ENV_NAME="${1:?usage: $0 vdev|vpreprod|vprod}"
case "$ENV_NAME" in vdev|vpreprod|vprod) ;; *) echo "usage: $0 vdev|vpreprod|vprod" >&2; exit 1 ;; esac
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FILE="$ROOT/infra/deploy/env/${ENV_NAME}.env"
test -f "$FILE" || { echo "Fichier introuvable : $FILE" >&2; exit 1; }
tmp="$(mktemp)"
tr -d '\r' <"$FILE" >"$tmp"
mv "$tmp" "$FILE"
case "$ENV_NAME" in
  vdev) SECRET=VDEV_ENV_FILE ;;
  vpreprod) SECRET=VPREPROD_ENV_FILE ;;
  vprod) SECRET=VPROD_ENV_FILE ;;
esac
echo "OK : $FILE -> LF uniquement."
echo "Secret GitHub : $SECRET"
echo "--- contenu à coller ---"
cat "$FILE"
