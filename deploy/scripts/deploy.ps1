param([string]$Alias = 'vps-antiga')
$ErrorActionPreference = 'Stop'
if ($Alias -ne 'vps-antiga') { throw 'O complemento autoriza somente o alias vps-antiga.' }
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location (Join-Path $Repo 'dosagem-concreto-v2')
try {
  npm ci; if ($LASTEXITCODE) { throw 'npm ci falhou' }
  npm test -- --run; if ($LASTEXITCODE) { throw 'Vitest falhou; resolva as divergências antes de publicar.' }
  npm run build; if ($LASTEXITCODE) { throw 'Build falhou' }
  Push-Location api
  try {
    $PgBin = 'C:\Program Files\PostgreSQL\16\bin'
    if (Test-Path -LiteralPath (Join-Path $PgBin 'postgres.exe')) { $env:PATH = "$PgBin;$env:PATH" }
    py -3.12 -m venv .venv; if ($LASTEXITCODE) { throw 'Python 3.12 ausente' }
    .\.venv\Scripts\python.exe -m pip install -e '.[test]'; if ($LASTEXITCODE) { throw 'Instalação da API falhou' }
    .\.venv\Scripts\python.exe -m pytest -q; if ($LASTEXITCODE) { throw 'Testes da API falharam' }
  } finally { Pop-Location }
} finally { Pop-Location }
ssh -o BatchMode=yes $Alias true
if ($LASTEXITCODE) { throw 'SSH por chave indisponível; deploy pendente.' }
$Ts = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
$Archive = Join-Path $env:TEMP "concretrack-dosagem-$Ts.tar.gz"
Push-Location $Repo
try {
  tar --exclude=.venv --exclude=__pycache__ --exclude=.env -czf $Archive dosagem-concreto-v2/api deploy
  if ($LASTEXITCODE) { throw 'Empacotamento falhou' }
  scp -o BatchMode=yes $Archive "${Alias}:/tmp/concretrack-dosagem-$Ts.tar.gz"
  if ($LASTEXITCODE) { throw 'Envio falhou' }
  $Remote = Get-Content (Join-Path $PSScriptRoot 'remote-release.sh') -Raw
  $Remote | ssh -o BatchMode=yes $Alias "bash -s -- '$Ts'"
  if ($LASTEXITCODE) { throw 'Implantação remota falhou' }
} finally {
  Pop-Location
  Remove-Item -LiteralPath $Archive -ErrorAction SilentlyContinue
}
