param([ValidateSet('install','remove')] [string]$Action)
$ErrorActionPreference = 'Stop'
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Aurora Discord Companion.cmd'
if ($Action -eq 'install') {
  & (Join-Path $PSScriptRoot 'install-windows.ps1') -StartWithWindows
} elseif (Test-Path -LiteralPath $startup) {
  Remove-Item -LiteralPath $startup -Force
  Write-Host 'Inicialização automática do Aurora Companion desativada.'
} else { Write-Host 'A inicialização automática já estava desativada.' }
