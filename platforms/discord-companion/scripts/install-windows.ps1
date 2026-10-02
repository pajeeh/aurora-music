param([switch]$StartWithWindows)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localRoot = Join-Path $env:LOCALAPPDATA 'Aurora\Discord Companion'
$launcher = Join-Path $localRoot 'Aurora Discord Companion.cmd'
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Aurora Discord Companion.cmd'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22 ou mais recente não foi encontrado.' }
$major = [int]((node --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) { throw 'O Aurora Companion requer Node.js 22 ou mais recente.' }

New-Item -ItemType Directory -Force -Path $localRoot | Out-Null
$node = (Get-Command node).Source
$entry = Join-Path $root 'src\index.mjs'
$log = Join-Path $localRoot 'companion.log'
$content = "@echo off`r`n:aurora_restart`r`npowershell -NoProfile -NonInteractive -Command `"if ((Test-Path -LiteralPath '$log') -and ((Get-Item -LiteralPath '$log').Length -gt 1048576)) { Clear-Content -LiteralPath '$log' }`"`r`n`"$node`" `"$entry`" >> `"$log`" 2>&1`r`ntimeout /t 5 /nobreak > nul`r`ngoto aurora_restart`r`n"
[IO.File]::WriteAllText($launcher, $content, [Text.UTF8Encoding]::new($false))
if ($StartWithWindows) { Copy-Item -LiteralPath $launcher -Destination $startup -Force }

Write-Host "Aurora Companion instalado em: $launcher"
if ($StartWithWindows) { Write-Host 'Inicialização automática ativada.' } else { Write-Host 'Use npm run startup:install para iniciar com o Windows.' }
