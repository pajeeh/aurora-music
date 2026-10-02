param([switch]$NoStartup)
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path $PSScriptRoot).Path
$programsRoot = Join-Path $env:LOCALAPPDATA 'Programs'
$destination = Join-Path $programsRoot 'Aurora Companion'
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Aurora Discord Companion.cmd'

if (-not $destination.StartsWith($programsRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Destino de instalação inválido.' }
if (Test-Path -LiteralPath $destination) {
  $running = Get-CimInstance Win32_Process | Where-Object {
    ($_.ExecutablePath -and $_.ExecutablePath.StartsWith($destination, [StringComparison]::OrdinalIgnoreCase)) -or
    ($_.Name -eq 'cmd.exe' -and $_.CommandLine -and $_.CommandLine.IndexOf((Join-Path $destination 'start.cmd'), [StringComparison]::OrdinalIgnoreCase) -ge 0)
  }
  $running | Sort-Object { if ($_.Name -eq 'cmd.exe') { 0 } else { 1 } } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  if ($running) { Start-Sleep -Milliseconds 500 }
}
New-Item -ItemType Directory -Force -Path $destination | Out-Null
Get-ChildItem -LiteralPath $source -Force | Where-Object { $_.Name -ne 'install.ps1' } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force
}
if (-not $NoStartup) { Copy-Item -LiteralPath (Join-Path $destination 'start.cmd') -Destination $startup -Force }
Write-Host "Aurora Companion instalado em $destination"
Write-Host 'Instalação concluída. Continue nesta janela para conectar o computador ao Aurora.'
