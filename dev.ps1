$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $toolsDir = Join-Path $env:LOCALAPPDATA 'aviso-programacao-tools'
    $nodeExecutable = Get-ChildItem -LiteralPath $toolsDir -Filter node.exe -Recurse | Select-Object -First 1
    if (-not $nodeExecutable) { throw 'Node não encontrado. Instale Node 22.12+ no perfil do usuário.' }
    $env:Path = "$($nodeExecutable.DirectoryName);$env:Path"
}
Push-Location $PSScriptRoot
try { & npm.cmd run dev } finally { Pop-Location }
