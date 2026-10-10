param([switch]$ForgetPairing)
$ErrorActionPreference = 'Stop'
$programsRoot = (Join-Path $env:LOCALAPPDATA 'Programs')
$destination = Join-Path $programsRoot 'Aurora Companion'
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Aurora Discord Companion.cmd'
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$runName = 'AuroraDiscordCompanion'
if (-not $destination.StartsWith($programsRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Destino de remoção inválido.' }
if (Test-Path -LiteralPath $startup) { Remove-Item -LiteralPath $startup -Force }
if (Get-ItemProperty -Path $runKey -Name $runName -ErrorAction SilentlyContinue) { Remove-ItemProperty -Path $runKey -Name $runName -Force }
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Recurse -Force }
if ($ForgetPairing) {
  $config = Join-Path $env:LOCALAPPDATA 'Aurora\discord-companion.json'
  if (Test-Path -LiteralPath $config) { Remove-Item -LiteralPath $config -Force }
}
Write-Host 'Aurora Companion removido. O pareamento foi preservado, salvo quando -ForgetPairing foi solicitado.'
