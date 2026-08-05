$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$certDir = Join-Path $root ".certs"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" -and $_.InterfaceAlias -notlike "vEthernet*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $lanIp) { $lanIp = "127.0.0.1" }
$port = 5173
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener) { $port = 5174 }

$cert = Join-Path $certDir "concretrack-local.pem"
$key = Join-Path $certDir "concretrack-local-key.pem"
$pfx = Join-Path $certDir "concretrack-local.pfx"
$pfxPass = "concretrack-local-dev"

if (-not (Test-Path $cert) -or -not (Test-Path $key) -or -not (Test-Path $pfx)) {
  if (Get-Command mkcert -ErrorAction SilentlyContinue) {
    Push-Location $certDir
    mkcert -cert-file "concretrack-local.pem" -key-file "concretrack-local-key.pem" localhost 127.0.0.1 $lanIp
    Pop-Location
  } else {
    $dnsNames = @("localhost", "127.0.0.1", $lanIp)
    $existing = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.Subject -eq "CN=ConcreTrack Local HTTPS" } | Select-Object -First 1
    if (-not $existing) {
      $existing = New-SelfSignedCertificate -Subject "CN=ConcreTrack Local HTTPS" -DnsName $dnsNames -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(2)
      Import-Certificate -FilePath (Export-Certificate -Cert $existing -FilePath (Join-Path $certDir "concretrack-local.cer")).FullName -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
    }
    Export-PfxCertificate -Cert $existing -FilePath $pfx -Password (ConvertTo-SecureString $pfxPass -AsPlainText -Force) | Out-Null
  }
}

Push-Location $root
docker compose up -d postgres api
Pop-Location

Push-Location (Join-Path $root "frontend")
$env:VITE_FACIAL_AUTH_ENABLED = "true"
$env:VITE_API_URL = "https://localhost:$port/api"
if (Test-Path $pfx) {
  $env:VITE_HTTPS_PFX = $pfx
  $env:VITE_HTTPS_PASSPHRASE = $pfxPass
} else {
  $env:VITE_HTTPS_CERT = $cert
  $env:VITE_HTTPS_KEY = $key
}
if ($port -eq 5174) {
  node scripts/https-proxy.mjs $port 5173 $pfx $pfxPass
} else {
  npm run dev -- --host 0.0.0.0 --port $port
}
Pop-Location

Write-Host "Computador: https://localhost:$port"
Write-Host "Tablet: https://$lanIp`:$port"
