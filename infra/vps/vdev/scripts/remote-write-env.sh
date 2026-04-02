#!/usr/bin/env bash
# Appelé uniquement en CI (variables d'environnement injectées par le workflow).
# Génère /srv/vdev/.env sur le VPS sans stocker ce fichier dans Git.
set -euo pipefail
TARGET="${1:-/srv/vdev/.env}"
mkdir -p "$(dirname "$TARGET")"

: "${VDEV_HOST:?VDEV_HOST est requis}"
CLIENT_URL_EFFECTIVE="${CLIENT_URL:-https://${VDEV_HOST}}"
TCR="${TRAEFIK_CERT_RESOLVER:-letsencrypt}"

cat > "$TARGET" << EOF
# Généré par GitHub Actions — ne pas commiter
HARBOR_REGISTRY=${HARBOR_REGISTRY}
HARBOR_PROJECT=${HARBOR_PROJECT}
IMAGE_TAG=${IMAGE_TAG:-latest}

VDEV_HOST=${VDEV_HOST}
TRAEFIK_CERT_RESOLVER=${TCR}

MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
MONGO_APP_DB=db_vdev

MONGODB_URI=mongodb://thetiptop:thetiptop123@mongodb:27017/db_vdev?authSource=db_vdev

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
CLIENT_URL=${CLIENT_URL_EFFECTIVE}

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Restic (optionnel — laisser vide si non utilisé)
# RESTIC_REPOSITORY=
# RESTIC_PASSWORD=
# MINIO_ACCESS_KEY=
# MINIO_SECRET_KEY=
EOF

chmod 600 "$TARGET"
echo "✅ $TARGET écrit."
