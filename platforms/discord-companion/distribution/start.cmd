@echo off
set "AURORA_HOME=%~dp0"
:aurora_restart
powershell -NoProfile -NonInteractive -Command "if ((Test-Path -LiteralPath '%LOCALAPPDATA%\Aurora\companion.log') -and ((Get-Item -LiteralPath '%LOCALAPPDATA%\Aurora\companion.log').Length -gt 1048576)) { Clear-Content -LiteralPath '%LOCALAPPDATA%\Aurora\companion.log' }"
"%AURORA_HOME%node.exe" "%AURORA_HOME%src\index.mjs" >> "%LOCALAPPDATA%\Aurora\companion.log" 2>&1
timeout /t 5 /nobreak > nul
goto aurora_restart
