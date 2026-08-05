$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$certDir = Join-Path $root ".certs"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" -and $_.InterfaceAlias -notlike "vEthernet*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Sort-Object @{ Expression = { if ($_.InterfaceAlias -match "Wi-Fi|Ethernet") { 0 } else { 1 } } } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $lanIp) { $lanIp = "127.0.0.1" }
$httpPort = 5173
$httpsPort = 5174

$cert = Join-Path $certDir "concretrack-local.pem"
$key = Join-Path $certDir "concretrack-local-key.pem"
$pfx = Join-Path $certDir "concretrack-local.pfx"
$pfxPass = "concretrack-local-dev"
$proxyScript = Join-Path $frontendDir "scripts\https-proxy.mjs"

function Test-HttpOk($url) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Wait-HttpOk($url, $seconds) {
  $limit = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $limit) {
    if (Test-HttpOk $url) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Get-DevCertificate {
  Get-ChildItem Cert:\CurrentUser\My |
    Where-Object {
      $_.Subject -eq "CN=ConcreTrack Local HTTPS" -and
      ($_.DnsNameList.Unicode -contains "localhost") -and
      ($_.DnsNameList.Unicode -contains "127.0.0.1") -and
      ($_.DnsNameList.Unicode -contains $lanIp)
    } |
    Select-Object -First 1
}

if (-not (Test-Path $proxyScript)) {
  throw "Proxy HTTPS nao encontrado: $proxyScript"
}

if (-not (Test-Path $cert) -or -not (Test-Path $key) -or -not (Test-Path $pfx) -or -not (Get-DevCertificate)) {
  if (Get-Command mkcert -ErrorAction SilentlyContinue) {
    Push-Location $certDir
    mkcert -cert-file "concretrack-local.pem" -key-file "concretrack-local-key.pem" localhost 127.0.0.1 $lanIp
    Pop-Location
  } else {
    $dnsNames = @("localhost", "127.0.0.1", $lanIp)
    $existing = Get-DevCertificate
    if (-not $existing) {
      Get-ChildItem Cert:\CurrentUser\My |
        Where-Object { $_.Subject -eq "CN=ConcreTrack Local HTTPS" } |
        Remove-Item -Force
      Get-ChildItem Cert:\CurrentUser\Root |
        Where-Object { $_.Subject -eq "CN=ConcreTrack Local HTTPS" } |
        Remove-Item -Force
      $existing = New-SelfSignedCertificate -Subject "CN=ConcreTrack Local HTTPS" -DnsName $dnsNames -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(2)
      Import-Certificate -FilePath (Export-Certificate -Cert $existing -FilePath (Join-Path $certDir "concretrack-local.cer")).FullName -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
    }
    Export-PfxCertificate -Cert $existing -FilePath $pfx -Password (ConvertTo-SecureString $pfxPass -AsPlainText -Force) | Out-Null
  }
}

Push-Location $root
docker compose up -d postgres api
Pop-Location

if (-not (Wait-HttpOk "http://127.0.0.1:3000/health" 30)) {
  throw "API nao respondeu em http://127.0.0.1:3000/health"
}

if (-not (Test-HttpOk "http://127.0.0.1:$httpPort")) {
  Push-Location $frontendDir
  $vite = Start-Process npm -ArgumentList @("run", "dev", "--", "--host", "0.0.0.0", "--port", "$httpPort") -PassThru -WindowStyle Hidden
  Pop-Location
  if (-not (Wait-HttpOk "http://127.0.0.1:$httpPort" 30)) {
    throw "Vite HTTP nao respondeu em http://127.0.0.1:$httpPort"
  }
}

if (Get-NetTCPConnection -LocalPort $httpsPort -State Listen -ErrorAction SilentlyContinue) {
  throw "Porta HTTPS $httpsPort ja esta em uso."
}

Push-Location $frontendDir
$env:VITE_FACIAL_AUTH_ENABLED = "true"
$env:VITE_API_URL = "https://localhost:$httpsPort/api"
$proxy = Start-Process node -ArgumentList @($proxyScript, "$httpsPort", "$httpPort", $pfx, $pfxPass) -PassThru -WindowStyle Hidden
Pop-Location

if (-not (Wait-HttpOk "https://localhost:$httpsPort" 30)) {
  if ($proxy -and -not $proxy.HasExited) { Stop-Process -Id $proxy.Id -Force }
  throw "HTTPS nao respondeu em https://localhost:$httpsPort"
}
if (-not (Wait-HttpOk "https://localhost:$httpsPort/api/health" 10)) {
  if ($proxy -and -not $proxy.HasExited) { Stop-Process -Id $proxy.Id -Force }
  throw "Proxy /api nao respondeu em https://localhost:$httpsPort/api/health"
}

Write-Host "Computador: https://localhost:$httpsPort"
Write-Host "Tablet: https://$lanIp`:$httpsPort"
Wait-Process -Id $proxy.Id
