param([switch]$NoStartup)
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path $PSScriptRoot).Path
$programsRoot = Join-Path $env:LOCALAPPDATA 'Programs'
$destination = Join-Path $programsRoot 'Aurora Companion'
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Aurora Discord Companion.cmd'

if (-not $destination.StartsWith($programsRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Destino de instalação inválido.' }
New-Item -ItemType Directory -Force -Path $destination | Out-Null
Get-ChildItem -LiteralPath $source -Force | Where-Object { $_.Name -ne 'install.ps1' } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force
}
if (-not $NoStartup) { Copy-Item -LiteralPath (Join-Path $destination 'start.cmd') -Destination $startup -Force }
Write-Host "Aurora Companion instalado em $destination"
Write-Host 'Instalação concluída. Continue nesta janela para conectar o computador ao Aurora.'
