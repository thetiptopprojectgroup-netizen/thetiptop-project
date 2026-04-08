#!/usr/bin/env bash
# Appelé par GitHub Actions après rsync : applique le rôle Ansible « restic » (script + crons) sur le VPS.
# Variables d’environnement : VPS_HOST, VPS_SSH_USER, VPS_SSH_KEY (clé privée multiligne).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

: "${VPS_HOST:?VPS_HOST requis}"
: "${VPS_SSH_USER:?VPS_SSH_USER requis}"
: "${VPS_SSH_KEY:?VPS_SSH_KEY requis}"

export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get install -y ansible-core

mkdir -p ~/.ssh
printf '%s\n' "$VPS_SSH_KEY" > ~/.ssh/id_ansible_vps
chmod 600 ~/.ssh/id_ansible_vps
ssh-keyscan -H "$VPS_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true

INV="$(mktemp)"
trap 'rm -f "$INV"' EXIT
KEY_PATH="${HOME}/.ssh/id_ansible_vps"
{
  echo '[vps]'
  echo "thetiptop-vps ansible_host=${VPS_HOST} ansible_user=${VPS_SSH_USER} ansible_ssh_private_key_file=${KEY_PATH} ansible_python_interpreter=/usr/bin/python3"
} > "$INV"

cd infra/ansible
if ! ansible-playbook site.yml -i "$INV" --tags restic; then
  echo "::error::Ansible (rôle restic) a échoué. Vérifier sur le VPS : MinIO actif sur 127.0.0.1:9000, bucket du restic_repository, alignement minio_root_user/minio_root_password avec la console MinIO, et /var/log/thetiptop-restic.log après un cron."
  exit 1
fi
