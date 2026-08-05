$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$certDir = Join-Path $root ".certs"
$certPath = Join-Path $certDir "concretrack-local.pem"
$keyPath = Join-Path $certDir "concretrack-local-key.pem"
$httpsPort = 5174

function Get-LanIp {
  Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254*" -and
      $_.InterfaceAlias -notlike "vEthernet*" -and
      $_.PrefixOrigin -ne "WellKnown"
    } |
    Sort-Object @{ Expression = { if ($_.InterfaceAlias -match "Wi-Fi|Ethernet") { 0 } else { 1 } } } |
    Select-Object -First 1 -ExpandProperty IPAddress
}

function Test-CertificateSan($certFile, $ip) {
  if (-not (Test-Path $certFile)) { return $false }
  $dump = certutil -dump $certFile 2>$null | Out-String
  return $dump.Contains("Nome DNS=localhost") -and
    $dump.Contains("Endere") -and
    $dump.Contains("127.0.0.1") -and
    $dump.Contains($ip)
}

function Test-Url($url) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-Url($url, $seconds) {
  $limit = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $limit) {
    if (Test-Url $url) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Stop-ProjectListener($port, $projectRoot) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine -and $process.CommandLine.Contains($projectRoot)) {
      Stop-Process -Id $listener.OwningProcess -Force
    }
  }
}

$lanIp = Get-LanIp
if (-not $lanIp) { throw "Nenhum IPv4 LAN ativo encontrado." }

New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$certOk = (Test-Path $keyPath) -and (Test-CertificateSan $certPath $lanIp)
if (-not $certOk) {
  $mkcert = Get-Command mkcert -ErrorAction SilentlyContinue
  if (-not $mkcert) {
    throw "mkcert nao encontrado no PATH e o certificado atual nao contem localhost, 127.0.0.1 e $lanIp."
  }
  & mkcert -install
  Push-Location $certDir
  try {
    & mkcert -cert-file "concretrack-local.pem" -key-file "concretrack-local-key.pem" localhost 127.0.0.1 $lanIp
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path $certPath) -or -not (Test-Path $keyPath)) {
  throw "Certificado PEM ou chave PEM ausente em .certs."
}
if (-not (Test-CertificateSan $certPath $lanIp)) {
  throw "Certificado PEM nao contem o IP LAN atual no SAN: $lanIp."
}

Push-Location $root
try {
  docker compose up -d postgres api
} finally {
  Pop-Location
}

if (-not (Wait-Url "http://127.0.0.1:3000/health" 45)) {
  throw "API nao respondeu em http://127.0.0.1:3000/health."
}

Stop-ProjectListener $httpsPort $root

Push-Location $frontendDir
try {
  $env:VITE_FACIAL_AUTH_ENABLED = "true"
  $env:VITE_API_URL = "/api"
  $env:VITE_HTTPS_ENABLED = "true"
  $env:VITE_HTTPS_CERT_PATH = $certPath
  $env:VITE_HTTPS_KEY_PATH = $keyPath
  $env:VITE_HTTPS_PORT = "$httpsPort"
  $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npmCommand) { $npmCommand = Get-Command npm -ErrorAction Stop }
  $npm = $npmCommand.Source
  $vite = Start-Process $npm -ArgumentList @("run", "dev:https") -PassThru -WindowStyle Hidden
} finally {
  Pop-Location
}

if ($vite.HasExited) {
  throw "Vite HTTPS encerrou imediatamente com exit code $($vite.ExitCode)."
}
if (-not (Wait-Url "https://localhost:$httpsPort" 45)) {
  if (-not $vite.HasExited) { Stop-Process -Id $vite.Id -Force }
  throw "Frontend HTTPS nao respondeu em https://localhost:$httpsPort."
}
if (-not (Wait-Url "https://$lanIp`:$httpsPort" 15)) {
  if (-not $vite.HasExited) { Stop-Process -Id $vite.Id -Force }
  throw "Frontend HTTPS LAN nao respondeu em https://$lanIp`:$httpsPort."
}
if (-not (Wait-Url "https://localhost:$httpsPort/api/health" 15)) {
  if (-not $vite.HasExited) { Stop-Process -Id $vite.Id -Force }
  throw "Proxy /api nao respondeu em https://localhost:$httpsPort/api/health."
}
if (-not (Wait-Url "https://$lanIp`:$httpsPort/api/health" 15)) {
  if (-not $vite.HasExited) { Stop-Process -Id $vite.Id -Force }
  throw "Proxy /api LAN nao respondeu em https://$lanIp`:$httpsPort/api/health."
}

Write-Host "Computador: https://localhost:$httpsPort"
Write-Host "Tablet: https://$lanIp`:$httpsPort"
Wait-Process -Id $vite.Id
