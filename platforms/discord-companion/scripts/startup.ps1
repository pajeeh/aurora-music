param([ValidateSet('install','remove')] [string]$Action)
$ErrorActionPreference = 'Stop'
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Aurora Discord Companion.cmd'
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$runName = 'AuroraDiscordCompanion'
if ($Action -eq 'install') {
  & (Join-Path $PSScriptRoot 'install-windows.ps1') -StartWithWindows
} else {
  if (Test-Path -LiteralPath $startup) { Remove-Item -LiteralPath $startup -Force }
  if (Get-ItemProperty -Path $runKey -Name $runName -ErrorAction SilentlyContinue) { Remove-ItemProperty -Path $runKey -Name $runName -Force }
  Write-Host 'Inicialização automática do Aurora Companion desativada.'
}
