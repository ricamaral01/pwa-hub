$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$certDir = Join-Path $root ".certs"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $lanIp) { $lanIp = "127.0.0.1" }

$cert = Join-Path $certDir "concretrack-local.pem"
$key = Join-Path $certDir "concretrack-local-key.pem"

if (-not (Test-Path $cert) -or -not (Test-Path $key)) {
  if (Get-Command mkcert -ErrorAction SilentlyContinue) {
    Push-Location $certDir
    mkcert -cert-file "concretrack-local.pem" -key-file "concretrack-local-key.pem" localhost 127.0.0.1 $lanIp
    Pop-Location
  } else {
    throw "mkcert nao encontrado. Instale mkcert e execute 'mkcert -install' para criar um certificado local confiavel."
  }
}

Push-Location $root
docker compose up -d postgres api
Pop-Location

Push-Location (Join-Path $root "frontend")
$env:VITE_FACIAL_AUTH_ENABLED = "true"
$env:VITE_API_URL = "https://localhost:5173/api"
npm run dev -- --host 0.0.0.0 --port 5173 --https --cert $cert --key $key
Pop-Location

Write-Host "Computador: https://localhost:5173"
Write-Host "Tablet: https://$lanIp`:5173"
