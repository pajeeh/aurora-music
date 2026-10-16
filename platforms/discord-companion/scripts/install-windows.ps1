param([switch]$StartWithWindows)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localRoot = Join-Path $env:LOCALAPPDATA 'Aurora\Discord Companion'
$launcher = Join-Path $localRoot 'Aurora Discord Companion.cmd'
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Aurora Discord Companion.cmd'
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$runName = 'AuroraDiscordCompanion'
$protocolKey = 'HKCU:\Software\Classes\aurora'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22 ou mais recente não foi encontrado.' }
$major = [int]((node --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) { throw 'O Aurora Companion requer Node.js 22 ou mais recente.' }

New-Item -ItemType Directory -Force -Path $localRoot | Out-Null
$node = (Get-Command node).Source
$entry = Join-Path $root 'src\index.mjs'
$log = Join-Path $localRoot 'companion.log'
$content = "@echo off`r`n:aurora_restart`r`npowershell -NoProfile -NonInteractive -Command `"if ((Test-Path -LiteralPath '$log') -and ((Get-Item -LiteralPath '$log').Length -gt 1048576)) { Clear-Content -LiteralPath '$log' }`"`r`n`"$node`" `"$entry`" >> `"$log`" 2>&1`r`ntimeout /t 5 /nobreak > nul`r`ngoto aurora_restart`r`n"
[IO.File]::WriteAllText($launcher, $content, [Text.UTF8Encoding]::new($false))
$protocolScript = Join-Path $localRoot 'Aurora Discord Pair.vbs'
$escapedNode = $node.Replace('"', '""')
$escapedEntry = $entry.Replace('"', '""')
$vbs = "Set shell = CreateObject(`"WScript.Shell`")`r`nurl = Replace(WScript.Arguments(0), `"`"`"`", `"`")`r`nshell.Run `"`"`"$escapedNode`"`" `"`"$escapedEntry`"`" pair-url `"`"`" & url & `"`"`"`", 0, False`r`n"
[IO.File]::WriteAllText($protocolScript, $vbs, [Text.UTF8Encoding]::new($false))
New-Item -Path $protocolKey -Force | Out-Null
Set-ItemProperty -Path $protocolKey -Name '(Default)' -Value 'URL:Aurora Music'
New-ItemProperty -Path $protocolKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
$protocolCommand = Join-Path $protocolKey 'shell\open\command'
New-Item -Path $protocolCommand -Force | Out-Null
Set-ItemProperty -Path $protocolCommand -Name '(Default)' -Value "wscript.exe `"$protocolScript`" `"%1`""
if ($StartWithWindows) {
  $runCommand = "powershell.exe -NoProfile -WindowStyle Hidden -Command `"Start-Process -WindowStyle Hidden -FilePath '$launcher'`""
  New-Item -Path $runKey -Force | Out-Null
  New-ItemProperty -Path $runKey -Name $runName -Value $runCommand -PropertyType String -Force | Out-Null
  if (Test-Path -LiteralPath $startup) { Remove-Item -LiteralPath $startup -Force }
}

Write-Host "Aurora Companion instalado em: $launcher"
Write-Host 'Conexão por um clique ativada para links aurora://.'
if ($StartWithWindows) { Write-Host 'Inicialização automática ativada.' } else { Write-Host 'Use npm run startup:install para iniciar com o Windows.' }
