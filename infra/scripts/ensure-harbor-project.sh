#!/usr/bin/env bash
# Crée un projet Harbor via l'API v2 s'il n'existe pas (HTTP 201 ou 409).
# Usage : HARBOR_URL HARBOR_ADMIN_PASSWORD [HARBOR_ADMIN_USER] requis ;
#         HARBOR_PROJECT_NAME ou $1 = nom du projet (ex. vdev).
set -euo pipefail

PROJECT="${HARBOR_PROJECT_NAME:-${1:-}}"
if [[ -z "${PROJECT}" ]]; then
  echo "usage: HARBOR_PROJECT_NAME=xxx $0   ou   $0 <project>" >&2
  exit 1
fi

BASE="${HARBOR_URL:?définir HARBOR_URL, ex. https://harbor.example.com}"
BASE="${BASE%/}"
USER="${HARBOR_ADMIN_USER:-admin}"
PASS="${HARBOR_ADMIN_PASSWORD:?définir le secret HARBOR_ADMIN_PASSWORD (compte admin Harbor)}"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

code=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -u "${USER}:${PASS}" \
  -H "Content-Type: application/json" \
  -X POST "${BASE}/api/v2.0/projects" \
  -d "{\"project_name\":\"${PROJECT}\",\"metadata\":{\"public\":\"false\"}}")

case "$code" in
  201) echo "Harbor : projet '${PROJECT}' créé (HTTP 201)." ;;
  409) echo "Harbor : projet '${PROJECT}' existe déjà (HTTP 409)." ;;
  *)
    echo "Harbor : échec création projet '${PROJECT}' (HTTP ${code})." >&2
    cat "$TMP" >&2 || true
    exit 1
    ;;
esac
