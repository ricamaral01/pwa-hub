$ErrorActionPreference = 'Stop'
$frontend = Join-Path $PSScriptRoot '..\..\unificado\laboratorio\frontend'
Push-Location $frontend
try {
    npm exec -- tsc -b --pretty false
    if ($LASTEXITCODE -ne 0) { throw 'Falha no TypeScript da Cronoanálise.' }
    npm exec -- vite build --config vite.cronoanalise.config.ts
    if ($LASTEXITCODE -ne 0) { throw 'Falha no build da Cronoanálise.' }
} finally {
    Pop-Location
}
