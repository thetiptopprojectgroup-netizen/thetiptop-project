# MinIO : ce script utilisait kubectl + manifests Kubernetes (supprimes du depot).
# Deploiement actuel : Docker Compose sur VPS + Ansible (infra/ansible, infra/deploy).
# Pour reinitialiser MinIO sur un environnement, utiliser les playbooks / compose du VPS
# ou docker compose down -v sur le service concerne (apres sauvegarde des donnees si besoin).

Write-Host "Ce script n'est plus utilise : le projet se deploie avec Ansible / Docker Compose, pas Kubernetes."
Write-Host "Voir : infra/deploy et infra/ansible"
exit 1
