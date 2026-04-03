#!/usr/bin/env bash
# À lancer sur le VPS (SSH), depuis n'importe où : bash /opt/thetiptop/app/infra/deploy/diagnose-traefik-stack.sh [vdev|vpreprod|vprod]
# Affiche réseau traefik, labels du conteneur client, logs Traefik — utile si 404 + « Non sécurisé ».
set -euo pipefail
ENV="${1:-vdev}"
echo "=== Environnement attendu : STACK_NAME=$ENV ==="
echo
echo "=== Conteneurs (traefik + stack) ==="
docker ps -a --format 'table {{.Names}}\t{{.Status}}' | (head -1; grep -E "traefik|${ENV}|thetiptop" || true)
echo
echo "=== Réseau Docker 'traefik' (noms attachés) ==="
if docker network inspect traefik &>/dev/null; then
  docker network inspect traefik --format '{{range $k,$v := .Containers}}{{$v.Name}} {{end}}'
  echo
else
  echo "ERREUR : le réseau 'traefik' n'existe pas. Lancez le playbook Ansible (rôle traefik_network)."
fi
echo
CID=$(docker ps -qf "name=${ENV}-client" | head -1)
if [[ -z "${CID}" ]]; then
  echo "=== AUCUN conteneur trouvé avec le nom *${ENV}-client* (docker ps). ==="
  echo "    Vérifiez : docker compose -f /opt/thetiptop/app/infra/deploy/docker-compose.stack.yml --env-file ... ps"
else
  echo "=== Labels traefik sur le conteneur client (${CID}) ==="
  docker inspect "$CID" --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | grep '^traefik' || true
fi
echo
echo "=== Image Traefik (doit être ≥ v3.6 si Docker Engine 29+ — sinon provider Docker en échec) ==="
docker inspect thetiptop-traefik --format '{{.Config.Image}}' 2>/dev/null || echo "(conteneur introuvable)"
echo
echo "=== Dernières lignes des logs Traefik (erreurs provider / certificats) ==="
docker logs thetiptop-traefik 2>&1 | tail -40
