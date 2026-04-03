# PowerShell helper to run createAdmin with a provided MongoDB URI
# Usage: From server folder run: powershell -ExecutionPolicy Bypass -File ./src/scripts/run-seed-admin.ps1

param()

Write-Host "Run helper to create admin/employe accounts for Thé Tip Top"
$inputUri = Read-Host -Prompt "Entrez l'URI MongoDB (ex: mongodb://user:pass@host:27017/thetiptop?authSource=admin) — ou appuyez sur Entrée pour localhost"
if ([string]::IsNullOrWhiteSpace($inputUri)) {
    $uri = "mongodb://localhost:27017/thetiptop"
    Write-Host "URI par défaut utilisée: $uri"
} else {
    $uri = $inputUri
    # Mask display
    $masked = $uri -replace '([^:]+):([^@]+)@', '****:****@'
    Write-Host "URI utilisée: $masked"
}

# Set environment variable for the child process
$env:MONGODB_URI = $uri

# Run the createAdmin script
Write-Host "Lancement de la création des comptes..."
node ./src/scripts/createAdmin.js
$exit = $LASTEXITCODE
if ($exit -ne 0) { Write-Host "Le script s'est terminé avec le code $exit" -ForegroundColor Red }
else { Write-Host "Opération terminée." -ForegroundColor Green }
