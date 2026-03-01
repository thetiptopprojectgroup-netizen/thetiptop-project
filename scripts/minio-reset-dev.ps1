# Optionnel : recréer MinIO en local après suppression du PVC (ex. erreur "xl meta version 3").
# En conditions normales, un simple PUSH sur dev suffit : le CD déploie tout (pas besoin de ce script).
# Exécuter depuis : D:\PFE\thetiptop-project  |  Usage : .\scripts\minio-reset-dev.ps1

Set-Location $PSScriptRoot\..

Write-Host "1. Namespace minio..."
& kubectl apply -f k8s/minio/namespace.yaml 2>&1 | ForEach-Object { Write-Host $_ }

Write-Host "`n2. ConfigMap nginx..."
& kubectl apply -f k8s/minio/nginx-configmap.yaml 2>&1 | ForEach-Object { Write-Host $_ }

Write-Host "`n3. Deployment + PVC (host dev)..."
$yaml = Get-Content -Raw -Path k8s/minio/deployment.yaml
$yaml = $yaml -replace 'MINIO_PUBLIC_HOST_PLACEHOLDER', 'minio.dev.thetiptop-jeu.fr'
$yaml | & kubectl apply -f - 2>&1 | ForEach-Object { Write-Host $_ }

Write-Host "`n4. Pods minio :"
& kubectl get pods -n minio 2>&1 | ForEach-Object { Write-Host $_ }
Write-Host "`nAttendre 1-2 min puis : kubectl get pods -n minio"
