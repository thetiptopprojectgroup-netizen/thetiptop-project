# Normalise infra/deploy/env/<env>.env en LF et affiche le nom du secret GitHub à coller.
# Usage (PowerShell, depuis le repo) : .\infra\scripts\normalize-env-for-github.ps1 vdev
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('vdev', 'vpreprod', 'vprod')]
    [string] $EnvName
)

$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$path = Join-Path $root "infra\deploy\env\$EnvName.env"
if (-not (Test-Path $path)) {
    Write-Error "Fichier introuvable : $path"
    exit 1
}

$raw = [System.IO.File]::ReadAllText($path)
$unix = $raw -replace "`r`n", "`n" -replace "`r", "`n"
[System.IO.File]::WriteAllText($path, $unix, [System.Text.UTF8Encoding]::new($false))

$secret = switch ($EnvName) {
    'vdev' { 'VDEV_ENV_FILE' }
    'vpreprod' { 'VPREPROD_ENV_FILE' }
    'vprod' { 'VPROD_ENV_FILE' }
}

Write-Host "OK : $path -> LF uniquement." -ForegroundColor Green
Write-Host "GitHub > Settings > Secrets and variables > Actions > secret : $secret" -ForegroundColor Cyan
Write-Host "Collez tout le fichier ci-dessous dans ce secret, puis Enregistrer.`n" -ForegroundColor Cyan
Write-Output $unix
