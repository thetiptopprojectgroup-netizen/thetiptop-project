#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-}"
IMAGE_TAG="${2:-}"

if [[ -z "${ENV_NAME}" || -z "${IMAGE_TAG}" ]]; then
  echo "Usage: $0 <vdev|vpreprod|vprod> <image_tag>"
  exit 1
fi

ENV_DIR="/srv/${ENV_NAME}"
COMPOSE_FILE="${ENV_DIR}/docker-compose.yml"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

echo "Logging in to Harbor..."
echo "${HARBOR_PASSWORD}" | docker login "${HARBOR_REGISTRY}" -u "${HARBOR_USERNAME}" --password-stdin

echo "Deploying ${ENV_NAME} with tag ${IMAGE_TAG}..."
export IMAGE_TAG
docker compose -f "${COMPOSE_FILE}" pull
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

echo "Deployment complete for ${ENV_NAME}"
