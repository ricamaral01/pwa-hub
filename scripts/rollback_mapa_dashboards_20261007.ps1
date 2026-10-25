$ErrorActionPreference = 'Stop'
$checkout = (Resolve-Path (Join-Path $PSScriptRoot '..\.work-mapa-old-github')).Path
$published = '6d3a884a531be5fa55c02da58306807c55c4f5fb'
$head = (git -C $checkout rev-parse HEAD).Trim()
$remote = ((git -C $checkout ls-remote origin refs/heads/main) -split '\s+')[0]
if ($LASTEXITCODE -ne 0 -or $head -ne $published -or $remote -ne $published) {
    throw 'O Mapa oficial mudou após esta publicação. Revise o histórico antes de voltar.'
}
git -C $checkout revert --no-edit 6d3a884a531be5fa55c02da58306807c55c4f5fb 240f8f7280d6c93bb3039c80a7d8f2546c14bc8f e3c5fcce65422605b9072d57dc1c7d1cd589cfa4
if ($LASTEXITCODE -ne 0) { throw 'Falha ao restaurar os dashboards no checkout.' }
git -C $checkout push origin HEAD:main
if ($LASTEXITCODE -ne 0) { throw 'Falha ao publicar o retorno.' }
